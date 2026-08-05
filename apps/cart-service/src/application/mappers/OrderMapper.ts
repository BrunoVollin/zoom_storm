import { Order } from '@src/domain/entities/order/Order';

export class OrderMapper {
  static toPrimitives(order: Order) {
    return {
      id: order.id.toString(),
      userId: order.userId.toString(),
      cartId: order.cartId.toString(),
      status: order.getStatus(),
      items: order.items.map((item) => ({
        id: item.id.toString(),
        productId: item.productId.toString(),
        productName: item.productName,
        productPrice: item.productPrice,
        quantity: item.quantity,
        subtotal: item.getSubtotal(),
      })),
      subtotal: order.subtotal,
      discount: order.discount,
      shipping: order.shipping,
      total: order.total,
      createdAt: order.createdAt.toISOString(),
      originCity: order.getOriginCity(),
      destinationCity: order.destinationCity,
    };
  }
}

export type OrderPrimitives = ReturnType<typeof OrderMapper.toPrimitives>;
