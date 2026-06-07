import type { Context } from 'hono';
import { setSignedCookie, deleteCookie } from 'hono/cookie';
import { LoginUseCase } from '@bff-application/usecases/LoginUseCase';
import { CallbackUseCase } from '@bff-application/usecases/CallbackUseCase';
import { LogoutUseCase } from '@bff-application/usecases/LogoutUseCase';
import { GetCurrentUserUseCase } from '@bff-application/usecases/GetCurrentUserUseCase';
import { Session } from '@bff-domain/entities/Session';
import { env } from '../../../config/env';
import { sessionCookieOptions } from '../cookies';

export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly callbackUseCase: CallbackUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly getCurrentUserUseCase: GetCurrentUserUseCase,
  ) {}

  async login(c: Context) {
    const { authorizationUrl } = await this.loginUseCase.execute({
      redirectUri: `${env.http.baseUrl}/auth/callback`,
    });

    return c.redirect(authorizationUrl, 302);
  }

  async callback(c: Context) {
    const state = c.req.query('state');
    if (!state)
      return c.json({ status: 'ERROR', message: 'Missing state' }, 400);

    const result = await this.callbackUseCase.execute({
      currentUrl: new URL(c.req.url),
      state,
    });

    if (result.outcome === 'invalid_state') {
      return c.json(
        { status: 'ERROR', message: 'Invalid or expired authorization state' },
        400,
      );
    }

    await this.setSessionCookie(c, result.session);

    return c.redirect(env.frontend.url, 302);
  }

  async logout(c: Context) {
    const session = c.get('session');
    const global = c.req.query('global') === 'true';

    const result = await this.logoutUseCase.execute({
      session,
      global,
      postLogoutRedirectUri: env.frontend.url,
    });

    deleteCookie(c, env.session.cookieName, sessionCookieOptions());

    if (result.outcome === 'global') {
      return c.json(
        { status: 'SUCCESS', redirectUrl: result.redirectUrl },
        200,
      );
    }

    return c.json({ status: 'SUCCESS' }, 200);
  }

  async me(c: Context) {
    const session = c.get('session');

    const { user } = await this.getCurrentUserUseCase.execute({ session });

    return c.json({ status: 'SUCCESS', user }, 200);
  }

  private async setSessionCookie(c: Context, session: Session): Promise<void> {
    await setSignedCookie(
      c,
      env.session.cookieName,
      session.id,
      env.session.cookieSecret,
      sessionCookieOptions(env.session.ttlSeconds),
    );
  }
}
