"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const personalDataSchema = z.object({
  fullName: z.string().trim().min(1, "Enter your full name"),
  document: z.string().refine((value) => {
    const digits = value.replace(/\D/g, "");
    return digits.length === 11 || digits.length === 14;
  }, "Document must have 11 (CPF) or 14 (CNPJ) digits"),
});

type PersonalDataInput = z.infer<typeof personalDataSchema>;

interface PersonalDataFormProps {
  initialValues?: PersonalDataInput;
  onSubmit: (values: PersonalDataInput) => Promise<unknown>;
}

export function PersonalDataForm({ initialValues, onSubmit }: PersonalDataFormProps) {
  const [saved, setSaved] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PersonalDataInput>({
    resolver: zodResolver(personalDataSchema),
    defaultValues: initialValues,
  });

  useEffect(() => {
    if (initialValues) reset(initialValues);
  }, [initialValues, reset]);

  const submit = handleSubmit(async (values) => {
    setSaved(false);
    setSubmitError(null);
    try {
      await onSubmit(values);
      setSaved(true);
    } catch (caught) {
      setSubmitError(caught instanceof Error ? caught.message : "We couldn't save your data.");
    }
  });

  return (
    <form data-testid="personal-data-form" onSubmit={submit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="personal-full-name">Full name</Label>
          <Input data-testid="personal-full-name" id="personal-full-name" {...register("fullName")} />
          {errors.fullName ? <p className="text-sm text-destructive">{errors.fullName.message}</p> : null}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="personal-document">Tax ID</Label>
          <Input data-testid="personal-document" id="personal-document" {...register("document")} />
          {errors.document ? <p className="text-sm text-destructive">{errors.document.message}</p> : null}
        </div>
      </div>
      {submitError ? <p className="text-sm text-destructive" role="alert">{submitError}</p> : null}
      {saved ? <p className="text-sm text-emerald-600">Data saved successfully.</p> : null}
      <Button data-testid="save-personal-data-btn" type="submit" disabled={isSubmitting} className="w-fit">
        {isSubmitting ? <Loader2 className="animate-spin" /> : "Save personal data"}
      </Button>
    </form>
  );
}
