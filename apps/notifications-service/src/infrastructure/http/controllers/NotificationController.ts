import type { Context } from 'hono';
import { ListNotificationsQuery } from '../../../application/queries/ListNotificationsQuery';
import { MarkNotificationReadUseCase } from '../../../application/usecases/MarkNotificationReadUseCase';
import { MarkAllNotificationsReadUseCase } from '../../../application/usecases/MarkAllNotificationsReadUseCase';
import { Status as QueryStatus } from '../../../application/contracts/Query';
import { Status as UseCaseStatus } from '../../../application/contracts/UseCase';

export class NotificationController {
  constructor(
    private readonly listNotificationsQuery: ListNotificationsQuery,
    private readonly markNotificationReadUseCase: MarkNotificationReadUseCase,
    private readonly markAllNotificationsReadUseCase: MarkAllNotificationsReadUseCase,
  ) {}

  async list(c: Context) {
    const userId = c.get('userId') as string;

    const result = await this.listNotificationsQuery.execute({ userId });
    const status = result.status === QueryStatus.SUCCESS ? 200 : 422;

    return c.json(result, status);
  }

  async markRead(c: Context) {
    const userId = c.get('userId') as string;
    const notificationId = c.req.param('id');

    if (!notificationId) {
      return c.json({ status: UseCaseStatus.ERROR, message: 'Notification not found' }, 404);
    }

    const result = await this.markNotificationReadUseCase.execute({
      notificationId,
      userId,
    });
    const status = result.status === UseCaseStatus.SUCCESS ? 200 : 422;

    return c.json(result, status);
  }

  async markAllRead(c: Context) {
    const result = await this.markAllNotificationsReadUseCase.execute({
      userId: c.get('userId') as string,
    });
    const status = result.status === UseCaseStatus.SUCCESS ? 200 : 422;

    return c.json(result, status);
  }
}
