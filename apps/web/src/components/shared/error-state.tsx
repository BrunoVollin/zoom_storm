import { TriangleAlert } from "lucide-react";

interface ErrorStateProps {
  title?: string;
  message?: string;
}

export function ErrorState({
  title = "Algo deu errado",
  message = "Não foi possível carregar essas informações agora. Tente novamente em instantes.",
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-6 py-16 text-center">
      <TriangleAlert className="size-10 text-destructive" />
      <p className="font-medium text-destructive">{title}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
