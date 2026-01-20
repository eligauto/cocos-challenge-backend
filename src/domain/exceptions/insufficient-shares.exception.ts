import { DomainException } from './domain.exception';

export class InsufficientSharesException extends DomainException {
  constructor(ticker: string, available: number, required: number) {
    super(`Insufficient shares of ${ticker}. Available: ${available}, Required: ${required}`);
  }
}
