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
        title="Entre para ver seu carrinho"
        description="Você precisa estar autenticado para montar e acompanhar seu carrinho de compras."
      />
    );
  }

  if (error) {
    return <ErrorState message="Não foi possível carregar o seu carrinho agora." />;
  }

  if (!cart || cart.items.length === 0) {
    return (
      <EmptyState
        title="Seu carrinho está vazio"
        description="Adicione jogos ao carrinho para vê-los listados aqui."
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
