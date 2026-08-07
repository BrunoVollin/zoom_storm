export interface UseCase<Input, Output extends OutputUseCase> {
  execute(input: Input): Promise<Output>;
}

export interface SuccessOutput {
  status: Status.SUCCESS;
}

export interface ErrorOutput {
  status: Status.ERROR;
  message: string;
  code?:
    | 'CONCURRENCY_CONFLICT'
    | 'ADDRESS_NOT_FOUND'
    | 'PAYMENT_METHOD_NOT_FOUND'
    | 'IDEMPOTENCY_CONFLICT'
    | 'PRODUCT_UNAVAILABLE'
    | 'INSUFFICIENT_STOCK'
    | 'CATALOG_CHANGED'
    | 'RESERVATION_NOT_FOUND'
    | 'RESERVATION_EXPIRED'
    | 'RESERVATION_NOT_ACTIVE'
    | 'INVENTORY_CONFLICT'
    | 'COUPON_CHANGED'
    | 'COUPON_UNAVAILABLE'
    | 'LOYALTY_BALANCE_CHANGED'
    | 'SHIPPING_QUOTE_EXPIRED';
}

export type OutputUseCase = SuccessOutput | ErrorOutput;

export enum Status {
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  PENDING = 'PENDING',
}
