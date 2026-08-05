import { http } from "@/lib/http";
import type { FlashOffer, FlashOfferWriteInput } from "@/types/flash-offer";

export const flashOfferService = {
  async listActive(): Promise<FlashOffer[]> {
    const { data } = await http.get<{ offers: FlashOffer[] }>("/flash-offers/active");
    return data.offers;
  },

  async list(): Promise<FlashOffer[]> {
    const { data } = await http.get<{ offers: FlashOffer[] }>("/flash-offers");
    return data.offers;
  },

  async create(input: FlashOfferWriteInput): Promise<FlashOffer> {
    const { data } = await http.post<{ offer: FlashOffer }>("/flash-offers", input);
    return data.offer;
  },

  async update(id: string, input: Omit<FlashOfferWriteInput, "productId">): Promise<FlashOffer> {
    const { data } = await http.put<{ offer: FlashOffer }>(`/flash-offers/${id}`, input);
    return data.offer;
  },

  async remove(id: string): Promise<void> {
    await http.delete(`/flash-offers/${id}`);
  },
};
