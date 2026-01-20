import { DomainException } from './domain.exception';

export class InsufficientFundsException extends DomainException {
  constructor(available: number, required: number) {
    super(`Insufficient funds. Available: ${available}, Required: ${required}`);
  }
}
