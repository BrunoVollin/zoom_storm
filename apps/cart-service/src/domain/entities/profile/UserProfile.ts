import { IdType } from '../../shared/IdType';
import { Address } from './Address';

/**
 * CPF (11 digits) or CNPJ (14 digits) — only the digit count is checked, no
 * checksum, matching the "no extra validation" approach already used for
 * credit card input in the payment flow.
 */
function assertValidDocument(document: string) {
  const digits = document.replace(/\D/g, '');

  if (digits.length !== 11 && digits.length !== 14) {
    throw new Error('Document must be a valid CPF (11 digits) or CNPJ (14 digits)');
  }
}

export class UserProfile {
  constructor(
    readonly userId: IdType,
    private fullName: string,
    private document: string,
    private address: Address,
    readonly updatedAt: Date = new Date(),
  ) {
    this.validate();
  }

  private validate() {
    if (!this.fullName.trim()) throw new Error('Full name is required');
    assertValidDocument(this.document);
  }

  update(fullName: string, document: string, address: Address) {
    this.fullName = fullName;
    this.document = document;
    this.address = address;
    this.validate();
  }

  getFullName(): string {
    return this.fullName;
  }

  getDocument(): string {
    return this.document;
  }

  getAddress(): Address {
    return this.address;
  }
}
