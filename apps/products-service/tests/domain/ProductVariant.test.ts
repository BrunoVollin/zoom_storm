import { InventoryErrorCode } from '../../src/domain/errors/InventoryError';
import { IdType } from '../../src/domain/shared/IdType';
import { ProductVariant } from '../../src/domain/entities/ProductVariant';

describe('ProductVariant inventory', () => {
  const createVariant = (stock = 10, reservedStock = 0) =>
    new ProductVariant(
      IdType.create('variant-1'),
      IdType.create('product-1'),
      'SKU-1',
      100,
      stock,
      null,
      true,
      reservedStock,
    );

  it('calculates available stock excluding reservations', () => {
    expect(createVariant(10, 3).availableStock).toBe(7);
  });

  it('reserves, confirms and releases stock without mutating prior values', () => {
    const original = createVariant();
    const reserved = original.reserve(4);
    const released = reserved.releaseReservation(1);
    const confirmed = released.confirmReservation(3);

    expect(original).toMatchObject({ stock: 10, reservedStock: 0 });
    expect(reserved).toMatchObject({ stock: 10, reservedStock: 4 });
    expect(released).toMatchObject({ stock: 10, reservedStock: 3 });
    expect(confirmed).toMatchObject({ stock: 7, reservedStock: 0 });
  });

  it('rejects reservations above available stock', () => {
    expect(() => createVariant(10, 8).reserve(3)).toThrow(
      InventoryErrorCode.INSUFFICIENT_STOCK,
    );
  });

  it('rejects stock updates below reserved stock', () => {
    expect(() => createVariant(10, 4).withStock(3)).toThrow(
      'Physical stock cannot be lower than reserved stock',
    );
  });
});
