export interface SavedCard {
  id: string;
  brand: string;
  lastFour: string;
  holderName: string;
  expiry: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SavedCardListResponse {
  status: "SUCCESS" | "ERROR";
  cards?: SavedCard[];
  message?: string;
}

export interface SavedCardResponse {
  status: "SUCCESS" | "ERROR";
  card?: SavedCard;
  message?: string;
}

export interface AddSavedCardInput {
  brand: string;
  lastFour: string;
  holderName: string;
  expiry: string;
  isDefault?: boolean;
}

export interface UpdateSavedCardInput {
  brand: string;
  holderName: string;
  expiry: string;
}
