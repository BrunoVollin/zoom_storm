"use client";

import { useRouter } from "next/navigation";

import { FlashOfferForm } from "@/components/features/admin/flash-offer-form";
import { ROUTES } from "@/constants/routes";
import { useCreateFlashOffer } from "@/hooks/use-flash-offers";

export default function NewFlashOfferPage() {
  const router = useRouter();
  const createFlashOffer = useCreateFlashOffer();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Nova oferta relâmpago</h1>
        <p className="text-sm text-muted-foreground">
          Cadastre uma oferta por tempo limitado para o banner da home.
        </p>
      </div>

      <FlashOfferForm
        submitLabel="Criar oferta"
        onSubmit={async (input) => {
          await createFlashOffer.mutateAsync(input);
          router.push(ROUTES.adminFlashOffers);
        }}
      />
    </div>
  );
}
