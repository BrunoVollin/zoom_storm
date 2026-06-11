import type { NextRequest } from "next/server";
import { proxyToBff } from "@/lib/bff-proxy";

interface RouteParams {
  params: Promise<{ path?: string[] }>;
}

/**
 * Builds the GET/POST/PATCH/DELETE handlers for a `[...path]` route segment,
 * relaying every method to the same BFF prefix. Keeps the three proxy routes
 * (`auth`, `products`, `cart`) declarative one-liners instead of copy-pasted
 * handler bodies.
 */
export function createProxyRoute(prefix: string) {
  const handle = async (request: NextRequest, { params }: RouteParams) => {
    const { path } = await params;
    return proxyToBff(request, path ?? [], prefix);
  };

  return {
    GET: handle,
    POST: handle,
    PATCH: handle,
    DELETE: handle,
    PUT: handle,
  };
}
