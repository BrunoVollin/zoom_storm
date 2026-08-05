import type { Context } from 'hono';
import { ListOrdersQuery } from '@application/Queries/ListOrdersQuery';
import { OrderQuery } from '@application/Queries/OrderQuery';
import { UpdateOrderStatusUseCase } from '@application/usecases/UpdateOrderStatusUseCase';
import { PayOrderUseCase } from '@application/usecases/PayOrderUseCase';
import { Status } from '@application/contracts/UseCase';
import { validate, validationError } from '../schemas/cart.schemas';
import { PayOrderSchema, UpdateOrderStatusSchema } from '../schemas/order.schemas';

export class OrderController {
  constructor(
    private readonly listOrders: ListOrdersQuery,
    private readonly getOrder: OrderQuery,
    private readonly updateOrderStatus: UpdateOrderStatusUseCase,
    private readonly payOrder: PayOrderUseCase,
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
    const parsed = validate(PayOrderSchema, await c.req.json());
    if ('error' in parsed) return validationError(c, parsed.error);

    const result = await this.payOrder.execute({
      orderId: c.req.param('orderId')!,
      userId: c.get('userId') as string,
      installments: parsed.data.installments,
    });

    return c.json(result, result.status === Status.SUCCESS ? 200 : 422);
  }
}
