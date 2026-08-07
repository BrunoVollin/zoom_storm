import { Address } from '../../../../domain/entities/profile/Address';
import { SavedAddress } from '../../../../domain/entities/profile/SavedAddress';
import { SavedAddressRepository } from '../../../../domain/repositories/SavedAddressRepository';
import { IdType } from '../../../../domain/shared/IdType';
import { prisma } from '../prisma-connection';

interface SavedAddressRow {
  id: string;
  userId: string;
  label: string;
  recipient: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  zip: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class PrismaSavedAddressRepository implements SavedAddressRepository {
  async save(savedAddress: SavedAddress): Promise<void> {
    const id = savedAddress.id.toString();
    const userId = savedAddress.userId.toString();
    const address = savedAddress.getAddress();
    const data = {
      userId,
      label: savedAddress.getLabel(),
      recipient: savedAddress.getRecipient(),
      street: address.street,
      number: address.number,
      complement: address.complement,
      neighborhood: address.neighborhood,
      city: address.city,
      state: address.state,
      zip: address.zip,
      isDefault: savedAddress.isDefault(),
      createdAt: savedAddress.createdAt,
      updatedAt: savedAddress.getUpdatedAt(),
    };

    await prisma.$transaction(async (tx) => {
      if (savedAddress.isDefault()) {
        await tx.savedAddress.updateMany({
          where: { userId, isDefault: true, id: { not: id } },
          data: { isDefault: false },
        });
      }

      await tx.savedAddress.upsert({
        where: { id },
        create: { id, ...data },
        update: data,
      });
    });
  }

  async findById(id: IdType): Promise<SavedAddress | null> {
    const row = await prisma.savedAddress.findUnique({
      where: { id: id.toString() },
    });

    return row ? this.toDomain(row) : null;
  }

  async findByUserId(userId: IdType): Promise<Array<SavedAddress>> {
    const rows = await prisma.savedAddress.findMany({
      where: { userId: userId.toString() },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });

    return rows.map((row) => this.toDomain(row));
  }

  async delete(id: IdType): Promise<void> {
    await prisma.savedAddress.delete({ where: { id: id.toString() } });
  }

  private toDomain(row: SavedAddressRow): SavedAddress {
    return new SavedAddress(
      IdType.create(row.id),
      IdType.create(row.userId),
      row.label,
      row.recipient,
      new Address(
        row.street,
        row.number,
        row.neighborhood,
        row.city,
        row.state,
        row.zip,
        row.complement,
      ),
      row.isDefault,
      row.createdAt,
      row.updatedAt,
    );
  }
}
