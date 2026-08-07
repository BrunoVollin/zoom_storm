import { ShippingQuote } from '../../../../domain/entities/freight/ShippingQuote';
import { ShippingQuoteRepository } from '../../../../domain/repositories/ShippingQuoteRepository';
import { IdType } from '../../../../domain/shared/IdType';
import { prisma } from '../prisma-connection';

export class PrismaShippingQuoteRepository implements ShippingQuoteRepository {
  async save(quote: ShippingQuote): Promise<void> {
    await prisma.shippingQuote.upsert({
      where: { id: quote.id.toString() },
      create: {
        id: quote.id.toString(),
        cartId: quote.cartId.toString(),
        addressId: quote.addressId.toString(),
        cartVersion: quote.cartVersion,
        shipping: quote.shipping,
        estimatedDays: quote.estimatedDays,
        expiresAt: quote.expiresAt,
        createdAt: quote.createdAt,
      },
      update: {
        shipping: quote.shipping,
        estimatedDays: quote.estimatedDays,
        expiresAt: quote.expiresAt,
      },
    });
  }

  async findById(id: IdType): Promise<ShippingQuote | null> {
    const row = await prisma.shippingQuote.findUnique({
      where: { id: id.toString() },
    });
    if (!row) return null;

    return new ShippingQuote(
      IdType.create(row.id),
      IdType.create(row.cartId),
      IdType.create(row.addressId),
      row.cartVersion,
      row.shipping,
      row.estimatedDays,
      row.expiresAt,
      row.createdAt,
    );
  }
}
