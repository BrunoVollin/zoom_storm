import { Notification, NotificationType } from '../../domain/entities/Notification';
import { NotificationRepository } from '../../domain/repositories/NotificationRepository';
import { NotificationPublisher } from '../../domain/repositories/NotificationPublisher';
import { IdType } from '../../domain/shared/IdType';
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

  if (input.eventName === 'order.created' && payload.status === 'CREATED') {
    return {
      message: `Compra realizada com sucesso! Pedido #${payload.id} confirmado.`,
      type: NotificationType.ORDER_CREATED,
    };
  }

  if (input.eventName === 'order.status_changed') {
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

  // PAID, or any other transition, has no user-facing notification copy yet.
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

    const notification = new Notification(
      IdType.create(),
      IdType.create(input.payload.userId),
      content.message,
      content.type,
      input.payload.id,
    );

    await this.notificationRepository.save(notification);
    await this.notificationPublisher.publish(notification);

    return { status: Status.SUCCESS, notification };
  }
}
