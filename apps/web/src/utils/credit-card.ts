/** Luhn checksum — the same algorithm real card networks use to catch
 * typos, not a real validity/issuer check. */
export function isValidCardNumber(rawNumber: string): boolean {
  const digits = rawNumber.replace(/\D/g, "");

  if (digits.length < 13 || digits.length > 19) return false;

  let sum = 0;
  let shouldDouble = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = Number(digits[i]);

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

/** Accepts "MM/YY" or "MM/YYYY", true only if the month is a real future
 * expiration (the card is valid through the end of that month). */
export function isFutureExpiryDate(expiry: string): boolean {
  const match = /^(\d{2})\/(\d{2}|\d{4})$/.exec(expiry.trim());
  if (!match) return false;

  const month = Number(match[1]);
  if (month < 1 || month > 12) return false;

  const yearPart = match[2] ?? "";
  const year = yearPart.length === 2 ? 2000 + Number(yearPart) : Number(yearPart);

  const now = new Date();
  const expiryEnd = new Date(year, month, 0, 23, 59, 59);

  return expiryEnd.getTime() >= now.getTime();
}

const BRAND_PATTERNS: Array<{ brand: string; pattern: RegExp }> = [
  { brand: "Visa", pattern: /^4/ },
  { brand: "Mastercard", pattern: /^(5[1-5]|2[2-7])/ },
  { brand: "American Express", pattern: /^3[47]/ },
  { brand: "Elo", pattern: /^(4011|431274|438935|451416|509\d{3}|636368)/ },
];

/** Best-effort brand detection by IIN prefix, for display only. */
export function detectCardBrand(rawNumber: string): string | null {
  const digits = rawNumber.replace(/\D/g, "");
  const match = BRAND_PATTERNS.find(({ pattern }) => pattern.test(digits));
  return match?.brand ?? null;
}

export function lastFourDigits(rawNumber: string): string {
  return rawNumber.replace(/\D/g, "").slice(-4);
}
