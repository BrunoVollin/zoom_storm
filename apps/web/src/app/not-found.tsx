import Link from "next/link";
import { CompassIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { ROUTES } from "@/constants/routes";

export default function NotFound() {
  return (
    <EmptyState
      icon={<CompassIcon className="size-10" />}
      title="Página não encontrada"
      description="O conteúdo que você procura não existe ou foi removido."
      action={
        <Button asChild size="sm">
          <Link href={ROUTES.home}>Voltar ao catálogo</Link>
        </Button>
      }
    />
  );
}
