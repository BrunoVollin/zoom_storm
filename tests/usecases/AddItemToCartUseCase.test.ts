import { AddItemToCartUseCase } from '@src/application/usecases/AddItemToCartUseCase';
import { createIdFromString } from '../factories/IdFactory';
import { createProduct } from '../factories/ProductFactory';
import { ProductRepository } from '@src/domain/repositories/ProductRepository';
import { CartRepository } from '@src/domain/repositories/CartRepository';
import { Status } from '@src/application/contracts/UseCase';

describe('AddItemToCartUseCase', () => {
  let productRepositoryMock: ProductRepository;
  let cartRepositoryMock: CartRepository;
  let useCase: AddItemToCartUseCase;
  let cartMock: any;

  const cartId = 'cart-1';

  beforeEach(() => {
    productRepositoryMock = {
      save: jest.fn(),
      findById: jest.fn(),
      findByIds: jest.fn(),
    };

    cartRepositoryMock = {
      save: jest.fn(),
      findById: jest.fn(),
    };

    cartMock = {
      addItem: jest.fn(),
    };

    useCase = new AddItemToCartUseCase(
      productRepositoryMock,
      cartRepositoryMock,
    );

    jest.clearAllMocks();
  });

  describe('Success Scenario', () => {
    it('should add item to cart successfully', async () => {
      const productId = 'product-1';
      const product = createProduct({ id: createIdFromString(productId) });
      const quantity = 2;

      (cartRepositoryMock.findById as jest.Mock).mockResolvedValue(cartMock);
      (productRepositoryMock.findByIds as jest.Mock).mockResolvedValue([
        product,
      ]);
      (cartRepositoryMock.save as jest.Mock).mockResolvedValue(undefined);

      const result = await useCase.execute({
        cartId,
        products: [{ id: productId, quantity }],
      });

      expect(result.status).toBe(Status.SUCCESS);
      expect(cartRepositoryMock.findById).toHaveBeenCalledTimes(1);
      expect(productRepositoryMock.findByIds).toHaveBeenCalledTimes(1);
      expect(cartMock.addItem).toHaveBeenCalledTimes(1);
      expect(cartRepositoryMock.save).toHaveBeenCalledWith(cartMock);
    });

    it('should add multiple items to cart successfully', async () => {
      const product1 = createProduct({ id: createIdFromString('product-1') });
      const product2 = createProduct({ id: createIdFromString('product-2') });

      (cartRepositoryMock.findById as jest.Mock).mockResolvedValue(cartMock);
      (productRepositoryMock.findByIds as jest.Mock).mockResolvedValue([
        product1,
        product2,
      ]);
      (cartRepositoryMock.save as jest.Mock).mockResolvedValue(undefined);

      const result = await useCase.execute({
        cartId,
        products: [
          { id: 'product-1', quantity: 1 },
          { id: 'product-2', quantity: 5 },
        ],
      });

      expect(result.status).toBe(Status.SUCCESS);
      expect(cartMock.addItem).toHaveBeenCalledTimes(2);
      expect(cartRepositoryMock.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('Business Rule Violations', () => {
    it('should return error when cart is not found', async () => {
      const product = createProduct({ id: createIdFromString('product-1') });

      (cartRepositoryMock.findById as jest.Mock).mockResolvedValue(null);
      (productRepositoryMock.findByIds as jest.Mock).mockResolvedValue([
        product,
      ]);

      const result = await useCase.execute({
        cartId,
        products: [{ id: 'product-1', quantity: 1 }],
      });

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.message).toBe('Cart not found');
      }
      expect(cartRepositoryMock.save).toHaveBeenCalledTimes(0);
    });

    it('should return error when any requested product is not found', async () => {
      const product1 = createProduct({ id: createIdFromString('product-1') });

      (cartRepositoryMock.findById as jest.Mock).mockResolvedValue(cartMock);

      (productRepositoryMock.findByIds as jest.Mock).mockResolvedValue([
        product1,
      ]);

      const result = await useCase.execute({
        cartId,
        products: [
          { id: 'product-1', quantity: 1 },
          { id: 'product-2', quantity: 1 },
        ],
      });

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.message).toBe('Product not found');
      }
      expect(cartRepositoryMock.save).toHaveBeenCalledTimes(0);
    });
  });

  describe('Exception Handling Scenario', () => {
    it('should return error when productRepository.findByIds throws exception', async () => {
      const errorMessage = 'Database failure';
      (cartRepositoryMock.findById as jest.Mock).mockResolvedValue(cartMock);
      (productRepositoryMock.findByIds as jest.Mock).mockRejectedValue(
        new Error(errorMessage),
      );

      const result = await useCase.execute({
        cartId,
        products: [{ id: 'product-1', quantity: 1 }],
      });

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.message).toBe(errorMessage);
      }
    });

    it('should return error when cartRepository.save throws exception', async () => {
      const product = createProduct({ id: createIdFromString('product-1') });
      const errorMessage = 'Failed to persist cart data';

      (cartRepositoryMock.findById as jest.Mock).mockResolvedValue(cartMock);
      (productRepositoryMock.findByIds as jest.Mock).mockResolvedValue([
        product,
      ]);
      (cartRepositoryMock.save as jest.Mock).mockRejectedValue(
        new Error(errorMessage),
      );

      const result = await useCase.execute({
        cartId,
        products: [{ id: 'product-1', quantity: 1 }],
      });

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.message).toBe(errorMessage);
      }
    });
  });

  describe('Repository Interaction Validations', () => {
    it('should call productRepository.findByIds with correctly parsed IDs', async () => {
      (cartRepositoryMock.findById as jest.Mock).mockResolvedValue(cartMock);
      (productRepositoryMock.findByIds as jest.Mock).mockResolvedValue([]);

      await useCase.execute({
        cartId,
        products: [
          { id: 'product-1', quantity: 1 },
          { id: 'product-2', quantity: 2 },
        ],
      });

      expect(productRepositoryMock.findByIds).toHaveBeenCalledTimes(1);
      const callArgs = (productRepositoryMock.findByIds as jest.Mock).mock
        .calls[0][0];
      expect(callArgs.length).toBe(2);
    });
  });
});
