import { AddToWishlistUseCase } from '../../src/application/usecases/AddToWishlistUseCase';
import { Status } from '../../src/application/contracts/UseCase';
import { ProductRepository } from '../../src/domain/repositories/ProductRepository';
import { WishlistRepository } from '../../src/domain/repositories/WishlistRepository';
import { createIdFromString } from '../factories/IdFactory';
import { createProduct } from '../factories/ProductFactory';

describe('AddToWishlistUseCase', () => {
  let productRepositoryMock: ProductRepository;
  let wishlistRepositoryMock: WishlistRepository;
  let useCase: AddToWishlistUseCase;

  const userId = 'user-1';
  const productId = 'product-1';

  beforeEach(() => {
    productRepositoryMock = {
      findById: jest.fn(),
      findByIds: jest.fn(),
      findByProductId: jest.fn(),
    };

    wishlistRepositoryMock = {
      add: jest.fn(),
      remove: jest.fn(),
      findByUserId: jest.fn(),
    };

    useCase = new AddToWishlistUseCase(
      productRepositoryMock,
      wishlistRepositoryMock,
    );

    jest.clearAllMocks();
  });

  describe('Success Scenario', () => {
    it('should add a product to the wishlist by looking it up by its product id', async () => {
      const product = createProduct({
        id: createIdFromString('variant-1'),
        productId: createIdFromString(productId),
        name: 'Bluza',
      });

      (productRepositoryMock.findByProductId as jest.Mock).mockResolvedValue(
        product,
      );
      (wishlistRepositoryMock.add as jest.Mock).mockResolvedValue(undefined);

      const result = await useCase.execute({ userId, productId });

      expect(result.status).toBe(Status.SUCCESS);
      expect(productRepositoryMock.findByProductId).toHaveBeenCalledWith(
        expect.objectContaining({ toString: expect.any(Function) }),
      );
      expect(
        (productRepositoryMock.findByProductId as jest.Mock).mock.calls[0][0].toString(),
      ).toBe(productId);
      // Regression guard: the product must be looked up by its parent
      // product id (the id the frontend sends), not by a variant id.
      expect(productRepositoryMock.findById).not.toHaveBeenCalled();
      expect(wishlistRepositoryMock.add).toHaveBeenCalledTimes(1);
      if (result.status === Status.SUCCESS) {
        expect(result.item.productId).toBe(productId);
        expect(result.item.productName).toBe('Bluza');
      }
    });
  });

  describe('Business Rule Violations', () => {
    it('should return error when the product cannot be found by product id', async () => {
      (productRepositoryMock.findByProductId as jest.Mock).mockResolvedValue(
        null,
      );

      const result = await useCase.execute({ userId, productId });

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.message).toBe('Product not found');
      }
      expect(wishlistRepositoryMock.add).not.toHaveBeenCalled();
    });
  });

  describe('Exception Handling Scenario', () => {
    it('should return error when productRepository.findByProductId throws', async () => {
      (productRepositoryMock.findByProductId as jest.Mock).mockRejectedValue(
        new Error('Database failure'),
      );

      const result = await useCase.execute({ userId, productId });

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.message).toBe(
          'An unexpected error occurred. Please try again later.',
        );
      }
    });

    it('should return error when wishlistRepository.add throws', async () => {
      const product = createProduct({
        id: createIdFromString('variant-1'),
        productId: createIdFromString(productId),
      });

      (productRepositoryMock.findByProductId as jest.Mock).mockResolvedValue(
        product,
      );
      (wishlistRepositoryMock.add as jest.Mock).mockRejectedValue(
        new Error('Save failed'),
      );

      const result = await useCase.execute({ userId, productId });

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.message).toBe(
          'An unexpected error occurred. Please try again later.',
        );
      }
    });
  });
});
