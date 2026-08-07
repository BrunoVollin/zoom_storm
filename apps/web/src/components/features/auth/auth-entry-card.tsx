import Link from "next/link";
import { Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ROUTES } from "@/constants/routes";
import { authService } from "@/services/auth-service";

interface AuthEntryCardProps {
  mode: "login" | "register";
}

const COPY = {
  login: {
    testId: "login-page",
    title: "Sign in",
    description: "Sign in to manage your cart, orders and wishlist.",
    emailLabel: "Continue with email",
    emailTestId: "login-email-btn",
    emailHref: authService.loginUrl,
    googleTestId: "login-google-btn",
    switchTestId: "login-switch-link",
    switchPrompt: "Don't have an account?",
    switchLabel: "Create one",
    switchHref: ROUTES.register,
  },
  register: {
    testId: "register-page",
    title: "Create your account",
    description: "Create an account to start shopping.",
    emailLabel: "Continue with email",
    emailTestId: "register-email-btn",
    emailHref: authService.registerUrl,
    googleTestId: "register-google-btn",
    switchTestId: "register-switch-link",
    switchPrompt: "Already have an account?",
    switchLabel: "Sign in",
    switchHref: ROUTES.login,
  },
} as const;

/**
 * Storefront entry point for `/login` and `/register`. Every provider button
 * hands off to a BFF-owned OAuth2/PKCE route (`authService`) — this
 * component owns none of the auth flow itself, only the entry UI.
 */
export function AuthEntryCard({ mode }: AuthEntryCardProps) {
  const copy = COPY[mode];

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <Card data-testid={copy.testId} className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{copy.title}</CardTitle>
          <CardDescription>{copy.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button asChild className="w-full">
            <a data-testid={copy.emailTestId} href={copy.emailHref}>
              <Mail />
              {copy.emailLabel}
            </a>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <a data-testid={copy.googleTestId} href={authService.googleUrl}>
              Continue with Google
            </a>
          </Button>
        </CardContent>
        <CardFooter className="justify-center text-sm text-muted-foreground">
          {copy.switchPrompt}
          <Link
            data-testid={copy.switchTestId}
            href={copy.switchHref}
            className="ml-1 font-medium text-foreground underline"
          >
            {copy.switchLabel}
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
