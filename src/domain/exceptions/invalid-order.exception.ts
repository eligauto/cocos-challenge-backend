import { DomainException } from './domain.exception';

export class InvalidOrderException extends DomainException {
  constructor(reason: string) {
    super(`Invalid order: ${reason}`);
  }
}
