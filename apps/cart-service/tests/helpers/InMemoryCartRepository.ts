import { Cart } from '../../src/domain/entities/cart/Cart';
import { IdType } from '../../src/domain/shared/IdType';
import { CartRepository } from '../../src/domain/repositories/CartRepository';
import { DomainEvent } from '../../src/domain/events/DomainEvent';

export class InMemoryCartRepository implements CartRepository {
  private readonly carts = new Map<string, Cart>();
  public readonly publishedEvents: Array<DomainEvent> = [];

  async save(cart: Cart, event?: DomainEvent): Promise<void> {
    this.carts.set(cart.getId().toString(), cart);

    if (event) this.publishedEvents.push(event);
  }

  async findById(id: IdType): Promise<Cart | null> {
    return this.carts.get(id.toString()) ?? null;
  }

  seed(cart: Cart) {
    this.carts.set(cart.getId().toString(), cart);
  }
}
