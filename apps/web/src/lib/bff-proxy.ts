import { NextResponse, type NextRequest } from "next/server";

const BFF_BASE_URL = process.env.BFF_BASE_URL ?? "http://localhost:8088";

const HOP_BY_HOP_REQUEST_HEADERS = new Set(["host", "connection", "content-length"]);

/**
 * Forwards a request from this Next.js server to the BFF, relaying the
 * session cookie upstream and any `set-cookie` response back to the browser.
 * This is the only place in the codebase allowed to know about `BFF_BASE_URL`,
 * keeping it a server-only secret and the session cookie HttpOnly end to end.
 */
export async function proxyToBff(request: NextRequest, segments: string[], prefix: string) {
  const targetUrl = new URL(`${prefix}/${segments.join("/")}`, BFF_BASE_URL);
  targetUrl.search = request.nextUrl.search;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!HOP_BY_HOP_REQUEST_HEADERS.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  const hasBody = !["GET", "HEAD"].includes(request.method);

  const upstreamResponse = await fetch(targetUrl, {
    method: request.method,
    headers,
    body: hasBody ? await request.arrayBuffer() : undefined,
    redirect: "manual",
  });

  const responseHeaders = new Headers();
  upstreamResponse.headers.forEach((value, key) => {
    if (key.toLowerCase() !== "content-encoding") {
      responseHeaders.append(key, value);
    }
  });

  return new NextResponse(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers: responseHeaders,
  });
}
