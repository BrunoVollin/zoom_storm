"use client";

import { Check, Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SavedCard } from "@/types/payment-card";

interface SavedCardsListProps {
  cards: SavedCard[];
  onDelete?: (cardId: string) => void;
  onEdit?: (card: SavedCard) => void;
  onSetDefault?: (cardId: string) => void;
  isDeleting?: boolean;
  busyCardId?: string | null;
  /** When provided, cards become selectable (used by checkout to pick which
   * saved card to pay with). Omit for a plain manage-only list (account
   * settings). */
  selectedCardId?: string | null;
  onSelect?: (cardId: string) => void;
}

/** Shared saved-card list + delete UI, reused by the checkout payment page
 * (card selection) and the account settings page (card management). */
export function SavedCardsList({
  cards,
  onDelete,
  isDeleting = false,
  selectedCardId = null,
  onSelect,
  onEdit,
  onSetDefault,
  busyCardId,
}: SavedCardsListProps) {
  if (cards.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {cards.map((card) => (
        <div
          data-testid="saved-card-card"
          data-card-id={card.id}
          key={card.id}
          className="flex flex-col gap-2 rounded-md border border-border p-3 sm:flex-row sm:items-center"
        >
          {onSelect ? (
            <button
              data-testid="saved-card-option"
              data-card-id={card.id}
              type="button"
              onClick={() => onSelect(card.id)}
              className={`flex min-w-0 flex-1 items-center justify-between rounded-md border px-3 py-2 text-left text-sm ${
                selectedCardId === card.id ? "border-primary" : "border-border"
              }`}
            >
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-2 font-medium">
                  {card.brand} •••• {card.lastFour}
                  {card.isDefault ? <Badge>Default</Badge> : null}
                  {selectedCardId === card.id ? <Check className="size-4 text-primary" /> : null}
                </span>
                <span className="block truncate text-muted-foreground">{card.holderName}</span>
              </span>
              <span className="text-muted-foreground">{card.expiry}</span>
            </button>
          ) : (
            <div className="flex min-w-0 flex-1 items-center justify-between gap-3 text-sm">
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-2 font-medium">
                  {card.brand} •••• {card.lastFour}
                  {card.isDefault ? <Badge>Default</Badge> : null}
                </span>
                <span className="block truncate text-muted-foreground">{card.holderName}</span>
              </span>
              <span className="text-muted-foreground">{card.expiry}</span>
            </div>
          )}
          {onSetDefault && !card.isDefault ? (
            <Button
              data-testid="set-default-card-btn"
              type="button"
              variant="outline"
              size="sm"
              disabled={busyCardId === card.id}
              onClick={() => onSetDefault(card.id)}
            >
              Set as default
            </Button>
          ) : null}
          {onEdit ? (
            <Button
              data-testid="edit-card-btn"
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Edit card ending in ${card.lastFour}`}
              onClick={() => onEdit(card)}
            >
              <Pencil />
            </Button>
          ) : null}
          {onDelete ? (
            <Button
              data-testid="delete-card-btn"
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Remove card ending in ${card.lastFour}`}
              disabled={isDeleting && busyCardId === card.id}
              onClick={() => onDelete(card.id)}
            >
              <Trash2 className="size-4" />
            </Button>
          ) : null}
        </div>
      ))}
    </div>
  );
}
