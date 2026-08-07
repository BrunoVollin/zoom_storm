export enum PaymentMethodType {
  SAVED_CARD = 'SAVED_CARD',
  NEW_CARD = 'NEW_CARD',
}

interface CardSnapshot {
  brand: string;
  lastFour: string;
  holderName: string;
  expiry: string;
}

export interface SavedCardPaymentMethod extends CardSnapshot {
  type: PaymentMethodType.SAVED_CARD;
  savedCardId: string;
}

export interface SavedCardPaymentReference {
  type: PaymentMethodType.SAVED_CARD;
  savedCardId: string;
}

export interface NewCardPaymentMethod extends CardSnapshot {
  type: PaymentMethodType.NEW_CARD;
  saveCard: boolean;
}

/** Safe payment snapshot. It intentionally cannot represent PAN, CVC or a token. */
export type PaymentMethod = SavedCardPaymentMethod | NewCardPaymentMethod;
export type PaymentMethodRequest = SavedCardPaymentReference | NewCardPaymentMethod;
