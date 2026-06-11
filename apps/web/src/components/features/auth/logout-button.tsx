"use client";

import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/auth-provider";

export function LogoutButton() {
  const { logout } = useAuth();

  return (
    <Button variant="ghost" size="sm" onClick={() => logout(false)}>
      <LogOut />
      Sair
    </Button>
  );
}
