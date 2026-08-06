import Link from "next/link";
import { CompassIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { ROUTES } from "@/constants/routes";

export default function NotFound() {
  return (
    <EmptyState
      icon={<CompassIcon className="size-10" />}
      title="Page not found"
      description="The content you're looking for doesn't exist or was removed."
      action={
        <Button asChild size="sm">
          <Link href={ROUTES.home}>Back to catalog</Link>
        </Button>
      }
    />
  );
}
