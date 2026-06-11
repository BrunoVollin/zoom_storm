export const ROUTES = {
  home: "/",
  product: (id: string) => `/products/${id}`,
  cart: "/cart",
  login: "/login",
} as const;

export const BFF_ROUTES = {
  login: "/auth/login",
  callback: "/auth/callback",
  logout: "/auth/logout",
  me: "/auth/me",
} as const;
