"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { CreditCard, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { PriceTag } from "@/components/shared/price-tag";
import { SavedCardsList } from "@/components/features/account/saved-cards-list";
import { FillTestCardButton } from "@/components/features/account/fill-test-card-button";
import { ROUTES } from "@/constants/routes";
import { useOrder, usePayOrder } from "@/hooks/use-orders";
import { useSavedCards } from "@/hooks/use-payment-cards";
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

  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [saveCard, setSaveCard] = useState(false);
  const initializedSavedCard = useRef(false);

  useEffect(() => {
    if (!savedCards || initializedSavedCard.current) return;
    initializedSavedCard.current = true;
    setSelectedCardId(savedCards.find((card) => card.isDefault)?.id ?? null);
  }, [savedCards]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<PaymentFormInput>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: { installments: 1 },
  });

  const { register: registerSavedCard, handleSubmit: handleSavedCardSubmit } =
    useForm<SavedCardPaymentFormInput>({
      resolver: zodResolver(savedCardPaymentFormSchema),
      defaultValues: { installments: 1 },
    });

  if (!orderId) {
    return <ErrorState title="No order specified" />;
  }

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error || !order) {
    return <ErrorState title="Order not found" />;
  }

  if (order.status !== "CREATED") {
    return (
      <div className="mx-auto max-w-md text-center">
        <p className="text-lg font-medium">This order has already been paid.</p>
        <Button className="mt-4" onClick={() => router.push(ROUTES.order(order.id))}>
          View order
        </Button>
      </div>
    );
  }

  const installmentOptions = calculateInstallments(order.total);

  const submitNewCard = handleSubmit(async (values) => {
    await payOrder.mutateAsync({
      installments: values.installments,
      paymentMethod: {
        type: "NEW_CARD",
        token: `sim_${crypto.randomUUID()}`,
        brand: detectCardBrand(values.cardNumber) ?? "Card",
        lastFour: lastFourDigits(values.cardNumber),
        holderName: values.cardName,
        expiry: values.expiry,
        saveCard,
      },
    }, {
      onSuccess: () => {
        router.push(ROUTES.order(order.id));
      },
    });
  });

  const submitSavedCard = handleSavedCardSubmit(async (values) => {
    if (!selectedCardId) return;
    await payOrder.mutateAsync({
      installments: values.installments,
      paymentMethod: { type: "SAVED_CARD", savedCardId: selectedCardId },
    }, {
      onSuccess: () => router.push(ROUTES.order(order.id)),
    });
  });

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Payment</h1>
        <p className="text-sm text-muted-foreground">
          Order total of <PriceTag cents={order.total} />
        </p>
      </div>

      {savedCards && savedCards.length > 0 ? (
        <div className="flex flex-col gap-2 rounded-lg border border-border p-4">
          <p className="text-sm font-medium">Saved cards</p>
          <SavedCardsList
            cards={savedCards}
            selectedCardId={selectedCardId}
            onSelect={setSelectedCardId}
          />
          <button
            data-testid="new-card-option"
            type="button"
            onClick={() => setSelectedCardId(null)}
            className={`rounded-md border px-3 py-2 text-left text-sm ${
              selectedCardId === null ? "border-primary" : "border-border"
            }`}
          >
            New card
          </button>
        </div>
      ) : null}

      {selectedCardId ? (
        <form
          data-testid="saved-card-payment-form"
          onSubmit={submitSavedCard}
          className="flex flex-col gap-4 rounded-lg border border-border p-4"
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CreditCard className="size-4" />
            Credit card (simulated — no real charge is made)
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="saved-card-installments">Installments</Label>
            <Select
              data-testid="saved-card-installments"
              id="saved-card-installments"
              {...registerSavedCard("installments")}
            >
              {installmentOptions.map((option) => (
                <option key={option.count} value={option.count}>
                  {option.count}x of {formatPrice(option.valueCents)} interest-free
                </option>
              ))}
            </Select>
          </div>

          {payOrder.isError ? (
            <p className="text-sm text-destructive">
              {payOrder.error instanceof Error
                ? payOrder.error.message
                : "Could not process payment"}
            </p>
          ) : null}

          <Button
            data-testid="payment-submit-btn"
            type="submit"
            size="lg"
            disabled={payOrder.isPending}
          >
            {payOrder.isPending ? <Loader2 className="animate-spin" /> : "Confirm payment"}
          </Button>
        </form>
      ) : (
        <form
          data-testid="new-card-payment-form"
          onSubmit={submitNewCard}
          className="flex flex-col gap-4 rounded-lg border border-border p-4"
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CreditCard className="size-4" />
            Credit card (simulated — no real charge is made)
          </div>

          <FillTestCardButton
            onFill={(data) => {
              setValue("cardNumber", data.cardNumber, { shouldValidate: true });
              setValue("cardName", data.cardName, { shouldValidate: true });
              setValue("expiry", data.expiry, { shouldValidate: true });
              setValue("cvv", data.cvv, { shouldValidate: true });
            }}
          />

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cardNumber">Card number</Label>
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
            <Label htmlFor="cardName">Name on card</Label>
            <Input id="cardName" placeholder="As printed on the card" {...register("cardName")} />
            {errors.cardName ? (
              <p className="text-sm text-destructive">{errors.cardName.message}</p>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="expiry">Expiry (MM/YY)</Label>
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
            <Label htmlFor="installments">Installments</Label>
            <Select id="installments" {...register("installments")}>
              {installmentOptions.map((option) => (
                <option key={option.count} value={option.count}>
                  {option.count}x of {formatPrice(option.valueCents)} interest-free
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
            Save card for future purchases
          </label>

          {payOrder.isError ? (
            <p className="text-sm text-destructive">
              {payOrder.error instanceof Error
                ? payOrder.error.message
                : "Could not process payment"}
            </p>
          ) : null}

          <Button
            data-testid="payment-submit-btn"
            type="submit"
            size="lg"
            disabled={payOrder.isPending}
          >
            {payOrder.isPending ? <Loader2 className="animate-spin" /> : "Confirm payment"}
          </Button>
        </form>
      )}
    </div>
  );
}
