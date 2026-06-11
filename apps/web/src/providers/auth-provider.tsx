"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { authService } from "@/services/auth-service";
import type { SessionUser } from "@/types/user";

interface AuthContextValue {
  user: SessionUser | null | undefined;
  isLoading: boolean;
  loginUrl: string;
  logout: (global?: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: user, isLoading } = useCurrentUser();

  const value: AuthContextValue = {
    user,
    isLoading,
    loginUrl: authService.loginUrl,
    logout: async (global = false) => {
      await authService.logout(global);
      window.location.assign("/");
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
