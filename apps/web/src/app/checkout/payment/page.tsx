"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { CreditCard, Loader2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { PriceTag } from "@/components/shared/price-tag";
import { ROUTES } from "@/constants/routes";
import { useOrder, usePayOrder } from "@/hooks/use-orders";
import { useSavedCards, useAddSavedCard, useDeleteSavedCard } from "@/hooks/use-payment-cards";
import { calculateInstallments } from "@/utils/installments";
import { detectCardBrand, lastFourDigits } from "@/utils/credit-card";
import {
  paymentFormSchema,
  savedCardPaymentFormSchema,
  type PaymentFormInput,
  type SavedCardPaymentFormInput,
} from "@/schemas/payment.schema";
import { formatPrice } from "@/utils/format-price";

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") ?? "";

  const { data: order, isLoading, error } = useOrder(orderId);
  const payOrder = usePayOrder(orderId);
  const { data: savedCards } = useSavedCards();
  const addSavedCard = useAddSavedCard();
  const deleteSavedCard = useDeleteSavedCard();

  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [saveCard, setSaveCard] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PaymentFormInput>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: { installments: 1 },
  });

  const {
    register: registerSavedCard,
    handleSubmit: handleSavedCardSubmit,
    formState: { errors: savedCardErrors },
  } = useForm<SavedCardPaymentFormInput>({
    resolver: zodResolver(savedCardPaymentFormSchema),
    defaultValues: { installments: 1 },
  });

  if (!orderId) {
    return <ErrorState title="Pedido não informado" />;
  }

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error || !order) {
    return <ErrorState title="Pedido não encontrado" />;
  }

  if (order.status !== "CREATED") {
    return (
      <div className="mx-auto max-w-md text-center">
        <p className="text-lg font-medium">Este pedido já foi pago.</p>
        <Button className="mt-4" onClick={() => router.push(ROUTES.order(order.id))}>
          Ver pedido
        </Button>
      </div>
    );
  }

  const installmentOptions = calculateInstallments(order.total);

  const submitNewCard = handleSubmit(async (values) => {
    await payOrder.mutateAsync(values.installments, {
      onSuccess: () => {
        if (saveCard) {
          addSavedCard.mutate({
            brand: detectCardBrand(values.cardNumber) ?? "Cartão",
            lastFour: lastFourDigits(values.cardNumber),
            holderName: values.cardName,
            expiry: values.expiry,
          });
        }
        router.push(ROUTES.order(order.id));
      },
    });
  });

  const submitSavedCard = handleSavedCardSubmit(async (values) => {
    await payOrder.mutateAsync(values.installments, {
      onSuccess: () => router.push(ROUTES.order(order.id)),
    });
  });

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Pagamento</h1>
        <p className="text-sm text-muted-foreground">
          Pedido no valor de <PriceTag cents={order.total} />
        </p>
      </div>

      {savedCards && savedCards.length > 0 ? (
        <div className="flex flex-col gap-2 rounded-lg border border-border p-4">
          <p className="text-sm font-medium">Cartões salvos</p>
          {savedCards.map((card) => (
            <div key={card.id} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedCardId(card.id)}
                className={`flex flex-1 items-center justify-between rounded-md border px-3 py-2 text-left text-sm ${
                  selectedCardId === card.id ? "border-primary" : "border-border"
                }`}
              >
                <span>
                  {card.brand} •••• {card.lastFour}
                </span>
                <span className="text-muted-foreground">{card.expiry}</span>
              </button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Remover cartão terminado em ${card.lastFour}`}
                disabled={deleteSavedCard.isPending}
                onClick={() => {
                  deleteSavedCard.mutate(card.id);
                  if (selectedCardId === card.id) setSelectedCardId(null);
                }}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setSelectedCardId(null)}
            className={`rounded-md border px-3 py-2 text-left text-sm ${
              selectedCardId === null ? "border-primary" : "border-border"
            }`}
          >
            Novo cartão
          </button>
        </div>
      ) : null}

      {selectedCardId ? (
        <form
          onSubmit={submitSavedCard}
          className="flex flex-col gap-4 rounded-lg border border-border p-4"
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CreditCard className="size-4" />
            Cartão de crédito (simulado — nenhuma cobrança real é feita)
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cvv">CVV</Label>
            <Input
              id="cvv"
              inputMode="numeric"
              placeholder="123"
              {...registerSavedCard("cvv")}
            />
            {savedCardErrors.cvv ? (
              <p className="text-sm text-destructive">{savedCardErrors.cvv.message}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="installments">Parcelas</Label>
            <Select id="installments" {...registerSavedCard("installments")}>
              {installmentOptions.map((option) => (
                <option key={option.count} value={option.count}>
                  {option.count}x de {formatPrice(option.valueCents)} sem juros
                </option>
              ))}
            </Select>
          </div>

          {payOrder.isError ? (
            <p className="text-sm text-destructive">
              {payOrder.error instanceof Error ? payOrder.error.message : "Não foi possível pagar"}
            </p>
          ) : null}

          <Button type="submit" size="lg" disabled={payOrder.isPending}>
            {payOrder.isPending ? <Loader2 className="animate-spin" /> : "Confirmar pagamento"}
          </Button>
        </form>
      ) : (
        <form
          onSubmit={submitNewCard}
          className="flex flex-col gap-4 rounded-lg border border-border p-4"
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CreditCard className="size-4" />
            Cartão de crédito (simulado — nenhuma cobrança real é feita)
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cardNumber">Número do cartão</Label>
            <Input
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
            <Label htmlFor="cardName">Nome no cartão</Label>
            <Input id="cardName" placeholder="Como impresso no cartão" {...register("cardName")} />
            {errors.cardName ? (
              <p className="text-sm text-destructive">{errors.cardName.message}</p>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="expiry">Validade (MM/AA)</Label>
              <Input id="expiry" placeholder="12/28" {...register("expiry")} />
              {errors.expiry ? (
                <p className="text-sm text-destructive">{errors.expiry.message}</p>
              ) : null}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cvv">CVV</Label>
              <Input id="cvv" inputMode="numeric" placeholder="123" {...register("cvv")} />
              {errors.cvv ? <p className="text-sm text-destructive">{errors.cvv.message}</p> : null}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="installments">Parcelas</Label>
            <Select id="installments" {...register("installments")}>
              {installmentOptions.map((option) => (
                <option key={option.count} value={option.count}>
                  {option.count}x de {formatPrice(option.valueCents)} sem juros
                </option>
              ))}
            </Select>
          </div>

          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={saveCard}
              onChange={(event) => setSaveCard(event.target.checked)}
              className="size-4 rounded border-border"
            />
            Salvar cartão para próximas compras
          </label>

          {payOrder.isError ? (
            <p className="text-sm text-destructive">
              {payOrder.error instanceof Error ? payOrder.error.message : "Não foi possível pagar"}
            </p>
          ) : null}

          <Button type="submit" size="lg" disabled={payOrder.isPending}>
            {payOrder.isPending ? <Loader2 className="animate-spin" /> : "Confirmar pagamento"}
          </Button>
        </form>
      )}
    </div>
  );
}
