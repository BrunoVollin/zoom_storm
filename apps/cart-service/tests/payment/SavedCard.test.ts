import { SavedCard } from '../../src/domain/entities/payment/SavedCard';
import { IdType } from '../../src/domain/shared/IdType';

describe('SavedCard', () => {
  const userId = IdType.create('user-1');

  it('creates a valid saved card', () => {
    const card = new SavedCard(
      IdType.create('card-1'),
      userId,
      'Visa',
      '4242',
      'Bruno Almeida',
      '12/28',
    );

    expect(card.brand).toBe('Visa');
    expect(card.lastFour).toBe('4242');
    expect(card.belongsTo(userId)).toBe(true);
    expect(card.belongsTo(IdType.create('other-user'))).toBe(false);
  });

  it('rejects a lastFour that is not exactly 4 digits', () => {
    expect(
      () =>
        new SavedCard(IdType.create(), userId, 'Visa', '42', 'Bruno Almeida', '12/28'),
    ).toThrow('Card lastFour must have exactly 4 digits');
  });

  it('rejects an expiry not in MM/YY format', () => {
    expect(
      () =>
        new SavedCard(
          IdType.create(),
          userId,
          'Visa',
          '4242',
          'Bruno Almeida',
          '2028-12',
        ),
    ).toThrow('Card expiry must be in MM/YY format');
  });

  it('rejects an empty holder name', () => {
    expect(
      () => new SavedCard(IdType.create(), userId, 'Visa', '4242', '  ', '12/28'),
    ).toThrow('Card holder name is required');
  });
});
