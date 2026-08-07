import { z } from 'zod';
import { OrderStatus } from '@domain/entities/order/OrderStatus';
import { PaymentMethodType } from '@domain/entities/payment/PaymentMethod';

export const UpdateOrderStatusSchema = z.object({
  status: z.enum(OrderStatus),
});

const SavedCardPaymentSchema = z.object({
  type: z.literal(PaymentMethodType.SAVED_CARD),
  savedCardId: z.string().trim().min(1),
}).strict();

const NewCardPaymentSchema = z.object({
  type: z.literal(PaymentMethodType.NEW_CARD),
  token: z.string().trim().min(1),
  brand: z.string().trim().min(1),
  lastFour: z.string().regex(/^\d{4}$/),
  holderName: z.string().trim().min(1),
  expiry: z.string().regex(/^\d{2}\/\d{2}$/),
  saveCard: z.boolean(),
}).strict();

// The token represents the simulated authorization. PAN and CVC are rejected
// by these strict schemas and are never represented by persistence models.
export const PayOrderSchema = z.object({
  installments: z.int().min(1).max(12),
  paymentMethod: z.discriminatedUnion('type', [
    SavedCardPaymentSchema,
    NewCardPaymentSchema,
  ]),
}).strict();

export const IdempotencyKeySchema = z.string().trim().min(1).max(128);
