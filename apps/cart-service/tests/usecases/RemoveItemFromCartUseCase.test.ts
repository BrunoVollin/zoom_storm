import { RemoveItemFromCartUseCase } from '../../src/application/usecases/RemoveItemFromCartUseCase';
import { createIdFromString } from '../factories/IdFactory';
import { CartRepository } from '../../src/domain/repositories/CartRepository';
import { EventPublisher } from '../../src/domain/events/EventPublisher';
import { Status } from '../../src/application/contracts/UseCase';

describe('RemoveItemFromCartUseCase', () => {
  let cartRepositoryMock: CartRepository;
  let eventPublisherMock: EventPublisher;
  let useCase: RemoveItemFromCartUseCase;
  let cartMock: any;

  const cartId = 'cart-1';
  const itemId = 'item-1';

  beforeEach(() => {
    cartRepositoryMock = {
      save: jest.fn(),
      findById: jest.fn(),
    };

    eventPublisherMock = {
      publish: jest.fn(),
    };

    cartMock = {
      id: { toString: () => 'cart-1' },
      userId: { toString: () => 'user-1' },
      getItems: jest.fn(),
      getCoupons: jest.fn(() => []),
      calcSubtotal: jest.fn(() => 0),
      calcTotalDiscount: jest.fn(() => 0),
      calcTotal: jest.fn(() => 0),
      removeItem: jest.fn(),
    };

    useCase = new RemoveItemFromCartUseCase(
      cartRepositoryMock,
      eventPublisherMock,
    );

    jest.clearAllMocks();
  });

  describe('Success Scenario', () => {
    it('should remove item from cart successfully', async () => {
      const itemWithId = {
        id: createIdFromString(itemId),
        quantity: 2,
        product: {
          id: createIdFromString('product-1'),
          name: 'Product 1',
          price: 10,
          description: 'Desc',
          category: 'cat',
          stock: 5,
        },
        getPrice: jest.fn(() => 20),
      };

      (cartRepositoryMock.findById as jest.Mock).mockResolvedValue(cartMock);
      (cartMock.getItems as jest.Mock).mockReturnValue([itemWithId]);
      (cartRepositoryMock.save as jest.Mock).mockResolvedValue(undefined);

      const result = await useCase.execute({
        cartId,
        itemId,
      });

      expect(result.status).toBe(Status.SUCCESS);
      expect(result).toEqual(
        expect.objectContaining({
          status: Status.SUCCESS,
          cart: expect.anything(),
        }),
      );
      expect(cartRepositoryMock.findById).toHaveBeenCalledTimes(1);
      expect(cartMock.getItems).toHaveBeenCalledTimes(2);
      expect(cartMock.removeItem).toHaveBeenCalledTimes(1);
      expect(cartRepositoryMock.save).toHaveBeenCalledWith(cartMock);
    });
  });

  describe('Business Rule Violations', () => {
    it('should return error when cart is not found', async () => {
      (cartRepositoryMock.findById as jest.Mock).mockResolvedValue(null);

      const result = await useCase.execute({
        cartId,
        itemId,
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
      });

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.message).toBe('Item not found in cart');
      }
      expect(cartMock.removeItem).toHaveBeenCalledTimes(0);
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
      });

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.message).toBe(errorMessage);
      }
    });

    it('should return error when cartRepository.save throws exception', async () => {
      const errorMessage = 'Save failed';
      const itemWithId = { id: createIdFromString(itemId) };

      (cartRepositoryMock.findById as jest.Mock).mockResolvedValue(cartMock);
      (cartMock.getItems as jest.Mock).mockReturnValue([itemWithId]);
      (cartRepositoryMock.save as jest.Mock).mockRejectedValue(
        new Error(errorMessage),
      );

      const result = await useCase.execute({
        cartId,
        itemId,
      });

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.message).toBe(errorMessage);
      }
    });
  });
});
