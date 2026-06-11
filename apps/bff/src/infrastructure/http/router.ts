import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Redis } from 'ioredis';
import { env } from '../../config/env';
import { KeycloakAuthService } from '@bff-infrastructure/keycloak/KeycloakAuthService';
import { RedisSessionRepository } from '@bff-infrastructure/session/RedisSessionRepository';
import { RedisPendingAuthorizationStore } from '@bff-infrastructure/session/RedisPendingAuthorizationStore';
import { LoginUseCase } from '@bff-application/usecases/LoginUseCase';
import { CallbackUseCase } from '@bff-application/usecases/CallbackUseCase';
import { RefreshTokenUseCase } from '@bff-application/usecases/RefreshTokenUseCase';
import { LogoutUseCase } from '@bff-application/usecases/LogoutUseCase';
import { GetCurrentUserUseCase } from '@bff-application/usecases/GetCurrentUserUseCase';
import { sessionAuthMiddleware } from './middlewares/sessionAuthMiddleware';
import { optionalSessionMiddleware } from './middlewares/optionalSessionMiddleware';
import { AuthController } from './controllers/AuthController';
import { ProxyController } from './controllers/ProxyController';

export function buildRouter(redis: Redis): Hono {
  const app = new Hono();

  const keycloakAuthService = new KeycloakAuthService();
  const sessionRepository = new RedisSessionRepository(redis);
  const pendingAuthorizationStore = new RedisPendingAuthorizationStore(redis);

  const refreshTokenUseCase = new RefreshTokenUseCase(
    keycloakAuthService,
    sessionRepository,
  );

  const authController = new AuthController(
    new LoginUseCase(keycloakAuthService, pendingAuthorizationStore),
    new CallbackUseCase(
      keycloakAuthService,
      pendingAuthorizationStore,
      sessionRepository,
    ),
    new LogoutUseCase(keycloakAuthService, sessionRepository),
    new GetCurrentUserUseCase(),
  );

  const proxyController = new ProxyController();

  const requireSession = sessionAuthMiddleware(
    sessionRepository,
    refreshTokenUseCase,
  );

  const optionalSession = optionalSessionMiddleware(
    sessionRepository,
    refreshTokenUseCase,
  );

  app.use(
    '*',
    cors({
      origin: env.frontend.url,
      credentials: true,
    }),
  );

  app.get('/health', (c) => c.json({ status: 'ok' }, 200));

  app.get('/auth/login', (c) => authController.login(c));
  app.get('/auth/callback', (c) => authController.callback(c));
  app.post('/auth/logout', requireSession, (c) => authController.logout(c));
  app.get('/auth/me', requireSession, (c) => authController.me(c));

  app.all('/cart/*', requireSession, (c) =>
    proxyController.forward(c, c.req.path),
  );

  app.all('/products/*', optionalSession, (c) =>
    proxyController.forward(c, c.req.path),
  );

  return app;
}
