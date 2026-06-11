"use client";

import { ErrorState } from "@/components/shared/error-state";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { ProductGrid } from "@/components/features/products/product-grid";
import { useProducts } from "@/hooks/use-products";

export function ProductCatalog() {
  const { data: products, isLoading, error } = useProducts();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <ErrorState
        title="Catálogo indisponível"
        message="Não foi possível carregar os jogos agora. Tente novamente em instantes."
      />
    );
  }

  return <ProductGrid products={products ?? []} />;
}
