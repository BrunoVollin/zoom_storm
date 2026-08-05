import { UserProfile } from '@src/domain/entities/profile/UserProfile';

export class UserProfileMapper {
  static toPrimitives(profile: UserProfile) {
    const address = profile.getAddress();

    return {
      userId: profile.userId.toString(),
      fullName: profile.getFullName(),
      document: profile.getDocument(),
      address: {
        street: address.street,
        number: address.number,
        complement: address.complement,
        neighborhood: address.neighborhood,
        city: address.city,
        state: address.state,
        zip: address.zip,
      },
      updatedAt: profile.updatedAt.toISOString(),
    };
  }
}

export type UserProfilePrimitives = ReturnType<typeof UserProfileMapper.toPrimitives>;
