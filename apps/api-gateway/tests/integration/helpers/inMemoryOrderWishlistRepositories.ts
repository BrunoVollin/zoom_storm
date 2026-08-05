import { Order } from '@domain/entities/order/Order';
import { WishlistItem } from '@domain/entities/wishlist/WishlistItem';
import { LoyaltyAccount } from '@domain/entities/loyalty/LoyaltyAccount';
import { IdType } from '@domain/shared/IdType';
import { OrderRepository } from '@domain/repositories/OrderRepository';
import { WishlistRepository } from '@domain/repositories/WishlistRepository';
import {
  LoyaltyRepository,
  LoyaltyTransactionType,
} from '@domain/repositories/LoyaltyRepository';
import { CepAddress, CepLookupService } from '@domain/repositories/CepLookupService';

/** In-memory replacement for PrismaOrderRepository. */
export class InMemoryOrderRepository implements OrderRepository {
  private readonly orders = new Map<string, Order>();

  async save(order: Order): Promise<void> {
    this.orders.set(order.id.toString(), order);
  }

  async findById(id: IdType): Promise<Order | null> {
    return this.orders.get(id.toString()) ?? null;
  }

  async findByUserId(userId: IdType): Promise<Order[]> {
    return [...this.orders.values()].filter((order) =>
      order.belongsTo(userId),
    );
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

/** In-memory replacement for ViaCepAdapter — avoids real network calls in tests. */
export class FakeCepLookupService implements CepLookupService {
  async lookup(cep: string): Promise<CepAddress | null> {
    if (!/^\d{5}-?\d{3}$/.test(cep)) return null;

    return { city: 'São Paulo', state: 'SP' };
  }
}
