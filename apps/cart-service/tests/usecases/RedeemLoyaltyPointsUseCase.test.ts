import { RedeemLoyaltyPointsUseCase } from '../../src/application/usecases/RedeemLoyaltyPointsUseCase';
import { Status } from '../../src/application/contracts/UseCase';
import { Cart } from '../../src/domain/entities/cart/Cart';
import { LoyaltyAccount } from '../../src/domain/entities/loyalty/LoyaltyAccount';
import { createIdFromString } from '../factories/IdFactory';
import {
  FakeCartRepository,
  FakeCouponRepository,
  FakeLoyaltyRepository,
} from '../factories/FakeRepositories';

describe('RedeemLoyaltyPointsUseCase', () => {
  let cartRepository: FakeCartRepository;
  let couponRepository: FakeCouponRepository;
  let loyaltyRepository: FakeLoyaltyRepository;
  let useCase: RedeemLoyaltyPointsUseCase;

  const userId = 'user-1';
  const cartId = 'cart-1';

  beforeEach(() => {
    cartRepository = new FakeCartRepository();
    couponRepository = new FakeCouponRepository();
    loyaltyRepository = new FakeLoyaltyRepository();
    useCase = new RedeemLoyaltyPointsUseCase(
      cartRepository,
      couponRepository,
      loyaltyRepository,
    );
  });

  describe('Success Scenario', () => {
    it('redeems points, applies a fixed-amount coupon to the cart and debits the loyalty balance', async () => {
      const cart = new Cart(createIdFromString(userId), createIdFromString(cartId));
      cartRepository.carts.set(cartId, cart);
      loyaltyRepository.accounts.set(
        userId,
        new LoyaltyAccount(createIdFromString(userId), 100),
      );

      const result = await useCase.execute({ cartId, userId, points: 40 });

      expect(result.status).toBe(Status.SUCCESS);
      if (result.status === Status.SUCCESS) {
        expect(result.balance).toBe(60);
      }
      expect(cart.getCoupons()).toHaveLength(1);
      expect(cart.getCoupons()[0].getDiscount(10000)).toBe(4000);
      expect(couponRepository.coupons.size).toBe(1);
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
      cart.addCoupon({
        id: createIdFromString('existing-coupon'),
        name: 'EXISTING',
        isValid: () => true,
        getName: () => 'EXISTING',
        getDiscount: () => 100,
      });
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
