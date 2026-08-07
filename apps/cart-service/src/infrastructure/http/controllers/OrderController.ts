import type { Context } from 'hono';
import { ListOrdersQuery } from '@application/Queries/ListOrdersQuery';
import { OrderQuery } from '@application/Queries/OrderQuery';
import { UpdateOrderStatusUseCase } from '@application/usecases/UpdateOrderStatusUseCase';
import { PayOrderUseCase } from '@application/usecases/PayOrderUseCase';
import { CancelOrderUseCase } from '@application/usecases/CancelOrderUseCase';
import { Status } from '@application/contracts/UseCase';
import { validate, validationError } from '../schemas/cart.schemas';
import { IdempotencyKeySchema, PayOrderSchema, UpdateOrderStatusSchema } from '../schemas/order.schemas';

export class OrderController {
  constructor(
    private readonly listOrders: ListOrdersQuery,
    private readonly getOrder: OrderQuery,
    private readonly updateOrderStatus: UpdateOrderStatusUseCase,
    private readonly payOrder: PayOrderUseCase,
    private readonly cancelOrder: CancelOrderUseCase,
  ) {}

  async list(c: Context) {
    const result = await this.listOrders.execute({
      userId: c.get('userId') as string,
    });

    return c.json(result, 200);
  }

  async getById(c: Context) {
    const result = await this.getOrder.execute({
      orderId: c.req.param('orderId')!,
      userId: c.get('userId') as string,
    });

    return c.json(result, result.status === Status.SUCCESS ? 200 : 404);
  }

  async updateStatus(c: Context) {
    const parsed = validate(UpdateOrderStatusSchema, await c.req.json());
    if ('error' in parsed) return validationError(c, parsed.error);

    const result = await this.updateOrderStatus.execute({
      orderId: c.req.param('orderId')!,
      status: parsed.data.status,
    });

    return c.json(result, result.status === Status.SUCCESS ? 200 : 422);
  }

  async pay(c: Context) {
    const idempotencyKey = validate(
      IdempotencyKeySchema,
      c.req.header('Idempotency-Key'),
    );
    if ('error' in idempotencyKey) {
      return validationError(c, `Idempotency-Key: ${idempotencyKey.error}`);
    }

    const parsed = validate(PayOrderSchema, await c.req.json());
    if ('error' in parsed) return validationError(c, parsed.error);

    const result = await this.payOrder.execute({
      orderId: c.req.param('orderId')!,
      userId: c.get('userId') as string,
      idempotencyKey: idempotencyKey.data,
      installments: parsed.data.installments,
      paymentMethod: parsed.data.paymentMethod,
    });

    const status =
      result.status === Status.SUCCESS
        ? 200
        : result.code === 'IDEMPOTENCY_CONFLICT'
          ? 409
          : 422;
    return c.json(result, status);
  }

  async cancel(c: Context) {
    const result = await this.cancelOrder.execute({
      orderId: c.req.param('orderId')!,
      userId: c.get('userId') as string,
    });
    return c.json(result, result.status === Status.SUCCESS ? 200 : 422);
  }
}
