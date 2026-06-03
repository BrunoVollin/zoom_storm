import { ApplyCouponUseCase } from '../../src/application/usecases/ApplyCouponUseCase';
import {
  createValidCoupon,
  createInvalidCoupon,
} from '../factories/CouponFactory';
import { CartRepository } from '../../src/domain/repositories/CartRepository';
import { CouponRepository } from '../../src/domain/repositories/CouponRepository';
import { Status } from '../../src/application/contracts/UseCase';

describe('ApplyCouponUseCase', () => {
  let cartRepositoryMock: CartRepository;
  let couponRepositoryMock: CouponRepository;
  let useCase: ApplyCouponUseCase;
  let cartMock: object;

  const cartId = 'cart-1';
  const couponId = 'coupon-1';

  beforeEach(() => {
    cartRepositoryMock = {
      save: jest.fn(),
      findById: jest.fn(),
    };

    couponRepositoryMock = {
      save: jest.fn(),
      findById: jest.fn(),
      findByIds: jest.fn(),
    };

    cartMock = {
      addCoupon: jest.fn(),
    };

    useCase = new ApplyCouponUseCase(cartRepositoryMock, couponRepositoryMock);

    jest.clearAllMocks();
  });

  describe('Success Scenario', () => {
    it('should apply valid coupon to cart successfully', async () => {
      const validCoupon = createValidCoupon();

      (cartRepositoryMock.findById as jest.Mock).mockResolvedValue(cartMock);
      (couponRepositoryMock.findById as jest.Mock).mockResolvedValue(
        validCoupon,
      );
      (cartRepositoryMock.save as jest.Mock).mockResolvedValue(undefined);

      const result = await useCase.execute({
        cartId,
        couponId,
      });

      expect(result.status).toBe(Status.SUCCESS);
      expect(cartRepositoryMock.findById).toHaveBeenCalledTimes(1);
      expect(couponRepositoryMock.findById).toHaveBeenCalledTimes(1);
      expect(cartMock.addCoupon).toHaveBeenCalledWith(validCoupon);
      expect(cartRepositoryMock.save).toHaveBeenCalledWith(cartMock);
    });
  });

  describe('Business Rule Violations', () => {
    it('should return error when cart is not found', async () => {
      const validCoupon = createValidCoupon();

      (cartRepositoryMock.findById as jest.Mock).mockResolvedValue(null);
      (couponRepositoryMock.findById as jest.Mock).mockResolvedValue(
        validCoupon,
      );

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

    it('should return error when coupon is not found', async () => {
      (cartRepositoryMock.findById as jest.Mock).mockResolvedValue(cartMock);
      (couponRepositoryMock.findById as jest.Mock).mockResolvedValue(null);

      const result = await useCase.execute({
        cartId,
        couponId,
      });

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.message).toBe('Coupon not found');
      }
      expect(cartRepositoryMock.save).toHaveBeenCalledTimes(0);
    });

    it('should return error when coupon is invalid', async () => {
      const invalidCoupon = createInvalidCoupon();

      (cartRepositoryMock.findById as jest.Mock).mockResolvedValue(cartMock);
      (couponRepositoryMock.findById as jest.Mock).mockResolvedValue(
        invalidCoupon,
      );

      const result = await useCase.execute({
        cartId,
        couponId,
      });

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.message).toBe('Error: ' + invalidCoupon.getName());
      }
      expect(cartMock.addCoupon).toHaveBeenCalledTimes(0);
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
      const validCoupon = createValidCoupon();

      (cartRepositoryMock.findById as jest.Mock).mockResolvedValue(cartMock);
      (couponRepositoryMock.findById as jest.Mock).mockResolvedValue(
        validCoupon,
      );
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
