"use client";

import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { SavedCard } from "@/types/payment-card";

interface SavedCardsListProps {
  cards: SavedCard[];
  onDelete: (cardId: string) => void;
  isDeleting?: boolean;
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
}: SavedCardsListProps) {
  if (cards.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {cards.map((card) => (
        <div key={card.id} className="flex items-center gap-2">
          {onSelect ? (
            <button
              data-testid="saved-card-option"
              type="button"
              onClick={() => onSelect(card.id)}
              className={`flex flex-1 items-center justify-between rounded-md border px-3 py-2 text-left text-sm ${
                selectedCardId === card.id ? "border-primary" : "border-border"
              }`}
            >
              <span>
                {card.brand} •••• {card.lastFour}
              </span>
              <span className="text-muted-foreground">{card.expiry}</span>
            </button>
          ) : (
            <div className="flex flex-1 items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
              <span>
                {card.brand} •••• {card.lastFour}
              </span>
              <span className="text-muted-foreground">{card.expiry}</span>
            </div>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Remove card ending in ${card.lastFour}`}
            disabled={isDeleting}
            onClick={() => onDelete(card.id)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
