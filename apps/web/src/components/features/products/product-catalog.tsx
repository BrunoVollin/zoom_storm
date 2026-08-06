"use client";

import { useSearchParams } from "next/navigation";

import { ErrorState } from "@/components/shared/error-state";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { ProductGrid } from "@/components/features/products/product-grid";
import { ProductFilters } from "@/components/features/products/product-filters";
import { useProducts } from "@/hooks/use-products";
import type { ProductFilters as ProductFiltersType } from "@/types/product";

function parseFilters(searchParams: URLSearchParams): ProductFiltersType {
  const [sortBy, sortOrder] = (searchParams.get("sort") ?? "").split("_") as [
    ProductFiltersType["sortBy"] | "",
    ProductFiltersType["sortOrder"] | "",
  ];

  return {
    category: searchParams.get("category") ?? undefined,
    search: searchParams.get("search") ?? undefined,
    minPrice: toCents(searchParams.get("minPrice")),
    maxPrice: toCents(searchParams.get("maxPrice")),
    sortBy: sortBy || undefined,
    sortOrder: sortOrder || undefined,
  };
}

function toCents(reais: string | null): number | undefined {
  if (!reais) return undefined;
  const value = Number(reais);
  return Number.isFinite(value) ? Math.round(value * 100) : undefined;
}

export function ProductCatalog() {
  const searchParams = useSearchParams();
  const filters = parseFilters(searchParams);
  const { data: products, isLoading, error } = useProducts(filters);

  return (
    <div className="flex flex-col gap-4">
      <ProductFilters />

      {isLoading ? <LoadingSpinner /> : null}
      {error ? (
        <ErrorState
          title="Catalog unavailable"
          message="We couldn't load the products right now. Please try again in a moment."
        />
      ) : null}
      {!isLoading && !error ? <ProductGrid products={products ?? []} /> : null}
    </div>
  );
}
