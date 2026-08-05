import { NotificationRepository } from '../../domain/repositories/NotificationRepository';
import { IdType } from '../../domain/shared/IdType';
import { Query, Status } from '../contracts/Query';
import { NotificationMapper, NotificationPrimitives } from '../mappers/NotificationMapper';

interface Input {
  userId: string;
}

interface SuccessOutput {
  status: Status.SUCCESS;
  notifications: NotificationPrimitives[];
  unreadCount: number;
}

interface ErrorOutput {
  status: Status.ERROR;
  message: string;
}

type Output = SuccessOutput | ErrorOutput;

export class ListNotificationsQuery implements Query<Input, Output> {
  constructor(private readonly notificationRepository: NotificationRepository) {}

  async execute(input: Input): Promise<Output> {
    const userId = IdType.create(input.userId);
    const notifications = await this.notificationRepository.findByUserId(userId);
    const unreadCount = await this.notificationRepository.countUnread(userId);

    return {
      status: Status.SUCCESS,
      notifications: notifications.map(NotificationMapper.toPrimitives),
      unreadCount,
    };
  }
}
