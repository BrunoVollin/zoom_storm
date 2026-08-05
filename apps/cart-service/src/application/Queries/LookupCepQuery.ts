import { CepAddress, CepLookupService } from '@src/domain/repositories/CepLookupService';
import { Query } from '../contracts/Query';
import { Status } from '../contracts/UseCase';

export class LookupCepQuery implements Query<Input, Output> {
  constructor(private readonly cepLookupService: CepLookupService) {}

  async execute(input: Input): Promise<Output> {
    const address = await this.cepLookupService.lookup(input.cep);

    return { status: Status.SUCCESS, address };
  }
}

interface Input {
  cep: string;
}

interface SuccessOutput {
  status: Status.SUCCESS;
  address: CepAddress | null;
}

type Output = SuccessOutput;
