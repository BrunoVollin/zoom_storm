import { Cart } from '@domain/entities/cart/Cart';
import { CartItem } from '@domain/entities/cart/CartItem';
import { Product } from '@domain/entities/product/Product';
import { Transport } from '@domain/entities/freight/Transport';
import { CouponPercentByTime } from '@domain/entities/coupon/Coupon';
import { IdType } from '@domain/shared/IdType';
import { CartRepository } from '@domain/repositories/CartRepository';
import { prisma } from '../prisma-connection';

export class PrismaCartRepository implements CartRepository {
  async save(cart: Cart): Promise<void> {
    const cartId = cart.getId().toString();

    await prisma.cart.upsert({
      where: { id: cartId },
      create: { id: cartId, userId: cart.getUserId().toString() },
      update: {},
    });

    await prisma.$transaction([
      prisma.cartItem.deleteMany({ where: { cartId } }),
      prisma.cartCoupon.deleteMany({ where: { cartId } }),
    ]);

    const items = cart.getItems().map((item) => ({
      id: item.id.toString(),
      cartId,
      productId: item.product.getId().toString(),
      quantity: item.quantity,
    }));

    if (items.length > 0) {
      await prisma.cartItem.createMany({ data: items });
    }

    const coupons = cart.getCoupons().map((c) => ({
      cartId,
      couponId: c.id.toString(),
    }));

    if (coupons.length > 0) {
      await prisma.cartCoupon.createMany({ data: coupons });
    }
  }

  async findById(id: IdType): Promise<Cart | null> {
    const dbCart = await prisma.cart.findUnique({
      where: { id: id.toString() },
      include: {
        items: { include: { product: true } },
        coupons: { include: { coupon: true } },
      },
    });

    if (!dbCart) return null;

    const cart = new Cart(IdType.create(dbCart.userId), IdType.create(dbCart.id));

    for (const it of dbCart.items) {
      const p = it.product;
      const productDomain = new Product(
        IdType.create(p.id),
        p.name,
        p.price,
        p.description,
        p.category,
        p.stock,
        new Transport(p.transportHeight, p.transportWidth, p.transportLength),
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
