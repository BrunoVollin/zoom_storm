import { Address } from '../../src/domain/entities/profile/Address';

function buildValidAddress(overrides: Partial<{
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  zip: string;
  complement: string | null;
}> = {}) {
  return new Address(
    overrides.street ?? 'Rua das Flores',
    overrides.number ?? '123',
    overrides.neighborhood ?? 'Centro',
    overrides.city ?? 'São Paulo',
    overrides.state ?? 'SP',
    overrides.zip ?? '01310-100',
    overrides.complement ?? null,
  );
}

describe('Address', () => {
  it('builds a valid address', () => {
    const address = buildValidAddress();

    expect(address.street).toBe('Rua das Flores');
    expect(address.zip).toBe('01310-100');
    expect(address.complement).toBeNull();
  });

  it('accepts an optional complement', () => {
    const address = buildValidAddress({ complement: 'Apto 42' });

    expect(address.complement).toBe('Apto 42');
  });

  it.each(['street', 'number', 'neighborhood', 'city', 'state'] as const)(
    'rejects a blank %s',
    (field) => {
      expect(() => buildValidAddress({ [field]: '  ' })).toThrow();
    },
  );

  it('rejects a zip without 8 digits', () => {
    expect(() => buildValidAddress({ zip: '123' })).toThrow(
      'Address zip must have 8 digits',
    );
  });

  it('accepts a zip formatted with a dash', () => {
    expect(() => buildValidAddress({ zip: '01310-100' })).not.toThrow();
  });
});
