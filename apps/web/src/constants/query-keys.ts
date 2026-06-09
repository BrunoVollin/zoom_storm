export const queryKeys = {
  products: {
    all: ["products"] as const,
    detail: (id: string) => ["products", id] as const,
  },
  cart: {
    detail: (cartId: string) => ["cart", cartId] as const,
    shipping: (cartId: string, distance: number) => ["cart", cartId, "shipping", distance] as const,
  },
  auth: {
    me: ["auth", "me"] as const,
  },
} as const;
