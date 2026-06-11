"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cartService } from "@/services/cart-service";
import { queryKeys } from "@/constants/query-keys";
import { useCartId } from "@/hooks/use-cart-id";
import { useCurrentUser } from "@/hooks/use-current-user";
import type { Cart } from "@/types/cart";

/**
 * Owns the cart lifecycle for the storefront: lazily creates a cart for the
 * signed-in user on first use, keeps it cached via TanStack Query, and
 * exposes typed mutations so feature components never call the service layer
 * (or axios) directly.
 */
export function useCart() {
  const queryClient = useQueryClient();
  const [cartId, setCartId] = useCartId();
  const { data: user } = useCurrentUser();

  const cartQuery = useQuery({
    queryKey: queryKeys.cart.detail(cartId ?? "none"),
    queryFn: () => cartService.getById(cartId as string),
    enabled: Boolean(cartId),
  });

  function setCart(cart: Cart) {
    queryClient.setQueryData(queryKeys.cart.detail(cart.id), cart);
    setCartId(cart.id);
  }

  const ensureCart = useMutation({
    mutationFn: async () => {
      if (cartId) return cartQuery.data ?? cartService.getById(cartId);
      if (!user) throw new Error("É necessário entrar para montar um carrinho");
      return cartService.create({ userId: user.subject });
    },
    onSuccess: setCart,
  });

  const addItem = useMutation({
    mutationFn: async ({ productId, quantity }: { productId: string; quantity: number }) => {
      const cart = cartId ? { id: cartId } : await ensureCart.mutateAsync();
      return cartService.addItems(cart.id, [{ id: productId, quantity }]);
    },
    onSuccess: setCart,
  });

  const updateItemQuantity = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      if (!cartId) throw new Error("Carrinho inexistente");
      return cartService.updateItemQuantity(cartId, itemId, quantity);
    },
    onSuccess: setCart,
  });

  const removeItem = useMutation({
    mutationFn: (itemId: string) => {
      if (!cartId) throw new Error("Carrinho inexistente");
      return cartService.removeItem(cartId, itemId);
    },
    onSuccess: setCart,
  });

  return {
    cart: cartQuery.data,
    isLoading: Boolean(cartId) && cartQuery.isLoading,
    error: cartQuery.error,
    addItem,
    updateItemQuantity,
    removeItem,
  };
}
