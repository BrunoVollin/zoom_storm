export interface FlashOffer {
  id: string;
  productId: string;
  title: string;
  discountPct: number;
  startsAt: string;
  endsAt: string;
}

export interface FlashOfferWriteInput {
  productId: string;
  title: string;
  discountPct: number;
  startsAt: string;
  endsAt: string;
}
