import {
  DomainEvent,
  DomainEventName,
  EventPublisher,
} from '../../domain/events/DomainEvent';
import { prisma } from '../database/prisma/prisma-connection';

const DEFAULT_POLL_INTERVAL_MS = 500;
const BATCH_SIZE = 50;

export class OutboxRelay {
  private timer: NodeJS.Timeout | null = null;
  private polling = false;

  constructor(
    private readonly eventPublisher: EventPublisher,
    private readonly pollIntervalMs: number = DEFAULT_POLL_INTERVAL_MS,
  ) {}

  start(): void {
    if (this.timer) return;

    this.timer = setInterval(() => {
      void this.pollOnce();
    }, this.pollIntervalMs);
  }

  async pollOnce(): Promise<void> {
    if (this.polling) return;
    this.polling = true;

    try {
      const pendingEvents = await prisma.outboxEvent.findMany({
        where: {
          publishedAt: null,
          eventType: { in: Object.values(DomainEventName) },
        },
        orderBy: { createdAt: 'asc' },
        take: BATCH_SIZE,
      });

      for (const row of pendingEvents) {
        await this.eventPublisher.publish(
          new DomainEvent(
            row.eventType as DomainEventName,
            row.payload as object,
            row.occurredAt,
          ),
        );

        await prisma.outboxEvent.update({
          where: { id: row.id },
          data: { publishedAt: new Date() },
        });
      }
    } catch (error) {
      console.error('[OutboxRelay] Failed to publish outbox events:', error);
    } finally {
      this.polling = false;
    }
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
