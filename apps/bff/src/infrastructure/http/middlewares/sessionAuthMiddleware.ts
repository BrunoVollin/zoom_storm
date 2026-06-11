import type { Context, MiddlewareHandler } from 'hono';
import { getSignedCookie, deleteCookie } from 'hono/cookie';
import { Session } from '@bff-domain/entities/Session';
import { SessionRepository } from '@bff-domain/repositories/SessionRepository';
import { RefreshTokenUseCase } from '@bff-application/usecases/RefreshTokenUseCase';
import { env } from '../../../config/env';
import { sessionCookieOptions } from '../cookies';

declare module 'hono' {
  interface ContextVariableMap {
    session: Session | undefined;
  }
}

export function sessionAuthMiddleware(
  sessionRepository: SessionRepository,
  refreshTokenUseCase: RefreshTokenUseCase,
): MiddlewareHandler {
  return async (c, next) => {
    const sessionId = await getSignedCookie(
      c,
      env.session.cookieSecret,
      env.session.cookieName,
    );

    if (!sessionId) return unauthorized(c);

    const session = await sessionRepository.findById(sessionId);
    if (!session) return clearSessionCookie(c);

    const refreshResult = await refreshTokenUseCase.execute({ session });

    if (refreshResult.outcome === 'expired') return clearSessionCookie(c);

    c.set('session', refreshResult.session);

    await next();
  };
}

function unauthorized(c: Context): Response {
  return c.json({ status: 'ERROR', message: 'Not authenticated' }, 401);
}

function clearSessionCookie(c: Context): Response {
  deleteCookie(c, env.session.cookieName, sessionCookieOptions());

  return unauthorized(c);
}
