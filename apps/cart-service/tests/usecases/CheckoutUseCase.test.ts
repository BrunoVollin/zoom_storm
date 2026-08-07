import { CheckoutUseCase } from '../../src/application/usecases/CheckoutUseCase';
import { RevalidateCartCouponsUseCase } from '../../src/application/usecases/RevalidateCartCouponsUseCase';
import { ReserveLoyaltyPointsUseCase } from '../../src/application/usecases/ReserveLoyaltyPointsUseCase';
import { createIdFromString } from '../factories/IdFactory';
import { createProduct } from '../factories/ProductFactory';
import { createValidCoupon } from '../factories/CouponFactory';
import { Cart } from '../../src/domain/entities/cart/Cart';
import { CartItem } from '../../src/domain/entities/cart/CartItem';
import { Address } from '../../src/domain/entities/profile/Address';
import { SavedAddress } from '../../src/domain/entities/profile/SavedAddress';
import { ShippingQuote } from '../../src/domain/entities/freight/ShippingQuote';
import { LoyaltyAccount } from '../../src/domain/entities/loyalty/LoyaltyAccount';
import { IdType } from '../../src/domain/shared/IdType';
import {
  FakeCartRepository,
  FakeCouponRepository,
  FakeInventoryReservationService,
  FakeLoyaltyReservationRepository,
  FakeLoyaltyRepository,
  FakeOrderRepository,
} from '../factories/FakeRepositories';
import { InMemorySavedAddressRepository } from '../helpers/InMemorySavedAddressRepository';
import { Status } from '../../src/application/contracts/UseCase';
import { ShippingQuoteRepository } from '../../src/domain/repositories/ShippingQuoteRepository';

class InMemoryShippingQuoteRepository implements ShippingQuoteRepository {
  readonly quotes = new Map<string, ShippingQuote>();

  async save(quote: ShippingQuote): Promise<void> {
    this.quotes.set(quote.id.toString(), quote);
  }

  async findById(id: IdType): Promise<ShippingQuote | null> {
    return this.quotes.get(id.toString()) ?? null;
  }
}

describe('CheckoutUseCase', () => {
  let cartRepository: FakeCartRepository;
  let orderRepository: FakeOrderRepository;
  let savedAddressRepository: InMemorySavedAddressRepository;
  let inventoryReservationService: FakeInventoryReservationService;
  let shippingQuoteRepository: InMemoryShippingQuoteRepository;
  let couponRepository: FakeCouponRepository;
  let loyaltyRepository: FakeLoyaltyRepository;
  let loyaltyReservationRepository: FakeLoyaltyReservationRepository;
  let useCase: CheckoutUseCase;
  let cart: Cart;
  let savedAddress: SavedAddress;
  let shippingQuote: ShippingQuote;

  const cartId = 'cart-1';
  const userId = 'user-1';
  const addressId = 'address-1';
  const idempotencyKey = 'checkout-1';
  const shippingQuoteId = 'quote-1';
  const calculatedShipping = 4321;

  beforeEach(async () => {
    cartRepository = new FakeCartRepository();
    orderRepository = new FakeOrderRepository();
    savedAddressRepository = new InMemorySavedAddressRepository();
    inventoryReservationService = new FakeInventoryReservationService();
    shippingQuoteRepository = new InMemoryShippingQuoteRepository();
    couponRepository = new FakeCouponRepository();
    loyaltyRepository = new FakeLoyaltyRepository();
    loyaltyReservationRepository = new FakeLoyaltyReservationRepository();

    cart = new Cart(createIdFromString(userId), createIdFromString(cartId));
    const product = createProduct({
      id: createIdFromString('variant-1'),
      price: 1000,
    });
    cart.addItem(new CartItem(createIdFromString('item-1'), product, 2));
    await cartRepository.save(cart);

    savedAddress = new SavedAddress(
      createIdFromString(addressId),
      createIdFromString(userId),
      'Home',
      'Bruno Almeida',
      new Address('Rua A', '100', 'Centro', 'São Paulo', 'SP', '01310-100'),
    );
    await savedAddressRepository.save(savedAddress);

    shippingQuote = new ShippingQuote(
      createIdFromString(shippingQuoteId),
      createIdFromString(cartId),
      createIdFromString(addressId),
      cart.getVersion(),
      calculatedShipping,
      5,
      new Date(Date.now() + 15 * 60 * 1000),
    );
    await shippingQuoteRepository.save(shippingQuote);

    useCase = new CheckoutUseCase(
      cartRepository,
      orderRepository,
      savedAddressRepository,
      inventoryReservationService,
      shippingQuoteRepository,
      new RevalidateCartCouponsUseCase(cartRepository, couponRepository),
      new ReserveLoyaltyPointsUseCase(loyaltyRepository, loyaltyReservationRepository),
    );
  });

  describe('Success Scenario', () => {
    it('should checkout successfully using the persisted shipping quote', async () => {
      const result = await useCase.execute({
        cartId,
        userId,
        addressId,
        idempotencyKey,
        shippingQuoteId,
      });

      expect(result.status).toBe(Status.SUCCESS);
      if (result.status === Status.SUCCESS) {
        expect(result.subtotal).toBe(2000);
        expect(result.discount).toBe(0);
        expect(result.shipping).toBe(calculatedShipping);
        expect(result.total).toBe(2000 + calculatedShipping);
        expect(result.cart).toBeDefined();
        expect(result.order).toBeDefined();
        expect(result.order.savedAddressId).toBe(addressId);
        expect(result.replayed).toBe(false);
      }
      expect(cartRepository.carts.get(cartId)?.getItems()).toHaveLength(0);
      expect(orderRepository.orders.size).toBe(1);
    });

    it('should replay an already-processed checkout for the same idempotency key', async () => {
      const first = await useCase.execute({
        cartId,
        userId,
        addressId,
        idempotencyKey,
        shippingQuoteId,
      });
      expect(first.status).toBe(Status.SUCCESS);

      const replay = await useCase.execute({
        cartId,
        userId,
        addressId,
        idempotencyKey,
        shippingQuoteId,
      });

      expect(replay.status).toBe(Status.SUCCESS);
      if (replay.status === Status.SUCCESS && first.status === Status.SUCCESS) {
        expect(replay.replayed).toBe(true);
        expect(replay.order.id).toBe(first.order.id);
        expect(replay.shipping).toBe(first.shipping);
      }
      expect(orderRepository.orders.size).toBe(1);
    });

    it('reserves loyalty points when the cart has a pending redemption', async () => {
      loyaltyRepository.accounts.set(userId, new LoyaltyAccount(createIdFromString(userId), 100));
      cart.setLoyaltyRedemption(10, 100);
      await cartRepository.save(cart);

      const result = await useCase.execute({
        cartId,
        userId,
        addressId,
        idempotencyKey,
        shippingQuoteId,
      });

      expect(result.status).toBe(Status.SUCCESS);
      if (result.status === Status.SUCCESS) {
        const reservation = await loyaltyReservationRepository.findByOrderId(
          createIdFromString(result.order.id),
        );
        expect(reservation?.points).toBe(10);
        expect(reservation?.getStatus()).toBe('ACTIVE');
      }
    });
  });

  describe('Business Rule Violations', () => {
    it('should return error when cart is not found', async () => {
      const result = await useCase.execute({
        cartId: 'does-not-exist',
        userId,
        addressId,
        idempotencyKey,
        shippingQuoteId,
      });

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.message).toBe('Cart not found');
      }
    });

    it('should return error when cart is empty', async () => {
      cart.clear();
      await cartRepository.save(cart);

      const result = await useCase.execute({
        cartId,
        userId,
        addressId,
        idempotencyKey,
        shippingQuoteId,
      });

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.message).toBe('Cart is empty');
      }
    });

    it('should return an explicit error when the idempotency key is blank', async () => {
      const result = await useCase.execute({
        cartId,
        userId,
        addressId,
        idempotencyKey: '   ',
        shippingQuoteId,
      });

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.message).toBe('Idempotency key is required');
      }
    });

    it('should return an explicit error when the saved address does not exist', async () => {
      const result = await useCase.execute({
        cartId,
        userId,
        addressId: 'does-not-exist',
        idempotencyKey,
        shippingQuoteId,
      });

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.message).toBe('Address not found');
        expect(result.code).toBe('ADDRESS_NOT_FOUND');
      }
    });

    it('should return an explicit error when the saved address belongs to another user', async () => {
      const othersAddress = new SavedAddress(
        createIdFromString('address-2'),
        createIdFromString('user-2'),
        'Work',
        'Other User',
        new Address('Rua B', '200', 'Centro', 'Rio de Janeiro', 'RJ', '20000-000'),
      );
      await savedAddressRepository.save(othersAddress);

      const result = await useCase.execute({
        cartId,
        userId,
        addressId: 'address-2',
        idempotencyKey,
        shippingQuoteId,
      });

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.message).toBe('Address not found');
        expect(result.code).toBe('ADDRESS_NOT_FOUND');
      }
    });

    it('should return an explicit error when the inventory reservation fails', async () => {
      inventoryReservationService.reserveResult = {
        ok: false,
        code: 'INSUFFICIENT_STOCK',
        message: 'Not enough stock',
      };

      const result = await useCase.execute({
        cartId,
        userId,
        addressId,
        idempotencyKey,
        shippingQuoteId,
      });

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.message).toBe('Not enough stock');
        expect(result.code).toBe('INSUFFICIENT_STOCK');
      }
      expect(orderRepository.orders.size).toBe(0);
    });

    it('should return SHIPPING_QUOTE_EXPIRED when the quote does not exist', async () => {
      const result = await useCase.execute({
        cartId,
        userId,
        addressId,
        idempotencyKey,
        shippingQuoteId: 'does-not-exist',
      });

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.code).toBe('SHIPPING_QUOTE_EXPIRED');
      }
      expect(orderRepository.orders.size).toBe(0);
    });

    it('should return SHIPPING_QUOTE_EXPIRED when the quote has expired', async () => {
      const expiredQuote = new ShippingQuote(
        createIdFromString('expired-quote'),
        createIdFromString(cartId),
        createIdFromString(addressId),
        cart.getVersion(),
        calculatedShipping,
        5,
        new Date(Date.now() - 1000),
      );
      await shippingQuoteRepository.save(expiredQuote);

      const result = await useCase.execute({
        cartId,
        userId,
        addressId,
        idempotencyKey,
        shippingQuoteId: 'expired-quote',
      });

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.code).toBe('SHIPPING_QUOTE_EXPIRED');
      }
    });

    it('should return SHIPPING_QUOTE_EXPIRED when the cart has changed since the quote was issued', async () => {
      const staleQuote = new ShippingQuote(
        createIdFromString('stale-quote'),
        createIdFromString(cartId),
        createIdFromString(addressId),
        cart.getVersion() + 1,
        calculatedShipping,
        5,
        new Date(Date.now() + 15 * 60 * 1000),
      );
      await shippingQuoteRepository.save(staleQuote);

      const result = await useCase.execute({
        cartId,
        userId,
        addressId,
        idempotencyKey,
        shippingQuoteId: 'stale-quote',
      });

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.code).toBe('SHIPPING_QUOTE_EXPIRED');
      }
    });

    it('should return COUPON_CHANGED when an applied coupon was edited after being applied', async () => {
      const coupon = createValidCoupon({ id: createIdFromString('coupon-1') });
      await couponRepository.save(coupon);
      cart.addCoupon(coupon, coupon.version);
      await cartRepository.save(cart);

      const editedCoupon = createValidCoupon({ id: createIdFromString('coupon-1') });
      Object.defineProperty(editedCoupon, 'version', { value: 2 });
      await couponRepository.save(editedCoupon);

      const result = await useCase.execute({
        cartId,
        userId,
        addressId,
        idempotencyKey,
        shippingQuoteId,
      });

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.code).toBe('COUPON_CHANGED');
      }
      expect(orderRepository.orders.size).toBe(0);
    });

    it('should return COUPON_UNAVAILABLE when an applied coupon was deleted', async () => {
      const coupon = createValidCoupon({ id: createIdFromString('coupon-1') });
      await couponRepository.save(coupon);
      cart.addCoupon(coupon, coupon.version);
      await cartRepository.save(cart);

      coupon.softDelete();
      await couponRepository.save(coupon);

      const result = await useCase.execute({
        cartId,
        userId,
        addressId,
        idempotencyKey,
        shippingQuoteId,
      });

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.code).toBe('COUPON_UNAVAILABLE');
      }
      expect(orderRepository.orders.size).toBe(0);
    });
  });

  describe('Exception Handling Scenario', () => {
    it('should return error when cartRepository.findById throws exception', async () => {
      jest
        .spyOn(cartRepository, 'findById')
        .mockRejectedValue(new Error('Database failure'));

      const result = await useCase.execute({
        cartId,
        userId,
        addressId,
        idempotencyKey,
        shippingQuoteId,
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
