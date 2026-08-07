export const queryKeys = {
  products: {
    all: ["products"] as const,
    list: (filters: import("@/types/product").ProductFilters = {}) =>
      ["products", "list", filters] as const,
    detail: (id: string) => ["products", id] as const,
    categories: () => ["products", "categories"] as const,
  },
  cart: {
    detail: (cartId: string) => ["cart", cartId] as const,
    shipping: (cartId: string, distance: number) => ["cart", cartId, "shipping", distance] as const,
  },
  auth: {
    me: ["auth", "me"] as const,
  },
  wishlist: {
    all: ["wishlist"] as const,
  },
  orders: {
    all: ["orders"] as const,
    detail: (id: string) => ["orders", id] as const,
  },
  loyalty: {
    balance: ["loyalty", "balance"] as const,
  },
  profile: {
    detail: ["profile"] as const,
  },
  paymentCards: {
    all: ["payment-cards"] as const,
  },
  coupons: {
    all: ["admin-coupons"] as const,
  },
} as const;
