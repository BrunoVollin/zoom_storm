import { InventoryErrorCode } from '../../domain/errors/InventoryError';
import { InventoryReservationRepository } from '../../domain/repositories/InventoryReservationRepository';
import { Status, UseCase } from '../contracts/UseCase';
import {
  InventoryReservationMapper,
  InventoryReservationPrimitives,
} from '../mappers/InventoryReservationMapper';

export interface GetInventoryReservationInput {
  orderId: string;
}

export type GetInventoryReservationOutput =
  | { status: Status.SUCCESS; reservation: InventoryReservationPrimitives }
  | { status: Status.ERROR; code: InventoryErrorCode; message: string };

export class GetInventoryReservationUseCase implements UseCase<
  GetInventoryReservationInput,
  GetInventoryReservationOutput
> {
  constructor(
    private readonly repository: InventoryReservationRepository,
  ) {}

  async execute(
    input: GetInventoryReservationInput,
  ): Promise<GetInventoryReservationOutput> {
    const reservation = await this.repository.findByOrderId(input.orderId);
    if (!reservation) {
      return {
        status: Status.ERROR,
        code: InventoryErrorCode.RESERVATION_NOT_FOUND,
        message: InventoryErrorCode.RESERVATION_NOT_FOUND,
      };
    }

    return {
      status: Status.SUCCESS,
      reservation: InventoryReservationMapper.toPrimitives(reservation),
    };
  }
}
