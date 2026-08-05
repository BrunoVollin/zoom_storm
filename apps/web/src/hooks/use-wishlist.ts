"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { wishlistService } from "@/services/wishlist-service";
import { queryKeys } from "@/constants/query-keys";
import { useCurrentUser } from "@/hooks/use-current-user";

/**
 * Owns the signed-in user's wishlist: fetches it (only when logged in) and
 * exposes typed add/remove mutations that keep the cached list in sync.
 */
export function useWishlist() {
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();

  const wishlistQuery = useQuery({
    queryKey: queryKeys.wishlist.all,
    queryFn: wishlistService.list,
    enabled: Boolean(user),
  });

  const addToWishlist = useMutation({
    mutationFn: (productId: string) => wishlistService.add(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wishlist.all });
    },
  });

  const removeFromWishlist = useMutation({
    mutationFn: (productId: string) => wishlistService.remove(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wishlist.all });
    },
  });

  return {
    items: wishlistQuery.data ?? [],
    isLoading: Boolean(user) && wishlistQuery.isLoading,
    error: wishlistQuery.error,
    addToWishlist,
    removeFromWishlist,
  };
}

export function useIsWishlisted(productId: string) {
  const { items } = useWishlist();
  return items.some((item) => item.productId === productId);
}
