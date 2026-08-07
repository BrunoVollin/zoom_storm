import { LoyaltyReservationRepository } from '../../domain/repositories/LoyaltyReservationRepository';
import { ErrorOutput, Status, UseCase } from '../contracts/UseCase';
import { handleUnexpectedError } from '../shared/handleUnexpectedError';

export class ExpireLoyaltyReservationsUseCase
  implements UseCase<Input, Output>
{
  constructor(
    private readonly reservationRepository: LoyaltyReservationRepository,
  ) {}

  async execute(input: Input): Promise<Output> {
    try {
      const reservations =
        await this.reservationRepository.findActiveExpired(input.referenceDate);

      for (const reservation of reservations) {
        reservation.expire(input.referenceDate);
        await this.reservationRepository.save(reservation);
      }

      return { status: Status.SUCCESS, expired: reservations.length };
    } catch (error) {
      return handleUnexpectedError(error);
    }
  }
}

interface Input {
  referenceDate: Date;
}

interface SuccessOutput {
  status: Status.SUCCESS;
  expired: number;
}

type Output = SuccessOutput | ErrorOutput;
