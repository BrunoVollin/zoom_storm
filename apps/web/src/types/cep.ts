export interface CepAddress {
  street?: string;
  neighborhood?: string;
  city: string;
  state: string;
}

export interface CepLookupResponse {
  status: "SUCCESS" | "ERROR";
  address?: CepAddress | null;
  message?: string;
}
