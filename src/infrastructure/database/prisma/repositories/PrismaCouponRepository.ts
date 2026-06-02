import { Coupon, CouponPercentByTime } from '@domain/entities/coupon/Coupon';
import { IdType } from '@domain/shared/IdType';
import { CouponRepository } from '@domain/repositories/CouponRepository';
import { PrismaClient } from '../../../../generated/prisma/client';
import { prisma } from '../prisma-connection';

interface CouponRow {
  id: string;
  name: string;
  start: Date;
  end: Date;
  percent: number;
}

export class PrismaCouponRepository implements CouponRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async save(coupon: Coupon): Promise<void> {
    await this.prisma.coupon.upsert({
      where: { id: coupon.id.toString() },
      create: {
        id: coupon.id.toString(),
        name: coupon.getName(),
        start: (coupon as unknown as CouponRow).start,
        end: (coupon as unknown as CouponRow).end,
        percent: (coupon as unknown as CouponRow).percent,
      },
      update: {
        name: coupon.getName(),
        start: (coupon as unknown as CouponRow).start,
        end: (coupon as unknown as CouponRow).end,
        percent: (coupon as unknown as CouponRow).percent,
      },
    });
  }

  async findById(id: IdType): Promise<Coupon | null> {
    const row = await this.prisma.coupon.findUnique({
      where: { id: id.toString() },
    });
    if (!row) return null;

    const r = row as unknown as CouponRow;

    return new CouponPercentByTime(
      IdType.create(r.id),
      r.name,
      new Date(),
      r.start,
      r.end,
      r.percent,
    );
  }

  async findByIds(ids: Array<IdType>): Promise<Array<Coupon>> {
    const idsStr = ids.map((i) => i.toString());
    const rows = await this.prisma.coupon.findMany({
      where: { id: { in: idsStr } },
    });

    return rows.map((r: CouponRow) => {
      const rr = r;

      return new CouponPercentByTime(
        IdType.create(rr.id),
        rr.name,
        new Date(),
        rr.start,
        rr.end,
        rr.percent,
      );
    });
  }
}
