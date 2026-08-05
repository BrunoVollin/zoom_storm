import { SavedCard } from '../../../../domain/entities/payment/SavedCard';
import { IdType } from '../../../../domain/shared/IdType';
import { SavedCardRepository } from '../../../../domain/repositories/SavedCardRepository';
import { prisma } from '../prisma-connection';

export class PrismaSavedCardRepository implements SavedCardRepository {
  async save(card: SavedCard): Promise<void> {
    await prisma.savedCard.create({
      data: {
        id: card.id.toString(),
        userId: card.userId.toString(),
        brand: card.brand,
        lastFour: card.lastFour,
        holderName: card.holderName,
        expiry: card.expiry,
      },
    });
  }

  async findByUserId(userId: IdType): Promise<Array<SavedCard>> {
    const rows = await prisma.savedCard.findMany({
      where: { userId: userId.toString() },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row) => this.toDomain(row));
  }

  async findById(id: IdType): Promise<SavedCard | null> {
    const row = await prisma.savedCard.findUnique({ where: { id: id.toString() } });

    if (!row) return null;

    return this.toDomain(row);
  }

  async delete(id: IdType): Promise<void> {
    await prisma.savedCard.delete({ where: { id: id.toString() } });
  }

  private toDomain(row: {
    id: string;
    userId: string;
    brand: string;
    lastFour: string;
    holderName: string;
    expiry: string;
    createdAt: Date;
  }): SavedCard {
    return new SavedCard(
      IdType.create(row.id),
      IdType.create(row.userId),
      row.brand,
      row.lastFour,
      row.holderName,
      row.expiry,
      row.createdAt,
    );
  }
}
