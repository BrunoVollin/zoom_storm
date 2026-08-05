"use client";

import { useParams, useRouter } from "next/navigation";

import { FlashOfferForm } from "@/components/features/admin/flash-offer-form";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { ROUTES } from "@/constants/routes";
import { useFlashOffers, useUpdateFlashOffer } from "@/hooks/use-flash-offers";

export default function EditFlashOfferPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { data: offers, isLoading, error } = useFlashOffers();
  const offer = offers?.find((o) => o.id === id);
  const updateFlashOffer = useUpdateFlashOffer(id);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error || !offer) {
    return <ErrorState title="Oferta não encontrada" />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Editar oferta</h1>
        <p className="text-sm text-muted-foreground">{offer.title}</p>
      </div>

      <FlashOfferForm
        initialOffer={offer}
        submitLabel="Salvar alterações"
        onSubmit={async (input) => {
          await updateFlashOffer.mutateAsync(input);
          router.push(ROUTES.adminFlashOffers);
        }}
      />
    </div>
  );
}
