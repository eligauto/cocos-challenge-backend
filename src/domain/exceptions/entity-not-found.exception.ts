import { DomainException } from './domain.exception';

export class EntityNotFoundException extends DomainException {
  constructor(entity: string, identifier: string | number) {
    super(`${entity} with identifier ${identifier} not found`);
  }
}
