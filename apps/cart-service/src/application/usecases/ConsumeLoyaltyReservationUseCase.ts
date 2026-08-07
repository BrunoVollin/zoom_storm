import { LoyaltyRepository } from '../../domain/repositories/LoyaltyRepository';
import { LoyaltyReservationRepository } from '../../domain/repositories/LoyaltyReservationRepository';
import { IdType } from '../../domain/shared/IdType';
import { ErrorOutput, Status, UseCase } from '../contracts/UseCase';
import {
  LoyaltyReservationMapper,
  LoyaltyReservationPrimitives,
} from '../mappers/LoyaltyReservationMapper';
import { handleUnexpectedError } from '../shared/handleUnexpectedError';

export class ConsumeLoyaltyReservationUseCase
  implements UseCase<Input, Output>
{
  constructor(
    private readonly loyaltyRepository: LoyaltyRepository,
    private readonly reservationRepository: LoyaltyReservationRepository,
  ) {}

  async execute(input: Input): Promise<Output> {
    try {
      const orderId = IdType.create(input.orderId);
      const userId = IdType.create(input.userId);
      const reservation =
        await this.reservationRepository.findByOrderId(orderId);

      if (!reservation || !reservation.userId.equals(userId)) {
        return { status: Status.ERROR, message: 'Loyalty reservation not found' };
      }

      const account = await this.loyaltyRepository.findByUserId(userId);
      if (!account) {
        return {
          status: Status.ERROR,
          message: 'Loyalty balance changed before payment',
          code: 'LOYALTY_BALANCE_CHANGED',
        };
      }

      reservation.consume(input.consumedAt);
      account.redeem(reservation.points);
      await this.reservationRepository.consume(reservation, account);

      return {
        status: Status.SUCCESS,
        reservation: LoyaltyReservationMapper.toPrimitives(reservation),
        balance: account.getBalance(),
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
  orderId: string;
  userId: string;
  consumedAt?: Date;
}

interface SuccessOutput {
  status: Status.SUCCESS;
  reservation: LoyaltyReservationPrimitives;
  balance: number;
}

type Output = SuccessOutput | ErrorOutput;
