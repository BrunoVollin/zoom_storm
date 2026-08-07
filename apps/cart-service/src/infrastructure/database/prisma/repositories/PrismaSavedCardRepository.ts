import { SavedCard } from '../../../../domain/entities/payment/SavedCard';
import { IdType } from '../../../../domain/shared/IdType';
import { SavedCardRepository } from '../../../../domain/repositories/SavedCardRepository';
import { prisma } from '../prisma-connection';

export class PrismaSavedCardRepository implements SavedCardRepository {
  async save(card: SavedCard): Promise<void> {
    const id = card.id.toString();
    const userId = card.userId.toString();
    const data = {
      userId,
      brand: card.getBrand(),
      lastFour: card.getLastFour(),
      holderName: card.getHolderName(),
      expiry: card.getExpiry(),
      isDefault: card.isDefault(),
      createdAt: card.createdAt,
      updatedAt: card.getUpdatedAt(),
    };

    await prisma.$transaction(async (tx) => {
      if (card.isDefault()) {
        await tx.savedCard.updateMany({
          where: { userId, isDefault: true, id: { not: id } },
          data: { isDefault: false },
        });
      }

      await tx.savedCard.upsert({
        where: { id },
        create: { id, ...data },
        update: data,
      });
    });
  }

  async findByUserId(userId: IdType): Promise<Array<SavedCard>> {
    const rows = await prisma.savedCard.findMany({
      where: { userId: userId.toString() },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
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
    isDefault: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): SavedCard {
    return new SavedCard(
      IdType.create(row.id),
      IdType.create(row.userId),
      row.brand,
      row.lastFour,
      row.holderName,
      row.expiry,
      row.createdAt,
      row.isDefault,
      row.updatedAt,
    );
  }
}
