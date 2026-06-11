import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import type { ApiError } from "@/types/api";

const isServer = typeof window === "undefined";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3100";

/**
 * Single HTTP entry point for the whole app. It always targets this Next.js
 * server's own `/api/*` route handlers — never the BFF directly — so the
 * `__Host-session` cookie stays same-origin and HttpOnly end to end.
 *
 * On the server (Server Components, Server Actions) axios needs an absolute
 * URL and the incoming request's cookies must be forwarded explicitly, since
 * there is no browser to do it automatically.
 */
export const http = axios.create({
  baseURL: isServer ? `${SITE_URL}/api` : "/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

http.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  if (isServer) {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();
    if (cookieHeader) {
      config.headers.set("Cookie", cookieHeader);
    }
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    const apiError: ApiError = {
      status: error.response?.status ?? 0,
      message: error.response?.data?.message ?? error.message ?? "Erro inesperado de comunicação",
    };
    return Promise.reject(apiError);
  },
);
