import { OrderStatus } from '../../src/domain/entities/order/OrderStatus';
import { IdType } from '../../src/domain/shared/IdType';

const orderFindMany = jest.fn();
const orderFindUnique = jest.fn();
const orderUpsert = jest.fn();
const outboxCreate = jest.fn();

jest.mock('../../src/infrastructure/database/prisma/prisma-connection', () => ({
  prisma: {
    $transaction: (callback: (tx: unknown) => Promise<void>) =>
      callback({ order: { upsert: orderUpsert }, outboxEvent: { create: outboxCreate } }),
    order: {
      findMany: orderFindMany,
      findUnique: orderFindUnique,
    },
  },
}));

import { PrismaOrderRepository } from '../../src/infrastructure/database/prisma/repositories/PrismaOrderRepository';

describe('PrismaOrderRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    orderFindMany.mockResolvedValue([]);
    orderFindUnique.mockResolvedValue(null);
  });

  describe('findInProgress', () => {
    it('selects only paid orders and active delivery statuses', async () => {
      const repository = new PrismaOrderRepository();

      await repository.findInProgress();

      expect(orderFindMany).toHaveBeenCalledWith({
        where: {
          status: {
            in: [
              OrderStatus.PAID,
              OrderStatus.IN_TRANSIT,
              OrderStatus.OUT_FOR_DELIVERY,
            ],
          },
        },
        include: { items: true },
      });
    });

    it('never includes CREATED or DELIVERED in the query', async () => {
      const repository = new PrismaOrderRepository();

      await repository.findInProgress();

      const statuses = orderFindMany.mock.calls[0][0].where.status.in;
      expect(statuses).not.toContain(OrderStatus.CREATED);
      expect(statuses).not.toContain(OrderStatus.DELIVERED);
    });
  });

  it('restores the immutable payment expiry when loading an order', async () => {
    const expiresAt = new Date('2026-08-07T12:15:00.000Z');
    orderFindUnique.mockResolvedValue({
      id: 'order-1',
      userId: 'user-1',
      cartId: 'cart-1',
      subtotal: 100,
      discount: 0,
      shipping: 10,
      total: 110,
      status: OrderStatus.CREATED,
      items: [],
      createdAt: new Date('2026-08-07T12:00:00.000Z'),
      updatedAt: new Date('2026-08-07T12:00:00.000Z'),
      expiresAt,
      originCity: null,
      destinationCity: 'Palmas',
    });

    const order = await new PrismaOrderRepository().findById(
      IdType.create('order-1'),
    );

    expect(order?.expiresAt).toEqual(expiresAt);
  });
});
