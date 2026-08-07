import { DeleteProductUseCase } from '../../src/application/usecases/DeleteProductUseCase';
import { Status } from '../../src/application/contracts/UseCase';
import { Product } from '../../src/domain/entities/Product';
import { ProductRepository } from '../../src/domain/repositories/ProductRepository';
import { IdType } from '../../src/domain/shared/IdType';
import { makeProduct } from '../factories/ProductFactory';

class InMemoryProductRepository implements ProductRepository {
  product: Product | null;
  deleteCalled = false;

  constructor(product: Product) {
    this.product = product;
  }

  async save(product: Product): Promise<void> {
    this.product = product;
  }

  async findById(id: IdType): Promise<Product | null> {
    return this.product?.id.equals(id) ? this.product : null;
  }

  async delete(): Promise<void> {
    this.deleteCalled = true;
    this.product = null;
  }
}

describe('DeleteProductUseCase', () => {
  it('soft deletes the product while preserving it in the repository', async () => {
    const repository = new InMemoryProductRepository(makeProduct());

    const result = await new DeleteProductUseCase(repository).execute({
      id: 'product-1',
    });

    expect(result).toEqual({ status: Status.SUCCESS });
    expect(repository.product?.isDeleted).toBe(true);
    expect(repository.deleteCalled).toBe(false);
  });

  it('rejects deletion while the product has active reservations', async () => {
    const repository = new InMemoryProductRepository(
      makeProduct({ reservedStock: 1 }),
    );

    await expect(
      new DeleteProductUseCase(repository).execute({ id: 'product-1' }),
    ).resolves.toEqual({
      status: Status.ERROR,
      code: 'PRODUCT_HAS_ACTIVE_RESERVATIONS',
      message: 'PRODUCT_HAS_ACTIVE_RESERVATIONS',
    });
    expect(repository.product?.isDeleted).toBe(false);
  });

  it('keeps repeated deletion compatible with the not-found response', async () => {
    const repository = new InMemoryProductRepository(
      makeProduct({ deletedAt: new Date('2026-08-07T12:00:00.000Z') }),
    );

    await expect(
      new DeleteProductUseCase(repository).execute({ id: 'product-1' }),
    ).resolves.toEqual({
      status: Status.ERROR,
      message: 'Product not found',
    });
  });
});
