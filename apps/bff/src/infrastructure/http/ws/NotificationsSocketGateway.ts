import type { WSContext } from 'hono/ws';

export class NotificationsSocketGateway {
  private readonly connections = new Map<string, Set<WSContext>>();

  register(userId: string, ws: WSContext): void {
    const sockets = this.connections.get(userId) ?? new Set();
    sockets.add(ws);
    this.connections.set(userId, sockets);
  }

  unregister(userId: string, ws: WSContext): void {
    const sockets = this.connections.get(userId);
    if (!sockets) return;

    sockets.delete(ws);
    if (sockets.size === 0) this.connections.delete(userId);
  }

  broadcastToUser(userId: string, payload: unknown): void {
    const sockets = this.connections.get(userId);
    if (!sockets) return;

    const message = JSON.stringify(payload);
    for (const ws of sockets) {
      ws.send(message);
    }
  }
}
