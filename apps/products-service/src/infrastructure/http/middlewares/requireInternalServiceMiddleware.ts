import { timingSafeEqual } from 'node:crypto';
import type { MiddlewareHandler } from 'hono';
import { env } from '../../../config/env';

const HEADER_NAME = 'x-internal-service-token';

function tokensMatch(received: string, expected: string): boolean {
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);
  if (receivedBuffer.length !== expectedBuffer.length) return false;
  return timingSafeEqual(receivedBuffer, expectedBuffer);
}

export const requireInternalService: MiddlewareHandler = async (c, next) => {
  const expected = env.internal.serviceToken;
  const received = c.req.header(HEADER_NAME);

  if (!expected || !received || !tokensMatch(received, expected)) {
    return c.json(
      { status: 'ERROR', message: 'Internal service authorization required' },
      401,
    );
  }

  await next();
};
