"use client";

import Link from "next/link";
import { Gift } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { ErrorState } from "@/components/shared/error-state";
import { PriceTag } from "@/components/shared/price-tag";
import { ProfileForm } from "@/components/features/account/profile-form";
import { SavedCardsSection } from "@/components/features/account/saved-cards-section";
import { useProfile, useUpdateProfile } from "@/hooks/use-profile";
import { useLoyaltyBalance } from "@/hooks/use-loyalty";
import { useAuth } from "@/providers/auth-provider";
import { ROUTES } from "@/constants/routes";

const CENTS_PER_POINT = 100;

export default function AccountSettingsPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { data: profile, isLoading, error } = useProfile();
  const updateProfile = useUpdateProfile();
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
          Your personal data, shipping address and available credit.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal data and address</CardTitle>
          <CardDescription>
            Used to identify your orders and calculate shipping costs.
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
            <ProfileForm
              initialProfile={profile ?? null}
              onSubmit={(input) => updateProfile.mutateAsync(input)}
            />
          ) : null}
        </CardContent>
      </Card>

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
