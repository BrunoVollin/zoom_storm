import type { Context } from 'hono';
import { GetLoyaltyBalanceQuery } from '@application/Queries/GetLoyaltyBalanceQuery';
import { RedeemLoyaltyPointsUseCase } from '@application/usecases/RedeemLoyaltyPointsUseCase';
import { RemoveLoyaltyRedemptionUseCase } from '@application/usecases/RemoveLoyaltyRedemptionUseCase';
import { Status } from '@application/contracts/UseCase';
import { validate, validationError } from '../schemas/cart.schemas';
import { RedeemLoyaltyPointsSchema } from '../schemas/loyalty.schemas';

export class LoyaltyController {
  constructor(
    private readonly getLoyaltyBalance: GetLoyaltyBalanceQuery,
    private readonly redeemLoyaltyPoints: RedeemLoyaltyPointsUseCase,
    private readonly removeLoyaltyRedemption: RemoveLoyaltyRedemptionUseCase,
  ) {}

  async balance(c: Context) {
    const result = await this.getLoyaltyBalance.execute({
      userId: c.get('userId') as string,
    });

    return c.json(result, 200);
  }

  async redeem(c: Context) {
    const parsed = validate(RedeemLoyaltyPointsSchema, await c.req.json());
    if ('error' in parsed) return validationError(c, parsed.error);

    const result = await this.redeemLoyaltyPoints.execute({
      cartId: c.req.param('cartId')!,
      userId: c.get('userId') as string,
      points: parsed.data.points,
    });

    return c.json(result, result.status === Status.SUCCESS ? 200 : 422);
  }

  async removeRedemption(c: Context) {
    const result = await this.removeLoyaltyRedemption.execute({
      cartId: c.req.param('cartId')!,
      userId: c.get('userId') as string,
    });

    return c.json(result, result.status === Status.SUCCESS ? 200 : 422);
  }
}
