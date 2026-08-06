import { ProductCatalog } from "@/components/features/products/product-catalog";

export default function SearchPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Search results</h1>
        <p className="text-muted-foreground">Products selected for you.</p>
      </div>
      <ProductCatalog />
    </div>
  );
}
