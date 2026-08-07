import {
  InventoryReservation,
  InventoryReservationStatus,
} from '../../domain/entities/InventoryReservation';
import { InventoryErrorCode } from '../../domain/errors/InventoryError';
import {
  InventoryCommitOutcome,
  InventoryReservationRepository,
} from '../../domain/repositories/InventoryReservationRepository';
import { IdType } from '../../domain/shared/IdType';
import { Status, UseCase } from '../contracts/UseCase';
import {
  InventoryReservationMapper,
  InventoryReservationPrimitives,
} from '../mappers/InventoryReservationMapper';
import { buildVariantChanges, mapCommitError } from '../shared/inventory';

export interface ReserveInventoryInput {
  orderId: string;
  lines: Array<{
    variantId: string;
    quantity: number;
    expectedUnitPrice: number;
  }>;
}

export type ReserveInventoryOutput =
  | { status: Status.SUCCESS; reservation: InventoryReservationPrimitives }
  | { status: Status.ERROR; code: InventoryErrorCode; message: string };

export class ReserveInventoryUseCase implements UseCase<
  ReserveInventoryInput,
  ReserveInventoryOutput
> {
  constructor(
    private readonly repository: InventoryReservationRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(input: ReserveInventoryInput): Promise<ReserveInventoryOutput> {
    let requested: InventoryReservation;
    try {
      requested = InventoryReservation.create(
        input.orderId,
        input.lines.map((line) => ({
          variantId: IdType.create(line.variantId),
          quantity: line.quantity,
          expectedUnitPrice: line.expectedUnitPrice,
        })),
        this.now(),
      );
    } catch {
      return this.error(InventoryErrorCode.INVENTORY_CONFLICT);
    }

    const existing = await this.repository.findByOrderId(input.orderId);
    if (existing) {
      if (!existing.matches(requested.lines)) {
        return this.error(InventoryErrorCode.IDEMPOTENCY_CONFLICT);
      }
      if (existing.status === InventoryReservationStatus.EXPIRED) {
        return this.error(InventoryErrorCode.RESERVATION_EXPIRED);
      }
      if (existing.status === InventoryReservationStatus.RELEASED) {
        return this.error(InventoryErrorCode.IDEMPOTENCY_CONFLICT);
      }
      return this.success(existing);
    }

    const variants = await buildVariantChanges(
      this.repository,
      requested,
      'reserve',
    );
    if (!Array.isArray(variants)) return this.error(variants);

    const result = await this.repository.commit({
      reservation: requested,
      expectedReservationStatus: null,
      variants,
    });

    if (
      result.outcome === InventoryCommitOutcome.IDEMPOTENT &&
      result.reservation &&
      !result.reservation.matches(requested.lines)
    ) {
      return this.error(InventoryErrorCode.IDEMPOTENCY_CONFLICT);
    }

    const error = mapCommitError(result);
    if (error) return this.error(error);
    return this.success(result.reservation ?? requested);
  }

  private success(reservation: InventoryReservation): ReserveInventoryOutput {
    return {
      status: Status.SUCCESS,
      reservation: InventoryReservationMapper.toPrimitives(reservation),
    };
  }

  private error(code: InventoryErrorCode): ReserveInventoryOutput {
    return { status: Status.ERROR, code, message: code };
  }
}
