"use client";

import { CreditCard } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { SavedCardsList } from "@/components/features/account/saved-cards-list";
import { AddCardForm } from "@/components/features/account/add-card-form";
import { useSavedCards, useAddSavedCard, useDeleteSavedCard } from "@/hooks/use-payment-cards";
import { detectCardBrand, lastFourDigits } from "@/utils/credit-card";
import type { AddCardFormInput } from "@/schemas/payment.schema";

/** "Saved cards" section for the account settings page — lists saved
 * cards with the option to remove them, and lets the user add a new one.
 * Reuses the same hooks (useSavedCards/useAddSavedCard/useDeleteSavedCard)
 * already powering the checkout payment page's saved-card UI. */
export function SavedCardsSection() {
  const { data: savedCards, isLoading } = useSavedCards();
  const addSavedCard = useAddSavedCard();
  const deleteSavedCard = useDeleteSavedCard();

  const handleAddCard = async (values: AddCardFormInput) => {
    await addSavedCard.mutateAsync({
      brand: detectCardBrand(values.cardNumber) ?? "Card",
      lastFour: lastFourDigits(values.cardNumber),
      holderName: values.cardName,
      expiry: values.expiry,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="size-4" />
          Saved cards
        </CardTitle>
        <CardDescription>
          Saved cards are available for quick use at checkout (simulated — no real
          charge is made).
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {isLoading ? <LoadingSpinner /> : null}
        {!isLoading && savedCards && savedCards.length > 0 ? (
          <SavedCardsList
            cards={savedCards}
            onDelete={(cardId) => deleteSavedCard.mutate(cardId)}
            isDeleting={deleteSavedCard.isPending}
          />
        ) : null}
        {!isLoading && (!savedCards || savedCards.length === 0) ? (
          <p className="text-sm text-muted-foreground">You don't have any saved cards yet.</p>
        ) : null}
        <AddCardForm onSubmit={handleAddCard} isSubmitting={addSavedCard.isPending} />
      </CardContent>
    </Card>
  );
}
