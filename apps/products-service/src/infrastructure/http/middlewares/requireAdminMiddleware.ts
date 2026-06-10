import type { MiddlewareHandler } from 'hono';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { env } from '../../../config/env';

let jwks: ReturnType<typeof createRemoteJWKSet> | undefined;

function getJwks() {
  if (!jwks) jwks = createRemoteJWKSet(new URL(env.keycloak.jwksUri));

  return jwks;
}

export const requireAdmin: MiddlewareHandler = async (c, next) => {
  if (env.auth.skip) {
    return next();
  }

  const authorization = c.req.header('authorization');
  const token = authorization?.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : undefined;

  if (!token) {
    return c.json({ status: 'ERROR', message: 'Missing bearer token' }, 401);
  }

  let payload;
  try {
    const result = await jwtVerify(token, getJwks(), {
      issuer: env.keycloak.issuerUrl,
    });
    payload = result.payload;
  } catch {
    return c.json(
      { status: 'ERROR', message: 'Invalid or expired token' },
      401,
    );
  }

  const roles =
    (payload.realm_access as { roles?: string[] } | undefined)?.roles ?? [];
  if (!roles.includes('admin')) {
    return c.json({ status: 'ERROR', message: 'Admin role required' }, 403);
  }

  c.set('user', payload);
  await next();
};
