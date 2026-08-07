export class DuplicateNotificationEventError extends Error {
  constructor(sourceEventKey: string) {
    super(`Notification for event ${sourceEventKey} was already processed`);
    this.name = 'DuplicateNotificationEventError';
  }
}
