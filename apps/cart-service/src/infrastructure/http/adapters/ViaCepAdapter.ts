import { CepAddress, CepLookupService } from '../../../domain/repositories/CepLookupService';

interface ViaCepResponse {
  localidade?: string;
  uf?: string;
  erro?: boolean;
}

/**
 * First real third-party HTTP integration in this codebase — every other
 * `fetch()` call in the repo is an internal service-to-service proxy.
 */
export class ViaCepAdapter implements CepLookupService {
  async lookup(cep: string): Promise<CepAddress | null> {
    const digits = cep.replace(/\D/g, '');

    if (digits.length !== 8) return null;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`, {
        signal: controller.signal,
      });

      if (!response.ok) return null;

      const data = (await response.json()) as ViaCepResponse;

      if (data.erro || !data.localidade || !data.uf) return null;

      return { city: data.localidade, state: data.uf };
    } catch {
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }
}
