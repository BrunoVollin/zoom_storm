import { http } from "@/lib/http";
import type { UpdateProfileInput, UserProfile, UserProfileResponse } from "@/types/profile";

export const profileService = {
  async get(): Promise<UserProfile | null> {
    const { data } = await http.get<UserProfileResponse>("/cart/profile");
    if (data.status === "ERROR") {
      throw new Error(data.message ?? "Não foi possível carregar seus dados");
    }
    return data.profile ?? null;
  },

  async update(input: UpdateProfileInput): Promise<UserProfile> {
    const { data } = await http.put<UserProfileResponse>("/cart/profile", input);
    if (data.status === "ERROR" || !data.profile) {
      throw new Error(data.message ?? "Não foi possível salvar seus dados");
    }
    return data.profile;
  },
};
