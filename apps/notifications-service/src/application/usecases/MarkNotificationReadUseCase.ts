import { NotificationRepository } from '../../domain/repositories/NotificationRepository';
import { IdType } from '../../domain/shared/IdType';
import { UseCase, Status } from '../contracts/UseCase';

interface Input {
  notificationId: string;
  userId: string;
}

interface SuccessOutput {
  status: Status.SUCCESS;
}

interface ErrorOutput {
  status: Status.ERROR;
  message: string;
}

type Output = SuccessOutput | ErrorOutput;

export class MarkNotificationReadUseCase implements UseCase<Input, Output> {
  constructor(private readonly notificationRepository: NotificationRepository) {}

  async execute(input: Input): Promise<Output> {
    const notification = await this.notificationRepository.findById(
      IdType.create(input.notificationId),
    );

    if (!notification || notification.userId.toString() !== input.userId) {
      return { status: Status.ERROR, message: 'Notification not found' };
    }

    notification.markAsRead();
    await this.notificationRepository.save(notification);

    return { status: Status.SUCCESS };
  }
}
