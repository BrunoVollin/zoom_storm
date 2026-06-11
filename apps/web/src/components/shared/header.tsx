import Link from "next/link";
import { Gamepad2 } from "lucide-react";

import { ROUTES } from "@/constants/routes";
import { CartLink } from "@/components/features/cart/cart-link";
import { UserMenu } from "@/components/features/auth/user-menu";

export function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href={ROUTES.home} className="flex items-center gap-2 font-semibold">
          <Gamepad2 className="size-6" />
          Zoom Storm
        </Link>
        <div className="flex items-center gap-2">
          <CartLink />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
