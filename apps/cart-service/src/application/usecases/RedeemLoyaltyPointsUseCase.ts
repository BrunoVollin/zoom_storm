import { DomainEvent, DomainEventName } from '@src/domain/events/DomainEvent';
import { CartRepository } from '../../domain/repositories/CartRepository';
import { LoyaltyRepository } from '../../domain/repositories/LoyaltyRepository';
import { LoyaltyAccount } from '../../domain/entities/loyalty/LoyaltyAccount';
import { IdType } from '../../domain/shared/IdType';
import { ErrorOutput, Status, UseCase } from '../contracts/UseCase';
import { CartMapper, CartPrimitives } from '../mappers/CartMapper';
import { handleUnexpectedError } from '../shared/handleUnexpectedError';

export class RedeemLoyaltyPointsUseCase implements UseCase<Input, Output> {
  constructor(
    private readonly cartRepository: CartRepository,
    private readonly loyaltyRepository: LoyaltyRepository,
  ) {}

  async execute(input: Input): Promise<Output> {
    try {
      const cart = await this.cartRepository.findById(
        IdType.create(input.cartId),
      );

      if (!cart) {
        return { status: Status.ERROR, message: 'Cart not found' };
      }

      if (cart.getUserId().toString() !== input.userId) {
        return { status: Status.ERROR, message: 'Cart not found' };
      }

      if (cart.getCoupons().length > 0) {
        return {
          status: Status.ERROR,
          message:
            'Não é possível resgatar pontos com um cupom já aplicado ao carrinho',
        };
      }

      const account =
        (await this.loyaltyRepository.findByUserId(
          IdType.create(input.userId),
        )) ?? new LoyaltyAccount(IdType.create(input.userId), 0);

      if (input.points > account.getBalance()) {
        return { status: Status.ERROR, message: 'Saldo de pontos insuficiente' };
      }

      cart.setLoyaltyRedemption(input.points, account.getBalance());

      const event = new DomainEvent(
        DomainEventName.CART_UPDATED,
        CartMapper.toPrimitives(cart),
        new Date(),
      );

      await this.cartRepository.save(cart, event);

      return {
        status: Status.SUCCESS,
        cart: CartMapper.toPrimitives(cart),
        balance: account.getBalance(),
        reservedPoints: input.points,
      };
    } catch (error) {
      if (error instanceof Error) {
        return { status: Status.ERROR, message: error.message };
      }

      return handleUnexpectedError(error);
    }
  }
}

interface Input {
  cartId: string;
  userId: string;
  points: number;
}

interface SuccessOutput {
  status: Status.SUCCESS;
  cart: CartPrimitives;
  balance: number;
  reservedPoints: number;
}

type Output = SuccessOutput | ErrorOutput;
