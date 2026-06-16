import { Cart } from '../../../../domain/entities/cart/Cart';
import { CartItem } from '../../../../domain/entities/cart/CartItem';
import { Product } from '../../../../domain/entities/product/Product';
import { Transport } from '../../../../domain/entities/freight/Transport';
import { CouponPercentByTime } from '../../../../domain/entities/coupon/Coupon';
import { IdType } from '../../../../domain/shared/IdType';
import { CartRepository } from '../../../../domain/repositories/CartRepository';
import { DomainEvent } from '../../../../domain/events/DomainEvent';
import { prisma } from '../prisma-connection';
import { Prisma } from '../../../../generated/prisma/client';

export class PrismaCartRepository implements CartRepository {
  async save(cart: Cart, event?: DomainEvent): Promise<void> {
    const cartId = cart.getId().toString();

    const items = cart.getItems().map((item) => ({
      id: item.id.toString(),
      cartId,
      productId: item.product.getId().toString(),
      productName: item.product.name,
      productPrice: item.product.price,
      productDescription: item.product.description,
      productCategory: item.product.category,
      productStock: item.product.stock,
      productWeight: item.product.weight,
      transportHeight: item.product.transport.height,
      transportWidth: item.product.transport.width,
      transportLength: item.product.transport.length,
      quantity: item.quantity,
    }));

    const coupons = cart.getCoupons().map((c) => ({
      cartId,
      couponId: c.id.toString(),
    }));

    await prisma.$transaction(async (tx) => {
      await tx.cart.upsert({
        where: { id: cartId },
        create: { id: cartId, userId: cart.getUserId().toString() },
        update: {},
      });

      await tx.cartItem.deleteMany({ where: { cartId } });
      await tx.cartCoupon.deleteMany({ where: { cartId } });

      if (items.length > 0) {
        await tx.cartItem.createMany({ data: items });
      }

      if (coupons.length > 0) {
        await tx.cartCoupon.createMany({ data: coupons });
      }

      if (event) {
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
    );

    for (const it of dbCart.items) {
      const productDomain = new Product(
        IdType.create(it.productId),
        it.productName,
        it.productPrice,
        it.productDescription,
        it.productCategory,
        it.productStock,
        new Transport(it.transportHeight, it.transportWidth, it.transportLength),
        it.productWeight,
      );
      cart.addItem(
        new CartItem(IdType.create(it.id), productDomain, it.quantity),
      );
    }

    for (const cp of dbCart.coupons) {
      const c = cp.coupon;
      cart.addCoupon(
        new CouponPercentByTime(
          IdType.create(c.id),
          c.name,
          new Date(),
          c.start,
          c.end,
          c.percent,
        ),
      );
    }

    return cart;
  }
}
