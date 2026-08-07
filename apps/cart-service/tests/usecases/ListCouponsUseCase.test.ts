import { ListCouponsUseCase } from '../../src/application/usecases/ListCouponsUseCase';
import { FakeCouponRepository } from '../factories/FakeRepositories';
import { createValidCoupon, createInvalidCoupon } from '../factories/CouponFactory';
import { Status } from '../../src/application/contracts/UseCase';
import { createIdFromString } from '../factories/IdFactory';

describe('ListCouponsUseCase', () => {
  let couponRepository: FakeCouponRepository;
  let useCase: ListCouponsUseCase;

  beforeEach(() => {
    couponRepository = new FakeCouponRepository();
    useCase = new ListCouponsUseCase(couponRepository);
  });

  it('returns an empty list when there are no coupons', async () => {
    const result = await useCase.execute({});

    expect(result.status).toBe(Status.SUCCESS);
    if (result.status === Status.SUCCESS) {
      expect(result.coupons).toEqual([]);
    }
  });

  it('returns all registered coupons mapped to primitives', async () => {
    const valid = createValidCoupon({ id: createIdFromString('coupon-1') });
    const invalid = createInvalidCoupon({ id: createIdFromString('coupon-2') });
    await couponRepository.save(valid);
    await couponRepository.save(invalid);

    const result = await useCase.execute({});

    expect(result.status).toBe(Status.SUCCESS);
    if (result.status === Status.SUCCESS) {
      expect(result.coupons).toHaveLength(2);
      expect(result.coupons.map((c) => c.id).sort()).toEqual([
        'coupon-1',
        'coupon-2',
      ]);
      const mappedValid = result.coupons.find((c) => c.id === 'coupon-1');
      expect(mappedValid?.isValid).toBe(true);
    }
  });

  it('returns an unexpected error when the repository throws', async () => {
    jest
      .spyOn(couponRepository, 'findAll')
      .mockRejectedValue(new Error('db down'));

    const result = await useCase.execute({});

    expect(result.status).toBe(Status.ERROR);
    if (result.status === Status.ERROR) {
      expect(result.message).toBe(
        'An unexpected error occurred. Please try again later.',
      );
    }
  });
});
