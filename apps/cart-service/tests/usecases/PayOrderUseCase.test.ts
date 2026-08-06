import { PayOrderUseCase } from '../../src/application/usecases/PayOrderUseCase';
import { Status } from '../../src/application/contracts/UseCase';
import { Order } from '../../src/domain/entities/order/Order';
import { OrderItem } from '../../src/domain/entities/order/OrderItem';
import { OrderStatus } from '../../src/domain/entities/order/OrderStatus';
import { LoyaltyAccount } from '../../src/domain/entities/loyalty/LoyaltyAccount';
import { createIdFromString } from '../factories/IdFactory';
import {
  FakeLoyaltyRepository,
  FakeOrderRepository,
} from '../factories/FakeRepositories';

describe('PayOrderUseCase', () => {
  let orderRepository: FakeOrderRepository;
  let loyaltyRepository: FakeLoyaltyRepository;
  let useCase: PayOrderUseCase;

  const userId = 'user-1';
  const orderId = 'order-1';

  function createOrder(total: number): Order {
    return new Order(
      createIdFromString(orderId),
      createIdFromString(userId),
      createIdFromString('cart-1'),
      [
        new OrderItem(
          createIdFromString('item-1'),
          createIdFromString('product-1'),
          'Bluza',
          total,
          1,
        ),
      ],
      total,
      0,
      0,
      total,
    );
  }

  beforeEach(() => {
    orderRepository = new FakeOrderRepository();
    loyaltyRepository = new FakeLoyaltyRepository();
    useCase = new PayOrderUseCase(orderRepository, loyaltyRepository);
  });

  describe('Success Scenario', () => {
    it('advances the order to PAID and earns loyalty points based on the total', async () => {
      const order = createOrder(2599);
      orderRepository.orders.set(orderId, order);

      const result = await useCase.execute({
        orderId,
        userId,
        installments: 1,
      });

      expect(result.status).toBe(Status.SUCCESS);
      if (result.status === Status.SUCCESS) {
        expect(result.order.status).toBe('PAID');
      }

      const account = await loyaltyRepository.findByUserId(
        createIdFromString(userId),
      );
      expect(account?.getBalance()).toBe(25);
    });

    it('creates a new loyalty account when the user has none yet', async () => {
      const order = createOrder(10000);
      orderRepository.orders.set(orderId, order);

      await useCase.execute({ orderId, userId, installments: 1 });

      const account = await loyaltyRepository.findByUserId(
        createIdFromString(userId),
      );
      expect(account).not.toBeNull();
      expect(account?.getBalance()).toBe(100);
    });

    it('adds earned points on top of the existing balance', async () => {
      const order = createOrder(1000);
      orderRepository.orders.set(orderId, order);
      loyaltyRepository.accounts.set(
        userId,
        new LoyaltyAccount(createIdFromString(userId), 50),
      );

      await useCase.execute({ orderId, userId, installments: 1 });

      const account = await loyaltyRepository.findByUserId(
        createIdFromString(userId),
      );
      expect(account?.getBalance()).toBe(60);
    });

    it('does not earn points when the total is below one point (100 cents)', async () => {
      const order = createOrder(50);
      orderRepository.orders.set(orderId, order);

      await useCase.execute({ orderId, userId, installments: 1 });

      const account = await loyaltyRepository.findByUserId(
        createIdFromString(userId),
      );
      expect(account).toBeNull();
    });
  });

  describe('Business Rule Violations', () => {
    it('returns an error when the order does not exist', async () => {
      const result = await useCase.execute({
        orderId,
        userId,
        installments: 1,
      });

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.message).toBe('Order not found');
      }
    });

    it('returns an error when the order belongs to another user', async () => {
      const order = createOrder(1000);
      orderRepository.orders.set(orderId, order);

      const result = await useCase.execute({
        orderId,
        userId: 'other-user',
        installments: 1,
      });

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.message).toBe('Order not found');
      }
    });

    it('returns an error when the order cannot advance to PAID again', async () => {
      const order = createOrder(1000);
      order.advanceTo(OrderStatus.PAID);
      orderRepository.orders.set(orderId, order);

      const result = await useCase.execute({
        orderId,
        userId,
        installments: 1,
      });

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.message).toContain('Cannot move order status');
      }
    });
  });
});
