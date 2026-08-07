import { Notification, NotificationType } from '../../domain/entities/Notification';
import { NotificationRepository } from '../../domain/repositories/NotificationRepository';
import { NotificationPublisher } from '../../domain/repositories/NotificationPublisher';
import { IdType } from '../../domain/shared/IdType';
import { DuplicateNotificationEventError } from '../../domain/errors/DuplicateNotificationEventError';
import { UseCase, Status } from '../contracts/UseCase';

interface OrderEventPayload {
  id: string;
  userId: string;
  status: 'CREATED' | 'PAID' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED';
  originCity: string | null;
  destinationCity: string | null;
}

interface Input {
  eventName: 'order.created' | 'order.status_changed';
  payload: OrderEventPayload;
}

interface SuccessOutput {
  status: Status.SUCCESS;
  notification: Notification | null;
}

interface ErrorOutput {
  status: Status.ERROR;
  message: string;
}

type Output = SuccessOutput | ErrorOutput;

function buildMessage(input: Input): { message: string; type: NotificationType } | null {
  const { payload } = input;
  const destination = payload.destinationCity ?? 'sua região';

  if (input.eventName === 'order.status_changed') {
    if (payload.status === 'PAID') {
      return {
        message: `Compra realizada com sucesso! Pedido #${payload.id} confirmado.`,
        type: NotificationType.ORDER_CREATED,
      };
    }

    if (payload.status === 'IN_TRANSIT') {
      const origin = payload.originCity ?? 'nosso centro de distribuição';

      return {
        message: `Seu pedido saiu de ${origin} e está a caminho de ${destination}.`,
        type: NotificationType.ORDER_IN_TRANSIT,
      };
    }

    if (payload.status === 'OUT_FOR_DELIVERY') {
      return {
        message: `Seu pedido chegou em ${destination}.`,
        type: NotificationType.ORDER_OUT_FOR_DELIVERY,
      };
    }

    if (payload.status === 'DELIVERED') {
      return {
        message: 'Seu pedido foi entregue!',
        type: NotificationType.ORDER_DELIVERED,
      };
    }
  }

  // Creating an unpaid order, or any other transition, must not notify the user.
  return null;
}

export class CreateNotificationFromOrderEventUseCase implements UseCase<Input, Output> {
  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly notificationPublisher: NotificationPublisher,
  ) {}

  async execute(input: Input): Promise<Output> {
    const content = buildMessage(input);
    if (!content) {
      return { status: Status.SUCCESS, notification: null };
    }

    // Natural, stable key for this order event transition: the same order
    // never fires the same status twice, so `${orderId}:${type}` uniquely
    // identifies the notification that transition should produce. Storing
    // it under a unique constraint makes reprocessing the same Kafka
    // message (e.g. after a consumer group rebalance, or a retry following
    // a failed Redis publish) idempotent, instead of creating a duplicate
    // notification with a fresh random id on every attempt.
    const sourceEventKey = `${input.payload.id}:${content.type}`;

    const notification = new Notification(
      IdType.create(),
      IdType.create(input.payload.userId),
      content.message,
      content.type,
      input.payload.id,
      sourceEventKey,
    );

    try {
      await this.notificationRepository.save(notification);
    } catch (error) {
      if (error instanceof DuplicateNotificationEventError) {
        // This order event was already persisted by a previous attempt.
        // Treat it as an idempotent success: fall through to (re)publish
        // in case the earlier attempt failed after saving but before
        // publishing, without creating a duplicate row.
      } else {
        console.error(error);

        return { status: Status.ERROR, message: 'An unexpected error occurred. Please try again later.' };
      }
    }

    try {
      await this.notificationPublisher.publish(notification);
    } catch (error) {
      console.error(error);

      return { status: Status.ERROR, message: 'An unexpected error occurred. Please try again later.' };
    }

    return { status: Status.SUCCESS, notification };
  }
}
