export interface SavedAddress {
  id: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface SavedAddressInput {
  label: string;
  recipient: string;
  street: string;
  number: string;
  complement?: string | null;
  neighborhood: string;
  city: string;
  state: string;
  zip: string;
}

export interface AddSavedAddressInput extends SavedAddressInput {
  isDefault?: boolean;
}

export interface SavedAddressListResponse {
  status: "SUCCESS" | "ERROR";
  addresses?: SavedAddress[];
  message?: string;
}

export interface SavedAddressResponse {
  status: "SUCCESS" | "ERROR";
  address?: SavedAddress;
  message?: string;
}
