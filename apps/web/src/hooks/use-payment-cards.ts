"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { paymentCardService } from "@/services/payment-card-service";
import { queryKeys } from "@/constants/query-keys";
import type { AddSavedCardInput } from "@/types/payment-card";

export function useSavedCards() {
  return useQuery({
    queryKey: queryKeys.paymentCards.all,
    queryFn: () => paymentCardService.list(),
  });
}

export function useAddSavedCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AddSavedCardInput) => paymentCardService.add(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.paymentCards.all });
    },
  });
}

export function useDeleteSavedCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (cardId: string) => paymentCardService.remove(cardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.paymentCards.all });
    },
  });
}
