import { Cart } from '@src/domain/entities/cart/Cart';

export class CartMapper {
  static toPrimitives(cart: Cart) {
    return {
      id: cart.id.toString(),
      userId: cart.userId.toString(),
      items: cart.getItems().map((item) => ({
        id: item.id.toString(),
        quantity: item.quantity,
        product: {
          id: item.product.id.toString(),
          name: item.product.name,
          price: item.product.price,
          description: item.product.description,
          category: item.product.category,
          stock: item.product.stock,
        },
        subtotal: item.getPrice(),
      })),
      coupons: cart.getCoupons().map((coupon) => ({
        id: coupon.id.toString(),
        name: coupon.name,
        discount: coupon.getDiscount(cart.calcSubtotal()),
      })),
      subtotal: cart.calcSubtotal(),
      totalDiscount: cart.calcTotalDiscount(cart.calcSubtotal()),
      total: cart.calcTotal(),
    };
  }
}

export type CartPrimitives = ReturnType<typeof CartMapper.toPrimitives>;
