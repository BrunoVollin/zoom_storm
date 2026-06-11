import { EmptyState } from "@/components/shared/empty-state";
import { ProductCard } from "@/components/features/products/product-card";
import type { Product } from "@/types/product";

export function ProductGrid({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <EmptyState
        title="Nenhum produto disponível"
        description="Ainda não há jogos cadastrados no catálogo. Volte em breve."
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
