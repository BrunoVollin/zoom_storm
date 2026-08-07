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

export interface ConfirmInventoryReservationInput {
  orderId: string;
}

export type ConfirmInventoryReservationOutput =
  | { status: Status.SUCCESS; reservation: InventoryReservationPrimitives }
  | { status: Status.ERROR; code: InventoryErrorCode; message: string };

export class ConfirmInventoryReservationUseCase implements UseCase<
  ConfirmInventoryReservationInput,
  ConfirmInventoryReservationOutput
> {
  constructor(
    private readonly repository: InventoryReservationRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(
    input: ConfirmInventoryReservationInput,
  ): Promise<ConfirmInventoryReservationOutput> {
    const existing = await this.repository.findByOrderId(input.orderId);
    if (!existing) return this.error(InventoryErrorCode.RESERVATION_NOT_FOUND);
    if (existing.status === InventoryReservationStatus.CONFIRMED) {
      return this.success(existing);
    }
    if (existing.status === InventoryReservationStatus.EXPIRED) {
      return this.error(InventoryErrorCode.RESERVATION_EXPIRED);
    }
    if (existing.status !== InventoryReservationStatus.ACTIVE) {
      return this.error(InventoryErrorCode.RESERVATION_NOT_ACTIVE);
    }

    const at = this.now();
    if (existing.isExpired(at)) {
      await this.expire(existing, at);
      return this.error(InventoryErrorCode.RESERVATION_EXPIRED);
    }

    let confirmed: InventoryReservation;
    try {
      confirmed = existing.confirm(at);
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
      'confirm',
    );
    if (!Array.isArray(variants)) return this.error(variants);

    const result = await this.repository.commit({
      reservation: confirmed,
      expectedReservationStatus: InventoryReservationStatus.ACTIVE,
      variants,
    });
    const error = mapCommitError(result);
    if (error) return this.error(error);
    return this.success(result.reservation ?? confirmed);
  }

  private async expire(
    reservation: InventoryReservation,
    at: Date,
  ): Promise<void> {
    const variants = await buildVariantChanges(
      this.repository,
      reservation,
      'release',
    );
    if (!Array.isArray(variants)) return;
    await this.repository.commit({
      reservation: reservation.expire(at),
      expectedReservationStatus: InventoryReservationStatus.ACTIVE,
      variants,
    });
  }

  private success(
    reservation: InventoryReservation,
  ): ConfirmInventoryReservationOutput {
    return {
      status: Status.SUCCESS,
      reservation: InventoryReservationMapper.toPrimitives(reservation),
    };
  }

  private error(code: InventoryErrorCode): ConfirmInventoryReservationOutput {
    return { status: Status.ERROR, code, message: code };
  }
}
