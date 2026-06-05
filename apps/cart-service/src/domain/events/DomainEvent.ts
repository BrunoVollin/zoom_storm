export class DomainEvent {
  constructor(
    public readonly name: DomainEventName,
    public readonly payload: object,
    public readonly occurredAt: Date,
  ) {}
}

export enum DomainEventName {
  CART_CREATED = 'cart.created',
  CART_ITEM_ADDED = 'cart.item_added',
  CART_ITEM_REMOVED = 'cart.item_removed',
  CART_UPDATED = 'cart.updated',
  CART_CHECKED_OUT = 'cart.checked_out',
  CART_ABANDONED = 'cart.abandoned',
}
