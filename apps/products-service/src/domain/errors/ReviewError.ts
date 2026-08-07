export enum ReviewErrorCode {
  PURCHASE_NOT_DELIVERED = 'PURCHASE_NOT_DELIVERED',
  REVIEW_ALREADY_EXISTS = 'REVIEW_ALREADY_EXISTS',
  INVALID_REVIEW = 'INVALID_REVIEW',
}

export class ReviewError extends Error {
  constructor(
    readonly code: ReviewErrorCode,
    message: string = code,
  ) {
    super(message);
    this.name = 'ReviewError';
  }
}
