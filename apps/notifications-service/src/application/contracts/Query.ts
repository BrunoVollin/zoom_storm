export interface Query<Input, Output extends OutputQuery> {
  execute(input: Input): Promise<Output>;
}

export interface SuccessOutput {
  status: Status.SUCCESS;
}

export interface ErrorOutput {
  status: Status.ERROR;
  message: string;
}

export type OutputQuery = SuccessOutput | ErrorOutput;

export enum Status {
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  PENDING = 'PENDING',
}
