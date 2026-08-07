import { RedeemLoyaltyPointsUseCase } from '../../src/application/usecases/RedeemLoyaltyPointsUseCase';
import { Status } from '../../src/application/contracts/UseCase';
import { Cart } from '../../src/domain/entities/cart/Cart';
import { LoyaltyAccount } from '../../src/domain/entities/loyalty/LoyaltyAccount';
import { createIdFromString } from '../factories/IdFactory';
import { createValidCoupon } from '../factories/CouponFactory';
import {
  FakeCartRepository,
  FakeLoyaltyRepository,
} from '../factories/FakeRepositories';

describe('RedeemLoyaltyPointsUseCase', () => {
  let cartRepository: FakeCartRepository;
  let loyaltyRepository: FakeLoyaltyRepository;
  let useCase: RedeemLoyaltyPointsUseCase;

  const userId = 'user-1';
  const cartId = 'cart-1';

  beforeEach(() => {
    cartRepository = new FakeCartRepository();
    loyaltyRepository = new FakeLoyaltyRepository();
    useCase = new RedeemLoyaltyPointsUseCase(cartRepository, loyaltyRepository);
  });

  describe('Success Scenario', () => {
    it('reserves the redemption on the cart without debiting the loyalty balance yet', async () => {
      const cart = new Cart(createIdFromString(userId), createIdFromString(cartId));
      cartRepository.carts.set(cartId, cart);
      loyaltyRepository.accounts.set(
        userId,
        new LoyaltyAccount(createIdFromString(userId), 100),
      );

      const result = await useCase.execute({ cartId, userId, points: 40 });

      expect(result.status).toBe(Status.SUCCESS);
      if (result.status === Status.SUCCESS) {
        // Balance is only debited when the reservation is consumed at
        // payment time, not when the redemption is requested.
        expect(result.balance).toBe(100);
        expect(result.reservedPoints).toBe(40);
      }
      expect(cart.getLoyaltyRedemptionPoints()).toBe(40);
      expect(cart.getCoupons()).toHaveLength(0);
    });
  });

  describe('Business Rule Violations', () => {
    it('returns an error when the cart does not exist', async () => {
      const result = await useCase.execute({ cartId, userId, points: 10 });

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.message).toBe('Cart not found');
      }
    });

    it('returns an error when the cart belongs to another user', async () => {
      const cart = new Cart(
        createIdFromString('other-user'),
        createIdFromString(cartId),
      );
      cartRepository.carts.set(cartId, cart);

      const result = await useCase.execute({ cartId, userId, points: 10 });

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.message).toBe('Cart not found');
      }
    });

    it('returns an error when the cart already has a coupon applied', async () => {
      const cart = new Cart(createIdFromString(userId), createIdFromString(cartId));
      cart.addCoupon(createValidCoupon({ id: createIdFromString('existing-coupon') }));
      cartRepository.carts.set(cartId, cart);
      loyaltyRepository.accounts.set(
        userId,
        new LoyaltyAccount(createIdFromString(userId), 100),
      );

      const result = await useCase.execute({ cartId, userId, points: 10 });

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.message).toContain('cupom já aplicado');
      }
    });

    it('returns an error when the requested points exceed the account balance', async () => {
      const cart = new Cart(createIdFromString(userId), createIdFromString(cartId));
      cartRepository.carts.set(cartId, cart);
      loyaltyRepository.accounts.set(
        userId,
        new LoyaltyAccount(createIdFromString(userId), 5),
      );

      const result = await useCase.execute({ cartId, userId, points: 10 });

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.message).toBe('Saldo de pontos insuficiente');
      }
    });

    it('treats a user with no loyalty account yet as having zero balance', async () => {
      const cart = new Cart(createIdFromString(userId), createIdFromString(cartId));
      cartRepository.carts.set(cartId, cart);

      const result = await useCase.execute({ cartId, userId, points: 1 });

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.message).toBe('Saldo de pontos insuficiente');
      }
    });
  });
});
