"use client";

import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/auth-provider";

export function LogoutButton() {
  const { logout } = useAuth();

  return (
    <Button
      data-testid="logout-btn"
      variant="ghost"
      size="sm"
      className="text-white/90 hover:bg-white/10 hover:text-white"
      onClick={() => logout(false)}
    >
      <LogOut />
      Sign out
    </Button>
  );
}
