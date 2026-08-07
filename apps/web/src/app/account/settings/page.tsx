"use client";

import Link from "next/link";
import { Gift } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { ErrorState } from "@/components/shared/error-state";
import { PriceTag } from "@/components/shared/price-tag";
import { PersonalDataForm } from "@/components/features/account/personal-data-form";
import { SavedAddressesSection } from "@/components/features/account/saved-addresses-section";
import { SavedCardsSection } from "@/components/features/account/saved-cards-section";
import { useProfile, useUpdateProfile } from "@/hooks/use-profile";
import { useLoyaltyBalance } from "@/hooks/use-loyalty";
import { useSavedAddresses } from "@/hooks/use-saved-addresses";
import { useAuth } from "@/providers/auth-provider";
import { ROUTES } from "@/constants/routes";

const CENTS_PER_POINT = 100;

export default function AccountSettingsPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { data: profile, isLoading, error } = useProfile();
  const updateProfile = useUpdateProfile();
  const { data: savedAddresses } = useSavedAddresses();
  const { data: loyaltyBalance, isLoading: isLoyaltyLoading } = useLoyaltyBalance();

  if (isAuthLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return (
      <ErrorState
        title="Sign in to access"
        message="You need to be signed in to view your account settings."
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Account settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your personal data, shipping addresses, payment cards and available credit.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal data</CardTitle>
          <CardDescription>
            Used to identify your orders. Shipping addresses are managed separately below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? <LoadingSpinner /> : null}
          {error ? (
            <ErrorState
              title="We couldn't load your data"
              message="Please try again in a moment."
            />
          ) : null}
          {!isLoading && !error ? (
            <PersonalDataForm
              initialValues={
                profile
                  ? { fullName: profile.fullName, document: profile.document }
                  : undefined
              }
              onSubmit={(input) => {
                const address = profile?.address ?? savedAddresses?.find((item) => item.isDefault) ?? savedAddresses?.[0];
                if (!address) {
                  throw new Error("Add a shipping address before saving your personal data.");
                }
                return updateProfile.mutateAsync({
                  ...input,
                  address: {
                    street: address.street,
                    number: address.number,
                    complement: address.complement,
                    neighborhood: address.neighborhood,
                    city: address.city,
                    state: address.state,
                    zip: address.zip,
                  },
                });
              }}
            />
          ) : null}
        </CardContent>
      </Card>

      <SavedAddressesSection />

      <SavedCardsSection />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="size-4" />
            Loyalty credit
          </CardTitle>
          <CardDescription>
            Points earned on your purchases — 1 point equals $1.00 in discount.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {isLoyaltyLoading ? (
            <LoadingSpinner />
          ) : (
            <>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-semibold tabular-nums">
                  {loyaltyBalance ?? 0} pts
                </span>
                <span className="text-sm text-muted-foreground">
                  (<PriceTag cents={(loyaltyBalance ?? 0) * CENTS_PER_POINT} /> available to use)
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Redeem your points as a discount directly in the{" "}
                <Link href={ROUTES.cart} className="underline hover:text-foreground">
                  cart
                </Link>
                .
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
