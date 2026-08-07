import { LoyaltyReservation } from '../../domain/entities/loyalty/LoyaltyReservation';

export class LoyaltyReservationMapper {
  static toPrimitives(reservation: LoyaltyReservation) {
    return {
      orderId: reservation.orderId.toString(),
      userId: reservation.userId.toString(),
      points: reservation.points,
      status: reservation.getStatus(),
      expiresAt: reservation.expiresAt,
      createdAt: reservation.createdAt,
      updatedAt: reservation.getUpdatedAt(),
    };
  }
}

export type LoyaltyReservationPrimitives = ReturnType<
  typeof LoyaltyReservationMapper.toPrimitives
>;
