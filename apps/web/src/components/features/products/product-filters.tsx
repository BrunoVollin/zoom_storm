"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useProductCategories } from "@/hooks/use-products";
import { ROUTES } from "@/constants/routes";

const SORT_OPTIONS = [
  { value: "", label: "Relevância" },
  { value: "price_asc", label: "Menor preço" },
  { value: "price_desc", label: "Maior preço" },
  { value: "name_asc", label: "Nome (A-Z)" },
  { value: "name_desc", label: "Nome (Z-A)" },
] as const;

export function ProductFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: categories = [] } = useProductCategories();

  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") ?? "");

  // Tracks the params synchronously across a burst of rapid filter changes.
  // `router.replace` doesn't commit to `window.location`/`searchParams`
  // synchronously, so two updates fired in quick succession (e.g. clearing
  // one filter and setting another right after) would otherwise each read a
  // stale base and one change would silently clobber the other.
  const pendingParams = useRef<URLSearchParams | null>(null);

  function updateParams(patch: Record<string, string | undefined>) {
    const params = pendingParams.current ?? new URLSearchParams(window.location.search);

    for (const [key, value] of Object.entries(patch)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }

    pendingParams.current = params;
    router.replace(`${ROUTES.home}?${params.toString()}`, { scroll: false });
    queueMicrotask(() => {
      if (pendingParams.current === params) pendingParams.current = null;
    });
  }

  const currentSort = searchParams.get("sort") ?? "";

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border p-4">
      <form
        className="flex flex-1 items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          updateParams({ search: search || undefined });
        }}
      >
        <div className="flex flex-1 flex-col gap-1.5">
          <label htmlFor="search" className="text-sm text-muted-foreground">
            Buscar
          </label>
          <div className="flex gap-2">
            <Input
              id="search"
              placeholder="Nome ou descrição do jogo"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <button
              type="submit"
              aria-label="Buscar"
              className="flex h-10 w-10 items-center justify-center rounded-md border border-border hover:bg-muted"
            >
              <Search className="size-4" />
            </button>
          </div>
        </div>
      </form>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="category" className="text-sm text-muted-foreground">
          Categoria
        </label>
        <Select
          id="category"
          className="w-40"
          value={searchParams.get("category") ?? ""}
          onChange={(event) => updateParams({ category: event.target.value || undefined })}
        >
          <option value="">Todas</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="minPrice" className="text-sm text-muted-foreground">
          Preço min. (R$)
        </label>
        <Input
          id="minPrice"
          type="number"
          min="0"
          step="0.01"
          className="w-28"
          value={minPrice}
          onChange={(event) => setMinPrice(event.target.value)}
          onBlur={() => updateParams({ minPrice: minPrice || undefined })}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="maxPrice" className="text-sm text-muted-foreground">
          Preço máx. (R$)
        </label>
        <Input
          id="maxPrice"
          type="number"
          min="0"
          step="0.01"
          className="w-28"
          value={maxPrice}
          onChange={(event) => setMaxPrice(event.target.value)}
          onBlur={() => updateParams({ maxPrice: maxPrice || undefined })}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="sort" className="text-sm text-muted-foreground">
          Ordenar por
        </label>
        <Select
          id="sort"
          className="w-40"
          value={currentSort}
          onChange={(event) => updateParams({ sort: event.target.value || undefined })}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
