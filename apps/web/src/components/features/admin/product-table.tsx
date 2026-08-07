"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Pencil, Search, Trash2 } from "lucide-react";

import { PriceTag } from "@/components/shared/price-tag";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ROUTES } from "@/constants/routes";
import { useDeleteProduct } from "@/hooks/use-products";
import { getDefaultVariant, type Product } from "@/types/product";

type StockFilter = "all" | "available" | "low" | "out";
type ProductSort = "name" | "price-asc" | "price-desc" | "stock";

function matchesStock(stock: number, filter: StockFilter): boolean {
  if (filter === "available") return stock > 5;
  if (filter === "low") return stock > 0 && stock <= 5;
  if (filter === "out") return stock === 0;
  return true;
}

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0)
    return (
      <Badge className="border-transparent bg-destructive text-destructive-foreground">
        Sem estoque
      </Badge>
    );
  if (stock <= 5)
    return (
      <Badge variant="outline" className="border-amber-500 text-amber-700">
        Baixo: {stock}
      </Badge>
    );
  return (
    <Badge variant="outline" className="border-emerald-500 text-emerald-700">
      {stock} unidades
    </Badge>
  );
}

export function ProductTable({ products }: { products: Product[] }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [stock, setStock] = useState<StockFilter>("all");
  const [sort, setSort] = useState<ProductSort>("name");

  const categories = useMemo(
    () => Array.from(new Set(products.map((product) => product.category))).sort(),
    [products],
  );

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR");
    return products
      .filter((product) => {
        const variant = getDefaultVariant(product);
        const matchesSearch =
          !normalizedSearch ||
          product.name.toLocaleLowerCase("pt-BR").includes(normalizedSearch) ||
          variant.sku.toLocaleLowerCase("pt-BR").includes(normalizedSearch);
        return (
          matchesSearch &&
          (category === "all" || product.category === category) &&
          matchesStock(variant.stock, stock)
        );
      })
      .sort((left, right) => {
        const leftVariant = getDefaultVariant(left);
        const rightVariant = getDefaultVariant(right);
        if (sort === "price-asc") return leftVariant.price - rightVariant.price;
        if (sort === "price-desc") return rightVariant.price - leftVariant.price;
        if (sort === "stock") return leftVariant.stock - rightVariant.stock;
        return left.name.localeCompare(right.name, "pt-BR");
      });
  }, [products, search, category, stock, sort]);

  return (
    <section data-testid="admin-product-list" className="flex flex-col gap-4">
      <div className="grid gap-3 rounded-lg border border-border bg-muted/20 p-4 md:grid-cols-2 lg:grid-cols-[minmax(14rem,1fr)_repeat(3,minmax(9rem,auto))]">
        <label className="relative">
          <span className="sr-only">Buscar produtos</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            data-testid="admin-product-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nome ou SKU"
            className="pl-9"
          />
        </label>
        <Select
          data-testid="admin-product-category-filter"
          aria-label="Filtrar por categoria"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        >
          <option value="all">Todas as categorias</option>
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </Select>
        <Select
          data-testid="admin-product-stock-filter"
          aria-label="Filtrar por estoque"
          value={stock}
          onChange={(event) => setStock(event.target.value as StockFilter)}
        >
          <option value="all">Todo estoque</option>
          <option value="available">Disponível</option>
          <option value="low">Estoque baixo</option>
          <option value="out">Sem estoque</option>
        </Select>
        <Select
          data-testid="admin-product-sort"
          aria-label="Ordenar produtos"
          value={sort}
          onChange={(event) => setSort(event.target.value as ProductSort)}
        >
          <option value="name">Nome (A–Z)</option>
          <option value="price-asc">Menor preço</option>
          <option value="price-desc">Maior preço</option>
          <option value="stock">Menor estoque</option>
        </Select>
      </div>

      <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
        <p data-testid="admin-product-result-count">
          {filteredProducts.length} de {products.length} produtos
        </p>
        {search || category !== "all" || stock !== "all" ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setCategory("all");
              setStock("all");
            }}
          >
            Limpar filtros
          </Button>
        ) : null}
      </div>

      {filteredProducts.length === 0 ? (
        <div
          data-testid="admin-products-empty-filter"
          className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground"
        >
          Nenhum produto corresponde aos filtros selecionados.
        </div>
      ) : (
        <>
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Estoque</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <ProductRow key={product.id} product={product} />
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="grid gap-3 md:hidden">
            {filteredProducts.map((product) => (
              <ProductMobileCard key={product.id} product={product} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function ProductRow({ product }: { product: Product }) {
  const variant = getDefaultVariant(product);
  return (
    <TableRow data-testid={`admin-product-row-${product.id}`}>
      <TableCell>
        <p className="font-medium">{product.name}</p>
        <p className="font-mono text-xs text-muted-foreground">{variant.sku}</p>
      </TableCell>
      <TableCell>{product.category}</TableCell>
      <TableCell>
        <PriceTag cents={variant.price} />
      </TableCell>
      <TableCell>
        <StockBadge stock={variant.stock} />
      </TableCell>
      <TableCell>
        <ProductActions product={product} testIdSuffix="desktop" />
      </TableCell>
    </TableRow>
  );
}

function ProductMobileCard({ product }: { product: Product }) {
  const variant = getDefaultVariant(product);
  return (
    <Card data-testid={`admin-product-card-${product.id}`}>
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div className="min-w-0">
          <CardTitle className="truncate">{product.name}</CardTitle>
          <p className="font-mono text-xs text-muted-foreground">{variant.sku}</p>
        </div>
        <StockBadge stock={variant.stock} />
      </CardHeader>
      <CardContent className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">{product.category}</p>
          <PriceTag cents={variant.price} />
        </div>
        <ProductActions product={product} testIdSuffix="mobile" />
      </CardContent>
    </Card>
  );
}

function ProductActions({ product, testIdSuffix }: { product: Product; testIdSuffix: string }) {
  const [open, setOpen] = useState(false);
  const deleteProduct = useDeleteProduct();

  async function handleDelete() {
    await deleteProduct.mutateAsync(product.id);
    setOpen(false);
  }

  return (
    <div className="flex justify-end gap-2">
      <Button asChild variant="outline" size="icon">
        <Link
          data-testid={`edit-product-${testIdSuffix}-${product.id}`}
          href={ROUTES.adminProductEdit(product.id)}
          aria-label={`Editar ${product.name}`}
        >
          <Pencil className="size-4" />
        </Link>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            data-testid={`delete-product-${testIdSuffix}-${product.id}`}
            variant="destructive"
            size="icon"
            aria-label={`Excluir ${product.name}`}
          >
            <Trash2 className="size-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir produto</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir &quot;{product.name}&quot;? Essa ação não pode ser
              desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              data-testid="confirm-delete-product-btn"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteProduct.isPending}
            >
              {deleteProduct.isPending ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
