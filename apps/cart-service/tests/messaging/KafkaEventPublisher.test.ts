import { DomainEvent, DomainEventName } from '../../src/domain/events/DomainEvent';
import { KafkaEventPublisher } from '../../src/infrastructure/messaging/KafkaEventPublisher';
import { KafkaProducerClient } from '../../src/infrastructure/messaging/KafkaProducerClient';

describe('KafkaEventPublisher', () => {
  it('publishes a PAID status change to order-events without changing the envelope', async () => {
    const send = jest.fn().mockResolvedValue(undefined);
    const producer = { send } as unknown as KafkaProducerClient;
    const publisher = new KafkaEventPublisher(producer);
    const occurredAt = new Date('2026-08-06T12:00:00.000Z');
    const payload = {
      id: 'order-1',
      userId: 'user-1',
      status: 'PAID',
      originCity: null,
      destinationCity: 'Rio de Janeiro',
    };

    await publisher.publish(
      new DomainEvent(
        DomainEventName.ORDER_STATUS_CHANGED,
        payload,
        occurredAt,
      ),
    );

    expect(send).toHaveBeenCalledTimes(1);
    const published = send.mock.calls[0][0];
    expect(published.topic).toBe('order-events');
    expect(JSON.parse(published.messages[0].value)).toEqual({
      name: 'order.status_changed',
      occurredAt: occurredAt.toISOString(),
      payload,
    });
  });

  it('publishes order.created to the same topic with its original CREATED status', async () => {
    const send = jest.fn().mockResolvedValue(undefined);
    const producer = { send } as unknown as KafkaProducerClient;
    const publisher = new KafkaEventPublisher(producer);
    const payload = {
      id: 'order-1',
      userId: 'user-1',
      status: 'CREATED',
    };

    await publisher.publish(
      new DomainEvent(DomainEventName.ORDER_CREATED, payload, new Date(0)),
    );

    const published = send.mock.calls[0][0];
    expect(published.topic).toBe('order-events');
    expect(JSON.parse(published.messages[0].value)).toMatchObject({
      name: 'order.created',
      payload,
    });
  });
});
