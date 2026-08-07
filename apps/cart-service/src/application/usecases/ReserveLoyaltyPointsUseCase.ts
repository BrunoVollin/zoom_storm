import { LoyaltyAccount } from '../../domain/entities/loyalty/LoyaltyAccount';
import { LoyaltyRepository } from '../../domain/repositories/LoyaltyRepository';
import { LoyaltyReservationRepository } from '../../domain/repositories/LoyaltyReservationRepository';
import { IdType } from '../../domain/shared/IdType';
import { LoyaltyReservation } from '../../domain/entities/loyalty/LoyaltyReservation';
import { ErrorOutput, Status, UseCase } from '../contracts/UseCase';
import {
  LoyaltyReservationMapper,
  LoyaltyReservationPrimitives,
} from '../mappers/LoyaltyReservationMapper';
import { handleUnexpectedError } from '../shared/handleUnexpectedError';

export class ReserveLoyaltyPointsUseCase implements UseCase<Input, Output> {
  constructor(
    private readonly loyaltyRepository: LoyaltyRepository,
    private readonly reservationRepository: LoyaltyReservationRepository,
  ) {}

  async execute(input: Input): Promise<Output> {
    try {
      const userId = IdType.create(input.userId);
      const account =
        (await this.loyaltyRepository.findByUserId(userId)) ??
        new LoyaltyAccount(userId, 0);
      const reservation = LoyaltyReservation.create(
        IdType.create(input.orderId),
        userId,
        input.points,
        input.expiresAt,
        input.createdAt,
      );

      const result = await this.reservationRepository.reserve(
        reservation,
        account.getBalance(),
      );

      if (result.outcome === 'INSUFFICIENT_BALANCE') {
        return {
          status: Status.ERROR,
          message: 'Loyalty balance changed before checkout',
          code: 'LOYALTY_BALANCE_CHANGED',
        };
      }

      if (result.outcome === 'IDEMPOTENCY_CONFLICT') {
        return {
          status: Status.ERROR,
          message: 'Order already has a different loyalty reservation',
          code: 'IDEMPOTENCY_CONFLICT',
        };
      }

      return {
        status: Status.SUCCESS,
        reservation: LoyaltyReservationMapper.toPrimitives(result.reservation),
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
  points: number;
  expiresAt: Date;
  createdAt?: Date;
}

interface SuccessOutput {
  status: Status.SUCCESS;
  reservation: LoyaltyReservationPrimitives;
}

type Output = SuccessOutput | ErrorOutput;
