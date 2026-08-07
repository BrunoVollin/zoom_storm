import { Status } from '../../src/application/contracts/UseCase';
import { MarkAllNotificationsReadUseCase } from '../../src/application/usecases/MarkAllNotificationsReadUseCase';
import { NotificationRepository } from '../../src/domain/repositories/NotificationRepository';

describe('MarkAllNotificationsReadUseCase', () => {
  let notificationRepository: NotificationRepository;
  let useCase: MarkAllNotificationsReadUseCase;

  beforeEach(() => {
    notificationRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      countUnread: jest.fn(),
      markAllAsRead: jest.fn(),
    };
    useCase = new MarkAllNotificationsReadUseCase(notificationRepository);
  });

  it('marks only the authenticated user notifications as read', async () => {
    (notificationRepository.markAllAsRead as jest.Mock).mockResolvedValue(3);

    const result = await useCase.execute({ userId: 'user-1' });

    expect(result).toEqual({ status: Status.SUCCESS, updatedCount: 3 });
    expect(notificationRepository.markAllAsRead).toHaveBeenCalledTimes(1);
    expect(notificationRepository.markAllAsRead).toHaveBeenCalledWith(
      expect.objectContaining({ value: 'user-1' }),
    );
  });

  it('succeeds with zero updates when the user has no unread notifications', async () => {
    (notificationRepository.markAllAsRead as jest.Mock).mockResolvedValue(0);

    await expect(useCase.execute({ userId: 'user-1' })).resolves.toEqual({
      status: Status.SUCCESS,
      updatedCount: 0,
    });
  });

  it('returns an error when persistence fails', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    (notificationRepository.markAllAsRead as jest.Mock).mockRejectedValue(
      new Error('Database unavailable'),
    );

    await expect(useCase.execute({ userId: 'user-1' })).resolves.toEqual({
      status: Status.ERROR,
      message: 'An unexpected error occurred. Please try again later.',
    });

    expect(consoleError).toHaveBeenCalledTimes(1);
    consoleError.mockRestore();
  });
});
