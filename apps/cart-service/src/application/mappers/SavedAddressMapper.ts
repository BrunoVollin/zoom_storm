import { SavedAddress } from '@src/domain/entities/profile/SavedAddress';

export class SavedAddressMapper {
  static toPrimitives(savedAddress: SavedAddress) {
    const address = savedAddress.getAddress();

    return {
      id: savedAddress.id.toString(),
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
      createdAt: savedAddress.createdAt.toISOString(),
      updatedAt: savedAddress.getUpdatedAt().toISOString(),
    };
  }
}

export type SavedAddressPrimitives = ReturnType<typeof SavedAddressMapper.toPrimitives>;
