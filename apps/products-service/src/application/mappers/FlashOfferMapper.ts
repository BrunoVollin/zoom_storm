import { FlashOffer } from '../../domain/entities/FlashOffer';

export class FlashOfferMapper {
  static toPrimitives(offer: FlashOffer) {
    return {
      id: offer.id.toString(),
      productId: offer.productId.toString(),
      title: offer.title,
      discountPct: offer.discountPct,
      startsAt: offer.startsAt,
      endsAt: offer.endsAt,
    };
  }
}

export type FlashOfferPrimitives = ReturnType<typeof FlashOfferMapper.toPrimitives>;
