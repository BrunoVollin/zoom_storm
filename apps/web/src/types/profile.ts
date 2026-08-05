export interface ProfileAddress {
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  zip: string;
}

export interface UserProfile {
  userId: string;
  fullName: string;
  document: string;
  address: ProfileAddress;
  updatedAt: string;
}

export interface UserProfileResponse {
  status: "SUCCESS" | "ERROR";
  profile?: UserProfile | null;
  message?: string;
}

export interface UpdateProfileInput {
  fullName: string;
  document: string;
  address: {
    street: string;
    number: string;
    complement?: string | null;
    neighborhood: string;
    city: string;
    state: string;
    zip: string;
  };
}
