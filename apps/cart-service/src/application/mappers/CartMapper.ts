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
          id: item.product.productId.toString(),
          name: item.product.productName,
          description: item.product.productDescription,
          category: item.product.productCategory,
          weight: item.product.weight,
          transportHeight: item.product.transport.height,
          transportWidth: item.product.transport.width,
          transportLength: item.product.transport.length,
        },
        variant: {
          id: item.product.id.toString(),
          sku: item.product.sku,
          name: item.product.name,
          price: item.product.price,
          stock: item.product.stock,
        },
        subtotal: item.getPrice(),
      })),
      coupons: cart.getCoupons().map((coupon) => ({
        id: coupon.id.toString(),
        name: coupon.name,
        appliedVersion: cart.getAppliedCouponVersion(coupon.id),
        discount: coupon.getDiscount(cart.calcSubtotal()),
      })),
      loyaltyRedemption: cart.getLoyaltyRedemptionPoints()
        ? {
            points: cart.getLoyaltyRedemptionPoints(),
            discount: Math.min(
              cart.calcSubtotal(),
              cart.getLoyaltyRedemptionPoints() * 100,
            ),
          }
        : null,
      subtotal: cart.calcSubtotal(),
      totalDiscount: cart.calcTotalDiscount(cart.calcSubtotal()),
      total: cart.calcTotal(),
    };
  }
}

export type CartPrimitives = ReturnType<typeof CartMapper.toPrimitives>;
