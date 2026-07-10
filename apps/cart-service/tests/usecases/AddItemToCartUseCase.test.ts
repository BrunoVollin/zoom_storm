import { AddItemToCartUseCase } from '../../src/application/usecases/AddItemToCartUseCase';
import { createIdFromString } from '../factories/IdFactory';
import { createProduct } from '../factories/ProductFactory';
import { ProductRepository } from '../../src/domain/repositories/ProductRepository';
import { Status } from '../../src/application/contracts/UseCase';
import { Cart } from '../../src/domain/entities/cart/Cart';
import { InMemoryCartRepository } from '../helpers/InMemoryCartRepository';

describe('AddItemToCartUseCase', () => {
  let productRepositoryMock: ProductRepository;
  let cartRepository: InMemoryCartRepository;
  let useCase: AddItemToCartUseCase;
  let cart: Cart;

  const cartId = 'cart-1';

  beforeEach(() => {
    productRepositoryMock = {
      findById: jest.fn(),
      findByIds: jest.fn(),
    };

    cartRepository = new InMemoryCartRepository();
    cart = new Cart(createIdFromString('user-1'), createIdFromString(cartId));
    cartRepository.seed(cart);

    useCase = new AddItemToCartUseCase(productRepositoryMock, cartRepository);

    jest.clearAllMocks();
  });

  describe('Success Scenario', () => {
    it('should add item to cart successfully', async () => {
      const productId = 'product-1';
      const product = createProduct({ id: createIdFromString(productId) });
      const quantity = 2;

      (productRepositoryMock.findByIds as jest.Mock).mockResolvedValue([
        product,
      ]);

      const result = await useCase.execute({
        cartId,
        userId: 'user-1',
        products: [{ id: productId, quantity }],
      });

      expect(result.status).toBe(Status.SUCCESS);
      expect(productRepositoryMock.findByIds).toHaveBeenCalledTimes(1);

      const savedCart = await cartRepository.findById(cart.getId());
      expect(savedCart?.getItems()).toHaveLength(1);
      expect(savedCart?.getItems()[0].quantity).toBe(quantity);
      expect(cartRepository.publishedEvents).toHaveLength(1);
    });

    it('should add multiple items to cart successfully', async () => {
      const product1 = createProduct({ id: createIdFromString('product-1') });
      const product2 = createProduct({ id: createIdFromString('product-2') });

      (productRepositoryMock.findByIds as jest.Mock).mockResolvedValue([
        product1,
        product2,
      ]);

      const result = await useCase.execute({
        cartId,
        userId: 'user-1',
        products: [
          { id: 'product-1', quantity: 1 },
          { id: 'product-2', quantity: 5 },
        ],
      });

      expect(result.status).toBe(Status.SUCCESS);

      const savedCart = await cartRepository.findById(cart.getId());
      expect(savedCart?.getItems()).toHaveLength(2);
    });
  });

  describe('Business Rule Violations', () => {
    it('should return error when cart is not found', async () => {
      const product = createProduct({ id: createIdFromString('product-1') });

      (productRepositoryMock.findByIds as jest.Mock).mockResolvedValue([
        product,
      ]);

      const result = await useCase.execute({
        cartId: 'unknown-cart',
        userId: 'user-1',
        products: [{ id: 'product-1', quantity: 1 }],
      });

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.message).toBe('Cart not found');
      }
    });

    it('should return the same message as "cart not found" when the cart belongs to another user', async () => {
      const product = createProduct({ id: createIdFromString('product-1') });

      (productRepositoryMock.findByIds as jest.Mock).mockResolvedValue([
        product,
      ]);

      const result = await useCase.execute({
        cartId,
        userId: 'someone-else',
        products: [{ id: 'product-1', quantity: 1 }],
      });

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.message).toBe('Cart not found');
      }
    });

    it('should return error when any requested product is not found', async () => {
      const product1 = createProduct({ id: createIdFromString('product-1') });

      (productRepositoryMock.findByIds as jest.Mock).mockResolvedValue([
        product1,
      ]);

      const result = await useCase.execute({
        cartId,
        userId: 'user-1',
        products: [
          { id: 'product-1', quantity: 1 },
          { id: 'product-2', quantity: 1 },
        ],
      });

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.message).toBe('Product not found');
      }
      expect(cartRepository.publishedEvents).toHaveLength(0);
    });
  });

  describe('Exception Handling Scenario', () => {
    it('should return error when productRepository.findByIds throws exception', async () => {
      (productRepositoryMock.findByIds as jest.Mock).mockRejectedValue(
        new Error('Database failure'),
      );

      const result = await useCase.execute({
        cartId,
        userId: 'user-1',
        products: [{ id: 'product-1', quantity: 1 }],
      });

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.message).toBe(
          'An unexpected error occurred. Please try again later.',
        );
      }
    });

    it('should return error when cartRepository.save throws exception', async () => {
      const product = createProduct({ id: createIdFromString('product-1') });

      (productRepositoryMock.findByIds as jest.Mock).mockResolvedValue([
        product,
      ]);
      jest
        .spyOn(cartRepository, 'save')
        .mockRejectedValue(new Error('Failed to persist cart data'));

      const result = await useCase.execute({
        cartId,
        userId: 'user-1',
        products: [{ id: 'product-1', quantity: 1 }],
      });

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.message).toBe(
          'An unexpected error occurred. Please try again later.',
        );
      }
    });
  });

  describe('Repository Interaction Validations', () => {
    it('should call productRepository.findByIds with correctly parsed IDs', async () => {
      (productRepositoryMock.findByIds as jest.Mock).mockResolvedValue([]);

      await useCase.execute({
        cartId,
        userId: 'user-1',
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
