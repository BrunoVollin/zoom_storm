import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

export function AdminNav() {
  const pathname = usePathname();
  const isFlashOffers = pathname?.startsWith(ROUTES.adminFlashOffers);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Painel admin</h1>
          <p className="text-sm text-muted-foreground">
            {isFlashOffers ? "Gerencie as ofertas relâmpago." : "Gerencie o catálogo de produtos."}
          </p>
        </div>
        <Button asChild>
          <Link href={isFlashOffers ? ROUTES.adminFlashOfferNew : ROUTES.adminProductNew}>
            {isFlashOffers ? "Nova oferta" : "Novo produto"}
          </Link>
        </Button>
      </div>
      <div className="flex gap-4 border-b border-border text-sm">
        <Link
          href={ROUTES.adminProducts}
          className={cn(
            "border-b-2 pb-2",
            !isFlashOffers ? "border-primary font-medium" : "border-transparent text-muted-foreground",
          )}
        >
          Produtos
        </Link>
        <Link
          href={ROUTES.adminFlashOffers}
          className={cn(
            "border-b-2 pb-2",
            isFlashOffers ? "border-primary font-medium" : "border-transparent text-muted-foreground",
          )}
        >
          Ofertas relâmpago
        </Link>
      </div>
    </div>
  );
}
