import { Order } from '../../src/domain/entities/order/Order';
import { OrderItem } from '../../src/domain/entities/order/OrderItem';
import { OrderStatus } from '../../src/domain/entities/order/OrderStatus';
import { createIdFromString } from '../factories/IdFactory';

function createOrder(status: OrderStatus = OrderStatus.CREATED): Order {
  return new Order(
    createIdFromString('order-1'),
    createIdFromString('user-1'),
    createIdFromString('cart-1'),
    [
      new OrderItem(
        createIdFromString('item-1'),
        createIdFromString('product-1'),
        'Product',
        1000,
        1,
      ),
    ],
    1000,
    0,
    0,
    1000,
    status,
  );
}

describe('Order', () => {
  describe('markAsPaid', () => {
    it('moves a newly created order to PAID', () => {
      const order = createOrder();

      order.markAsPaid();

      expect(order.getStatus()).toBe(OrderStatus.PAID);
    });

    it('rejects payment confirmation after the order has already been paid', () => {
      const order = createOrder(OrderStatus.PAID);

      expect(() => order.markAsPaid()).toThrow(
        'Cannot mark order as paid from status PAID',
      );
    });
  });

  describe('advanceLogisticsTo', () => {
    it('does not allow the generic status transition to confirm payment', () => {
      const order = createOrder();

      expect(() => order.advanceLogisticsTo(OrderStatus.PAID)).toThrow(
        'Paid status can only be set by payment confirmation',
      );
      expect(order.getStatus()).toBe(OrderStatus.CREATED);
    });

    it.each([
      OrderStatus.IN_TRANSIT,
      OrderStatus.OUT_FOR_DELIVERY,
      OrderStatus.DELIVERED,
    ])('does not allow an unpaid order to jump to %s', (status) => {
      const order = createOrder();

      expect(() => order.advanceLogisticsTo(status)).toThrow(
        `Cannot move order status from CREATED to ${status}`,
      );
      expect(order.getStatus()).toBe(OrderStatus.CREATED);
    });

    it('allows one sequential logistics step after payment', () => {
      const order = createOrder(OrderStatus.PAID);

      order.advanceLogisticsTo(OrderStatus.IN_TRANSIT, 'São Paulo');

      expect(order.getStatus()).toBe(OrderStatus.IN_TRANSIT);
      expect(order.getOriginCity()).toBe('São Paulo');
    });

    it('rejects skipped logistics steps', () => {
      const order = createOrder(OrderStatus.PAID);

      expect(() => order.advanceLogisticsTo(OrderStatus.DELIVERED)).toThrow(
        'Cannot move order status from PAID to DELIVERED',
      );
      expect(order.getStatus()).toBe(OrderStatus.PAID);
    });
  });
});
