"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FillTestCardButton } from "@/components/features/account/fill-test-card-button";
import { addCardFormSchema, type AddCardFormInput } from "@/schemas/payment.schema";

interface AddCardFormProps {
  onSubmit: (values: AddCardFormInput) => void | Promise<void>;
  isSubmitting?: boolean;
  submitLabel?: string;
}

/** Standalone "add a new card" form — used by the account settings page to
 * save a card outside of a payment flow (no CVV/installments involved). */
export function AddCardForm({ onSubmit, isSubmitting = false, submitLabel = "Save card" }: AddCardFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<AddCardFormInput>({
    resolver: zodResolver(addCardFormSchema),
    defaultValues: { isDefault: false },
  });

  const submit = handleSubmit(async (values) => {
    await onSubmit(values);
    reset();
  });

  return (
    <form
      data-testid="add-card-form"
      onSubmit={submit}
      className="flex flex-col gap-4 rounded-lg border border-border p-4"
    >
      <FillTestCardButton
        onFill={(data) => {
          setValue("cardNumber", data.cardNumber, { shouldValidate: true });
          setValue("cardName", data.cardName, { shouldValidate: true });
          setValue("expiry", data.expiry, { shouldValidate: true });
        }}
      />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cardNumber">Card number</Label>
        <Input
          data-testid="card-number"
          id="cardNumber"
          inputMode="numeric"
          placeholder="0000 0000 0000 0000"
          {...register("cardNumber")}
        />
        {errors.cardNumber ? (
          <p className="text-sm text-destructive">{errors.cardNumber.message}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cardName">Name on card</Label>
        <Input data-testid="card-name" id="cardName" placeholder="As printed on the card" {...register("cardName")} />
        {errors.cardName ? (
          <p className="text-sm text-destructive">{errors.cardName.message}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="expiry">Expiry (MM/YY)</Label>
        <Input data-testid="card-expiry" id="expiry" placeholder="12/28" {...register("expiry")} />
        {errors.expiry ? <p className="text-sm text-destructive">{errors.expiry.message}</p> : null}
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          data-testid="card-is-default"
          type="checkbox"
          className="size-4 rounded border-border"
          {...register("isDefault")}
        />
        Use as default payment card
      </label>

      <Button data-testid="save-card-btn" type="submit" disabled={isSubmitting} className="w-fit">
        {isSubmitting ? <Loader2 className="animate-spin" /> : submitLabel}
      </Button>
    </form>
  );
}
