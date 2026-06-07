import type { Context } from 'hono';
import { proxyToGateway } from '@bff-infrastructure/proxy/GatewayProxyClient';

export class ProxyController {
  async forward(c: Context, gatewayPath: string) {
    const session = c.get('session');

    return proxyToGateway(c, session, gatewayPath);
  }
}
