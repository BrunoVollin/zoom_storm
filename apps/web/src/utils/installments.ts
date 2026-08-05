export interface InstallmentOption {
  count: number;
  valueCents: number;
}

const MAX_INSTALLMENTS = 12;

/** Simple "up to 12x sem juros" simulation — pure display, no real payment
 * gateway involved. Returns one option per installment count from 1 to 12,
 * each installment's value simply being the total split evenly (the last
 * installment absorbs the rounding remainder). */
export function calculateInstallments(totalCents: number): InstallmentOption[] {
  if (totalCents <= 0) return [];

  const options: InstallmentOption[] = [];

  for (let count = 1; count <= MAX_INSTALLMENTS; count++) {
    options.push({ count, valueCents: Math.floor(totalCents / count) });
  }

  return options;
}

/** The option a UI typically wants to headline: the maximum installment
 * count still "sem juros" (interest-free) under this simulation. */
export function bestInstallmentOption(totalCents: number): InstallmentOption | null {
  const options = calculateInstallments(totalCents);
  return options[options.length - 1] ?? null;
}
