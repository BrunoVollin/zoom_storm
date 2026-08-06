import { UpdateOrderStatusUseCase } from '../../src/application/usecases/UpdateOrderStatusUseCase';
import { Status } from '../../src/application/contracts/UseCase';
import { Order } from '../../src/domain/entities/order/Order';
import { OrderItem } from '../../src/domain/entities/order/OrderItem';
import { OrderStatus } from '../../src/domain/entities/order/OrderStatus';
import { DomainEventName } from '../../src/domain/events/DomainEvent';
import { createIdFromString } from '../factories/IdFactory';
import { FakeOrderRepository } from '../factories/FakeRepositories';

function createOrder(status: OrderStatus): Order {
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

describe('UpdateOrderStatusUseCase', () => {
  let repository: FakeOrderRepository;
  let useCase: UpdateOrderStatusUseCase;

  beforeEach(() => {
    repository = new FakeOrderRepository();
    useCase = new UpdateOrderStatusUseCase(repository, 'São Paulo');
  });

  it('rejects setting PAID outside the payment use case', async () => {
    const order = createOrder(OrderStatus.CREATED);
    repository.orders.set(order.id.toString(), order);

    const result = await useCase.execute({
      orderId: order.id.toString(),
      status: OrderStatus.PAID,
    });

    expect(result).toEqual({
      status: Status.ERROR,
      message: 'Paid status can only be set by payment confirmation',
    });
    expect(order.getStatus()).toBe(OrderStatus.CREATED);
    expect(repository.savedEvents).toHaveLength(0);
  });

  it('rejects starting logistics before payment', async () => {
    const order = createOrder(OrderStatus.CREATED);
    repository.orders.set(order.id.toString(), order);

    const result = await useCase.execute({
      orderId: order.id.toString(),
      status: OrderStatus.IN_TRANSIT,
    });

    expect(result.status).toBe(Status.ERROR);
    expect(order.getStatus()).toBe(OrderStatus.CREATED);
    expect(repository.savedEvents).toHaveLength(0);
  });

  it('rejects skipping logistics statuses', async () => {
    const order = createOrder(OrderStatus.PAID);
    repository.orders.set(order.id.toString(), order);

    const result = await useCase.execute({
      orderId: order.id.toString(),
      status: OrderStatus.DELIVERED,
    });

    expect(result.status).toBe(Status.ERROR);
    expect(order.getStatus()).toBe(OrderStatus.PAID);
    expect(repository.savedEvents).toHaveLength(0);
  });

  it('persists and emits an event for the next logistics status', async () => {
    const order = createOrder(OrderStatus.PAID);
    repository.orders.set(order.id.toString(), order);

    const result = await useCase.execute({
      orderId: order.id.toString(),
      status: OrderStatus.IN_TRANSIT,
    });

    expect(result.status).toBe(Status.SUCCESS);
    expect(order.getStatus()).toBe(OrderStatus.IN_TRANSIT);
    expect(order.getOriginCity()).toBe('São Paulo');
    expect(repository.savedEvents).toHaveLength(1);
    expect(repository.savedEvents[0]).toMatchObject({
      name: DomainEventName.ORDER_STATUS_CHANGED,
    });
  });
});
