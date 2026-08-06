import { OrderStatus } from '../../src/domain/entities/order/OrderStatus';

const orderFindMany = jest.fn();

jest.mock('../../src/infrastructure/database/prisma/prisma-connection', () => ({
  prisma: {
    order: {
      findMany: orderFindMany,
    },
  },
}));

import { PrismaOrderRepository } from '../../src/infrastructure/database/prisma/repositories/PrismaOrderRepository';

describe('PrismaOrderRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    orderFindMany.mockResolvedValue([]);
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
});
