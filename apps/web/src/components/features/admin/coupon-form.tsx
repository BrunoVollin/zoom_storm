"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { CouponFormSchema, type CouponFormValues } from "@/schemas/coupon.schema";
import type { AdminCoupon, CouponWriteInput } from "@/types/coupon";

interface CouponFormProps {
  initialCoupon?: AdminCoupon;
  onSubmit: (input: CouponWriteInput) => Promise<unknown>;
  submitLabel: string;
}

function toDatetimeLocal(iso?: string): string {
  if (!iso) return "";
  return iso.slice(0, 16);
}

function toDefaultValues(coupon?: AdminCoupon): Partial<CouponFormValues> {
  if (!coupon) {
    return { type: "PERCENT" };
  }

  return {
    name: coupon.name,
    type: coupon.type,
    percent: coupon.percent !== undefined ? Math.round(coupon.percent * 10000) / 100 : undefined,
    amount: coupon.amount !== undefined ? coupon.amount / 100 : undefined,
    start: toDatetimeLocal(coupon.start),
    end: toDatetimeLocal(coupon.end),
  };
}

export function CouponForm({ initialCoupon, onSubmit, submitLabel }: CouponFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CouponFormValues>({
    resolver: zodResolver(CouponFormSchema),
    defaultValues: toDefaultValues(initialCoupon),
  });

  const type = watch("type");

  const submit = handleSubmit(async (values) => {
    setSubmitError(null);

    try {
      const input: CouponWriteInput = {
        name: values.name,
        type: values.type,
        start: new Date(values.start).toISOString(),
        end: new Date(values.end).toISOString(),
        percent: values.type === "PERCENT" ? values.percent! / 100 : undefined,
        amount: values.type === "FIXED" ? Math.round(values.amount! * 100) : undefined,
      };

      await onSubmit(input);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível salvar o cupom.";
      setSubmitError(message);
    }
  });

  return (
    <form onSubmit={submit} className="flex max-w-xl flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" {...register("name")} />
        {errors.name ? <p className="text-sm text-destructive">{errors.name.message}</p> : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="type">Tipo</Label>
        <Select id="type" {...register("type")}>
          <option value="PERCENT">Percentual</option>
          <option value="FIXED">Valor fixo</option>
        </Select>
        {errors.type ? <p className="text-sm text-destructive">{errors.type.message}</p> : null}
      </div>

      {type === "FIXED" ? (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="amount">Valor (R$)</Label>
          <Input id="amount" type="number" step="0.01" min="0" {...register("amount")} />
          {errors.amount ? (
            <p className="text-sm text-destructive">{errors.amount.message}</p>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="percent">Percentual (%)</Label>
          <Input id="percent" type="number" step="0.01" min="0" max="100" {...register("percent")} />
          {errors.percent ? (
            <p className="text-sm text-destructive">{errors.percent.message}</p>
          ) : null}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="start">Início</Label>
          <Input id="start" type="datetime-local" {...register("start")} />
          {errors.start ? <p className="text-sm text-destructive">{errors.start.message}</p> : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="end">Término</Label>
          <Input id="end" type="datetime-local" {...register("end")} />
          {errors.end ? <p className="text-sm text-destructive">{errors.end.message}</p> : null}
        </div>
      </div>

      {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}

      <Button type="submit" disabled={isSubmitting} className="w-fit">
        {isSubmitting ? "Salvando..." : submitLabel}
      </Button>
    </form>
  );
}
