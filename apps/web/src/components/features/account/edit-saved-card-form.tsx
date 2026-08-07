"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { editCardFormSchema, type EditCardFormInput } from "@/schemas/payment.schema";
import type { SavedCard } from "@/types/payment-card";

interface EditSavedCardFormProps {
  card: SavedCard;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (values: EditCardFormInput) => Promise<void>;
}

export function EditSavedCardForm({ card, isSubmitting, onCancel, onSubmit }: EditSavedCardFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditCardFormInput>({
    resolver: zodResolver(editCardFormSchema),
    defaultValues: { brand: card.brand, cardName: card.holderName, expiry: card.expiry },
  });

  return (
    <form data-testid="edit-card-form" className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
      <p className="text-sm text-muted-foreground">
        Card ending in {card.lastFour}. The card number cannot be changed.
      </p>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="edit-card-brand">Brand</Label>
        <Input data-testid="edit-card-brand" id="edit-card-brand" {...register("brand")} />
        {errors.brand ? <p className="text-sm text-destructive">{errors.brand.message}</p> : null}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="edit-card-name">Name on card</Label>
        <Input data-testid="edit-card-name" id="edit-card-name" {...register("cardName")} />
        {errors.cardName ? <p className="text-sm text-destructive">{errors.cardName.message}</p> : null}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="edit-card-expiry">Expiry (MM/YY)</Label>
        <Input data-testid="edit-card-expiry" id="edit-card-expiry" {...register("expiry")} />
        {errors.expiry ? <p className="text-sm text-destructive">{errors.expiry.message}</p> : null}
      </div>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancel</Button>
        <Button data-testid="update-card-btn" type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="animate-spin" /> : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
