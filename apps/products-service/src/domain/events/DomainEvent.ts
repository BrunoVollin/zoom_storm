export class DomainEvent {
  constructor(
    public readonly name: DomainEventName,
    public readonly payload: object,
    public readonly occurredAt: Date,
  ) {}
}

export interface EventPublisher {
  publish(event: DomainEvent): Promise<void>;
}

export enum DomainEventName {
  PRODUCT_CREATED = 'product.created',
}
