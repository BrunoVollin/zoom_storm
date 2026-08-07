import { Cart } from '../../src/domain/entities/cart/Cart';
import { Coupon } from '../../src/domain/entities/coupon/Coupon';
import { LoyaltyAccount } from '../../src/domain/entities/loyalty/LoyaltyAccount';
import { LoyaltyReservation } from '../../src/domain/entities/loyalty/LoyaltyReservation';
import { Order } from '../../src/domain/entities/order/Order';
import { OrderStatus } from '../../src/domain/entities/order/OrderStatus';
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
import {
  LoyaltyReservationRepository,
  ReserveLoyaltyResult,
} from '../../src/domain/repositories/LoyaltyReservationRepository';
import { OrderRepository } from '../../src/domain/repositories/OrderRepository';
import {
  InventoryReservationLineInput,
  InventoryReservationResult,
  InventoryReservationService,
  InventoryReservationSnapshot,
} from '../../src/domain/repositories/InventoryReservationService';
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

  async findByCheckoutIdempotencyKey(
    userId: IdType,
    key: string,
  ): Promise<Order | null> {
    return (
      [...this.orders.values()].find(
        (order) =>
          order.belongsTo(userId) && order.checkoutIdempotencyKey === key,
      ) ?? null
    );
  }

  async findByUserId(userId: IdType): Promise<Array<Order>> {
    return [...this.orders.values()].filter((order) =>
      order.belongsTo(userId),
    );
  }

  async findAwaitingPaymentExpiredAtOrBefore(at: Date): Promise<Array<Order>> {
    return [...this.orders.values()].filter(
      (order) =>
        order.getStatus() === OrderStatus.CREATED &&
        order.expiresAt.getTime() <= at.getTime(),
    );
  }

  async findInProgress(): Promise<Array<Order>> {
    return [...this.orders.values()];
  }
}

/**
 * Permissive in-memory fake for InventoryReservationService: every
 * operation succeeds by default (synthesizing a reservation snapshot when
 * one hasn't been created via `reserve` yet), so tests that don't care
 * about inventory reservation mechanics don't need to set one up. Assign
 * `reserveResult`/`confirmResult`/`releaseResult` to force a specific
 * outcome (e.g. simulate a conflict) in tests that do care.
 */
export class FakeInventoryReservationService implements InventoryReservationService {
  readonly reservations = new Map<string, InventoryReservationSnapshot>();
  reserveResult: InventoryReservationResult | null = null;
  confirmResult: InventoryReservationResult | null = null;
  releaseResult: InventoryReservationResult | null = null;

  async reserve(input: {
    orderId: string;
    lines: InventoryReservationLineInput[];
  }): Promise<InventoryReservationResult> {
    if (this.reserveResult) return this.reserveResult;

    const now = new Date();
    const reservation: InventoryReservationSnapshot = {
      id: `reservation-${input.orderId}`,
      orderId: input.orderId,
      status: 'ACTIVE',
      lines: input.lines,
      createdAt: now,
      expiresAt: new Date(now.getTime() + 15 * 60 * 1000),
      updatedAt: now,
    };
    this.reservations.set(input.orderId, reservation);
    return { ok: true, reservation };
  }

  async confirm(orderId: string): Promise<InventoryReservationResult> {
    if (this.confirmResult) return this.confirmResult;

    const reservation =
      this.reservations.get(orderId) ??
      this.buildDefaultReservation(orderId, 'CONFIRMED');
    reservation.status = 'CONFIRMED';
    this.reservations.set(orderId, reservation);
    return { ok: true, reservation };
  }

  async release(orderId: string): Promise<InventoryReservationResult> {
    if (this.releaseResult) return this.releaseResult;

    const reservation =
      this.reservations.get(orderId) ??
      this.buildDefaultReservation(orderId, 'RELEASED');
    reservation.status = 'RELEASED';
    this.reservations.set(orderId, reservation);
    return { ok: true, reservation };
  }

  private buildDefaultReservation(
    orderId: string,
    status: InventoryReservationSnapshot['status'],
  ): InventoryReservationSnapshot {
    const now = new Date();
    return {
      id: `reservation-${orderId}`,
      orderId,
      status,
      lines: [],
      createdAt: now,
      expiresAt: now,
      updatedAt: now,
    };
  }
}

/** In-memory fake implementing LoyaltyReservationRepository for unit tests. */
export class FakeLoyaltyReservationRepository
  implements LoyaltyReservationRepository
{
  readonly reservations = new Map<string, LoyaltyReservation>();

  async findByOrderId(orderId: IdType): Promise<LoyaltyReservation | null> {
    return this.reservations.get(orderId.toString()) ?? null;
  }

  async reserve(
    reservation: LoyaltyReservation,
    currentBalance: number,
  ): Promise<ReserveLoyaltyResult> {
    const orderId = reservation.orderId.toString();
    const existing = this.reservations.get(orderId);

    if (existing) {
      if (
        existing.userId.equals(reservation.userId) &&
        existing.points === reservation.points
      ) {
        return { outcome: 'RESERVED', reservation: existing };
      }
      return { outcome: 'IDEMPOTENCY_CONFLICT' };
    }

    const alreadyReserved = [...this.reservations.values()]
      .filter(
        (candidate) =>
          candidate.userId.equals(reservation.userId) &&
          candidate.getStatus() === 'ACTIVE',
      )
      .reduce((acc, candidate) => acc + candidate.points, 0);

    if (alreadyReserved + reservation.points > currentBalance) {
      return { outcome: 'INSUFFICIENT_BALANCE' };
    }

    this.reservations.set(orderId, reservation);
    return { outcome: 'RESERVED', reservation };
  }

  async save(reservation: LoyaltyReservation): Promise<void> {
    this.reservations.set(reservation.orderId.toString(), reservation);
  }

  async consume(
    reservation: LoyaltyReservation,
    account: LoyaltyAccount,
  ): Promise<void> {
    this.reservations.set(reservation.orderId.toString(), reservation);
    void account;
  }

  async findActiveExpired(referenceDate: Date): Promise<LoyaltyReservation[]> {
    return [...this.reservations.values()].filter(
      (reservation) =>
        reservation.getStatus() === 'ACTIVE' &&
        reservation.expiresAt.getTime() <= referenceDate.getTime(),
    );
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
