import { ProductCatalog } from "@/components/features/products/product-catalog";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Catálogo</h1>
        <p className="text-muted-foreground">Jogos atuais e retro selecionados para você.</p>
      </div>
      <ProductCatalog />
    </div>
  );
}
