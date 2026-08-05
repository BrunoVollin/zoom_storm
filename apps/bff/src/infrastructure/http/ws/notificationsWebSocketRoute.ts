import type { Context } from 'hono';
import { getSignedCookie, deleteCookie } from 'hono/cookie';
import type { WSEvents } from 'hono/ws';
import { SessionRepository } from '@bff-domain/repositories/SessionRepository';
import { RefreshTokenUseCase } from '@bff-application/usecases/RefreshTokenUseCase';
import { env } from '../../../config/env';
import { sessionCookieOptions } from '../cookies';
import { NotificationsSocketGateway } from './NotificationsSocketGateway';

export function notificationsWebSocketHandler(
  sessionRepository: SessionRepository,
  refreshTokenUseCase: RefreshTokenUseCase,
  gateway: NotificationsSocketGateway,
) {
  return async (c: Context): Promise<WSEvents> => {
    const sessionId = await getSignedCookie(
      c,
      env.session.cookieSecret,
      env.session.cookieName,
    );

    let userId: string | null = null;

    if (sessionId) {
      const session = await sessionRepository.findById(sessionId);

      if (session) {
        const refreshResult = await refreshTokenUseCase.execute({ session });

        if (refreshResult.outcome !== 'expired') {
          userId = refreshResult.session.user.subject;
        } else {
          deleteCookie(c, env.session.cookieName, sessionCookieOptions());
        }
      }
    }

    return {
      onOpen: (_event, ws) => {
        if (!userId) {
          ws.close(1008, 'Not authenticated');
          return;
        }

        gateway.register(userId, ws);
      },
      onClose: (_event, ws) => {
        if (userId) gateway.unregister(userId, ws);
      },
    };
  };
}
