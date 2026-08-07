import type { EachMessagePayload } from 'kafkajs';
import { Status } from '../../src/application/contracts/UseCase';
import { RegisterDeliveredOrderReviewEligibilitiesUseCase } from '../../src/application/usecases/RegisterDeliveredOrderReviewEligibilitiesUseCase';
import { OrderReviewEligibilityHandler } from '../../src/infrastructure/messaging/OrderReviewEligibilityHandler';

function kafkaMessage(event: object): EachMessagePayload {
  return {
    topic: 'order-events',
    partition: 0,
    heartbeat: jest.fn(),
    pause: jest.fn(),
    message: {
      key: null,
      value: Buffer.from(JSON.stringify(event)),
      timestamp: '0',
      attributes: 0,
      offset: '1',
      headers: {},
    },
  };
}

describe('OrderReviewEligibilityHandler', () => {
  it('handles the current unversioned delivered-order envelope', async () => {
    const execute = jest.fn().mockResolvedValue({
      status: Status.SUCCESS,
      createdCount: 1,
      eligibleProductCount: 1,
    });
    const handler = new OrderReviewEligibilityHandler({
      execute,
    } as unknown as RegisterDeliveredOrderReviewEligibilitiesUseCase);

    await handler.handle(
      kafkaMessage({
        name: 'order.status_changed',
        occurredAt: '2026-08-07T12:00:00.000Z',
        payload: {
          id: 'order-1',
          userId: 'user-1',
          status: 'DELIVERED',
          items: [{ productId: 'product-1', quantity: 2 }],
        },
      }),
    );

    expect(execute).toHaveBeenCalledWith({
      orderId: 'order-1',
      userId: 'user-1',
      status: 'DELIVERED',
      items: [{ productId: 'product-1' }],
      deliveredAt: new Date('2026-08-07T12:00:00.000Z'),
    });
  });

  it('tolerates a versioned data envelope and unknown fields', async () => {
    const execute = jest.fn().mockResolvedValue({ status: Status.SUCCESS });
    const handler = new OrderReviewEligibilityHandler({
      execute,
    } as unknown as RegisterDeliveredOrderReviewEligibilitiesUseCase);

    await handler.handle(
      kafkaMessage({
        version: 2,
        type: 'order.status_changed',
        time: '2026-08-07T13:00:00.000Z',
        ignored: true,
        data: {
          orderId: 'order-2',
          userId: 'user-2',
          status: 'DELIVERED',
          items: [{ productId: 'product-2', extra: 'ignored' }],
        },
      }),
    );

    expect(execute).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: 'order-2',
        userId: 'user-2',
        items: [{ productId: 'product-2' }],
      }),
    );
  });

  it('ignores unrelated and pre-delivery events', async () => {
    const execute = jest.fn();
    const handler = new OrderReviewEligibilityHandler({
      execute,
    } as unknown as RegisterDeliveredOrderReviewEligibilitiesUseCase);

    await handler.handle(kafkaMessage({ name: 'order.created', payload: {} }));
    await handler.handle(
      kafkaMessage({
        name: 'order.status_changed',
        payload: { status: 'PAID' },
      }),
    );

    expect(execute).not.toHaveBeenCalled();
  });

  it('rejects malformed delivered events so Kafka can retry them', async () => {
    const handler = new OrderReviewEligibilityHandler({
      execute: jest.fn(),
    } as unknown as RegisterDeliveredOrderReviewEligibilitiesUseCase);

    await expect(
      handler.handle(
        kafkaMessage({
          name: 'order.status_changed',
          occurredAt: 'invalid',
          payload: { status: 'DELIVERED', userId: 'user-1', items: [] },
        }),
      ),
    ).rejects.toThrow();
  });

  it('rejects application failures so Kafka does not commit the offset', async () => {
    const execute = jest.fn().mockResolvedValue({
      status: Status.ERROR,
      message: 'database unavailable',
    });
    const handler = new OrderReviewEligibilityHandler({
      execute,
    } as unknown as RegisterDeliveredOrderReviewEligibilitiesUseCase);

    await expect(
      handler.handle(
        kafkaMessage({
          name: 'order.status_changed',
          occurredAt: '2026-08-07T12:00:00.000Z',
          payload: {
            id: 'order-1',
            userId: 'user-1',
            status: 'DELIVERED',
            items: [],
          },
        }),
      ),
    ).rejects.toThrow('Review eligibility processing failed');
  });
});
