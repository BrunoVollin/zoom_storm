import { IdType } from '../../shared/IdType';

export class LoyaltyAccount {
  constructor(
    readonly userId: IdType,
    private balance: number = 0,
  ) {}

  getBalance(): number {
    return this.balance;
  }

  earn(points: number) {
    if (points <= 0) throw new Error('Points to earn must be positive');

    this.balance += points;
  }

  redeem(points: number) {
    if (points <= 0) throw new Error('Points to redeem must be positive');
    if (points > this.balance) throw new Error('Insufficient loyalty points balance');

    this.balance -= points;
  }
}
