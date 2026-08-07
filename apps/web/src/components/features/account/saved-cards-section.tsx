"use client";

import { useState } from "react";
import { CreditCard } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { SavedCardsList } from "@/components/features/account/saved-cards-list";
import { AddCardForm } from "@/components/features/account/add-card-form";
import { EditSavedCardForm } from "@/components/features/account/edit-saved-card-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useSavedCards,
  useAddSavedCard,
  useDeleteSavedCard,
  useSetDefaultSavedCard,
  useUpdateSavedCard,
} from "@/hooks/use-payment-cards";
import { detectCardBrand, lastFourDigits } from "@/utils/credit-card";
import type { AddCardFormInput, EditCardFormInput } from "@/schemas/payment.schema";
import type { SavedCard } from "@/types/payment-card";

/** "Saved cards" section for the account settings page — lists saved
 * cards with the option to remove them, and lets the user add a new one.
 * Reuses the same hooks (useSavedCards/useAddSavedCard/useDeleteSavedCard)
 * already powering the checkout payment page's saved-card UI. */
export function SavedCardsSection() {
  const { data: savedCards, isLoading, error, refetch } = useSavedCards();
  const addSavedCard = useAddSavedCard();
  const deleteSavedCard = useDeleteSavedCard();
  const updateSavedCard = useUpdateSavedCard();
  const setDefaultSavedCard = useSetDefaultSavedCard();
  const [editingCard, setEditingCard] = useState<SavedCard | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleAddCard = async (values: AddCardFormInput) => {
    await addSavedCard.mutateAsync({
      brand: detectCardBrand(values.cardNumber) ?? "Card",
      lastFour: lastFourDigits(values.cardNumber),
      holderName: values.cardName,
      expiry: values.expiry,
      isDefault: values.isDefault,
    });
  };

  const handleEditCard = async (values: EditCardFormInput) => {
    if (!editingCard) return;
    setActionError(null);
    try {
      await updateSavedCard.mutateAsync({
        cardId: editingCard.id,
        input: { brand: values.brand, holderName: values.cardName, expiry: values.expiry },
      });
      setEditingCard(null);
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : "Could not update the card");
    }
  };

  const handleDelete = async (cardId: string) => {
    if (!window.confirm("Remove this saved card?")) return;
    setActionError(null);
    try {
      await deleteSavedCard.mutateAsync(cardId);
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : "Could not remove the card");
    }
  };

  const handleSetDefault = async (cardId: string) => {
    setActionError(null);
    try {
      await setDefaultSavedCard.mutateAsync(cardId);
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : "Could not define the default card");
    }
  };

  return (
    <>
    <Card data-testid="saved-cards-section">
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
        {error ? (
          <div className="flex items-center justify-between gap-3 rounded-md border border-destructive/30 p-3 text-sm text-destructive">
            <span>We couldn&apos;t load your saved cards.</span>
            <button type="button" className="underline" onClick={() => void refetch()}>Try again</button>
          </div>
        ) : null}
        {!isLoading && savedCards && savedCards.length > 0 ? (
          <SavedCardsList
            cards={savedCards}
            onDelete={(cardId) => void handleDelete(cardId)}
            onEdit={setEditingCard}
            onSetDefault={(cardId) => void handleSetDefault(cardId)}
            isDeleting={deleteSavedCard.isPending}
            busyCardId={deleteSavedCard.variables ?? setDefaultSavedCard.variables ?? null}
          />
        ) : null}
        {!isLoading && (!savedCards || savedCards.length === 0) ? (
          <p className="text-sm text-muted-foreground">You don&apos;t have any saved cards yet.</p>
        ) : null}
        <AddCardForm onSubmit={handleAddCard} isSubmitting={addSavedCard.isPending} />
        {addSavedCard.isError || actionError ? (
          <p data-testid="saved-card-error" className="text-sm text-destructive" role="alert">
            {actionError ??
              (addSavedCard.error instanceof Error
                ? addSavedCard.error.message
                : "Could not save the card")}
          </p>
        ) : null}
      </CardContent>
    </Card>
      <Dialog open={Boolean(editingCard)} onOpenChange={(open) => !open && setEditingCard(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit saved card</DialogTitle>
            <DialogDescription>
              Only safe card metadata is stored. Card number and CVV are never persisted.
            </DialogDescription>
          </DialogHeader>
          {editingCard ? (
            <EditSavedCardForm
              card={editingCard}
              isSubmitting={updateSavedCard.isPending}
              onCancel={() => setEditingCard(null)}
              onSubmit={handleEditCard}
            />
          ) : null}
          {actionError ? <p className="mt-3 text-sm text-destructive" role="alert">{actionError}</p> : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
