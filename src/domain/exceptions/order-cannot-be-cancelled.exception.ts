import { DomainException } from './domain.exception';

export class OrderCannotBeCancelledException extends DomainException {
  constructor(orderId: number, currentStatus: string) {
    super(`Order ${orderId} cannot be cancelled. Current status: ${currentStatus}`);
  }
}
