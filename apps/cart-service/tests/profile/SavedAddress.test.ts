import { Address } from '../../src/domain/entities/profile/Address';
import { SavedAddress } from '../../src/domain/entities/profile/SavedAddress';
import { createIdFromString } from '../factories/IdFactory';

const address = () =>
  new Address('Rua A', '10', 'Centro', 'São Paulo', 'SP', '01001-000');

describe('SavedAddress', () => {
  it('validates its label and recipient', () => {
    expect(
      () =>
        new SavedAddress(
          createIdFromString('address-1'),
          createIdFromString('user-1'),
          '',
          'Bruno',
          address(),
        ),
    ).toThrow('Address label is required');
  });

  it('updates safe details without changing ownership or id', () => {
    const saved = new SavedAddress(
      createIdFromString('address-1'),
      createIdFromString('user-1'),
      'Home',
      'Bruno',
      address(),
    );
    const updatedAddress = new Address(
      'Rua B',
      '20',
      'Bairro B',
      'Rio de Janeiro',
      'RJ',
      '20000-000',
    );

    saved.update('Office', 'Bruno Silva', updatedAddress);

    expect(saved.getLabel()).toBe('Office');
    expect(saved.getRecipient()).toBe('Bruno Silva');
    expect(saved.getAddress()).toBe(updatedAddress);
    expect(saved.belongsTo(createIdFromString('user-1'))).toBe(true);
  });

  it('can be selected as the default address', () => {
    const saved = new SavedAddress(
      createIdFromString('address-1'),
      createIdFromString('user-1'),
      'Home',
      'Bruno',
      address(),
    );

    saved.makeDefault();
    expect(saved.isDefault()).toBe(true);
    saved.clearDefault();
    expect(saved.isDefault()).toBe(false);
  });
});
