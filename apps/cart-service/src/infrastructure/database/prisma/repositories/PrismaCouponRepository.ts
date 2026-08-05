import {
  Coupon,
  CouponFixedAmount,
  CouponPercentByTime,
} from '../../../../domain/entities/coupon/Coupon';
import { IdType } from '../../../../domain/shared/IdType';
import { CouponRepository } from '../../../../domain/repositories/CouponRepository';
import { PrismaClient } from '../../../../generated/prisma/client';
import { prisma } from '../prisma-connection';
import { couponFromRow } from './CouponFactory';

export class PrismaCouponRepository implements CouponRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async save(coupon: Coupon): Promise<void> {
    const data =
      coupon instanceof CouponFixedAmount
        ? {
            name: coupon.getName(),
            start: coupon.start,
            end: coupon.end,
            type: 'FIXED' as const,
            amount: coupon.amount,
            percent: null,
          }
        : coupon instanceof CouponPercentByTime
          ? {
              name: coupon.getName(),
              start: coupon.start,
              end: coupon.end,
              type: 'PERCENT' as const,
              percent: coupon.percent,
              amount: null,
            }
          : (() => {
              throw new Error('Unknown coupon type');
            })();

    await this.prisma.coupon.upsert({
      where: { id: coupon.id.toString() },
      create: { id: coupon.id.toString(), ...data },
      update: data,
    });
  }

  async findById(id: IdType): Promise<Coupon | null> {
    const row = await this.prisma.coupon.findUnique({
      where: { id: id.toString() },
    });
    if (!row) return null;

    return couponFromRow(row);
  }

  async findByIds(ids: Array<IdType>): Promise<Array<Coupon>> {
    const idsStr = ids.map((i) => i.toString());
    const rows = await this.prisma.coupon.findMany({
      where: { id: { in: idsStr } },
    });

    return rows.map((row) => couponFromRow(row));
  }
}
