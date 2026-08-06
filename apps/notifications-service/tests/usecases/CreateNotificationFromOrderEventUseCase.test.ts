import { CreateNotificationFromOrderEventUseCase } from '../../src/application/usecases/CreateNotificationFromOrderEventUseCase';
import { Status } from '../../src/application/contracts/UseCase';
import { NotificationRepository } from '../../src/domain/repositories/NotificationRepository';
import { NotificationPublisher } from '../../src/domain/repositories/NotificationPublisher';
import { NotificationType } from '../../src/domain/entities/Notification';

describe('CreateNotificationFromOrderEventUseCase', () => {
  let notificationRepositoryMock: NotificationRepository;
  let notificationPublisherMock: NotificationPublisher;
  let useCase: CreateNotificationFromOrderEventUseCase;

  const basePayload = {
    id: 'order-1',
    userId: 'user-1',
    status: 'IN_TRANSIT' as const,
    originCity: 'Sao Paulo',
    destinationCity: 'Rio de Janeiro',
  };

  beforeEach(() => {
    notificationRepositoryMock = {
      save: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      countUnread: jest.fn(),
    };

    notificationPublisherMock = {
      publish: jest.fn(),
    };

    useCase = new CreateNotificationFromOrderEventUseCase(
      notificationRepositoryMock,
      notificationPublisherMock,
    );
  });

  describe('Success Scenario', () => {
    it('should not notify before the order is paid', async () => {
      const result = await useCase.execute({
        eventName: 'order.created',
        payload: { ...basePayload, status: 'CREATED' },
      });

      expect(result.status).toBe(Status.SUCCESS);
      if (result.status === Status.SUCCESS) {
        expect(result.notification).toBeNull();
      }
      expect(notificationRepositoryMock.save).not.toHaveBeenCalled();
      expect(notificationPublisherMock.publish).not.toHaveBeenCalled();
    });

    it('should create and publish a purchase notification after payment', async () => {
      (notificationRepositoryMock.save as jest.Mock).mockResolvedValue(undefined);
      (notificationPublisherMock.publish as jest.Mock).mockResolvedValue(undefined);

      const result = await useCase.execute({
        eventName: 'order.status_changed',
        payload: { ...basePayload, status: 'PAID' },
      });

      expect(result.status).toBe(Status.SUCCESS);
      if (result.status === Status.SUCCESS) {
        expect(result.notification?.type).toBe(NotificationType.ORDER_CREATED);
      }
      expect(notificationRepositoryMock.save).toHaveBeenCalledTimes(1);
      expect(notificationPublisherMock.publish).toHaveBeenCalledTimes(1);
    });

    it('should create a delivery notification for order.status_changed / DELIVERED', async () => {
      (notificationRepositoryMock.save as jest.Mock).mockResolvedValue(undefined);
      (notificationPublisherMock.publish as jest.Mock).mockResolvedValue(undefined);

      const result = await useCase.execute({
        eventName: 'order.status_changed',
        payload: { ...basePayload, status: 'DELIVERED' },
      });

      expect(result.status).toBe(Status.SUCCESS);
      if (result.status === Status.SUCCESS) {
        expect(result.notification?.type).toBe(NotificationType.ORDER_DELIVERED);
      }
      expect(notificationRepositoryMock.save).toHaveBeenCalledTimes(1);
      expect(notificationPublisherMock.publish).toHaveBeenCalledTimes(1);
    });

    it('should return notification: null for transitions with no user-facing copy', async () => {
      const result = await useCase.execute({
        eventName: 'order.status_changed',
        payload: { ...basePayload, status: 'CREATED' },
      });

      expect(result.status).toBe(Status.SUCCESS);
      if (result.status === Status.SUCCESS) {
        expect(result.notification).toBeNull();
      }
      expect(notificationRepositoryMock.save).not.toHaveBeenCalled();
      expect(notificationPublisherMock.publish).not.toHaveBeenCalled();
    });
  });

  describe('Exception Handling Scenario', () => {
    it('should return error when notificationRepository.save throws, without letting the exception escape', async () => {
      (notificationRepositoryMock.save as jest.Mock).mockRejectedValue(
        new Error('Database connection failed'),
      );

      const result = await useCase.execute({
        eventName: 'order.status_changed',
        payload: { ...basePayload, status: 'DELIVERED' },
      });

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.message).toBe(
          'An unexpected error occurred. Please try again later.',
        );
      }
      expect(notificationPublisherMock.publish).not.toHaveBeenCalled();
    });

    it('should return error when notificationPublisher.publish throws, without letting the exception escape', async () => {
      (notificationRepositoryMock.save as jest.Mock).mockResolvedValue(undefined);
      (notificationPublisherMock.publish as jest.Mock).mockRejectedValue(
        new Error('Redis connection failed'),
      );

      const result = await useCase.execute({
        eventName: 'order.status_changed',
        payload: { ...basePayload, status: 'OUT_FOR_DELIVERY' },
      });

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.message).toBe(
          'An unexpected error occurred. Please try again later.',
        );
      }
      expect(notificationRepositoryMock.save).toHaveBeenCalledTimes(1);
    });
  });
});
