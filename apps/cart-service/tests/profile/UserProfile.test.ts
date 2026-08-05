import { UserProfile } from '../../src/domain/entities/profile/UserProfile';
import { Address } from '../../src/domain/entities/profile/Address';
import { createIdFromString } from '../factories/IdFactory';

function buildAddress() {
  return new Address('Rua das Flores', '123', 'Centro', 'São Paulo', 'SP', '01310-100');
}

describe('UserProfile', () => {
  it('builds a valid profile with a CPF (11 digits)', () => {
    const profile = new UserProfile(
      createIdFromString('user-1'),
      'Bruno Almeida',
      '123.456.789-00',
      buildAddress(),
    );

    expect(profile.getFullName()).toBe('Bruno Almeida');
    expect(profile.getDocument()).toBe('123.456.789-00');
  });

  it('accepts a CNPJ (14 digits)', () => {
    expect(
      () =>
        new UserProfile(
          createIdFromString('user-1'),
          'Empresa LTDA',
          '12.345.678/0001-99',
          buildAddress(),
        ),
    ).not.toThrow();
  });

  it('rejects a blank full name', () => {
    expect(
      () => new UserProfile(createIdFromString('user-1'), '  ', '12345678900', buildAddress()),
    ).toThrow('Full name is required');
  });

  it('rejects a document with an invalid digit count', () => {
    expect(
      () => new UserProfile(createIdFromString('user-1'), 'Bruno', '123', buildAddress()),
    ).toThrow('Document must be a valid CPF (11 digits) or CNPJ (14 digits)');
  });

  it('update() replaces name, document and address, re-validating invariants', () => {
    const profile = new UserProfile(
      createIdFromString('user-1'),
      'Bruno Almeida',
      '12345678900',
      buildAddress(),
    );

    const newAddress = new Address('Av. Paulista', '1000', 'Bela Vista', 'São Paulo', 'SP', '01310-000');
    profile.update('Bruno A. Silva', '98765432100', newAddress);

    expect(profile.getFullName()).toBe('Bruno A. Silva');
    expect(profile.getDocument()).toBe('98765432100');
    expect(profile.getAddress()).toBe(newAddress);
  });

  it('update() rejects an invalid document, leaving invariants enforced', () => {
    const profile = new UserProfile(
      createIdFromString('user-1'),
      'Bruno Almeida',
      '12345678900',
      buildAddress(),
    );

    expect(() => profile.update('Bruno Almeida', '123', buildAddress())).toThrow();
  });
});
