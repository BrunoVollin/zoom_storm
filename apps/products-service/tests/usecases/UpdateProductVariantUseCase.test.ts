import { Status } from '../../src/application/contracts/UseCase';
import { UpdateProductVariantUseCase } from '../../src/application/usecases/UpdateProductVariantUseCase';
import { Product } from '../../src/domain/entities/Product';
import { InventoryErrorCode } from '../../src/domain/errors/InventoryError';
import { ProductRepository } from '../../src/domain/repositories/ProductRepository';
import { IdType } from '../../src/domain/shared/IdType';
import { makeProduct } from '../factories/ProductFactory';

class InMemoryProductRepository implements ProductRepository {
  constructor(public product: Product) {}
  async save(product: Product): Promise<void> {
    this.product = product;
  }
  async findById(id: IdType): Promise<Product | null> {
    return id.equals(this.product.id) ? this.product : null;
  }
  async delete(): Promise<void> {}
}

describe('UpdateProductVariantUseCase inventory constraints', () => {
  it('rejects reducing physical stock below active reservations', async () => {
    const repository = new InMemoryProductRepository(
      makeProduct({ stock: 10, reservedStock: 4 }),
    );

    const result = await new UpdateProductVariantUseCase(repository).execute({
      productId: 'product-1',
      variantId: 'variant-1',
      price: 100,
      stock: 3,
    });

    expect(result).toEqual({
      status: Status.ERROR,
      code: InventoryErrorCode.INSUFFICIENT_STOCK,
      message: InventoryErrorCode.INSUFFICIENT_STOCK,
    });
    expect(repository.product.variants[0].stock).toBe(10);
  });
});
