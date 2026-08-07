"use client";

import { Check, MapPin, Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SavedAddress } from "@/types/saved-address";

interface SavedAddressesListProps {
  addresses: SavedAddress[];
  selectedAddressId?: string | null;
  busyAddressId?: string | null;
  onSelect?: (addressId: string) => void;
  onEdit?: (address: SavedAddress) => void;
  onDelete?: (addressId: string) => void;
  onSetDefault?: (addressId: string) => void;
}

export function SavedAddressesList({
  addresses,
  selectedAddressId,
  busyAddressId,
  onSelect,
  onEdit,
  onDelete,
  onSetDefault,
}: SavedAddressesListProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {addresses.map((address) => {
        const selected = selectedAddressId === address.id;
        return (
          <article
            data-testid="saved-address-card"
            data-address-id={address.id}
            key={address.id}
            className={`flex min-w-0 flex-col gap-3 rounded-lg border p-4 ${
              selected ? "border-primary ring-1 ring-primary" : "border-border"
            }`}
          >
            <button
              data-testid="saved-address-option"
              type="button"
              disabled={!onSelect}
              onClick={() => onSelect?.(address.id)}
              className="flex min-w-0 items-start gap-3 text-left disabled:cursor-default"
            >
              <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2 font-medium">
                  {address.label}
                  {address.isDefault ? <Badge>Default</Badge> : null}
                  {selected ? (
                    <Badge variant="outline" className="gap-1">
                      <Check className="size-3" /> Selected
                    </Badge>
                  ) : null}
                </span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  {address.recipient}
                  <br />
                  {address.street}, {address.number}
                  {address.complement ? `, ${address.complement}` : ""}
                  <br />
                  {address.neighborhood}, {address.city}/{address.state} · {address.zip}
                </span>
              </span>
            </button>

            {onEdit || onDelete || onSetDefault ? (
              <div className="flex flex-wrap gap-2 border-t border-border pt-3">
                {onSetDefault && !address.isDefault ? (
                  <Button
                    data-testid="set-default-address-btn"
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={busyAddressId === address.id}
                    onClick={() => onSetDefault(address.id)}
                  >
                    Set as default
                  </Button>
                ) : null}
                {onEdit ? (
                  <Button
                    data-testid="edit-address-btn"
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => onEdit(address)}
                  >
                    <Pencil /> Edit
                  </Button>
                ) : null}
                {onDelete ? (
                  <Button
                    data-testid="delete-address-btn"
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={busyAddressId === address.id}
                    onClick={() => onDelete(address.id)}
                  >
                    <Trash2 /> Remove
                  </Button>
                ) : null}
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
