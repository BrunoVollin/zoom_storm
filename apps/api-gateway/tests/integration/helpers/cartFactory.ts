interface CartItemInput {
  id: string;
  quantity: number;
}

export function buildCartPayload(
  overrides: Partial<Record<string, unknown>> = {},
) {
  return {
    products: [] as CartItemInput[],
    coupons: [] as string[],
    ...overrides,
  };
}

export async function createCart(
  gatewayUrl: string,
  overrides: Partial<Record<string, unknown>> = {},
) {
  const response = await fetch(`${gatewayUrl}/cart/carts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(buildCartPayload(overrides)),
  });
  const body = await response.json();

  return { response, body };
}
