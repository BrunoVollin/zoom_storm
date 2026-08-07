import { DeleteCouponUseCase } from '../../src/application/usecases/DeleteCouponUseCase';
import { FakeCouponRepository } from '../factories/FakeRepositories';
import { Status } from '../../src/application/contracts/UseCase';
import { createValidCoupon } from '../factories/CouponFactory';
import { createIdFromString } from '../factories/IdFactory';

describe('DeleteCouponUseCase', () => {
  let couponRepository: FakeCouponRepository;
  let useCase: DeleteCouponUseCase;

  beforeEach(() => {
    couponRepository = new FakeCouponRepository();
    useCase = new DeleteCouponUseCase(couponRepository);
  });

  describe('Success Scenario', () => {
    it('soft-deletes an existing coupon', async () => {
      await couponRepository.save(
        createValidCoupon({ id: createIdFromString('coupon-1') }),
      );

      const result = await useCase.execute({ id: 'coupon-1' });

      expect(result.status).toBe(Status.SUCCESS);
      const stored = await couponRepository.findById(
        createIdFromString('coupon-1'),
      );
      expect(stored).not.toBeNull();
      expect(stored?.isDeleted()).toBe(true);
    });
  });

  describe('Business Rule Violations', () => {
    it('returns an error when coupon does not exist', async () => {
      const result = await useCase.execute({ id: 'missing-coupon' });

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.message).toBe('Coupon not found');
      }
    });
  });

  describe('Exception Handling Scenario', () => {
    it('returns an unexpected error when the repository throws', async () => {
      await couponRepository.save(
        createValidCoupon({ id: createIdFromString('coupon-1') }),
      );
      jest
        .spyOn(couponRepository, 'save')
        .mockRejectedValue(new Error('db down'));

      const result = await useCase.execute({ id: 'coupon-1' });

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.message).toBe(
          'An unexpected error occurred. Please try again later.',
        );
      }
    });
  });
});
