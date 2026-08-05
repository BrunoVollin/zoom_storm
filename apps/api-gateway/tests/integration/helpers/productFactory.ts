let variantCounter = 0;

export function buildProductPayload(
  overrides: Partial<Record<string, unknown>> = {},
) {
  const { price = 4999, stock = 10, sku, ...rest } = overrides;

  return {
    name: 'Runner X Sneaker',
    description: 'High-performance running shoe',
    category: 'Footwear',
    transportHeight: 20,
    transportWidth: 15,
    transportLength: 30,
    weight: 1.5,
    variants: [
      {
        sku: (sku as string) ?? `TEST-SKU-${++variantCounter}`,
        price,
        stock,
        isDefault: true,
      },
    ],
    ...rest,
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
