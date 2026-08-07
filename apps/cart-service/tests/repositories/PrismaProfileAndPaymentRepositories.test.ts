import { DomainEvent, DomainEventName } from '../../src/domain/events/DomainEvent';
import { Order } from '../../src/domain/entities/order/Order';
import { PaymentAttempt } from '../../src/domain/entities/payment/PaymentAttempt';
import { PaymentMethodType } from '../../src/domain/entities/payment/PaymentMethod';
import { SavedCard } from '../../src/domain/entities/payment/SavedCard';
import { Address } from '../../src/domain/entities/profile/Address';
import { SavedAddress } from '../../src/domain/entities/profile/SavedAddress';
import { IdType } from '../../src/domain/shared/IdType';

const addressUpdateMany = jest.fn();
const addressUpsert = jest.fn();
const addressFindUnique = jest.fn();
const addressFindMany = jest.fn();
const addressDelete = jest.fn();
const cardUpdateMany = jest.fn();
const cardUpsert = jest.fn();
const cardFindUnique = jest.fn();
const cardFindMany = jest.fn();
const cardDelete = jest.fn();
const paymentFindUnique = jest.fn();
const paymentCreate = jest.fn();
const paymentUpdateMany = jest.fn();
const paymentUpsert = jest.fn();
const orderUpdateMany = jest.fn();
const outboxCreate = jest.fn();

const tx = {
  savedAddress: {
    updateMany: addressUpdateMany,
    upsert: addressUpsert,
  },
  savedCard: {
    updateMany: cardUpdateMany,
    upsert: cardUpsert,
  },
  paymentAttempt: {
    findUnique: paymentFindUnique,
    create: paymentCreate,
    updateMany: paymentUpdateMany,
  },
  order: { updateMany: orderUpdateMany },
  outboxEvent: { create: outboxCreate },
  loyaltyAccount: { upsert: jest.fn() },
  loyaltyTransaction: { create: jest.fn() },
};

jest.mock('../../src/infrastructure/database/prisma/prisma-connection', () => ({
  prisma: {
    $transaction: (callback: (client: typeof tx) => Promise<void>) => callback(tx),
    savedAddress: {
      findUnique: addressFindUnique,
      findMany: addressFindMany,
      delete: addressDelete,
    },
    savedCard: {
      findUnique: cardFindUnique,
      findMany: cardFindMany,
      delete: cardDelete,
    },
    paymentAttempt: {
      findUnique: paymentFindUnique,
      upsert: paymentUpsert,
    },
  },
}));

import { PrismaPaymentAttemptRepository } from '../../src/infrastructure/database/prisma/repositories/PrismaPaymentAttemptRepository';
import { PrismaSavedAddressRepository } from '../../src/infrastructure/database/prisma/repositories/PrismaSavedAddressRepository';
import { PrismaSavedCardRepository } from '../../src/infrastructure/database/prisma/repositories/PrismaSavedCardRepository';

describe('Prisma profile and payment repositories', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    addressFindMany.mockResolvedValue([]);
    cardFindMany.mockResolvedValue([]);
    paymentFindUnique.mockResolvedValue(null);
    orderUpdateMany.mockResolvedValue({ count: 1 });
  });

  it('atomically clears the old default address before upserting the new one', async () => {
    const repository = new PrismaSavedAddressRepository();
    const savedAddress = new SavedAddress(
      IdType.create('address-1'),
      IdType.create('user-1'),
      'Home',
      'Test User',
      new Address('Main', '10', 'Center', 'Sao Paulo', 'SP', '01001000'),
      true,
    );

    await repository.save(savedAddress);

    expect(addressUpdateMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', isDefault: true, id: { not: 'address-1' } },
      data: { isDefault: false },
    });
    expect(addressUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'address-1' },
        create: expect.objectContaining({ isDefault: true, zip: '01001000' }),
      }),
    );
  });

  it('upserts only safe card fields and atomically changes the default', async () => {
    const repository = new PrismaSavedCardRepository();
    const card = new SavedCard(
      IdType.create('card-1'),
      IdType.create('user-1'),
      'Visa',
      '4242',
      'Test User',
      '12/99',
      undefined,
      true,
    );

    await repository.save(card);

    expect(cardUpdateMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', isDefault: true, id: { not: 'card-1' } },
      data: { isDefault: false },
    });
    const persisted = cardUpsert.mock.calls[0][0].create;
    expect(persisted).toMatchObject({ brand: 'Visa', lastFour: '4242' });
    expect(persisted).not.toHaveProperty('pan');
    expect(persisted).not.toHaveProperty('cvc');
    expect(persisted).not.toHaveProperty('cvv');
  });

  it('persists payment, paid order and event in one transaction without the token', async () => {
    const repository = new PrismaPaymentAttemptRepository();
    const now = new Date();
    const order = new Order(
      IdType.create('order-1'),
      IdType.create('user-1'),
      IdType.create('cart-1'),
      [],
      100,
      0,
      10,
      110,
      undefined,
      now,
    );
    order.markAsPaid(now);
    const attempt = new PaymentAttempt(
      IdType.create('attempt-1'),
      order.id,
      order.userId,
      'pay-1',
      {
        type: PaymentMethodType.NEW_CARD,
        brand: 'Visa',
        lastFour: '4242',
        holderName: 'Test User',
        expiry: '12/99',
        saveCard: false,
      },
      2,
    );
    attempt.succeed();

    await repository.complete({
      attempt,
      order,
      event: new DomainEvent(DomainEventName.ORDER_STATUS_CHANGED, {}, now),
    });

    const persisted = paymentCreate.mock.calls[0][0].data;
    expect(persisted).toMatchObject({
      idempotencyKey: 'pay-1',
      methodType: PaymentMethodType.NEW_CARD,
      lastFour: '4242',
    });
    expect(persisted).not.toHaveProperty('token');
    expect(orderUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'order-1', status: 'CREATED' } }),
    );
    expect(outboxCreate).toHaveBeenCalledTimes(1);
  });
});
