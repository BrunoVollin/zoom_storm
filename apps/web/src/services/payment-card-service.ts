import { http } from "@/lib/http";
import type {
  AddSavedCardInput,
  SavedCard,
  SavedCardListResponse,
  SavedCardResponse,
} from "@/types/payment-card";

export const paymentCardService = {
  async list(): Promise<SavedCard[]> {
    const { data } = await http.get<SavedCardListResponse>("/cart/profile/cards");
    if (data.status === "ERROR") {
      throw new Error(data.message ?? "Não foi possível carregar seus cartões");
    }
    return data.cards ?? [];
  },

  async add(input: AddSavedCardInput): Promise<SavedCard> {
    const { data } = await http.post<SavedCardResponse>("/cart/profile/cards", input);
    if (data.status === "ERROR" || !data.card) {
      throw new Error(data.message ?? "Não foi possível salvar o cartão");
    }
    return data.card;
  },

  async remove(cardId: string): Promise<void> {
    const { data } = await http.delete<SavedCardResponse>(`/cart/profile/cards/${cardId}`);
    if (data.status === "ERROR") {
      throw new Error(data.message ?? "Não foi possível remover o cartão");
    }
  },
};
