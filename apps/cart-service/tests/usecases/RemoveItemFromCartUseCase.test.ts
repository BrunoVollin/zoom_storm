import { RemoveItemFromCartUseCase } from '../../src/application/usecases/RemoveItemFromCartUseCase';
import { createIdFromString } from '../factories/IdFactory';
import { createProduct } from '../factories/ProductFactory';
import { Status } from '../../src/application/contracts/UseCase';
import { Cart } from '../../src/domain/entities/cart/Cart';
import { CartItem } from '../../src/domain/entities/cart/CartItem';
import { InMemoryCartRepository } from '../helpers/InMemoryCartRepository';

describe('RemoveItemFromCartUseCase', () => {
  let cartRepository: InMemoryCartRepository;
  let useCase: RemoveItemFromCartUseCase;
  let cart: Cart;

  const cartId = 'cart-1';
  const itemId = 'item-1';

  beforeEach(() => {
    cartRepository = new InMemoryCartRepository();
    cart = new Cart(createIdFromString('user-1'), createIdFromString(cartId));
    cartRepository.seed(cart);

    useCase = new RemoveItemFromCartUseCase(cartRepository);

    jest.clearAllMocks();
  });

  describe('Success Scenario', () => {
    it('should remove item from cart successfully', async () => {
      const product = createProduct({ id: createIdFromString('product-1') });
      cart.addItem(new CartItem(createIdFromString(itemId), product, 2));

      const result = await useCase.execute({
        cartId,
        userId: 'user-1',
        itemId,
      });

      expect(result.status).toBe(Status.SUCCESS);
      expect(result).toEqual(
        expect.objectContaining({
          status: Status.SUCCESS,
          cart: expect.anything(),
        }),
      );

      const savedCart = await cartRepository.findById(cart.getId());
      expect(savedCart?.getItems()).toHaveLength(0);
      expect(cartRepository.publishedEvents).toHaveLength(1);
    });
  });

  describe('Business Rule Violations', () => {
    it('should return error when cart is not found', async () => {
      const result = await useCase.execute({
        cartId: 'unknown-cart',
        userId: 'user-1',
        itemId,
      });

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.message).toBe('Cart not found');
      }
    });

    it('should return the same message as "cart not found" when the cart belongs to another user', async () => {
      const result = await useCase.execute({
        cartId,
        userId: 'someone-else',
        itemId,
      });

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.message).toBe('Cart not found');
      }
    });

    it('should return error when item is not found in cart', async () => {
      const result = await useCase.execute({
        cartId,
        userId: 'user-1',
        itemId: 'other-item',
      });

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.message).toBe('Item not found in cart');
      }
    });
  });

  describe('Exception Handling Scenario', () => {
    it('should return error when cartRepository.findById throws exception', async () => {
      jest
        .spyOn(cartRepository, 'findById')
        .mockRejectedValue(new Error('Database failure'));

      const result = await useCase.execute({
        cartId,
        userId: 'user-1',
        itemId,
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
      cart.addItem(new CartItem(createIdFromString(itemId), product, 1));

      jest
        .spyOn(cartRepository, 'save')
        .mockRejectedValue(new Error('Save failed'));

      const result = await useCase.execute({
        cartId,
        userId: 'user-1',
        itemId,
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
