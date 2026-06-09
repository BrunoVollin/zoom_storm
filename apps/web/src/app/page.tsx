import { ErrorState } from "@/components/shared/error-state";
import { ProductGrid } from "@/components/features/products/product-grid";
import { productService } from "@/services/product-service";

export const revalidate = 60;

export default async function HomePage() {
  let products;
  try {
    products = await productService.list();
  } catch {
    return <ErrorState title="Catálogo indisponível" message="Não foi possível carregar os jogos agora. Tente novamente em instantes." />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Catálogo</h1>
        <p className="text-muted-foreground">Jogos atuais e retro selecionados para você.</p>
      </div>
      <ProductGrid products={products} />
    </div>
  );
}
