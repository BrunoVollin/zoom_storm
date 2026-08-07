import { ConfirmInventoryReservationUseCase } from '../../src/application/usecases/ConfirmInventoryReservationUseCase';
import { ExpireInventoryReservationsUseCase } from '../../src/application/usecases/ExpireInventoryReservationsUseCase';
import { ReleaseInventoryReservationUseCase } from '../../src/application/usecases/ReleaseInventoryReservationUseCase';
import { ReserveInventoryUseCase } from '../../src/application/usecases/ReserveInventoryUseCase';
import { GetInventoryReservationUseCase } from '../../src/application/usecases/GetInventoryReservationUseCase';
import { Status } from '../../src/application/contracts/UseCase';
import { InventoryReservationStatus } from '../../src/domain/entities/InventoryReservation';
import { InventoryErrorCode } from '../../src/domain/errors/InventoryError';
import { makeProduct } from '../factories/ProductFactory';
import { InMemoryInventoryReservationRepository } from '../helpers/InMemoryInventoryReservationRepository';

describe('inventory reservation use cases', () => {
  const now = new Date('2026-08-07T12:00:00.000Z');
  let currentTime: Date;
  let repository: InMemoryInventoryReservationRepository;
  let reserve: ReserveInventoryUseCase;
  let confirm: ConfirmInventoryReservationUseCase;
  let release: ReleaseInventoryReservationUseCase;

  beforeEach(() => {
    currentTime = now;
    repository = new InMemoryInventoryReservationRepository();
    repository.seed(makeProduct({ stock: 5 }));
    const clock = () => currentTime;
    reserve = new ReserveInventoryUseCase(repository, clock);
    confirm = new ConfirmInventoryReservationUseCase(repository, clock);
    release = new ReleaseInventoryReservationUseCase(repository, clock);
  });

  it('atomically reserves stock and returns the same reservation on retry', async () => {
    const input = {
      orderId: 'order-1',
      lines: [{ variantId: 'variant-1', quantity: 2, expectedUnitPrice: 100 }],
    };

    const first = await reserve.execute(input);
    const second = await reserve.execute(input);

    expect(first.status).toBe(Status.SUCCESS);
    expect(second).toEqual(first);
    expect(repository.getVariant('variant-1')).toMatchObject({
      stock: 5,
      reservedStock: 2,
      availableStock: 3,
    });
  });

  it('returns reservation status and reports an unknown order', async () => {
    await reserve.execute({
      orderId: 'order-1',
      lines: [{ variantId: 'variant-1', quantity: 1, expectedUnitPrice: 100 }],
    });
    const getReservation = new GetInventoryReservationUseCase(repository);

    await expect(getReservation.execute({ orderId: 'order-1' })).resolves.toMatchObject({
      status: Status.SUCCESS,
      reservation: { orderId: 'order-1', status: InventoryReservationStatus.ACTIVE },
    });
    await expect(getReservation.execute({ orderId: 'missing' })).resolves.toMatchObject({
      status: Status.ERROR,
      code: InventoryErrorCode.RESERVATION_NOT_FOUND,
    });
  });

  it('rejects a different payload for the same order id', async () => {
    await reserve.execute({
      orderId: 'order-1',
      lines: [{ variantId: 'variant-1', quantity: 2, expectedUnitPrice: 100 }],
    });

    await expect(
      reserve.execute({
        orderId: 'order-1',
        lines: [{ variantId: 'variant-1', quantity: 3, expectedUnitPrice: 100 }],
      }),
    ).resolves.toMatchObject({
      status: Status.ERROR,
      code: InventoryErrorCode.IDEMPOTENCY_CONFLICT,
    });
  });

  it('rejects deleted, missing and insufficient inventory', async () => {
    const deletedRepository = new InMemoryInventoryReservationRepository();
    deletedRepository.seed(
      makeProduct({ deletedAt: new Date('2026-08-01T00:00:00.000Z') }),
    );

    await expect(
      new ReserveInventoryUseCase(deletedRepository, () => now).execute({
        orderId: 'deleted-order',
        lines: [{ variantId: 'variant-1', quantity: 1, expectedUnitPrice: 100 }],
      }),
    ).resolves.toMatchObject({ code: InventoryErrorCode.PRODUCT_UNAVAILABLE });
    await expect(
      reserve.execute({
        orderId: 'missing-order',
        lines: [{ variantId: 'missing', quantity: 1, expectedUnitPrice: 100 }],
      }),
    ).resolves.toMatchObject({ code: InventoryErrorCode.PRODUCT_UNAVAILABLE });
    await expect(
      reserve.execute({
        orderId: 'large-order',
        lines: [{ variantId: 'variant-1', quantity: 6, expectedUnitPrice: 100 }],
      }),
    ).resolves.toMatchObject({ code: InventoryErrorCode.INSUFFICIENT_STOCK });
  });

  it('rejects a stale cart price without reserving stock', async () => {
    await expect(
      reserve.execute({
        orderId: 'stale-price-order',
        lines: [
          { variantId: 'variant-1', quantity: 1, expectedUnitPrice: 99 },
        ],
      }),
    ).resolves.toMatchObject({
      status: Status.ERROR,
      code: InventoryErrorCode.CATALOG_CHANGED,
    });
    expect(repository.getVariant('variant-1')?.reservedStock).toBe(0);
  });

  it('confirms once, decreasing physical stock exactly once', async () => {
    await reserve.execute({
      orderId: 'order-1',
      lines: [{ variantId: 'variant-1', quantity: 2, expectedUnitPrice: 100 }],
    });

    const first = await confirm.execute({ orderId: 'order-1' });
    const second = await confirm.execute({ orderId: 'order-1' });

    expect(first).toMatchObject({
      status: Status.SUCCESS,
      reservation: { status: InventoryReservationStatus.CONFIRMED },
    });
    expect(second).toEqual(first);
    expect(repository.getVariant('variant-1')).toMatchObject({
      stock: 3,
      reservedStock: 0,
      availableStock: 3,
    });
  });

  it('releases once without decreasing physical stock', async () => {
    await reserve.execute({
      orderId: 'order-1',
      lines: [{ variantId: 'variant-1', quantity: 2, expectedUnitPrice: 100 }],
    });

    const first = await release.execute({ orderId: 'order-1' });
    const second = await release.execute({ orderId: 'order-1' });

    expect(second).toEqual(first);
    expect(repository.getVariant('variant-1')).toMatchObject({
      stock: 5,
      reservedStock: 0,
      availableStock: 5,
    });
  });

  it('expires reservations after 15 minutes and restores availability', async () => {
    await reserve.execute({
      orderId: 'order-1',
      lines: [{ variantId: 'variant-1', quantity: 2, expectedUnitPrice: 100 }],
    });
    currentTime = new Date(now.getTime() + 15 * 60 * 1000);

    const result = await new ExpireInventoryReservationsUseCase(
      repository,
      () => currentTime,
    ).execute({});

    expect(result).toEqual({
      status: Status.SUCCESS,
      expired: 1,
      conflicts: 0,
    });
    expect(repository.getVariant('variant-1')?.availableStock).toBe(5);
    await expect(
      confirm.execute({ orderId: 'order-1' }),
    ).resolves.toMatchObject({
      status: Status.ERROR,
      code: InventoryErrorCode.RESERVATION_EXPIRED,
    });
  });
});
