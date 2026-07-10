export class ConcurrencyConflictError extends Error {
  constructor(cartId: string) {
    super(`Cart ${cartId} was modified concurrently`);
    this.name = 'ConcurrencyConflictError';
  }
}
