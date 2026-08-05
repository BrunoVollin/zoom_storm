import { Address } from '../../../../domain/entities/profile/Address';
import { UserProfile } from '../../../../domain/entities/profile/UserProfile';
import { IdType } from '../../../../domain/shared/IdType';
import { UserProfileRepository } from '../../../../domain/repositories/UserProfileRepository';
import { prisma } from '../prisma-connection';

export class PrismaUserProfileRepository implements UserProfileRepository {
  async findByUserId(userId: IdType): Promise<UserProfile | null> {
    const row = await prisma.userProfile.findUnique({
      where: { userId: userId.toString() },
    });

    if (!row) return null;

    return new UserProfile(
      IdType.create(row.userId),
      row.fullName,
      row.document,
      new Address(
        row.addressStreet,
        row.addressNumber,
        row.addressNeighborhood,
        row.addressCity,
        row.addressState,
        row.addressZip,
        row.addressComplement,
      ),
      row.updatedAt,
    );
  }

  async save(profile: UserProfile): Promise<void> {
    const userId = profile.userId.toString();
    const address = profile.getAddress();

    const data = {
      fullName: profile.getFullName(),
      document: profile.getDocument(),
      addressStreet: address.street,
      addressNumber: address.number,
      addressComplement: address.complement,
      addressNeighborhood: address.neighborhood,
      addressCity: address.city,
      addressState: address.state,
      addressZip: address.zip,
    };

    await prisma.userProfile.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
  }
}
