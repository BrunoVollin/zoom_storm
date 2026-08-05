import type { Context } from 'hono';
import { LookupCepQuery } from '@application/Queries/LookupCepQuery';

export class CepLookupController {
  constructor(private readonly lookupCep: LookupCepQuery) {}

  async lookup(c: Context) {
    const result = await this.lookupCep.execute({ cep: c.req.param('cep') });

    return c.json(result, 200);
  }
}
