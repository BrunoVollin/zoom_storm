import { ConcurrencyConflictError } from '@src/domain/errors/ConcurrencyConflictError';
import { ErrorOutput, Status } from '../contracts/UseCase';

export function handleUnexpectedError(error: unknown): ErrorOutput {
  console.error(error);

  if (error instanceof ConcurrencyConflictError) {
    return {
      status: Status.ERROR,
      message: 'Cart was modified concurrently, please retry.',
    };
  }

  return {
    status: Status.ERROR,
    message: 'An unexpected error occurred. Please try again later.',
  };
}
