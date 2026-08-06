"use client";

import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { CartItemRow } from "@/components/features/cart/cart-item-row";
import { CartSummary } from "@/components/features/cart/cart-summary";
import { useAuth } from "@/providers/auth-provider";
import { useCart } from "@/hooks/use-cart";

export function CartList() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { cart, isLoading, error } = useCart();

  if (isAuthLoading || isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return (
      <EmptyState
        title="Sign in to view your cart"
        description="You need to be signed in to build and track your shopping cart."
      />
    );
  }

  if (error) {
    return <ErrorState message="We couldn't load your cart right now." />;
  }

  if (!cart || cart.items.length === 0) {
    return (
      <EmptyState
        title="Your cart is empty"
        description="Add products to your cart to see them listed here."
      />
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        {cart.items.map((item) => (
          <CartItemRow key={item.id} item={item} />
        ))}
      </div>
      <CartSummary cart={cart} />
    </div>
  );
}
