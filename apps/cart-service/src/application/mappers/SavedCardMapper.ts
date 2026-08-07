import { SavedCard } from '@src/domain/entities/payment/SavedCard';

export class SavedCardMapper {
  static toPrimitives(card: SavedCard) {
    return {
      id: card.id.toString(),
      brand: card.getBrand(),
      lastFour: card.getLastFour(),
      holderName: card.getHolderName(),
      expiry: card.getExpiry(),
      isDefault: card.isDefault(),
      createdAt: card.createdAt.toISOString(),
      updatedAt: card.getUpdatedAt().toISOString(),
    };
  }
}

export type SavedCardPrimitives = ReturnType<typeof SavedCardMapper.toPrimitives>;
