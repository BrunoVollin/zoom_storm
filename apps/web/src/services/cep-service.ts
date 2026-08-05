import { http } from "@/lib/http";
import type { CepAddress, CepLookupResponse } from "@/types/cep";

export const cepService = {
  async lookup(cep: string): Promise<CepAddress | null> {
    const digits = cep.replace(/\D/g, "");
    const { data } = await http.get<CepLookupResponse>(`/cart/cep/${digits}`);
    if (data.status === "ERROR") {
      throw new Error(data.message ?? "Não foi possível consultar o CEP");
    }
    return data.address ?? null;
  },
};
