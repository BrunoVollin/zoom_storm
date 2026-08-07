"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Search } from "lucide-react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  savedAddressFormSchema,
  type SavedAddressFormInput,
} from "@/schemas/saved-address.schema";
import { cepService } from "@/services/cep-service";

interface SavedAddressFormProps {
  defaultValues?: Partial<SavedAddressFormInput>;
  isSubmitting?: boolean;
  onCancel: () => void;
  onSubmit: (values: SavedAddressFormInput) => Promise<void>;
}

export function SavedAddressForm({
  defaultValues,
  isSubmitting = false,
  onCancel,
  onSubmit,
}: SavedAddressFormProps) {
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<SavedAddressFormInput>({
    resolver: zodResolver(savedAddressFormSchema),
    defaultValues: { isDefault: false, ...defaultValues },
  });

  const lookupZip = async () => {
    setLookupError(null);
    setIsLookingUp(true);
    try {
      const address = await cepService.lookup(getValues("zip"));
      if (!address) {
        setLookupError("Zip code not found");
        return;
      }
      if (address.street) setValue("street", address.street, { shouldValidate: true });
      if (address.neighborhood) {
        setValue("neighborhood", address.neighborhood, { shouldValidate: true });
      }
      setValue("city", address.city, { shouldValidate: true });
      setValue("state", address.state, { shouldValidate: true });
    } catch {
      setLookupError("Could not look up the zip code");
    } finally {
      setIsLookingUp(false);
    }
  };

  const fieldError = (message?: string) =>
    message ? <p className="text-xs text-destructive">{message}</p> : null;

  return (
    <form
      data-testid="saved-address-form"
      className="flex max-h-[75vh] flex-col gap-4 overflow-y-auto pr-1"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="address-label">Label</Label>
          <Input data-testid="address-label" id="address-label" placeholder="Home" {...register("label")} />
          {fieldError(errors.label?.message)}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="address-recipient">Recipient</Label>
          <Input data-testid="address-recipient" id="address-recipient" {...register("recipient")} />
          {fieldError(errors.recipient?.message)}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="address-zip">Zip code</Label>
        <div className="flex gap-2">
          <Input data-testid="address-zip" id="address-zip" placeholder="00000-000" {...register("zip")} />
          <Button
            data-testid="address-zip-lookup"
            type="button"
            variant="outline"
            size="icon"
            aria-label="Look up zip code"
            disabled={isLookingUp}
            onClick={lookupZip}
          >
            {isLookingUp ? <Loader2 className="animate-spin" /> : <Search />}
          </Button>
        </div>
        {fieldError(errors.zip?.message ?? lookupError ?? undefined)}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(7rem,1fr)]">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="address-street">Street</Label>
          <Input data-testid="address-street" id="address-street" {...register("street")} />
          {fieldError(errors.street?.message)}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="address-number">Number</Label>
          <Input data-testid="address-number" id="address-number" {...register("number")} />
          {fieldError(errors.number?.message)}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="address-complement">Complement</Label>
          <Input data-testid="address-complement" id="address-complement" {...register("complement")} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="address-neighborhood">Neighborhood</Label>
          <Input data-testid="address-neighborhood" id="address-neighborhood" {...register("neighborhood")} />
          {fieldError(errors.neighborhood?.message)}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_6rem]">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="address-city">City</Label>
          <Input data-testid="address-city" id="address-city" {...register("city")} />
          {fieldError(errors.city?.message)}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="address-state">State</Label>
          <Input data-testid="address-state" id="address-state" maxLength={2} {...register("state")} />
          {fieldError(errors.state?.message)}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          data-testid="address-is-default"
          type="checkbox"
          className="size-4 rounded border-border"
          {...register("isDefault")}
        />
        Use as default shipping address
      </label>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button data-testid="save-address-btn" type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="animate-spin" /> : "Save address"}
        </Button>
      </div>
    </form>
  );
}
