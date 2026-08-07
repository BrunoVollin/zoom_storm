import { Order } from '@domain/entities/order/Order';
import { OrderStatus } from '@domain/entities/order/OrderStatus';
import { SavedAddress } from '@domain/entities/profile/SavedAddress';
import { WishlistItem } from '@domain/entities/wishlist/WishlistItem';
import { LoyaltyAccount } from '@domain/entities/loyalty/LoyaltyAccount';
import { UserProfile } from '@domain/entities/profile/UserProfile';
import { SavedCard } from '@domain/entities/payment/SavedCard';
import { PaymentAttempt } from '@domain/entities/payment/PaymentAttempt';
import { LoyaltyReservation } from '@domain/entities/loyalty/LoyaltyReservation';
import { ShippingQuote } from '@domain/entities/freight/ShippingQuote';
import { IdType } from '@domain/shared/IdType';
import { OrderRepository } from '@domain/repositories/OrderRepository';
import { SavedAddressRepository } from '@domain/repositories/SavedAddressRepository';
import { WishlistRepository } from '@domain/repositories/WishlistRepository';
import {
  LoyaltyRepository,
  LoyaltyTransactionType,
} from '@domain/repositories/LoyaltyRepository';
import { UserProfileRepository } from '@domain/repositories/UserProfileRepository';
import { SavedCardRepository } from '@domain/repositories/SavedCardRepository';
import {
  CompletePaymentInput,
  PaymentAttemptRepository,
} from '@domain/repositories/PaymentAttemptRepository';
import {
  LoyaltyReservationRepository,
  ReserveLoyaltyResult,
} from '@domain/repositories/LoyaltyReservationRepository';
import { ShippingQuoteRepository } from '@domain/repositories/ShippingQuoteRepository';
import { CepAddress, CepLookupService } from '@domain/repositories/CepLookupService';
import {
  InventoryReservationLineInput,
  InventoryReservationResult,
  InventoryReservationService,
  InventoryReservationSnapshot,
} from '@domain/repositories/InventoryReservationService';
import { DomainEvent } from '@domain/events/DomainEvent';

/** In-memory replacement for PrismaOrderRepository. */
export class InMemoryOrderRepository implements OrderRepository {
  private readonly orders = new Map<string, Order>();

  async save(order: Order, _events?: DomainEvent | Array<DomainEvent>): Promise<void> {
    this.orders.set(order.id.toString(), order);
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

  async findByUserId(userId: IdType): Promise<Order[]> {
    return [...this.orders.values()].filter((order) =>
      order.belongsTo(userId),
    );
  }

  async findAwaitingPaymentExpiredAtOrBefore(at: Date): Promise<Order[]> {
    return [...this.orders.values()].filter(
      (order) =>
        order.getStatus() === OrderStatus.CREATED &&
        order.expiresAt.getTime() <= at.getTime(),
    );
  }

  async findInProgress(): Promise<Order[]> {
    return [...this.orders.values()].filter(
      (order) =>
        order.getStatus() !== OrderStatus.CREATED &&
        order.getStatus() !== OrderStatus.DELIVERED,
    );
  }
}

/** In-memory replacement for PrismaSavedAddressRepository. */
export class InMemorySavedAddressRepository implements SavedAddressRepository {
  private readonly addresses = new Map<string, SavedAddress>();

  async save(address: SavedAddress): Promise<void> {
    if (address.isDefault()) {
      for (const current of this.addresses.values()) {
        if (
          current.belongsTo(address.userId) &&
          !current.id.equals(address.id)
        ) {
          current.clearDefault();
        }
      }
    }
    this.addresses.set(address.id.toString(), address);
  }

  async findById(id: IdType): Promise<SavedAddress | null> {
    return this.addresses.get(id.toString()) ?? null;
  }

  async findByUserId(userId: IdType): Promise<SavedAddress[]> {
    return [...this.addresses.values()].filter((address) =>
      address.belongsTo(userId),
    );
  }

  async delete(id: IdType): Promise<void> {
    this.addresses.delete(id.toString());
  }
}

/**
 * Permissive in-memory replacement for the products-service inventory
 * reservation HTTP adapter: every operation succeeds by default, which is
 * enough for gateway integration tests that exercise the checkout/payment
 * HTTP contract without asserting on inventory reservation mechanics.
 */
export class InMemoryInventoryReservationService implements InventoryReservationService {
  private readonly reservations = new Map<string, InventoryReservationSnapshot>();

  async reserve(input: {
    orderId: string;
    lines: InventoryReservationLineInput[];
  }): Promise<InventoryReservationResult> {
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
    const reservation =
      this.reservations.get(orderId) ?? this.buildDefault(orderId, 'CONFIRMED');
    reservation.status = 'CONFIRMED';
    this.reservations.set(orderId, reservation);
    return { ok: true, reservation };
  }

  async release(orderId: string): Promise<InventoryReservationResult> {
    const reservation =
      this.reservations.get(orderId) ?? this.buildDefault(orderId, 'RELEASED');
    reservation.status = 'RELEASED';
    this.reservations.set(orderId, reservation);
    return { ok: true, reservation };
  }

  private buildDefault(
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

/** In-memory replacement for PrismaWishlistRepository. */
export class InMemoryWishlistRepository implements WishlistRepository {
  private readonly items: WishlistItem[] = [];

  async add(item: WishlistItem): Promise<void> {
    const exists = this.items.some(
      (existing) =>
        existing.userId.toString() === item.userId.toString() &&
        existing.productId.toString() === item.productId.toString(),
    );
    if (!exists) this.items.push(item);
  }

  async remove(userId: IdType, productId: IdType): Promise<void> {
    const index = this.items.findIndex(
      (item) =>
        item.userId.toString() === userId.toString() &&
        item.productId.toString() === productId.toString(),
    );
    if (index >= 0) this.items.splice(index, 1);
  }

  async findByUserId(userId: IdType): Promise<WishlistItem[]> {
    return this.items.filter((item) => item.userId.toString() === userId.toString());
  }
}

/** In-memory replacement for PrismaLoyaltyRepository. */
export class InMemoryLoyaltyRepository implements LoyaltyRepository {
  private readonly accounts = new Map<string, LoyaltyAccount>();

  async findByUserId(userId: IdType): Promise<LoyaltyAccount | null> {
    return this.accounts.get(userId.toString()) ?? null;
  }

  async save(
    account: LoyaltyAccount,
    _transaction: { type: LoyaltyTransactionType; points: number; orderId?: string },
  ): Promise<void> {
    this.accounts.set(account.userId.toString(), account);
  }
}

/** In-memory replacement for PrismaUserProfileRepository. */
export class InMemoryUserProfileRepository implements UserProfileRepository {
  private readonly profiles = new Map<string, UserProfile>();

  async findByUserId(userId: IdType): Promise<UserProfile | null> {
    return this.profiles.get(userId.toString()) ?? null;
  }

  async save(profile: UserProfile): Promise<void> {
    this.profiles.set(profile.userId.toString(), profile);
  }
}

/** In-memory replacement for PrismaSavedCardRepository. */
export class InMemorySavedCardRepository implements SavedCardRepository {
  private readonly cards = new Map<string, SavedCard>();

  async save(card: SavedCard): Promise<void> {
    this.cards.set(card.id.toString(), card);
  }

  async findByUserId(userId: IdType): Promise<SavedCard[]> {
    return [...this.cards.values()].filter((card) => card.belongsTo(userId));
  }

  async findById(id: IdType): Promise<SavedCard | null> {
    return this.cards.get(id.toString()) ?? null;
  }

  async delete(id: IdType): Promise<void> {
    this.cards.delete(id.toString());
  }
}

/** In-memory replacement for PrismaPaymentAttemptRepository. */
export class InMemoryPaymentAttemptRepository implements PaymentAttemptRepository {
  private readonly attempts = new Map<string, PaymentAttempt>();

  async findByIdempotencyKey(
    userId: IdType,
    key: string,
  ): Promise<PaymentAttempt | null> {
    return (
      [...this.attempts.values()].find(
        (attempt) =>
          attempt.userId.toString() === userId.toString() &&
          attempt.idempotencyKey === key,
      ) ?? null
    );
  }

  async save(attempt: PaymentAttempt): Promise<void> {
    this.attempts.set(attempt.id.toString(), attempt);
  }

  async complete(input: CompletePaymentInput): Promise<void> {
    await this.save(input.attempt);
  }
}

/** In-memory replacement for PrismaLoyaltyReservationRepository. */
export class InMemoryLoyaltyReservationRepository
  implements LoyaltyReservationRepository
{
  private readonly reservations = new Map<string, LoyaltyReservation>();

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

  async consume(reservation: LoyaltyReservation): Promise<void> {
    this.reservations.set(reservation.orderId.toString(), reservation);
  }

  async findActiveExpired(referenceDate: Date): Promise<LoyaltyReservation[]> {
    return [...this.reservations.values()].filter(
      (reservation) =>
        reservation.getStatus() === 'ACTIVE' &&
        reservation.expiresAt.getTime() <= referenceDate.getTime(),
    );
  }
}

/** In-memory replacement for PrismaShippingQuoteRepository. */
export class InMemoryShippingQuoteRepository implements ShippingQuoteRepository {
  private readonly quotes = new Map<string, ShippingQuote>();

  async save(quote: ShippingQuote): Promise<void> {
    this.quotes.set(quote.id.toString(), quote);
  }

  async findById(id: IdType): Promise<ShippingQuote | null> {
    return this.quotes.get(id.toString()) ?? null;
  }
}

/** In-memory replacement for ViaCepAdapter — avoids real network calls in tests. */
export class FakeCepLookupService implements CepLookupService {
  async lookup(cep: string): Promise<CepAddress | null> {
    if (!/^\d{5}-?\d{3}$/.test(cep)) return null;

    return { city: 'São Paulo', state: 'SP' };
  }
}
