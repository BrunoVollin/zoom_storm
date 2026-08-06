import { OrderRepository } from '../../domain/repositories/OrderRepository';
import { OrderStatus } from '../../domain/entities/order/OrderStatus';
import { UpdateOrderStatusUseCase } from '../../application/usecases/UpdateOrderStatusUseCase';
import { Status } from '../../application/contracts/UseCase';

const DEFAULT_POLL_INTERVAL_MS = 30_000;
const DEFAULT_STEP_DURATION_MS = 2 * 60_000;
const SIMULATABLE_STATUSES = new Set([
  OrderStatus.PAID,
  OrderStatus.IN_TRANSIT,
  OrderStatus.OUT_FOR_DELIVERY,
]);

/**
 * Simulates transit time for paid orders: there's no real carrier
 * integration, so this worker advances PAID -> IN_TRANSIT ->
 * OUT_FOR_DELIVERY -> DELIVERED on its own, one step every
 * `stepDurationMs`, using the order's `updatedAt` (bumped on every status
 * change) as the clock for "time spent in the current step". Reuses
 * UpdateOrderStatusUseCase so the transition, event emission and
 * order.status_changed side effects (loyalty, notifications) stay identical
 * to the existing admin-triggered PATCH.
 */
export class OrderDeliverySimulatorWorker {
  private timer: NodeJS.Timeout | null = null;
  private polling = false;

  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly updateOrderStatusUseCase: UpdateOrderStatusUseCase,
    private readonly stepDurationMs: number = DEFAULT_STEP_DURATION_MS,
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
      const orders = await this.orderRepository.findInProgress();
      const now = Date.now();

      for (const order of orders) {
        // Defense in depth: a repository regression must never let the
        // delivery simulator turn an unpaid CREATED order into PAID.
        if (!SIMULATABLE_STATUSES.has(order.getStatus())) continue;

        const nextStatus = order.getNextStatus();
        if (!nextStatus) continue;

        const elapsedMs = now - order.updatedAt.getTime();
        if (elapsedMs < this.stepDurationMs) continue;

        const result = await this.updateOrderStatusUseCase.execute({
          orderId: order.id.toString(),
          status: nextStatus,
        });

        if (result.status === Status.ERROR) {
          console.error(
            `[OrderDeliverySimulatorWorker] Failed to advance order ${order.id.toString()} to ${nextStatus}: ${result.message}`,
          );
        }
      }
    } catch (error) {
      console.error('[OrderDeliverySimulatorWorker] Poll failed:', error);
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
