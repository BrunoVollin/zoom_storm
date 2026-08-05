"use client";

import { AdminNav } from "@/components/features/admin/admin-nav";
import { ProductTable } from "@/components/features/admin/product-table";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { useProducts } from "@/hooks/use-products";

export default function AdminProductsPage() {
  const { data: products, isLoading, error } = useProducts();

  return (
    <div className="flex flex-col gap-6">
      <AdminNav />

      {isLoading ? <LoadingSpinner /> : null}
      {error ? (
        <ErrorState
          title="Não foi possível carregar os produtos"
          message="Tente novamente em instantes."
        />
      ) : null}
      {!isLoading && !error && products?.length === 0 ? (
        <EmptyState title="Nenhum produto cadastrado" />
      ) : null}
      {products && products.length > 0 ? <ProductTable products={products} /> : null}
    </div>
  );
}
