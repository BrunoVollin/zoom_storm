import { z } from 'zod';
import { OrderStatus } from '@domain/entities/order/OrderStatus';

export const UpdateOrderStatusSchema = z.object({
  status: z.enum(OrderStatus),
});

// Only the installment count is sent to the server — the card number/CVV
// are validated entirely client-side and never leave the browser, even
// masked, since nothing here persists payment metadata.
export const PayOrderSchema = z.object({
  installments: z.int().min(1).max(12),
});
