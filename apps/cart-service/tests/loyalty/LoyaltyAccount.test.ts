import { LoyaltyAccount } from '../../src/domain/entities/loyalty/LoyaltyAccount';
import { createIdFromString } from '../factories/IdFactory';

describe('LoyaltyAccount', () => {
  describe('getBalance', () => {
    it('defaults to zero when no initial balance is given', () => {
      const account = new LoyaltyAccount(createIdFromString('user-1'));

      expect(account.getBalance()).toBe(0);
    });

    it('returns the initial balance passed to the constructor', () => {
      const account = new LoyaltyAccount(createIdFromString('user-1'), 50);

      expect(account.getBalance()).toBe(50);
    });
  });

  describe('earn', () => {
    it('increases the balance by the given amount of points', () => {
      const account = new LoyaltyAccount(createIdFromString('user-1'), 10);

      account.earn(15);

      expect(account.getBalance()).toBe(25);
    });

    it('throws when earning zero points', () => {
      const account = new LoyaltyAccount(createIdFromString('user-1'));

      expect(() => account.earn(0)).toThrow(
        'Points to earn must be positive',
      );
    });

    it('throws when earning a negative amount of points', () => {
      const account = new LoyaltyAccount(createIdFromString('user-1'));

      expect(() => account.earn(-5)).toThrow(
        'Points to earn must be positive',
      );
    });
  });

  describe('redeem', () => {
    it('decreases the balance by the given amount of points', () => {
      const account = new LoyaltyAccount(createIdFromString('user-1'), 30);

      account.redeem(10);

      expect(account.getBalance()).toBe(20);
    });

    it('allows redeeming the full balance, leaving zero', () => {
      const account = new LoyaltyAccount(createIdFromString('user-1'), 10);

      account.redeem(10);

      expect(account.getBalance()).toBe(0);
    });

    it('throws when redeeming zero points', () => {
      const account = new LoyaltyAccount(createIdFromString('user-1'), 10);

      expect(() => account.redeem(0)).toThrow(
        'Points to redeem must be positive',
      );
    });

    it('throws when redeeming a negative amount of points', () => {
      const account = new LoyaltyAccount(createIdFromString('user-1'), 10);

      expect(() => account.redeem(-5)).toThrow(
        'Points to redeem must be positive',
      );
    });

    it('throws when redeeming more points than the current balance', () => {
      const account = new LoyaltyAccount(createIdFromString('user-1'), 10);

      expect(() => account.redeem(11)).toThrow(
        'Insufficient loyalty points balance',
      );
    });
  });
});
