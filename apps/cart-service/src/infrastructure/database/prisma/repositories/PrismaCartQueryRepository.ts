import { CartDTO, CartQueryRepository } from '../../../../domain/repositories/CartQueryRepository';
import { IdType } from '../../../../domain/shared/IdType';
import { prisma } from '../prisma-connection';

export class PrismaCartQueryRepository implements CartQueryRepository {
  async findById(id: IdType): Promise<CartDTO | null> {
    const dbCart = await prisma.cart.findUnique({
      where: { id: id.toString() },
      include: {
        items: { include: { product: true } },
        coupons: { include: { coupon: true } },
      },
    });

    if (!dbCart) return null;

    const subtotal = dbCart.items.reduce(
      (sum, it) => sum + it.product.price * it.quantity,
      0,
    );

    const totalDiscount = dbCart.coupons.reduce((sum, cp) => {
      const c = cp.coupon;
      const now = new Date();
      if (now >= c.start && now <= c.end) {
        return sum + Math.round(subtotal * (c.percent / 100));
      }
      return sum;
    }, 0);

    return {
      id: dbCart.id,
      userId: dbCart.userId,
      items: dbCart.items.map((it) => ({
        id: it.id,
        quantity: it.quantity,
        product: {
          id: it.product.id,
          name: it.product.name,
          price: it.product.price,
          description: it.product.description,
          category: it.product.category,
          stock: it.product.stock,
        },
        subtotal: it.product.price * it.quantity,
      })),
      coupons: dbCart.coupons.map((cp) => {
        const c = cp.coupon;
        const now = new Date();
        const discount =
          now >= c.start && now <= c.end
            ? Math.round(subtotal * (c.percent / 100))
            : 0;
        return { id: c.id, name: c.name, discount };
      }),
      subtotal,
      totalDiscount,
      total: subtotal - totalDiscount,
    };
  }
}
