"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { reviewService } from "@/services/review-service";
import { queryKeys } from "@/constants/query-keys";
import type { CreateReviewInput } from "@/schemas/review.schema";

export function useCreateReview(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateReviewInput) => reviewService.create(productId, input),
    onSuccess: (product) => {
      queryClient.setQueryData(queryKeys.products.detail(productId), product);
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    },
  });
}
