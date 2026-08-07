import {
  InventoryReservation,
  InventoryReservationStatus,
} from '../../domain/entities/InventoryReservation';
import {
  InventoryError,
  InventoryErrorCode,
} from '../../domain/errors/InventoryError';
import { InventoryReservationRepository } from '../../domain/repositories/InventoryReservationRepository';
import { Status, UseCase } from '../contracts/UseCase';
import {
  InventoryReservationMapper,
  InventoryReservationPrimitives,
} from '../mappers/InventoryReservationMapper';
import { buildVariantChanges, mapCommitError } from '../shared/inventory';

export interface ReleaseInventoryReservationInput {
  orderId: string;
}

export type ReleaseInventoryReservationOutput =
  | { status: Status.SUCCESS; reservation: InventoryReservationPrimitives }
  | { status: Status.ERROR; code: InventoryErrorCode; message: string };

export class ReleaseInventoryReservationUseCase implements UseCase<
  ReleaseInventoryReservationInput,
  ReleaseInventoryReservationOutput
> {
  constructor(
    private readonly repository: InventoryReservationRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(
    input: ReleaseInventoryReservationInput,
  ): Promise<ReleaseInventoryReservationOutput> {
    const existing = await this.repository.findByOrderId(input.orderId);
    if (!existing) return this.error(InventoryErrorCode.RESERVATION_NOT_FOUND);
    if (
      existing.status === InventoryReservationStatus.RELEASED ||
      existing.status === InventoryReservationStatus.EXPIRED
    ) {
      return this.success(existing);
    }

    let released: InventoryReservation;
    try {
      released = existing.release(this.now());
    } catch (error) {
      return this.error(
        error instanceof InventoryError
          ? error.code
          : InventoryErrorCode.INVENTORY_CONFLICT,
      );
    }

    const variants = await buildVariantChanges(
      this.repository,
      existing,
      'release',
    );
    if (!Array.isArray(variants)) return this.error(variants);

    const result = await this.repository.commit({
      reservation: released,
      expectedReservationStatus: InventoryReservationStatus.ACTIVE,
      variants,
    });
    const error = mapCommitError(result);
    if (error) return this.error(error);
    return this.success(result.reservation ?? released);
  }

  private success(
    reservation: InventoryReservation,
  ): ReleaseInventoryReservationOutput {
    return {
      status: Status.SUCCESS,
      reservation: InventoryReservationMapper.toPrimitives(reservation),
    };
  }

  private error(code: InventoryErrorCode): ReleaseInventoryReservationOutput {
    return { status: Status.ERROR, code, message: code };
  }
}
