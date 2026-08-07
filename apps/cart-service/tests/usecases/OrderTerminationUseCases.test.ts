import { Status } from '../../src/application/contracts/UseCase';
import { CancelOrderUseCase } from '../../src/application/usecases/CancelOrderUseCase';
import { ExpireOrderUseCase } from '../../src/application/usecases/ExpireOrderUseCase';
import { ReleaseLoyaltyReservationUseCase } from '../../src/application/usecases/ReleaseLoyaltyReservationUseCase';
import { LoyaltyReservation } from '../../src/domain/entities/loyalty/LoyaltyReservation';
import { Order } from '../../src/domain/entities/order/Order';
import { OrderStatus } from '../../src/domain/entities/order/OrderStatus';
import { createIdFromString } from '../factories/IdFactory';
import {
  FakeInventoryReservationService,
  FakeLoyaltyReservationRepository,
  FakeOrderRepository,
} from '../factories/FakeRepositories';

function order(createdAt = new Date('2026-01-01T10:00:00.000Z')): Order {
  return new Order(
    createIdFromString('order-1'),
    createIdFromString('user-1'),
    createIdFromString('cart-1'),
    [],
    1000,
    0,
    0,
    1000,
    OrderStatus.CREATED,
    createdAt,
  );
}

function buildCancelUseCase(
  repository: FakeOrderRepository,
  inventoryReservationService: FakeInventoryReservationService,
  loyaltyReservationRepository = new FakeLoyaltyReservationRepository(),
) {
  return new CancelOrderUseCase(
    repository,
    inventoryReservationService,
    loyaltyReservationRepository,
    new ReleaseLoyaltyReservationUseCase(loyaltyReservationRepository),
  );
}

function buildExpireUseCase(
  repository: FakeOrderRepository,
  inventoryReservationService: FakeInventoryReservationService,
  loyaltyReservationRepository = new FakeLoyaltyReservationRepository(),
) {
  return new ExpireOrderUseCase(
    repository,
    inventoryReservationService,
    loyaltyReservationRepository,
    new ReleaseLoyaltyReservationUseCase(loyaltyReservationRepository),
  );
}

describe('order termination use cases', () => {
  it('cancels an owned unpaid order and emits no paid status', async () => {
    const repository = new FakeOrderRepository();
    repository.orders.set('order-1', order());
    const inventoryReservationService = new FakeInventoryReservationService();

    const result = await buildCancelUseCase(
      repository,
      inventoryReservationService,
    ).execute({
      orderId: 'order-1', userId: 'user-1',
    });

    expect(result).toMatchObject({ status: Status.SUCCESS, order: { status: 'CANCELLED' } });
    expect(repository.savedEvents[0]).toMatchObject({
      name: 'order.status_changed', payload: { status: 'CANCELLED' },
    });
  });

  it('does not allow another user to cancel the order', async () => {
    const repository = new FakeOrderRepository();
    repository.orders.set('order-1', order());
    const inventoryReservationService = new FakeInventoryReservationService();

    const result = await buildCancelUseCase(
      repository,
      inventoryReservationService,
    ).execute({
      orderId: 'order-1', userId: 'user-2',
    });

    expect(result).toEqual({ status: Status.ERROR, message: 'Order not found' });
    expect(repository.orders.get('order-1')?.getStatus()).toBe(OrderStatus.CREATED);
  });

  it('releases an active loyalty reservation when the order is cancelled', async () => {
    const repository = new FakeOrderRepository();
    repository.orders.set('order-1', order());
    const inventoryReservationService = new FakeInventoryReservationService();
    const loyaltyReservationRepository = new FakeLoyaltyReservationRepository();
    loyaltyReservationRepository.reservations.set(
      'order-1',
      LoyaltyReservation.create(
        createIdFromString('order-1'),
        createIdFromString('user-1'),
        40,
        new Date('2026-01-01T10:15:00.000Z'),
        new Date('2026-01-01T10:00:00.000Z'),
      ),
    );

    const result = await buildCancelUseCase(
      repository,
      inventoryReservationService,
      loyaltyReservationRepository,
    ).execute({ orderId: 'order-1', userId: 'user-1' });

    expect(result.status).toBe(Status.SUCCESS);
    expect(loyaltyReservationRepository.reservations.get('order-1')?.getStatus()).toBe(
      'RELEASED',
    );
  });

  it('expires a pending order only after its deadline', async () => {
    const repository = new FakeOrderRepository();
    repository.orders.set('order-1', order());
    const inventoryReservationService = new FakeInventoryReservationService();
    const useCase = buildExpireUseCase(repository, inventoryReservationService);

    const early = await useCase.execute({
      orderId: 'order-1', referenceDate: new Date('2026-01-01T10:14:00.000Z'),
    });
    const expired = await useCase.execute({
      orderId: 'order-1', referenceDate: new Date('2026-01-01T10:15:00.000Z'),
    });

    expect(early).toMatchObject({ status: Status.ERROR });
    expect(expired).toMatchObject({ status: Status.SUCCESS, order: { status: 'EXPIRED' } });
  });
});
