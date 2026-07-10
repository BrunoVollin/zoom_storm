export interface UseCase<Input, Output extends OutputUseCase> {
  execute(input: Input): Promise<Output>;
}

export interface SuccessOutput {
  status: Status.SUCCESS;
}

export interface ErrorOutput {
  status: Status.ERROR;
  message: string;
  code?: 'CONCURRENCY_CONFLICT';
}

export type OutputUseCase = SuccessOutput | ErrorOutput;

export enum Status {
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  PENDING = 'PENDING',
}
