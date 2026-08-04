import { CheckoutUseCase } from '../../src/application/usecases/CheckoutUseCase';
import { createIdFromString } from '../factories/IdFactory';
import { createProduct } from '../factories/ProductFactory';
import { CartRepository } from '../../src/domain/repositories/CartRepository';
import { Status } from '../../src/application/contracts/UseCase';

describe('CheckoutUseCase', () => {
  let cartRepositoryMock: CartRepository;
  let useCase: CheckoutUseCase;
  let cartMock: Record<string, unknown>;

  const cartId = 'cart-1';
  const shipping = 5000;

  beforeEach(() => {
    cartRepositoryMock = {
      save: jest.fn(),
      findById: jest.fn(),
    };

    const product = createProduct({
      id: createIdFromString('product-1'),
      price: 1000,
    });

    const mockItem = {
      id: createIdFromString('item-1'),
      quantity: 2,
      product,
      getPrice: jest.fn(() => 2000),
    };

    cartMock = {
      id: { toString: () => 'cart-1' },
      userId: { toString: () => 'user-1' },
      getUserId: jest.fn(() => ({ toString: () => 'user-1' })),
      getItems: jest.fn(() => [mockItem]),
      calcSubtotal: jest.fn(() => 2000),
      calcTotalDiscount: jest.fn(() => 200),
      calcTotal: jest.fn(() => 1800),
      getCoupons: jest.fn(() => []),
      clear: jest.fn(),
    };

    useCase = new CheckoutUseCase(cartRepositoryMock);

    jest.clearAllMocks();
  });

  describe('Success Scenario', () => {
    it('should checkout successfully', async () => {
      (cartRepositoryMock.findById as jest.Mock).mockResolvedValue(cartMock);

      const result = await useCase.execute({
        cartId,
        userId: 'user-1',
        shipping,
      });

      expect(result.status).toBe(Status.SUCCESS);
      if (result.status === Status.SUCCESS) {
        expect(result.subtotal).toBe(2000);
        expect(result.discount).toBe(200);
        expect(result.shipping).toBe(shipping);
        expect(result.total).toBe(6800);
        expect(result.cart).toBeDefined();
      }
      expect(cartRepositoryMock.findById).toHaveBeenCalledTimes(1);
      expect(cartMock.clear).toHaveBeenCalledTimes(1);
      expect(cartRepositoryMock.save).toHaveBeenCalledWith(cartMock, [
        expect.objectContaining({ name: 'cart.checked_out' }),
        expect.objectContaining({ name: 'cart.updated' }),
      ]);
    });

    it('should checkout with zero discount', async () => {
      (cartRepositoryMock.findById as jest.Mock).mockResolvedValue(cartMock);
      (cartMock.calcTotalDiscount as jest.Mock).mockReturnValue(0);
      (cartMock.calcTotal as jest.Mock).mockReturnValue(2000);

      const result = await useCase.execute({
        cartId,
        userId: 'user-1',
        shipping,
      });

      expect(result.status).toBe(Status.SUCCESS);
      if (result.status === Status.SUCCESS) {
        expect(result.discount).toBe(0);
        expect(result.total).toBe(7000);
      }
    });

    it('should checkout with different shipping costs', async () => {
      (cartRepositoryMock.findById as jest.Mock).mockResolvedValue(cartMock);

      const largeShipping = 10000;
      const result = await useCase.execute({
        cartId,
        userId: 'user-1',
        shipping: largeShipping,
      });

      expect(result.status).toBe(Status.SUCCESS);
      if (result.status === Status.SUCCESS) {
        expect(result.shipping).toBe(largeShipping);
        expect(result.total).toBe(11800);
      }
    });
  });

  describe('Business Rule Violations', () => {
    it('should return error when cart is not found', async () => {
      (cartRepositoryMock.findById as jest.Mock).mockResolvedValue(null);

      const result = await useCase.execute({
        cartId,
        userId: 'user-1',
        shipping,
      });

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.message).toBe('Cart not found');
      }
    });

    it('should return error when cart is empty', async () => {
      (cartRepositoryMock.findById as jest.Mock).mockResolvedValue(cartMock);
      (cartMock.getItems as jest.Mock).mockReturnValue([]);

      const result = await useCase.execute({
        cartId,
        userId: 'user-1',
        shipping,
      });

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.message).toBe('Cart is empty');
      }
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
        userId: 'user-1',
        shipping,
      });

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.message).toBe(
          'An unexpected error occurred. Please try again later.',
        );
      }
    });

    it('should return error when cart.calcTotal throws exception', async () => {
      const errorMessage = 'Calculation failed';
      (cartRepositoryMock.findById as jest.Mock).mockResolvedValue(cartMock);
      (cartMock.calcTotal as jest.Mock).mockImplementation(() => {
        throw new Error(errorMessage);
      });

      const result = await useCase.execute({
        cartId,
        userId: 'user-1',
        shipping,
      });

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.message).toBe(
          'An unexpected error occurred. Please try again later.',
        );
      }
    });
  });
});
