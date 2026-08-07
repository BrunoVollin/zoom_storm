import { ReviewEligibility } from '../../src/domain/entities/ReviewEligibility';
import { IdType } from '../../src/domain/shared/IdType';

describe('ReviewEligibility', () => {
  it('uses user, order and product as its stable natural key', () => {
    const eligibility = new ReviewEligibility(
      IdType.create('eligibility-1'),
      IdType.create('user-1'),
      IdType.create('order-1'),
      IdType.create('product-1'),
      new Date('2026-08-07T12:00:00.000Z'),
    );

    expect(eligibility.naturalKey).toBe('user-1:order-1:product-1');
    expect(
      eligibility.matches(
        IdType.create('user-1'),
        IdType.create('order-1'),
        IdType.create('product-1'),
      ),
    ).toBe(true);
  });

  it('rejects invalid identity or delivery data', () => {
    expect(
      () =>
        new ReviewEligibility(
          IdType.create('eligibility-1'),
          IdType.create(''),
          IdType.create('order-1'),
          IdType.create('product-1'),
          new Date('invalid'),
        ),
    ).toThrow('Review eligibility data is invalid');
  });
});
