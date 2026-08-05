export const ROUTES = {
  home: "/",
  product: (id: string) => `/products/${id}`,
  cart: "/cart",
  login: "/login",
  wishlist: "/account/wishlist",
  accountSettings: "/account/settings",
  checkoutPayment: (orderId: string) => `/checkout/payment?orderId=${orderId}`,
  orders: "/orders",
  order: (id: string) => `/orders/${id}`,
  admin: "/admin",
  adminProducts: "/admin/products",
  adminProductNew: "/admin/products/new",
  adminProductEdit: (id: string) => `/admin/products/${id}/edit`,
  adminFlashOffers: "/admin/flash-offers",
  adminFlashOfferNew: "/admin/flash-offers/new",
  adminFlashOfferEdit: (id: string) => `/admin/flash-offers/${id}/edit`,
} as const;

export const BFF_ROUTES = {
  login: "/auth/login",
  callback: "/auth/callback",
  logout: "/auth/logout",
  me: "/auth/me",
} as const;
