import type { MiddlewareHandler } from 'hono';
import { getSignedCookie, deleteCookie } from 'hono/cookie';
import { SessionRepository } from '@bff-domain/repositories/SessionRepository';
import { RefreshTokenUseCase } from '@bff-application/usecases/RefreshTokenUseCase';
import { env } from '../../../config/env';
import { sessionCookieOptions } from '../cookies';

/**
 * Like sessionAuthMiddleware, but never blocks the request: if there is no
 * session (or it's invalid/expired), `session` is left unset and the request
 * proceeds anonymously. Used for routes that are accessible both to guests
 * and authenticated users.
 */
export function optionalSessionMiddleware(
  sessionRepository: SessionRepository,
  refreshTokenUseCase: RefreshTokenUseCase,
): MiddlewareHandler {
  return async (c, next) => {
    const sessionId = await getSignedCookie(
      c,
      env.session.cookieSecret,
      env.session.cookieName,
    );

    if (!sessionId) return next();

    const session = await sessionRepository.findById(sessionId);
    if (!session) {
      deleteCookie(c, env.session.cookieName, sessionCookieOptions());
      return next();
    }

    const refreshResult = await refreshTokenUseCase.execute({ session });

    if (refreshResult.outcome === 'expired') {
      deleteCookie(c, env.session.cookieName, sessionCookieOptions());
      return next();
    }

    c.set('session', refreshResult.session);

    await next();
  };
}
