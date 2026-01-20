import { Instrument } from '../../../domain/entities/instrument.entity';
import { InstrumentType } from '../../../domain/value-objects/instrument-type.enum';
import { InstrumentOrmEntity } from '../entities/instrument.orm-entity';

export class InstrumentMapper {
  static toDomain(ormEntity: InstrumentOrmEntity): Instrument {
    return new Instrument(
      ormEntity.id,
      ormEntity.ticker,
      ormEntity.name,
      ormEntity.type as InstrumentType,
    );
  }

  static toOrm(domain: Instrument): InstrumentOrmEntity {
    const orm = new InstrumentOrmEntity();
    orm.id = domain.id;
    orm.ticker = domain.ticker;
    orm.name = domain.name;
    orm.type = domain.type;
    return orm;
  }
}
