import { CreateCouponUseCase } from '../../src/application/usecases/CreateCouponUseCase';
import { FakeCouponRepository } from '../factories/FakeRepositories';
import { Status } from '../../src/application/contracts/UseCase';
import { CouponType } from '../../src/domain/entities/coupon/Coupon';

describe('CreateCouponUseCase', () => {
  let couponRepository: FakeCouponRepository;
  let useCase: CreateCouponUseCase;

  beforeEach(() => {
    couponRepository = new FakeCouponRepository();
    useCase = new CreateCouponUseCase(couponRepository);
  });

  describe('Success Scenario', () => {
    it('creates a percent coupon', async () => {
      const result = await useCase.execute({
        name: 'BLACKFRIDAY',
        type: CouponType.PERCENT,
        start: new Date('2026-06-01'),
        end: new Date('2026-06-30'),
        percent: 0.2,
      });

      expect(result.status).toBe(Status.SUCCESS);
      if (result.status === Status.SUCCESS) {
        expect(result.coupon.name).toBe('BLACKFRIDAY');
        expect(result.coupon.type).toBe(CouponType.PERCENT);
        expect(result.coupon.percent).toBe(0.2);
      }
      expect(await couponRepository.findAll()).toHaveLength(1);
    });

    it('creates a fixed amount coupon', async () => {
      const result = await useCase.execute({
        name: 'FIXED10',
        type: CouponType.FIXED,
        start: new Date('2026-06-01'),
        end: new Date('2026-06-30'),
        amount: 1000,
      });

      expect(result.status).toBe(Status.SUCCESS);
      if (result.status === Status.SUCCESS) {
        expect(result.coupon.type).toBe(CouponType.FIXED);
        expect(result.coupon.amount).toBe(1000);
      }
    });
  });

  describe('Business Rule Violations', () => {
    it('rejects duplicate coupon names', async () => {
      await useCase.execute({
        name: 'BLACKFRIDAY',
        type: CouponType.PERCENT,
        start: new Date('2026-06-01'),
        end: new Date('2026-06-30'),
        percent: 0.2,
      });

      const result = await useCase.execute({
        name: 'BLACKFRIDAY',
        type: CouponType.PERCENT,
        start: new Date('2026-07-01'),
        end: new Date('2026-07-30'),
        percent: 0.1,
      });

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.message).toBe(
          'A coupon named "BLACKFRIDAY" already exists',
        );
      }
      expect(await couponRepository.findAll()).toHaveLength(1);
    });

    it('returns a validation error when start is after end', async () => {
      const result = await useCase.execute({
        name: 'BADRANGE',
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
      expect(await couponRepository.findAll()).toHaveLength(0);
    });

    it('returns a validation error when percent is out of range', async () => {
      const result = await useCase.execute({
        name: 'BADPERCENT',
        type: CouponType.PERCENT,
        start: new Date('2026-06-01'),
        end: new Date('2026-06-30'),
        percent: 2,
      });

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.message).toBe(
          'Coupon percent must be greater than 0 and at most 1',
        );
      }
    });
  });

  describe('Exception Handling Scenario', () => {
    it('returns an unexpected error when the repository throws', async () => {
      jest
        .spyOn(couponRepository, 'findByName')
        .mockRejectedValue(new Error('db down'));

      const result = await useCase.execute({
        name: 'BLACKFRIDAY',
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
