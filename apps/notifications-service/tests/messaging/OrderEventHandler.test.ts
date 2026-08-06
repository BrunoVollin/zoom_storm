import type { EachMessagePayload } from 'kafkajs';
import { Status } from '../../src/application/contracts/UseCase';
import { CreateNotificationFromOrderEventUseCase } from '../../src/application/usecases/CreateNotificationFromOrderEventUseCase';
import { OrderEventHandler } from '../../src/infrastructure/messaging/order-event.handler';

function kafkaMessage(event: object): EachMessagePayload {
  return {
    topic: 'order-events',
    partition: 0,
    heartbeat: jest.fn(),
    pause: jest.fn(),
    message: {
      key: null,
      value: Buffer.from(JSON.stringify(event)),
      timestamp: Date.now().toString(),
      attributes: 0,
      offset: '1',
      headers: {},
    },
  };
}

describe('OrderEventHandler', () => {
  it('forwards order.status_changed with PAID unchanged to the notification use case', async () => {
    const execute = jest.fn().mockResolvedValue({
      status: Status.SUCCESS,
      notification: null,
    });
    const useCase = { execute } as unknown as CreateNotificationFromOrderEventUseCase;
    const handler = new OrderEventHandler(useCase);
    const payload = {
      id: 'order-1',
      userId: 'user-1',
      status: 'PAID',
      originCity: null,
      destinationCity: 'Rio de Janeiro',
    };

    await handler.handle(
      kafkaMessage({
        name: 'order.status_changed',
        occurredAt: new Date().toISOString(),
        payload,
      }),
    );

    expect(execute).toHaveBeenCalledTimes(1);
    expect(execute).toHaveBeenCalledWith({
      eventName: 'order.status_changed',
      payload,
    });
  });

  it('forwards order.created as a distinct event so it cannot masquerade as payment', async () => {
    const execute = jest.fn().mockResolvedValue({
      status: Status.SUCCESS,
      notification: null,
    });
    const useCase = { execute } as unknown as CreateNotificationFromOrderEventUseCase;
    const handler = new OrderEventHandler(useCase);
    const payload = {
      id: 'order-1',
      userId: 'user-1',
      status: 'CREATED',
      originCity: null,
      destinationCity: null,
    };

    await handler.handle(
      kafkaMessage({
        name: 'order.created',
        occurredAt: new Date().toISOString(),
        payload,
      }),
    );

    expect(execute).toHaveBeenCalledWith({
      eventName: 'order.created',
      payload,
    });
  });

  it('rejects the Kafka message when notification processing fails', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    const execute = jest.fn().mockResolvedValue({
      status: Status.ERROR,
      message: 'Database unavailable',
    });
    const useCase = { execute } as unknown as CreateNotificationFromOrderEventUseCase;
    const handler = new OrderEventHandler(useCase);

    await expect(
      handler.handle(
        kafkaMessage({
          name: 'order.status_changed',
          payload: {
            id: 'order-1',
            userId: 'user-1',
            status: 'PAID',
          },
        }),
      ),
    ).rejects.toThrow('Notification processing failed: Database unavailable');

    expect(consoleError).toHaveBeenCalledTimes(1);
    consoleError.mockRestore();
  });
});
