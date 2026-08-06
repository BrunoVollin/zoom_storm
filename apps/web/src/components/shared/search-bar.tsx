"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

import { ROUTES } from "@/constants/routes";

export function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("search") ?? "");

  // `SearchBar` lives in the Header and stays mounted across navigations, so
  // its local `value` must be resynced whenever the `search` query param
  // changes externally (e.g. leaving /search clears it, or a link sets it
  // directly) instead of only reflecting the value at first mount.
  useEffect(() => {
    setValue(searchParams.get("search") ?? "");
  }, [searchParams]);

  return (
    <form
      className="flex w-full overflow-hidden rounded-md bg-white"
      onSubmit={(event) => {
        event.preventDefault();
        router.push(`${ROUTES.search}?search=${encodeURIComponent(value)}`);
      }}
    >
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search products, brands and more..."
        aria-label="Search"
        className="min-w-0 flex-1 border-0 bg-transparent px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"
      />
      <button
        type="submit"
        aria-label="Search"
        className="flex items-center justify-center bg-brand-yellow px-4 text-brand-purple hover:brightness-95"
      >
        <Search className="size-4" />
      </button>
    </form>
  );
}
