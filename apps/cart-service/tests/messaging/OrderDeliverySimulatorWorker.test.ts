import { Order } from '../../src/domain/entities/order/Order';
import { OrderItem } from '../../src/domain/entities/order/OrderItem';
import { OrderStatus } from '../../src/domain/entities/order/OrderStatus';
import { OrderRepository } from '../../src/domain/repositories/OrderRepository';
import { UpdateOrderStatusUseCase } from '../../src/application/usecases/UpdateOrderStatusUseCase';
import { OrderDeliverySimulatorWorker } from '../../src/infrastructure/messaging/OrderDeliverySimulatorWorker';
import { Status } from '../../src/application/contracts/UseCase';
import { createIdFromString } from '../factories/IdFactory';

const STEP_MS = 60_000;

function buildOrder(status: OrderStatus, updatedAt: Date): Order {
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
    new Date('2026-01-01T00:00:00Z'),
    'São Paulo',
    'Rio de Janeiro',
    updatedAt,
  );
}

class FakeOrderRepository implements OrderRepository {
  public saved: Order[] = [];

  constructor(private readonly inProgress: Order[]) {}

  async save(order: Order): Promise<void> {
    this.saved.push(order);
  }

  async findById(): Promise<Order | null> {
    return this.inProgress[0] ?? null;
  }

  async findByUserId(): Promise<Order[]> {
    return this.inProgress;
  }

  async findInProgress(): Promise<Order[]> {
    return this.inProgress;
  }
}

describe('OrderDeliverySimulatorWorker', () => {
  it('advances an order whose current step has already elapsed', async () => {
    const staleOrder = buildOrder(
      OrderStatus.PAID,
      new Date(Date.now() - STEP_MS - 1_000),
    );
    const repository = new FakeOrderRepository([staleOrder]);
    const updateOrderStatus = new UpdateOrderStatusUseCase(repository, 'São Paulo');
    const worker = new OrderDeliverySimulatorWorker(
      repository,
      updateOrderStatus,
      STEP_MS,
    );

    await worker.pollOnce();

    expect(repository.saved).toHaveLength(1);
    expect(repository.saved[0].getStatus()).toBe(OrderStatus.IN_TRANSIT);
  });

  it('does not advance an order still within its current step window', async () => {
    const freshOrder = buildOrder(OrderStatus.PAID, new Date());
    const repository = new FakeOrderRepository([freshOrder]);
    const updateOrderStatus = new UpdateOrderStatusUseCase(repository, 'São Paulo');
    const worker = new OrderDeliverySimulatorWorker(
      repository,
      updateOrderStatus,
      STEP_MS,
    );

    await worker.pollOnce();

    expect(repository.saved).toHaveLength(0);
  });

  it('never advances an order past DELIVERED', () => {
    const delivered = buildOrder(OrderStatus.DELIVERED, new Date(0));

    expect(delivered.getNextStatus()).toBeNull();
  });
});
