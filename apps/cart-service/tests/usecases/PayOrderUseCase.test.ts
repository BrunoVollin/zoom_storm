import { Status } from '../../src/application/contracts/UseCase';
import { PayOrderUseCase } from '../../src/application/usecases/PayOrderUseCase';
import { ConsumeLoyaltyReservationUseCase } from '../../src/application/usecases/ConsumeLoyaltyReservationUseCase';
import { LoyaltyAccount } from '../../src/domain/entities/loyalty/LoyaltyAccount';
import { LoyaltyReservation } from '../../src/domain/entities/loyalty/LoyaltyReservation';
import { Order } from '../../src/domain/entities/order/Order';
import { OrderItem } from '../../src/domain/entities/order/OrderItem';
import { PaymentAttempt } from '../../src/domain/entities/payment/PaymentAttempt';
import { PaymentMethodType } from '../../src/domain/entities/payment/PaymentMethod';
import { SavedCard } from '../../src/domain/entities/payment/SavedCard';
import {
  CompletePaymentInput,
  PaymentAttemptRepository,
} from '../../src/domain/repositories/PaymentAttemptRepository';
import { IdType } from '../../src/domain/shared/IdType';
import { createIdFromString } from '../factories/IdFactory';
import {
  FakeInventoryReservationService,
  FakeLoyaltyReservationRepository,
  FakeLoyaltyRepository,
  FakeOrderRepository,
} from '../factories/FakeRepositories';
import { InMemorySavedCardRepository } from '../helpers/InMemorySavedCardRepository';

class InMemoryPaymentAttemptRepository implements PaymentAttemptRepository {
  readonly attempts = new Map<string, PaymentAttempt>();
  completeCalls = 0;

  constructor(
    private readonly orders: FakeOrderRepository,
    private readonly loyalty: FakeLoyaltyRepository,
    private readonly cards: InMemorySavedCardRepository,
  ) {}

  async findByIdempotencyKey(userId: IdType, key: string): Promise<PaymentAttempt | null> {
    return this.attempts.get(`${userId.toString()}:${key}`) ?? null;
  }

  async save(attempt: PaymentAttempt): Promise<void> {
    this.attempts.set(`${attempt.userId.toString()}:${attempt.idempotencyKey}`, attempt);
  }

  async complete(input: CompletePaymentInput): Promise<void> {
    this.completeCalls += 1;
    await this.save(input.attempt);
    await this.orders.save(input.order, input.event);
    if (input.loyalty) {
      await this.loyalty.save(input.loyalty.account, {
        type: 'EARN',
        points: input.loyalty.points,
        orderId: input.order.id.toString(),
      });
    }
    if (input.savedCard) await this.cards.save(input.savedCard);
  }
}

describe('PayOrderUseCase', () => {
  let orderRepository: FakeOrderRepository;
  let loyaltyRepository: FakeLoyaltyRepository;
  let cardRepository: InMemorySavedCardRepository;
  let paymentRepository: InMemoryPaymentAttemptRepository;
  let inventoryReservationService: FakeInventoryReservationService;
  let loyaltyReservationRepository: FakeLoyaltyReservationRepository;
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

  beforeEach(async () => {
    orderRepository = new FakeOrderRepository();
    loyaltyRepository = new FakeLoyaltyRepository();
    cardRepository = new InMemorySavedCardRepository();
    paymentRepository = new InMemoryPaymentAttemptRepository(
      orderRepository,
      loyaltyRepository,
      cardRepository,
    );
    inventoryReservationService = new FakeInventoryReservationService();
    loyaltyReservationRepository = new FakeLoyaltyReservationRepository();
    useCase = new PayOrderUseCase(
      orderRepository,
      loyaltyRepository,
      cardRepository,
      paymentRepository,
      inventoryReservationService,
      loyaltyReservationRepository,
      new ConsumeLoyaltyReservationUseCase(
        loyaltyRepository,
        loyaltyReservationRepository,
      ),
    );
    await cardRepository.save(
      new SavedCard(
        IdType.create('card-1'),
        IdType.create(userId),
        'Visa',
        '4242',
        'Bruno Almeida',
        '12/28',
        undefined,
        true,
      ),
    );
  });

  it('pays with an owned saved card and atomically earns loyalty points', async () => {
    orderRepository.orders.set(orderId, createOrder(2599));

    const result = await useCase.execute({
      orderId,
      userId,
      idempotencyKey: 'payment-1',
      installments: 2,
      paymentMethod: { type: PaymentMethodType.SAVED_CARD, savedCardId: 'card-1' },
    });

    expect(result.status).toBe(Status.SUCCESS);
    if (result.status !== Status.SUCCESS) return;
    expect(result.order.status).toBe('PAID');
    expect(result.payment.method).toEqual({
      type: 'SAVED_CARD',
      savedCardId: 'card-1',
      brand: 'Visa',
      lastFour: '4242',
      holderName: 'Bruno Almeida',
      expiry: '12/28',
    });
    expect('cvc' in result.payment.method).toBe(false);
    expect(loyaltyRepository.accounts.get(userId)?.getBalance()).toBe(25);
    expect(orderRepository.savedEvents[0]).toMatchObject({
      name: 'order.status_changed',
      payload: { status: 'PAID' },
    });
  });

  it('rejects a saved card owned by another user without changing the order', async () => {
    const order = createOrder(1000);
    orderRepository.orders.set(orderId, order);
    await cardRepository.save(
      new SavedCard(IdType.create('other-card'), IdType.create('user-2'), 'Visa', '1111', 'Other', '12/29'),
    );

    const result = await useCase.execute({
      orderId,
      userId,
      idempotencyKey: 'payment-2',
      installments: 1,
      paymentMethod: { type: PaymentMethodType.SAVED_CARD, savedCardId: 'other-card' },
    });

    expect(result).toMatchObject({ status: Status.ERROR, code: 'PAYMENT_METHOD_NOT_FOUND' });
    expect(order.getStatus()).toBe('CREATED');
    expect(paymentRepository.completeCalls).toBe(0);
  });

  it('pays with a tokenized new card, persists only safe fields and optionally saves it', async () => {
    orderRepository.orders.set(orderId, createOrder(1000));

    const result = await useCase.execute({
      orderId,
      userId,
      idempotencyKey: 'payment-3',
      installments: 1,
      paymentMethod: {
        type: PaymentMethodType.NEW_CARD,
        token: 'single-use-token',
        brand: 'Mastercard',
        lastFour: '5555',
        holderName: 'Bruno Almeida',
        expiry: '11/30',
        saveCard: true,
      },
    });

    expect(result.status).toBe(Status.SUCCESS);
    if (result.status !== Status.SUCCESS) return;
    expect(result.payment.method).toEqual({
      type: 'NEW_CARD', brand: 'Mastercard', lastFour: '5555', holderName: 'Bruno Almeida', expiry: '11/30', saveCard: true,
    });
    expect(JSON.stringify(result.payment)).not.toContain('single-use-token');
    expect(JSON.stringify(result.payment)).not.toContain('cvc');
    expect(await cardRepository.findByUserId(IdType.create(userId))).toHaveLength(2);
  });

  it('replays a completed idempotent request without a second mutation', async () => {
    orderRepository.orders.set(orderId, createOrder(1000));
    const input = {
      orderId,
      userId,
      idempotencyKey: 'same-key',
      installments: 1,
      paymentMethod: { type: PaymentMethodType.SAVED_CARD as const, savedCardId: 'card-1' },
    };

    const first = await useCase.execute(input);
    const replay = await useCase.execute(input);

    expect(first).toMatchObject({ status: Status.SUCCESS, replayed: false });
    expect(replay).toMatchObject({ status: Status.SUCCESS, replayed: true });
    expect(paymentRepository.completeCalls).toBe(1);
    expect(loyaltyRepository.transactions).toHaveLength(1);
    expect(loyaltyRepository.accounts.get(userId)?.getBalance()).toBe(10);
  });

  it('rejects reuse of an idempotency key with different request data', async () => {
    orderRepository.orders.set(orderId, createOrder(1000));
    await useCase.execute({
      orderId, userId, idempotencyKey: 'same-key', installments: 1,
      paymentMethod: { type: PaymentMethodType.SAVED_CARD, savedCardId: 'card-1' },
    });

    const result = await useCase.execute({
      orderId, userId, idempotencyKey: 'same-key', installments: 2,
      paymentMethod: { type: PaymentMethodType.SAVED_CARD, savedCardId: 'card-1' },
    });

    expect(result).toMatchObject({ status: Status.ERROR, code: 'IDEMPOTENCY_CONFLICT' });
    expect(paymentRepository.completeCalls).toBe(1);
  });

  it('consumes an active loyalty reservation and debits the balance atomically', async () => {
    orderRepository.orders.set(orderId, createOrder(2599));
    loyaltyRepository.accounts.set(userId, new LoyaltyAccount(IdType.create(userId), 40));
    loyaltyReservationRepository.reservations.set(
      orderId,
      LoyaltyReservation.create(
        createIdFromString(orderId),
        createIdFromString(userId),
        40,
        new Date(Date.now() + 60_000),
      ),
    );

    const result = await useCase.execute({
      orderId,
      userId,
      idempotencyKey: 'payment-4',
      installments: 1,
      paymentMethod: { type: PaymentMethodType.SAVED_CARD, savedCardId: 'card-1' },
    });

    expect(result.status).toBe(Status.SUCCESS);
    expect(loyaltyReservationRepository.reservations.get(orderId)?.getStatus()).toBe(
      'CONSUMED',
    );
    // Points redeemed by the reservation and points earned by this same
    // purchase both hit the balance (0 after redeem, +25 after earn).
    expect(loyaltyRepository.accounts.get(userId)?.getBalance()).toBe(25);
  });

  it('returns an error when the order does not exist', async () => {
    const result = await useCase.execute({
      orderId, userId, idempotencyKey: 'missing', installments: 1,
      paymentMethod: { type: PaymentMethodType.SAVED_CARD, savedCardId: 'card-1' },
    });

    expect(result).toEqual({ status: Status.ERROR, message: 'Order not found' });
  });
});
