import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { flashOfferService } from "@/services/flash-offer-service";
import type { FlashOfferWriteInput } from "@/types/flash-offer";

const flashOffersKey = ["flash-offers", "active"] as const;
const allFlashOffersKey = ["flash-offers", "all"] as const;

export function useActiveFlashOffers() {
  return useQuery({
    queryKey: flashOffersKey,
    queryFn: () => flashOfferService.listActive(),
  });
}

export function useFlashOffers() {
  return useQuery({
    queryKey: allFlashOffersKey,
    queryFn: () => flashOfferService.list(),
  });
}

function invalidateFlashOffers(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: flashOffersKey });
  queryClient.invalidateQueries({ queryKey: allFlashOffersKey });
}

export function useCreateFlashOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: FlashOfferWriteInput) => flashOfferService.create(input),
    onSuccess: () => invalidateFlashOffers(queryClient),
  });
}

export function useUpdateFlashOffer(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Omit<FlashOfferWriteInput, "productId">) =>
      flashOfferService.update(id, input),
    onSuccess: () => invalidateFlashOffers(queryClient),
  });
}

export function useDeleteFlashOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => flashOfferService.remove(id),
    onSuccess: () => invalidateFlashOffers(queryClient),
  });
}
