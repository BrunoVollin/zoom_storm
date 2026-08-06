"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { profileFormSchema, type ProfileFormValues } from "@/schemas/profile.schema";
import { cepService } from "@/services/cep-service";
import type { UpdateProfileInput, UserProfile } from "@/types/profile";

interface ProfileFormProps {
  initialProfile: UserProfile | null;
  onSubmit: (input: UpdateProfileInput) => Promise<unknown>;
}

function toDefaultValues(profile: UserProfile | null): Partial<ProfileFormValues> {
  if (!profile) return {};

  return {
    fullName: profile.fullName,
    document: profile.document,
    street: profile.address.street,
    number: profile.address.number,
    complement: profile.address.complement ?? "",
    neighborhood: profile.address.neighborhood,
    city: profile.address.city,
    state: profile.address.state,
    zip: profile.address.zip,
  };
}

export function ProfileForm({ initialProfile, onSubmit }: ProfileFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: toDefaultValues(initialProfile),
  });

  const [cepError, setCepError] = useState<string | null>(null);

  const lookupCep = useMutation({
    mutationFn: () => cepService.lookup(getValues("zip")),
    onSuccess: (address) => {
      if (!address) {
        setCepError("Zip code not found");
        return;
      }

      setCepError(null);
      if (address.street) setValue("street", address.street);
      if (address.neighborhood) setValue("neighborhood", address.neighborhood);
      setValue("city", address.city);
      setValue("state", address.state);
    },
    onError: () => setCepError("Could not look up the zip code"),
  });

  const submit = handleSubmit(async (values) => {
    setSubmitError(null);
    setSaved(false);

    try {
      await onSubmit({
        fullName: values.fullName,
        document: values.document,
        address: {
          street: values.street,
          number: values.number,
          complement: values.complement || null,
          neighborhood: values.neighborhood,
          city: values.city,
          state: values.state,
          zip: values.zip,
        },
      });
      setSaved(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "We couldn't save your data.";
      setSubmitError(message);
    }
  });

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" {...register("fullName")} />
          {errors.fullName ? (
            <p className="text-sm text-destructive">{errors.fullName.message}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="document">Tax ID</Label>
          <Input id="document" {...register("document")} />
          {errors.document ? (
            <p className="text-sm text-destructive">{errors.document.message}</p>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 flex flex-col gap-1.5">
          <Label htmlFor="street">Street</Label>
          <Input id="street" {...register("street")} />
          {errors.street ? <p className="text-sm text-destructive">{errors.street.message}</p> : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="number">Number</Label>
          <Input id="number" {...register("number")} />
          {errors.number ? <p className="text-sm text-destructive">{errors.number.message}</p> : null}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="complement">Complement</Label>
          <Input id="complement" {...register("complement")} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="neighborhood">Neighborhood</Label>
          <Input id="neighborhood" {...register("neighborhood")} />
          {errors.neighborhood ? (
            <p className="text-sm text-destructive">{errors.neighborhood.message}</p>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="city">City</Label>
          <Input id="city" {...register("city")} />
          {errors.city ? <p className="text-sm text-destructive">{errors.city.message}</p> : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="state">State</Label>
          <Input id="state" maxLength={2} {...register("state")} />
          {errors.state ? <p className="text-sm text-destructive">{errors.state.message}</p> : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="zip">Zip code</Label>
          <div className="flex gap-2">
            <Input id="zip" placeholder="00000-000" {...register("zip")} />
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Look up zip code"
              disabled={lookupCep.isPending}
              onClick={() => lookupCep.mutate()}
            >
              {lookupCep.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Search className="size-4" />
              )}
            </Button>
          </div>
          {errors.zip ? <p className="text-sm text-destructive">{errors.zip.message}</p> : null}
          {cepError ? <p className="text-sm text-destructive">{cepError}</p> : null}
        </div>
      </div>

      {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}
      {saved ? <p className="text-sm text-emerald-600">Data saved successfully.</p> : null}

      <Button type="submit" disabled={isSubmitting} className="w-fit">
        {isSubmitting ? "Saving..." : "Save changes"}
      </Button>
    </form>
  );
}
