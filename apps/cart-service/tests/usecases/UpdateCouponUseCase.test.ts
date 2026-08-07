import { UpdateCouponUseCase } from '../../src/application/usecases/UpdateCouponUseCase';
import { FakeCouponRepository } from '../factories/FakeRepositories';
import { Status } from '../../src/application/contracts/UseCase';
import { CouponType } from '../../src/domain/entities/coupon/Coupon';
import { createValidCoupon } from '../factories/CouponFactory';
import { createIdFromString } from '../factories/IdFactory';

describe('UpdateCouponUseCase', () => {
  let couponRepository: FakeCouponRepository;
  let useCase: UpdateCouponUseCase;

  beforeEach(() => {
    couponRepository = new FakeCouponRepository();
    useCase = new UpdateCouponUseCase(couponRepository);
  });

  describe('Success Scenario', () => {
    it('updates an existing coupon', async () => {
      const existing = createValidCoupon({
        id: createIdFromString('coupon-1'),
        name: 'OLDNAME',
      });
      await couponRepository.save(existing);

      const result = await useCase.execute({
        id: 'coupon-1',
        name: 'NEWNAME',
        type: CouponType.PERCENT,
        start: new Date('2026-06-01'),
        end: new Date('2026-06-30'),
        percent: 0.3,
      });

      expect(result.status).toBe(Status.SUCCESS);
      if (result.status === Status.SUCCESS) {
        expect(result.coupon.id).toBe('coupon-1');
        expect(result.coupon.name).toBe('NEWNAME');
        expect(result.coupon.percent).toBe(0.3);
      }
    });

    it('allows keeping the same name on update', async () => {
      const existing = createValidCoupon({
        id: createIdFromString('coupon-1'),
        name: 'SAME',
      });
      await couponRepository.save(existing);

      const result = await useCase.execute({
        id: 'coupon-1',
        name: 'SAME',
        type: CouponType.PERCENT,
        start: new Date('2026-06-01'),
        end: new Date('2026-06-30'),
        percent: 0.4,
      });

      expect(result.status).toBe(Status.SUCCESS);
    });
  });

  describe('Business Rule Violations', () => {
    it('returns an error when coupon does not exist', async () => {
      const result = await useCase.execute({
        id: 'missing-coupon',
        name: 'NEWNAME',
        type: CouponType.PERCENT,
        start: new Date('2026-06-01'),
        end: new Date('2026-06-30'),
        percent: 0.3,
      });

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.message).toBe('Coupon not found');
      }
    });

    it('rejects renaming to a name already used by another coupon', async () => {
      await couponRepository.save(
        createValidCoupon({ id: createIdFromString('coupon-1'), name: 'ONE' }),
      );
      await couponRepository.save(
        createValidCoupon({ id: createIdFromString('coupon-2'), name: 'TWO' }),
      );

      const result = await useCase.execute({
        id: 'coupon-2',
        name: 'ONE',
        type: CouponType.PERCENT,
        start: new Date('2026-06-01'),
        end: new Date('2026-06-30'),
        percent: 0.1,
      });

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.message).toBe('A coupon named "ONE" already exists');
      }
    });

    it('returns a validation error from the domain entity', async () => {
      await couponRepository.save(
        createValidCoupon({ id: createIdFromString('coupon-1'), name: 'ONE' }),
      );

      const result = await useCase.execute({
        id: 'coupon-1',
        name: 'ONE',
        type: CouponType.PERCENT,
        start: new Date('2026-07-30'),
        end: new Date('2026-07-01'),
        percent: 0.1,
      });

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.message).toBe(
          'Coupon start date must be before end date',
        );
      }
    });
  });

  describe('Exception Handling Scenario', () => {
    it('returns an unexpected error when the repository throws', async () => {
      await couponRepository.save(
        createValidCoupon({ id: createIdFromString('coupon-1'), name: 'ONE' }),
      );
      jest
        .spyOn(couponRepository, 'save')
        .mockRejectedValue(new Error('db down'));

      const result = await useCase.execute({
        id: 'coupon-1',
        name: 'ONE',
        type: CouponType.PERCENT,
        start: new Date('2026-06-01'),
        end: new Date('2026-06-30'),
        percent: 0.2,
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
