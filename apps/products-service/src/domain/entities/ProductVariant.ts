import { IdType } from '../shared/IdType';
import { InventoryError, InventoryErrorCode } from '../errors/InventoryError';

export class ProductVariant {
  constructor(
    readonly id: IdType,
    readonly productId: IdType,
    readonly sku: string,
    readonly price: number,
    readonly stock: number,
    readonly name: string | null = null,
    readonly isDefault: boolean = false,
    readonly reservedStock: number = 0,
  ) {
    if (!Number.isInteger(stock) || stock < 0) {
      throw new Error('Stock must be a non-negative integer');
    }

    if (!Number.isInteger(reservedStock) || reservedStock < 0) {
      throw new Error('Reserved stock must be a non-negative integer');
    }

    if (reservedStock > stock) {
      throw new InventoryError(
        InventoryErrorCode.INSUFFICIENT_STOCK,
        'Physical stock cannot be lower than reserved stock',
      );
    }
  }

  getId(): IdType {
    return this.id;
  }

  get availableStock(): number {
    return this.stock - this.reservedStock;
  }

  reserve(quantity: number): ProductVariant {
    this.assertPositiveQuantity(quantity);
    if (quantity > this.availableStock) {
      throw new InventoryError(InventoryErrorCode.INSUFFICIENT_STOCK);
    }

    return this.withInventory(this.stock, this.reservedStock + quantity);
  }

  confirmReservation(quantity: number): ProductVariant {
    this.assertPositiveQuantity(quantity);
    if (quantity > this.reservedStock) {
      throw new InventoryError(InventoryErrorCode.RESERVATION_QUANTITY_INVALID);
    }

    return this.withInventory(
      this.stock - quantity,
      this.reservedStock - quantity,
    );
  }

  releaseReservation(quantity: number): ProductVariant {
    this.assertPositiveQuantity(quantity);
    if (quantity > this.reservedStock) {
      throw new InventoryError(InventoryErrorCode.RESERVATION_QUANTITY_INVALID);
    }

    return this.withInventory(this.stock, this.reservedStock - quantity);
  }

  withStock(stock: number): ProductVariant {
    return this.withInventory(stock, this.reservedStock);
  }

  private assertPositiveQuantity(quantity: number): void {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error('Quantity must be a positive integer');
    }
  }

  private withInventory(stock: number, reservedStock: number): ProductVariant {
    return new ProductVariant(
      this.id,
      this.productId,
      this.sku,
      this.price,
      stock,
      this.name,
      this.isDefault,
      reservedStock,
    );
  }
}
