import { InventoryReservationStatus } from '../../domain/entities/InventoryReservation';
import { InventoryReservationRepository } from '../../domain/repositories/InventoryReservationRepository';
import { Status, UseCase } from '../contracts/UseCase';
import { buildVariantChanges, mapCommitError } from '../shared/inventory';

export interface ExpireInventoryReservationsInput {
  limit?: number;
}

export interface ExpireInventoryReservationsOutput {
  status: Status.SUCCESS;
  expired: number;
  conflicts: number;
}

export class ExpireInventoryReservationsUseCase implements UseCase<
  ExpireInventoryReservationsInput,
  ExpireInventoryReservationsOutput
> {
  constructor(
    private readonly repository: InventoryReservationRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(
    input: ExpireInventoryReservationsInput,
  ): Promise<ExpireInventoryReservationsOutput> {
    const at = this.now();
    const reservations = await this.repository.findActiveExpiringAtOrBefore(
      at,
      input.limit ?? 100,
    );

    let expired = 0;
    let conflicts = 0;
    for (const reservation of reservations) {
      const variants = await buildVariantChanges(
        this.repository,
        reservation,
        'release',
      );
      if (!Array.isArray(variants)) {
        conflicts += 1;
        continue;
      }

      const result = await this.repository.commit({
        reservation: reservation.expire(at),
        expectedReservationStatus: InventoryReservationStatus.ACTIVE,
        variants,
      });
      if (mapCommitError(result)) conflicts += 1;
      else expired += 1;
    }

    return { status: Status.SUCCESS, expired, conflicts };
  }
}
