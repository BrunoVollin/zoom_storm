import { Cart } from '../../../../domain/entities/cart/Cart';
import { CartItem } from '../../../../domain/entities/cart/CartItem';
import { ProductVariant } from '../../../../domain/entities/product/ProductVariant';
import { Transport } from '../../../../domain/entities/freight/Transport';
import { IdType } from '../../../../domain/shared/IdType';
import { CartRepository } from '../../../../domain/repositories/CartRepository';
import { DomainEvent } from '../../../../domain/events/DomainEvent';
import { ConcurrencyConflictError } from '../../../../domain/errors/ConcurrencyConflictError';
import { prisma } from '../prisma-connection';
import { Prisma } from '../../../../generated/prisma/client';
import { couponFromRow } from './CouponFactory';

export class PrismaCartRepository implements CartRepository {
  async save(
    cart: Cart,
    events?: DomainEvent | Array<DomainEvent>,
  ): Promise<void> {
    const cartId = cart.getId().toString();
    const eventList = events ? [events].flat() : [];

    const items = cart.getItems().map((item) => ({
      id: item.id.toString(),
      cartId,
      productId: item.product.productId.toString(),
      productName: item.product.productName,
      productDescription: item.product.productDescription,
      productCategory: item.product.productCategory,
      variantId: item.product.getId().toString(),
      variantSku: item.product.sku,
      variantName: item.product.name,
      variantPrice: item.product.price,
      variantStock: item.product.stock,
      productWeight: item.product.weight ?? 0,
      transportHeight: item.product.transport.height,
      transportWidth: item.product.transport.width,
      transportLength: item.product.transport.length,
      quantity: item.quantity,
    }));

    const coupons = cart.getCoupons().map((c) => ({
      id: c.id.toString(),
      appliedVersion: cart.getAppliedCouponVersion(c.id) ?? c.version,
    }));
    const couponIds = coupons.map((c) => c.id);

    await prisma.$transaction(async (tx) => {
      const existingCart = await tx.cart.findUnique({
        where: { id: cartId },
        select: { version: true },
      });

      if (!existingCart) {
        await tx.cart.create({
          data: { id: cartId, userId: cart.getUserId().toString() },
        });
      } else {
        const updated = await tx.cart.updateMany({
          where: { id: cartId, version: cart.getVersion() },
          data: { version: { increment: 1 } },
        });

        if (updated.count === 0) {
          throw new ConcurrencyConflictError(cartId);
        }
      }

      const itemIds = items.map((item) => item.id);

      await tx.cartItem.deleteMany({
        where: { cartId, id: { notIn: itemIds } },
      });

      await tx.cartCoupon.deleteMany({
        where: { cartId, couponId: { notIn: couponIds } },
      });

      await Promise.all(
        items.map((item) =>
          tx.cartItem.upsert({
            where: { id: item.id },
            create: item,
            update: item,
          }),
        ),
      );

      await Promise.all(
        coupons.map((coupon) =>
          tx.cartCoupon.upsert({
            where: { cartId_couponId: { cartId, couponId: coupon.id } },
            create: {
              cartId,
              couponId: coupon.id,
              appliedVersion: coupon.appliedVersion,
            },
            update: { appliedVersion: coupon.appliedVersion },
          }),
        ),
      );

      for (const event of eventList) {
        await tx.outboxEvent.create({
          data: {
            eventType: event.name,
            payload: event.payload as Prisma.InputJsonValue,
            occurredAt: event.occurredAt,
          },
        });
      }
    });
  }

  async findById(id: IdType): Promise<Cart | null> {
    const dbCart = await prisma.cart.findUnique({
      where: { id: id.toString() },
      include: {
        items: true,
        coupons: { include: { coupon: true } },
      },
    });

    if (!dbCart) return null;

    const cart = new Cart(
      IdType.create(dbCart.userId),
      IdType.create(dbCart.id),
      dbCart.version,
    );

    for (const it of dbCart.items) {
      const variantDomain = new ProductVariant(
        IdType.create(it.variantId ?? it.productId),
        IdType.create(it.productId),
        it.productName,
        it.productDescription,
        it.productCategory,
        it.variantSku ?? it.productId,
        it.variantName,
        it.variantPrice,
        it.variantStock,
        new Transport(
          it.transportHeight,
          it.transportWidth,
          it.transportLength,
        ),
        it.productWeight,
      );
      cart.addItem(
        new CartItem(IdType.create(it.id), variantDomain, it.quantity),
      );
    }

    for (const cp of dbCart.coupons) {
      cart.addCoupon(couponFromRow(cp.coupon), cp.appliedVersion);
    }

    return cart;
  }
}
