import { Cart } from '../../src/domain/entities/cart/Cart';
import { Coupon } from '../../src/domain/entities/coupon/Coupon';
import { LoyaltyAccount } from '../../src/domain/entities/loyalty/LoyaltyAccount';
import { Order } from '../../src/domain/entities/order/Order';
import { WishlistItem } from '../../src/domain/entities/wishlist/WishlistItem';
import { DomainEvent } from '../../src/domain/events/DomainEvent';
import {
  CartRepository,
} from '../../src/domain/repositories/CartRepository';
import {
  CouponRepository,
} from '../../src/domain/repositories/CouponRepository';
import {
  LoyaltyRepository,
  LoyaltyTransactionType,
} from '../../src/domain/repositories/LoyaltyRepository';
import { OrderRepository } from '../../src/domain/repositories/OrderRepository';
import {
  WishlistRepository,
} from '../../src/domain/repositories/WishlistRepository';
import { IdType } from '../../src/domain/shared/IdType';

/** In-memory fake implementing LoyaltyRepository for unit tests. */
export class FakeLoyaltyRepository implements LoyaltyRepository {
  readonly accounts = new Map<string, LoyaltyAccount>();
  readonly transactions: Array<{
    userId: string;
    type: LoyaltyTransactionType;
    points: number;
    orderId?: string;
  }> = [];

  async findByUserId(userId: IdType): Promise<LoyaltyAccount | null> {
    return this.accounts.get(userId.toString()) ?? null;
  }

  async save(
    account: LoyaltyAccount,
    transaction: { type: LoyaltyTransactionType; points: number; orderId?: string },
  ): Promise<void> {
    this.accounts.set(account.userId.toString(), account);
    this.transactions.push({
      userId: account.userId.toString(),
      ...transaction,
    });
  }
}

/** In-memory fake implementing CouponRepository for unit tests. */
export class FakeCouponRepository implements CouponRepository {
  readonly coupons = new Map<string, Coupon>();

  async save(coupon: Coupon): Promise<void> {
    this.coupons.set(coupon.id.toString(), coupon);
  }

  async findAll(): Promise<Array<Coupon>> {
    return [...this.coupons.values()];
  }

  async findById(id: IdType): Promise<Coupon | null> {
    return this.coupons.get(id.toString()) ?? null;
  }

  async findByIds(ids: Array<IdType>): Promise<Array<Coupon>> {
    return ids
      .map((id) => this.coupons.get(id.toString()))
      .filter((coupon): coupon is Coupon => Boolean(coupon));
  }

  async findByName(name: string): Promise<Coupon | null> {
    return (
      [...this.coupons.values()].find((coupon) => coupon.getName() === name) ??
      null
    );
  }

  async delete(id: IdType): Promise<void> {
    this.coupons.delete(id.toString());
  }
}

/** In-memory fake implementing WishlistRepository for unit tests. */
export class FakeWishlistRepository implements WishlistRepository {
  readonly items: Array<WishlistItem> = [];

  async add(item: WishlistItem): Promise<void> {
    this.items.push(item);
  }

  async remove(userId: IdType, productId: IdType): Promise<void> {
    const index = this.items.findIndex(
      (item) =>
        item.userId.toString() === userId.toString() &&
        item.productId.toString() === productId.toString(),
    );

    if (index >= 0) {
      this.items.splice(index, 1);
    }
  }

  async findByUserId(userId: IdType): Promise<Array<WishlistItem>> {
    return this.items.filter(
      (item) => item.userId.toString() === userId.toString(),
    );
  }
}

/** In-memory fake implementing OrderRepository for unit tests. */
export class FakeOrderRepository implements OrderRepository {
  readonly orders = new Map<string, Order>();
  readonly savedEvents: Array<DomainEvent | Array<DomainEvent>> = [];

  async save(
    order: Order,
    events?: DomainEvent | Array<DomainEvent>,
  ): Promise<void> {
    this.orders.set(order.id.toString(), order);
    if (events) this.savedEvents.push(events);
  }

  async findById(id: IdType): Promise<Order | null> {
    return this.orders.get(id.toString()) ?? null;
  }

  async findByUserId(userId: IdType): Promise<Array<Order>> {
    return [...this.orders.values()].filter((order) =>
      order.belongsTo(userId),
    );
  }

  async findInProgress(): Promise<Array<Order>> {
    return [...this.orders.values()];
  }
}

/** In-memory fake implementing CartRepository for unit tests. */
export class FakeCartRepository implements CartRepository {
  readonly carts = new Map<string, Cart>();
  readonly savedEvents: Array<DomainEvent | Array<DomainEvent>> = [];

  async save(cart: Cart, events?: DomainEvent | Array<DomainEvent>): Promise<void> {
    this.carts.set(cart.getId().toString(), cart);
    if (events) this.savedEvents.push(events);
  }

  async findById(id: IdType): Promise<Cart | null> {
    return this.carts.get(id.toString()) ?? null;
  }
}
