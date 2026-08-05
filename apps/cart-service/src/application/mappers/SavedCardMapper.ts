import { SavedCard } from '@src/domain/entities/payment/SavedCard';

export class SavedCardMapper {
  static toPrimitives(card: SavedCard) {
    return {
      id: card.id.toString(),
      brand: card.brand,
      lastFour: card.lastFour,
      holderName: card.holderName,
      expiry: card.expiry,
      createdAt: card.createdAt.toISOString(),
    };
  }
}

export type SavedCardPrimitives = ReturnType<typeof SavedCardMapper.toPrimitives>;
