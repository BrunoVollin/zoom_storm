export interface CepAddress {
  street?: string;
  neighborhood?: string;
  city: string;
  state: string;
}

export interface CepLookupService {
  lookup(cep: string): Promise<CepAddress | null>;
}
