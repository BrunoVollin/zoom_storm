import { http } from "@/lib/http";
import type {
  AddSavedAddressInput,
  SavedAddress,
  SavedAddressInput,
  SavedAddressListResponse,
  SavedAddressResponse,
} from "@/types/saved-address";

export const savedAddressService = {
  async list(): Promise<SavedAddress[]> {
    const { data } = await http.get<SavedAddressListResponse>("/cart/profile/addresses");
    if (data.status === "ERROR") {
      throw new Error(data.message ?? "Não foi possível carregar seus endereços");
    }
    return data.addresses ?? [];
  },

  async add(input: AddSavedAddressInput): Promise<SavedAddress> {
    const { data } = await http.post<SavedAddressResponse>("/cart/profile/addresses", input);
    if (data.status === "ERROR" || !data.address) {
      throw new Error(data.message ?? "Não foi possível salvar o endereço");
    }
    return data.address;
  },

  async update(addressId: string, input: SavedAddressInput): Promise<SavedAddress> {
    const { data } = await http.put<SavedAddressResponse>(
      `/cart/profile/addresses/${addressId}`,
      input,
    );
    if (data.status === "ERROR" || !data.address) {
      throw new Error(data.message ?? "Não foi possível atualizar o endereço");
    }
    return data.address;
  },

  async remove(addressId: string): Promise<void> {
    const { data } = await http.delete<SavedAddressResponse>(
      `/cart/profile/addresses/${addressId}`,
    );
    if (data.status === "ERROR") {
      throw new Error(data.message ?? "Não foi possível remover o endereço");
    }
  },

  async setDefault(addressId: string): Promise<SavedAddress> {
    const { data } = await http.put<SavedAddressResponse>(
      `/cart/profile/addresses/${addressId}/default`,
    );
    if (data.status === "ERROR" || !data.address) {
      throw new Error(data.message ?? "Não foi possível definir o endereço padrão");
    }
    return data.address;
  },
};
