import { NotificationRepository } from '../../domain/repositories/NotificationRepository';
import { IdType } from '../../domain/shared/IdType';
import { Status, UseCase } from '../contracts/UseCase';

interface Input {
  userId: string;
}

interface SuccessOutput {
  status: Status.SUCCESS;
  updatedCount: number;
}

interface ErrorOutput {
  status: Status.ERROR;
  message: string;
}

type Output = SuccessOutput | ErrorOutput;

export class MarkAllNotificationsReadUseCase implements UseCase<Input, Output> {
  constructor(private readonly notificationRepository: NotificationRepository) {}

  async execute(input: Input): Promise<Output> {
    try {
      const updatedCount = await this.notificationRepository.markAllAsRead(
        IdType.create(input.userId),
      );

      return { status: Status.SUCCESS, updatedCount };
    } catch (error) {
      console.error(error);

      return {
        status: Status.ERROR,
        message: 'An unexpected error occurred. Please try again later.',
      };
    }
  }
}
