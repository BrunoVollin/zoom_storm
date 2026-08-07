import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

export function AdminNav() {
  const pathname = usePathname();
  const isFlashOffers = pathname?.startsWith(ROUTES.adminFlashOffers);
  const isCoupons = pathname?.startsWith(ROUTES.adminCoupons);
  const section = isCoupons ? "coupons" : isFlashOffers ? "offers" : "products";

  const description = {
    products: "Gerencie o catálogo de produtos.",
    offers: "Gerencie as ofertas relâmpago.",
    coupons: "Gerencie códigos, valores e períodos de validade.",
  }[section];

  const createLink = {
    products: { href: ROUTES.adminProductNew, label: "Novo produto" },
    offers: { href: ROUTES.adminFlashOfferNew, label: "Nova oferta" },
    coupons: { href: ROUTES.adminCouponNew, label: "Novo cupom" },
  }[section];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold">Painel admin</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Button asChild>
          <Link data-testid="admin-create-btn" href={createLink.href}>
            {createLink.label}
          </Link>
        </Button>
      </div>
      <nav
        aria-label="Seções administrativas"
        className="flex gap-4 overflow-x-auto border-b border-border text-sm"
      >
        <Link
          href={ROUTES.adminProducts}
          className={cn(
            "border-b-2 pb-2",
            section === "products"
              ? "border-primary font-medium"
              : "border-transparent text-muted-foreground",
          )}
        >
          Produtos
        </Link>
        <Link
          href={ROUTES.adminFlashOffers}
          className={cn(
            "border-b-2 pb-2",
            section === "offers"
              ? "border-primary font-medium"
              : "border-transparent text-muted-foreground",
          )}
        >
          Ofertas relâmpago
        </Link>
        <Link
          data-testid="admin-nav-coupons"
          href={ROUTES.adminCoupons}
          className={cn(
            "whitespace-nowrap border-b-2 pb-2",
            section === "coupons"
              ? "border-primary font-medium"
              : "border-transparent text-muted-foreground",
          )}
        >
          Cupons
        </Link>
      </nav>
    </div>
  );
}
