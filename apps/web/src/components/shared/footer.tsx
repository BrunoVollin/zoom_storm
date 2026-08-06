import { GoogleTranslate } from "@/components/shared/google-translate";

export function Footer() {
  return (
    <footer className="border-t border-border py-6">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 text-center text-sm text-muted-foreground sm:px-6">
        <span>Zoom Storm — all rights reserved.</span>
        <GoogleTranslate />
      </div>
    </footer>
  );
}
