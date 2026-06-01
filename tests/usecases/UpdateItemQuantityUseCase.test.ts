import { UpdateItemQuantityUseCase } from '@src/application/usecases/UpdateItemQuantityUseCase';
import { createIdFromString } from '../factories/IdFactory';
import { createProduct } from '../factories/ProductFactory';
import { CartRepository } from '@src/domain/repositories/CartRepository';
import { ProductRepository } from '@src/domain/repositories/ProductRepository';
import { Status } from '@src/application/contracts/UseCase';

describe('UpdateItemQuantityUseCase', () => {
  let cartRepositoryMock: CartRepository;
  let productRepositoryMock: ProductRepository;
  let useCase: UpdateItemQuantityUseCase;
  let cartMock: any;

  const cartId = 'cart-1';
  const itemId = 'item-1';
  const quantity = 5;

  beforeEach(() => {
    cartRepositoryMock = {
      save: jest.fn(),
      findById: jest.fn(),
    };

    productRepositoryMock = {
      save: jest.fn(),
      findById: jest.fn(),
      findByIds: jest.fn(),
    };

    const mockItem = {
      id: createIdFromString(itemId),
      product: createProduct({ id: createIdFromString('product-1') }),
    };

    cartMock = {
      getItems: jest.fn(() => [mockItem]),
      removeItem: jest.fn(),
      addItem: jest.fn(),
    };

    useCase = new UpdateItemQuantityUseCase(
      cartRepositoryMock,
      productRepositoryMock,
    );

    jest.clearAllMocks();
  });

  describe('Success Scenario', () => {
    it('should update item quantity successfully', async () => {
      const product = createProduct({ id: createIdFromString('product-1') });

      (cartRepositoryMock.findById as jest.Mock).mockResolvedValue(cartMock);
      (productRepositoryMock.findById as jest.Mock).mockResolvedValue(product);
      (cartRepositoryMock.save as jest.Mock).mockResolvedValue(undefined);

      const result = await useCase.execute({
        cartId,
        itemId,
        quantity,
      });

      expect(result.status).toBe(Status.SUCCESS);
      expect(cartRepositoryMock.findById).toHaveBeenCalledTimes(1);
      expect(productRepositoryMock.findById).toHaveBeenCalledTimes(1);
      expect(cartMock.removeItem).toHaveBeenCalledTimes(1);
      expect(cartMock.addItem).toHaveBeenCalledTimes(1);
      expect(cartRepositoryMock.save).toHaveBeenCalledTimes(1);
    });

    it('should update quantity to a different value', async () => {
      const product = createProduct({ id: createIdFromString('product-1') });
      const newQuantity = 10;

      (cartRepositoryMock.findById as jest.Mock).mockResolvedValue(cartMock);
      (productRepositoryMock.findById as jest.Mock).mockResolvedValue(product);
      (cartRepositoryMock.save as jest.Mock).mockResolvedValue(undefined);

      const result = await useCase.execute({
        cartId,
        itemId,
        quantity: newQuantity,
      });

      expect(result.status).toBe(Status.SUCCESS);
      expect(cartMock.addItem).toHaveBeenCalledTimes(1);
    });
  });

  describe('Business Rule Violations', () => {
    it('should return error when cart is not found', async () => {
      (cartRepositoryMock.findById as jest.Mock).mockResolvedValue(null);

      const result = await useCase.execute({
        cartId,
        itemId,
        quantity,
      });

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.message).toBe('Cart not found');
      }
      expect(cartRepositoryMock.save).toHaveBeenCalledTimes(0);
    });

    it('should return error when item is not found in cart', async () => {
      (cartRepositoryMock.findById as jest.Mock).mockResolvedValue(cartMock);
      (cartMock.getItems as jest.Mock).mockReturnValue([
        { id: createIdFromString('other-item') },
      ]);

      const result = await useCase.execute({
        cartId,
        itemId,
        quantity,
      });

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.message).toBe('Item not found in cart');
      }
      expect(cartRepositoryMock.save).toHaveBeenCalledTimes(0);
    });

    it('should return error when product is not found', async () => {
      (cartRepositoryMock.findById as jest.Mock).mockResolvedValue(cartMock);
      (productRepositoryMock.findById as jest.Mock).mockResolvedValue(null);

      const result = await useCase.execute({
        cartId,
        itemId,
        quantity,
      });

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.message).toBe('Product not found');
      }
      expect(cartRepositoryMock.save).toHaveBeenCalledTimes(0);
    });
  });

  describe('Exception Handling Scenario', () => {
    it('should return error when cartRepository.findById throws exception', async () => {
      const errorMessage = 'Database failure';
      (cartRepositoryMock.findById as jest.Mock).mockRejectedValue(
        new Error(errorMessage),
      );

      const result = await useCase.execute({
        cartId,
        itemId,
        quantity,
      });

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.message).toBe(errorMessage);
      }
    });

    it('should return error when cartRepository.save throws exception', async () => {
      const errorMessage = 'Save failed';
      const product = createProduct({ id: createIdFromString('product-1') });

      (cartRepositoryMock.findById as jest.Mock).mockResolvedValue(cartMock);
      (productRepositoryMock.findById as jest.Mock).mockResolvedValue(product);
      (cartRepositoryMock.save as jest.Mock).mockRejectedValue(
        new Error(errorMessage),
      );

      const result = await useCase.execute({
        cartId,
        itemId,
        quantity,
      });

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.message).toBe(errorMessage);
      }
    });
  });
});
