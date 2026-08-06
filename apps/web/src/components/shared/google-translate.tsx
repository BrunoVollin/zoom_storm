"use client";

import Script from "next/script";

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: {
      translate: {
        TranslateElement: new (
          options: { pageLanguage: string; autoDisplay?: boolean },
          elementId: string,
        ) => unknown;
      };
    };
  }
}

/**
 * Discreet Google Website Translator widget.
 * Renders the official Google Translate Element so visitors can translate
 * the site (authored in English) into their preferred language.
 */
export function GoogleTranslate() {
  return (
    <>
      <div
        id="google_translate_element"
        className="text-xs [&_.goog-te-gadget]:!text-muted-foreground [&_.goog-te-gadget-simple]:!rounded-md [&_.goog-te-gadget-simple]:!border-border [&_.goog-te-gadget-simple]:!bg-background [&_.goog-te-gadget-simple]:!px-2 [&_.goog-te-gadget-simple]:!py-1"
      />
      <Script id="google-translate-init" strategy="afterInteractive">
        {`
          window.googleTranslateElementInit = function () {
            new window.google.translate.TranslateElement(
              { pageLanguage: "en", autoDisplay: false },
              "google_translate_element"
            );
          };
        `}
      </Script>
      <Script
        src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
        strategy="afterInteractive"
      />
    </>
  );
}
