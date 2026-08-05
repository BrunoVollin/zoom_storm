"use client";

import { AdminNav } from "@/components/features/admin/admin-nav";
import { FlashOfferTable } from "@/components/features/admin/flash-offer-table";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { useFlashOffers } from "@/hooks/use-flash-offers";

export default function AdminFlashOffersPage() {
  const { data: offers, isLoading, error } = useFlashOffers();

  return (
    <div className="flex flex-col gap-6">
      <AdminNav />

      {isLoading ? <LoadingSpinner /> : null}
      {error ? (
        <ErrorState
          title="Não foi possível carregar as ofertas"
          message="Tente novamente em instantes."
        />
      ) : null}
      {!isLoading && !error && offers?.length === 0 ? (
        <EmptyState title="Nenhuma oferta cadastrada" />
      ) : null}
      {offers && offers.length > 0 ? <FlashOfferTable offers={offers} /> : null}
    </div>
  );
}
