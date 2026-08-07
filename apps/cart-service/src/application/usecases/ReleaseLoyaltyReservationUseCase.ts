import { LoyaltyReservationRepository } from '../../domain/repositories/LoyaltyReservationRepository';
import { IdType } from '../../domain/shared/IdType';
import { ErrorOutput, Status, UseCase } from '../contracts/UseCase';
import {
  LoyaltyReservationMapper,
  LoyaltyReservationPrimitives,
} from '../mappers/LoyaltyReservationMapper';
import { handleUnexpectedError } from '../shared/handleUnexpectedError';

export class ReleaseLoyaltyReservationUseCase
  implements UseCase<Input, Output>
{
  constructor(
    private readonly reservationRepository: LoyaltyReservationRepository,
  ) {}

  async execute(input: Input): Promise<Output> {
    try {
      const reservation = await this.reservationRepository.findByOrderId(
        IdType.create(input.orderId),
      );

      if (!reservation || reservation.userId.toString() !== input.userId) {
        return { status: Status.ERROR, message: 'Loyalty reservation not found' };
      }

      reservation.release(input.releasedAt);
      await this.reservationRepository.save(reservation);

      return {
        status: Status.SUCCESS,
        reservation: LoyaltyReservationMapper.toPrimitives(reservation),
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
  releasedAt?: Date;
}

interface SuccessOutput {
  status: Status.SUCCESS;
  reservation: LoyaltyReservationPrimitives;
}

type Output = SuccessOutput | ErrorOutput;
