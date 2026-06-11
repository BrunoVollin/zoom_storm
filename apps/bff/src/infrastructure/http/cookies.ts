import type { CookieOptions } from 'hono/utils/cookie';

export function sessionCookieOptions(maxAge?: number): CookieOptions {
  return {
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    path: '/',
    ...(maxAge ? { maxAge } : {}),
  };
}
