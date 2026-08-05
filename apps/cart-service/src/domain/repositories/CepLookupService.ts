export interface CepAddress {
  city: string;
  state: string;
}

export interface CepLookupService {
  lookup(cep: string): Promise<CepAddress | null>;
}
