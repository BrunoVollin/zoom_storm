import type { Context } from 'hono';
import { ListNotificationsQuery } from '../../../application/queries/ListNotificationsQuery';
import { MarkNotificationReadUseCase } from '../../../application/usecases/MarkNotificationReadUseCase';
import { Status as QueryStatus } from '../../../application/contracts/Query';
import { Status as UseCaseStatus } from '../../../application/contracts/UseCase';

export class NotificationController {
  constructor(
    private readonly listNotificationsQuery: ListNotificationsQuery,
    private readonly markNotificationReadUseCase: MarkNotificationReadUseCase,
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

    const result = await this.markNotificationReadUseCase.execute({
      notificationId,
      userId,
    });
    const status = result.status === UseCaseStatus.SUCCESS ? 200 : 422;

    return c.json(result, status);
  }
}
