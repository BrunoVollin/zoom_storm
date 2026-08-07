"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cartService } from "@/services/cart-service";
import { queryKeys } from "@/constants/query-keys";
import { clearCartId, useCartId } from "@/hooks/use-cart-id";
import { useCurrentUser } from "@/hooks/use-current-user";
import type { ApiError } from "@/types/api";
import type { Cart } from "@/types/cart";

const CART_NOT_FOUND_MESSAGE = "Cart not found";
const PRODUCT_NOT_FOUND_MESSAGE = "Product not found";

function toFriendlyError(error: unknown): unknown {
  if ((error as ApiError | undefined)?.message === PRODUCT_NOT_FOUND_MESSAGE) {
    return new Error("Produto indisponível no momento. Tente novamente em instantes.");
  }
  return error;
}

/**
 * A saved cartId can go stale without the frontend ever finding out — the
 * cart-service returns the same "Cart not found" message whether the id
 * doesn't exist or belongs to a different user. Either way the id in
 * localStorage is no longer usable and must be dropped.
 */
function isStaleCartError(error: unknown): boolean {
  return (error as ApiError | undefined)?.message === CART_NOT_FOUND_MESSAGE;
}

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
    queryFn: async () => {
      try {
        return await cartService.getById(cartId as string);
      } catch (error) {
        if (isStaleCartError(error)) clearCartId();
        throw error;
      }
    },
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
      return cartService.create({});
    },
    onSuccess: setCart,
  });

  const addItem = useMutation({
    mutationFn: async ({ productId, quantity }: { productId: string; quantity: number }) => {
      const products = [{ id: productId, quantity }];

      if (!cartId) {
        const cart = await ensureCart.mutateAsync();
        try {
          return await cartService.addItems(cart.id, products);
        } catch (error) {
          throw toFriendlyError(error);
        }
      }

      try {
        return await cartService.addItems(cartId, products);
      } catch (error) {
        if (!isStaleCartError(error)) throw toFriendlyError(error);

        clearCartId();
        const cart = await cartService.create({});
        setCart(cart);
        try {
          return await cartService.addItems(cart.id, products);
        } catch (retryError) {
          throw toFriendlyError(retryError);
        }
      }
    },
    onSuccess: setCart,
  });

  const updateItemQuantity = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      if (!cartId) throw new Error("Carrinho inexistente");
      try {
        return await cartService.updateItemQuantity(cartId, itemId, quantity);
      } catch (error) {
        if (isStaleCartError(error)) clearCartId();
        throw error;
      }
    },
    onSuccess: setCart,
  });

  const removeItem = useMutation({
    mutationFn: async (itemId: string) => {
      if (!cartId) throw new Error("Carrinho inexistente");
      try {
        return await cartService.removeItem(cartId, itemId);
      } catch (error) {
        if (isStaleCartError(error)) clearCartId();
        throw error;
      }
    },
    onSuccess: setCart,
  });

  const applyCoupon = useMutation({
    mutationFn: async (couponId: string) => {
      if (!cartId) throw new Error("Carrinho inexistente");
      try {
        return await cartService.applyCoupon(cartId, couponId);
      } catch (error) {
        if (isStaleCartError(error)) clearCartId();
        throw error;
      }
    },
    onSuccess: setCart,
  });

  const removeCoupon = useMutation({
    mutationFn: async (couponId: string) => {
      if (!cartId) throw new Error("Carrinho inexistente");
      try {
        return await cartService.removeCoupon(cartId, couponId);
      } catch (error) {
        if (isStaleCartError(error)) clearCartId();
        throw error;
      }
    },
    onSuccess: setCart,
  });

  const checkout = useMutation({
    mutationFn: async ({
      addressId,
      shippingQuoteId,
    }: {
      addressId: string;
      shippingQuoteId: string;
    }) => {
      if (!cartId) throw new Error("Carrinho inexistente");
      const idempotencyKey = `checkout-${cartId}-${crypto.randomUUID()}`;
      try {
        return await cartService.checkout(cartId, addressId, shippingQuoteId, idempotencyKey);
      } catch (error) {
        if (isStaleCartError(error)) clearCartId();
        throw error;
      }
    },
    onSuccess: ({ cart }) => setCart(cart),
  });

  return {
    cart: cartQuery.data,
    isLoading: Boolean(cartId) && cartQuery.isLoading,
    error: cartQuery.error,
    addItem,
    updateItemQuantity,
    removeItem,
    applyCoupon,
    removeCoupon,
    checkout,
  };
}
