import { RemoveCouponUseCase } from '../../src/application/usecases/RemoveCouponUseCase';
import { createIdFromString } from '../factories/IdFactory';
import { createValidCoupon } from '../factories/CouponFactory';
import { CartRepository } from '../../src/domain/repositories/CartRepository';
import { Status } from '../../src/application/contracts/UseCase';

describe('RemoveCouponUseCase', () => {
  let cartRepositoryMock: CartRepository;
  let useCase: RemoveCouponUseCase;
  let cartMock: object;

  const cartId = 'cart-1';
  const couponId = 'coupon-1';

  beforeEach(() => {
    cartRepositoryMock = {
      save: jest.fn(),
      findById: jest.fn(),
    };

    const validCoupon = createValidCoupon();

    cartMock = {
      getCoupons: jest.fn(() => [validCoupon]),
      removeCoupon: jest.fn(),
    };

    useCase = new RemoveCouponUseCase(cartRepositoryMock);

    jest.clearAllMocks();
  });

  describe('Success Scenario', () => {
    it('should remove coupon from cart successfully', async () => {
      const validCoupon = createValidCoupon({
        id: createIdFromString(couponId),
      });

      (cartRepositoryMock.findById as jest.Mock).mockResolvedValue(cartMock);
      (cartMock.getCoupons as jest.Mock).mockReturnValue([validCoupon]);
      (cartRepositoryMock.save as jest.Mock).mockResolvedValue(undefined);

      const result = await useCase.execute({
        cartId,
        couponId,
      });

      expect(result.status).toBe(Status.SUCCESS);
      expect(cartRepositoryMock.findById).toHaveBeenCalledTimes(1);
      expect(cartMock.getCoupons).toHaveBeenCalledTimes(1);
      expect(cartRepositoryMock.save).toHaveBeenCalledTimes(1);
    });

    it('should remove coupon and keep other coupons', async () => {
      const coupon1 = createValidCoupon({
        id: createIdFromString('coupon-1'),
      });
      const coupon2 = createValidCoupon({
        id: createIdFromString('coupon-2'),
      });

      (cartRepositoryMock.findById as jest.Mock).mockResolvedValue(cartMock);
      (cartMock.getCoupons as jest.Mock).mockReturnValue([coupon1, coupon2]);
      (cartRepositoryMock.save as jest.Mock).mockResolvedValue(undefined);

      const result = await useCase.execute({
        cartId,
        couponId: 'coupon-1',
      });

      expect(result.status).toBe(Status.SUCCESS);
      expect(cartRepositoryMock.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('Business Rule Violations', () => {
    it('should return error when cart is not found', async () => {
      (cartRepositoryMock.findById as jest.Mock).mockResolvedValue(null);

      const result = await useCase.execute({
        cartId,
        couponId,
      });

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.message).toBe('Cart not found');
      }
      expect(cartRepositoryMock.save).toHaveBeenCalledTimes(0);
    });

    it('should return error when coupon is not found in cart', async () => {
      const validCoupon = createValidCoupon({
        id: createIdFromString('other-coupon'),
      });

      (cartRepositoryMock.findById as jest.Mock).mockResolvedValue(cartMock);
      (cartMock.getCoupons as jest.Mock).mockReturnValue([validCoupon]);

      const result = await useCase.execute({
        cartId,
        couponId,
      });

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.message).toBe('Coupon not found in cart');
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
        couponId,
      });

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.message).toBe(errorMessage);
      }
    });

    it('should return error when cartRepository.save throws exception', async () => {
      const errorMessage = 'Save failed';
      const validCoupon = createValidCoupon({
        id: createIdFromString(couponId),
      });

      (cartRepositoryMock.findById as jest.Mock).mockResolvedValue(cartMock);
      (cartMock.getCoupons as jest.Mock).mockReturnValue([validCoupon]);
      (cartRepositoryMock.save as jest.Mock).mockRejectedValue(
        new Error(errorMessage),
      );

      const result = await useCase.execute({
        cartId,
        couponId,
      });

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.message).toBe(errorMessage);
      }
    });
  });
});
