import { ErrorOutput, Status } from '../contracts/UseCase';

export function handleUnexpectedError(error: unknown): ErrorOutput {
  console.error(error);

  return {
    status: Status.ERROR,
    message: 'An unexpected error occurred. Please try again later.',
  };
}
