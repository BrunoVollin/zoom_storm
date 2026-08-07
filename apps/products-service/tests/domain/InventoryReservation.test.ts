import {
  INVENTORY_RESERVATION_TTL_MS,
  InventoryReservation,
  InventoryReservationStatus,
} from '../../src/domain/entities/InventoryReservation';
import { InventoryErrorCode } from '../../src/domain/errors/InventoryError';
import { IdType } from '../../src/domain/shared/IdType';

describe('InventoryReservation', () => {
  const now = new Date('2026-08-07T12:00:00.000Z');
  const lines = [
    {
      variantId: IdType.create('variant-1'),
      quantity: 2,
      expectedUnitPrice: 100,
    },
  ];

  it('starts active with a 15 minute TTL', () => {
    const reservation = InventoryReservation.create('order-1', lines, now);

    expect(reservation.status).toBe(InventoryReservationStatus.ACTIVE);
    expect(reservation.expiresAt.getTime() - now.getTime()).toBe(
      INVENTORY_RESERVATION_TTL_MS,
    );
  });

  it('matches equivalent lines independently of their order', () => {
    const reservation = InventoryReservation.create(
      'order-1',
      [
        ...lines,
        {
          variantId: IdType.create('variant-2'),
          quantity: 1,
          expectedUnitPrice: 200,
        },
      ],
      now,
    );

    expect(
      reservation.matches([
        {
          variantId: IdType.create('variant-2'),
          quantity: 1,
          expectedUnitPrice: 200,
        },
        ...lines,
      ]),
    ).toBe(true);
  });

  it('includes the accepted unit price in its idempotency payload', () => {
    const reservation = InventoryReservation.create('order-1', lines, now);

    expect(
      reservation.matches([{ ...lines[0], expectedUnitPrice: 101 }]),
    ).toBe(false);
  });

  it('confirms once and keeps repeated confirmation idempotent', () => {
    const reservation = InventoryReservation.create('order-1', lines, now);
    const confirmed = reservation.confirm(new Date(now.getTime() + 1));

    expect(confirmed.status).toBe(InventoryReservationStatus.CONFIRMED);
    expect(confirmed.confirm(new Date(now.getTime() + 2))).toBe(confirmed);
  });

  it('does not confirm an expired reservation', () => {
    const reservation = InventoryReservation.create('order-1', lines, now);

    expect(() => reservation.confirm(reservation.expiresAt)).toThrow(
      InventoryErrorCode.RESERVATION_EXPIRED,
    );
  });

  it('expires only after reaching the deadline', () => {
    const reservation = InventoryReservation.create('order-1', lines, now);

    expect(() => reservation.expire(now)).toThrow(
      InventoryErrorCode.RESERVATION_NOT_ACTIVE,
    );
    expect(reservation.expire(reservation.expiresAt).status).toBe(
      InventoryReservationStatus.EXPIRED,
    );
  });
});
