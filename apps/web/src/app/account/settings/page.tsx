"use client";

import Link from "next/link";
import { Gift } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { ErrorState } from "@/components/shared/error-state";
import { PriceTag } from "@/components/shared/price-tag";
import { ProfileForm } from "@/components/features/account/profile-form";
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
        title="Faça login para acessar"
        message="Você precisa estar autenticado para ver suas configurações de conta."
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Configurações da conta</h1>
        <p className="text-sm text-muted-foreground">
          Seus dados pessoais, endereço de entrega e crédito disponível.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados pessoais e endereço</CardTitle>
          <CardDescription>
            Usados para identificar seus pedidos e calcular o frete de entrega.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? <LoadingSpinner /> : null}
          {error ? (
            <ErrorState
              title="Não foi possível carregar seus dados"
              message="Tente novamente em instantes."
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="size-4" />
            Crédito de fidelidade
          </CardTitle>
          <CardDescription>
            Pontos acumulados nas suas compras — 1 ponto equivale a R$1,00 de desconto.
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
                  (<PriceTag cents={(loyaltyBalance ?? 0) * CENTS_PER_POINT} /> em uso disponível)
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Resgate seus pontos como desconto direto no{" "}
                <Link href={ROUTES.cart} className="underline hover:text-foreground">
                  carrinho
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
