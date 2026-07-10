export function buildProductPayload(
  overrides: Partial<Record<string, unknown>> = {},
) {
  return {
    name: 'Runner X Sneaker',
    price: 4999,
    description: 'High-performance running shoe',
    category: 'Footwear',
    stock: 10,
    transportHeight: 20,
    transportWidth: 15,
    transportLength: 30,
    weight: 1.5,
    ...overrides,
  };
}

export async function createProduct(
  gatewayUrl: string,
  overrides: Partial<Record<string, unknown>> = {},
) {
  const response = await fetch(`${gatewayUrl}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(buildProductPayload(overrides)),
  });
  const body = await response.json();

  return { response, body };
}
