export interface DomainEvent {
  name: string;
  payload: object;
  occurredAt: Date;
}
