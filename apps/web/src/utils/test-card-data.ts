/**
 * Random-but-valid card data for the admin-only "fill with test data"
 * shortcut on the saved-card form (checkout and account settings). Never
 * used for anything beyond speeding up manual QA — no real charge is ever
 * made, this is a simulated payment flow.
 */

const FIRST_NAMES = ["Ana", "Bruno", "Carla", "Diego", "Elisa", "Felipe", "Gabriela", "Hugo"];
const LAST_NAMES = ["Silva", "Souza", "Oliveira", "Pereira", "Costa", "Almeida", "Ferreira", "Lima"];

function randomOf<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

/** Appends a Luhn check digit to a 15-digit prefix, producing a 16-digit
 * number that passes `isValidCardNumber`'s Luhn check. */
function withLuhnCheckDigit(prefix: string): string {
  let sum = 0;
  let shouldDouble = true; // check digit itself is skipped, so start doubling from the rightmost prefix digit

  for (let i = prefix.length - 1; i >= 0; i--) {
    let digit = Number(prefix[i]);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }

  const checkDigit = (10 - (sum % 10)) % 10;
  return `${prefix}${checkDigit}`;
}

function generateCardNumber(): string {
  // Visa-like: starts with 4, 15 more digits (last one is the Luhn check digit).
  let prefix = "4";
  for (let i = 0; i < 14; i++) {
    prefix += Math.floor(Math.random() * 10).toString();
  }
  return withLuhnCheckDigit(prefix);
}

function formatCardNumber(digits: string): string {
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

function generateFutureExpiry(): string {
  const now = new Date();
  const monthsAhead = 1 + Math.floor(Math.random() * 36); // 1 to 36 months in the future
  const target = new Date(now.getFullYear(), now.getMonth() + monthsAhead, 1);
  const month = String(target.getMonth() + 1).padStart(2, "0");
  const year = String(target.getFullYear() % 100).padStart(2, "0");
  return `${month}/${year}`;
}

function generateCvv(): string {
  return String(100 + Math.floor(Math.random() * 900));
}

export interface TestCardData {
  cardNumber: string;
  cardName: string;
  expiry: string;
  cvv: string;
}

export function generateTestCardData(): TestCardData {
  return {
    cardNumber: formatCardNumber(generateCardNumber()),
    cardName: `${randomOf(FIRST_NAMES)} ${randomOf(LAST_NAMES)}`,
    expiry: generateFutureExpiry(),
    cvv: generateCvv(),
  };
}
