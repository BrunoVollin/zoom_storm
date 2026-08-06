import { FlashOffer } from '../../../../domain/entities/FlashOffer';
import { FlashOfferRepository } from '../../../../domain/repositories/FlashOfferRepository';
import { IdType } from '../../../../domain/shared/IdType';
import { prisma } from '../prisma-connection';

export class PrismaFlashOfferRepository implements FlashOfferRepository {
  async save(offer: FlashOffer): Promise<void> {
    const data = {
      productId: offer.productId.toString(),
      title: offer.title,
      discountPct: offer.discountPct,
      startsAt: offer.startsAt,
      endsAt: offer.endsAt,
    };

    await prisma.flashOffer.upsert({
      where: { id: offer.getId().toString() },
      create: { id: offer.getId().toString(), ...data },
      update: data,
    });
  }

  async findById(id: IdType): Promise<FlashOffer | null> {
    const row = await prisma.flashOffer.findUnique({ where: { id: id.toString() } });
    if (!row) return null;

    return PrismaFlashOfferRepository.toDomain(row);
  }

  async findActive(now: Date = new Date()): Promise<FlashOffer[]> {
    const rows = await prisma.flashOffer.findMany({
      where: { startsAt: { lte: now }, endsAt: { gte: now } },
      orderBy: { startsAt: 'asc' },
    });

    return rows.map(PrismaFlashOfferRepository.toDomain);
  }

  async findExpired(now: Date = new Date()): Promise<FlashOffer[]> {
    const rows = await prisma.flashOffer.findMany({
      where: { endsAt: { lt: now } },
      orderBy: { endsAt: 'asc' },
    });

    return rows.map(PrismaFlashOfferRepository.toDomain);
  }

  async findAll(): Promise<FlashOffer[]> {
    const rows = await prisma.flashOffer.findMany({ orderBy: { startsAt: 'desc' } });

    return rows.map(PrismaFlashOfferRepository.toDomain);
  }

  async delete(id: IdType): Promise<void> {
    await prisma.flashOffer.delete({ where: { id: id.toString() } });
  }

  private static toDomain(row: {
    id: string;
    productId: string;
    title: string;
    discountPct: number;
    startsAt: Date;
    endsAt: Date;
    createdAt: Date;
  }): FlashOffer {
    return new FlashOffer(
      IdType.create(row.id),
      IdType.create(row.productId),
      row.title,
      row.discountPct,
      row.startsAt,
      row.endsAt,
      row.createdAt,
    );
  }
}
