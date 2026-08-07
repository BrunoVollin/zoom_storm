import { InventoryReservation } from '../../domain/entities/InventoryReservation';

export class InventoryReservationMapper {
  static toPrimitives(reservation: InventoryReservation) {
    return {
      id: reservation.id.toString(),
      orderId: reservation.orderId,
      status: reservation.status,
      lines: reservation.lines.map((line) => ({
        variantId: line.variantId.toString(),
        quantity: line.quantity,
        expectedUnitPrice: line.expectedUnitPrice,
      })),
      createdAt: reservation.createdAt,
      expiresAt: reservation.expiresAt,
      updatedAt: reservation.updatedAt,
    };
  }
}

export type InventoryReservationPrimitives = ReturnType<
  typeof InventoryReservationMapper.toPrimitives
>;
