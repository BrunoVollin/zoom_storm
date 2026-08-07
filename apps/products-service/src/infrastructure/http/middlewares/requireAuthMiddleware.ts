import type { MiddlewareHandler } from 'hono';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { env } from '../../../config/env';

let jwks: ReturnType<typeof createRemoteJWKSet> | undefined;

function getJwks() {
  if (!jwks) jwks = createRemoteJWKSet(new URL(env.keycloak.jwksUri));

  return jwks;
}

export const requireAuth: MiddlewareHandler = async (c, next) => {
  if (env.auth.skip) {
    c.set('userId', 'local-dev-user');
    c.set('userName', 'Local Development User');
    c.set('userEmail', 'local-dev-user@localhost');

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

  if (!payload.sub) {
    return c.json(
      { status: 'ERROR', message: 'Invalid or expired token' },
      401,
    );
  }

  c.set('userId', payload.sub);
  const userName =
    typeof payload.name === 'string'
      ? payload.name
      : typeof payload.preferred_username === 'string'
        ? payload.preferred_username
        : undefined;
  const userEmail =
    typeof payload.email === 'string' ? payload.email : undefined;

  if (!userName || !userEmail) {
    return c.json(
      { status: 'ERROR', message: 'Authenticated profile is incomplete' },
      401,
    );
  }

  c.set('userName', userName);
  c.set('userEmail', userEmail);
  await next();
};
