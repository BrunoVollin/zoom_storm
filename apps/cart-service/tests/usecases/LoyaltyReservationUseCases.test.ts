import { Status } from '../../src/application/contracts/UseCase';
import { ReserveLoyaltyPointsUseCase } from '../../src/application/usecases/ReserveLoyaltyPointsUseCase';
import { ConsumeLoyaltyReservationUseCase } from '../../src/application/usecases/ConsumeLoyaltyReservationUseCase';
import { ReleaseLoyaltyReservationUseCase } from '../../src/application/usecases/ReleaseLoyaltyReservationUseCase';
import { ExpireLoyaltyReservationsUseCase } from '../../src/application/usecases/ExpireLoyaltyReservationsUseCase';
import { LoyaltyReservation } from '../../src/domain/entities/loyalty/LoyaltyReservation';
import { LoyaltyAccount } from '../../src/domain/entities/loyalty/LoyaltyAccount';
import { createIdFromString } from '../factories/IdFactory';
import {
  FakeLoyaltyReservationRepository,
  FakeLoyaltyRepository,
} from '../factories/FakeRepositories';

describe('ReserveLoyaltyPointsUseCase', () => {
  let loyaltyRepository: FakeLoyaltyRepository;
  let reservationRepository: FakeLoyaltyReservationRepository;
  let useCase: ReserveLoyaltyPointsUseCase;

  const userId = 'user-1';
  const orderId = 'order-1';
  const expiresAt = new Date('2026-01-01T10:15:00.000Z');
  const createdAt = new Date('2026-01-01T10:00:00.000Z');

  beforeEach(() => {
    loyaltyRepository = new FakeLoyaltyRepository();
    reservationRepository = new FakeLoyaltyReservationRepository();
    useCase = new ReserveLoyaltyPointsUseCase(loyaltyRepository, reservationRepository);
  });

  it('reserves points when the balance covers the request', async () => {
    loyaltyRepository.accounts.set(userId, new LoyaltyAccount(createIdFromString(userId), 100));

    const result = await useCase.execute({ orderId, userId, points: 40, expiresAt, createdAt });

    expect(result.status).toBe(Status.SUCCESS);
    if (result.status === Status.SUCCESS) {
      expect(result.reservation.points).toBe(40);
      expect(result.reservation.status).toBe('ACTIVE');
    }
  });

  it('is idempotent when the same orderId/user/points are retried', async () => {
    loyaltyRepository.accounts.set(userId, new LoyaltyAccount(createIdFromString(userId), 100));

    const first = await useCase.execute({ orderId, userId, points: 40, expiresAt, createdAt });
    const second = await useCase.execute({ orderId, userId, points: 40, expiresAt, createdAt });

    expect(first.status).toBe(Status.SUCCESS);
    expect(second.status).toBe(Status.SUCCESS);
    expect(reservationRepository.reservations.size).toBe(1);
  });

  it('returns IDEMPOTENCY_CONFLICT when the same orderId is reused with a different payload', async () => {
    loyaltyRepository.accounts.set(userId, new LoyaltyAccount(createIdFromString(userId), 100));
    await useCase.execute({ orderId, userId, points: 40, expiresAt, createdAt });

    const result = await useCase.execute({ orderId, userId, points: 10, expiresAt, createdAt });

    expect(result.status).toBe(Status.ERROR);
    if (result.status === Status.ERROR) {
      expect(result.code).toBe('IDEMPOTENCY_CONFLICT');
    }
  });

  it('returns LOYALTY_BALANCE_CHANGED when the balance no longer covers the reservation', async () => {
    loyaltyRepository.accounts.set(userId, new LoyaltyAccount(createIdFromString(userId), 5));

    const result = await useCase.execute({ orderId, userId, points: 40, expiresAt, createdAt });

    expect(result.status).toBe(Status.ERROR);
    if (result.status === Status.ERROR) {
      expect(result.code).toBe('LOYALTY_BALANCE_CHANGED');
    }
  });
});

describe('ConsumeLoyaltyReservationUseCase', () => {
  let loyaltyRepository: FakeLoyaltyRepository;
  let reservationRepository: FakeLoyaltyReservationRepository;
  let useCase: ConsumeLoyaltyReservationUseCase;

  const userId = 'user-1';
  const orderId = 'order-1';

  beforeEach(() => {
    loyaltyRepository = new FakeLoyaltyRepository();
    reservationRepository = new FakeLoyaltyReservationRepository();
    useCase = new ConsumeLoyaltyReservationUseCase(loyaltyRepository, reservationRepository);
  });

  it('consumes an active reservation and debits the account balance', async () => {
    loyaltyRepository.accounts.set(userId, new LoyaltyAccount(createIdFromString(userId), 100));
    reservationRepository.reservations.set(
      orderId,
      LoyaltyReservation.create(
        createIdFromString(orderId),
        createIdFromString(userId),
        40,
        new Date(Date.now() + 60_000),
      ),
    );

    const result = await useCase.execute({ orderId, userId });

    expect(result.status).toBe(Status.SUCCESS);
    if (result.status === Status.SUCCESS) {
      expect(result.balance).toBe(60);
      expect(result.reservation.status).toBe('CONSUMED');
    }
  });

  it('returns an error when there is no reservation for the order', async () => {
    const result = await useCase.execute({ orderId, userId });

    expect(result.status).toBe(Status.ERROR);
  });
});

describe('ReleaseLoyaltyReservationUseCase', () => {
  it('releases an active reservation', async () => {
    const reservationRepository = new FakeLoyaltyReservationRepository();
    const userId = 'user-1';
    const orderId = 'order-1';
    reservationRepository.reservations.set(
      orderId,
      LoyaltyReservation.create(
        createIdFromString(orderId),
        createIdFromString(userId),
        40,
        new Date(Date.now() + 60_000),
      ),
    );
    const useCase = new ReleaseLoyaltyReservationUseCase(reservationRepository);

    const result = await useCase.execute({ orderId, userId });

    expect(result.status).toBe(Status.SUCCESS);
    expect(reservationRepository.reservations.get(orderId)?.getStatus()).toBe('RELEASED');
  });

  it('returns an error when there is no reservation for the order', async () => {
    const reservationRepository = new FakeLoyaltyReservationRepository();
    const useCase = new ReleaseLoyaltyReservationUseCase(reservationRepository);

    const result = await useCase.execute({ orderId: 'missing', userId: 'user-1' });

    expect(result.status).toBe(Status.ERROR);
  });
});

describe('ExpireLoyaltyReservationsUseCase', () => {
  it('expires every active reservation past its expiration date', async () => {
    const reservationRepository = new FakeLoyaltyReservationRepository();
    const referenceDate = new Date('2026-01-01T10:15:00.000Z');

    reservationRepository.reservations.set(
      'order-1',
      LoyaltyReservation.create(
        createIdFromString('order-1'),
        createIdFromString('user-1'),
        20,
        new Date('2026-01-01T10:15:00.000Z'),
        new Date('2026-01-01T10:00:00.000Z'),
      ),
    );
    reservationRepository.reservations.set(
      'order-2',
      LoyaltyReservation.create(
        createIdFromString('order-2'),
        createIdFromString('user-2'),
        10,
        new Date('2026-01-01T11:00:00.000Z'),
        new Date('2026-01-01T10:00:00.000Z'),
      ),
    );
    const useCase = new ExpireLoyaltyReservationsUseCase(reservationRepository);

    const result = await useCase.execute({ referenceDate });

    expect(result).toEqual({ status: Status.SUCCESS, expired: 1 });
    expect(reservationRepository.reservations.get('order-1')?.getStatus()).toBe('EXPIRED');
    expect(reservationRepository.reservations.get('order-2')?.getStatus()).toBe('ACTIVE');
  });
});
