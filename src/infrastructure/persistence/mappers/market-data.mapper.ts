import { MarketData } from '../../../domain/entities/market-data.entity';
import { MarketDataOrmEntity } from '../entities/market-data.orm-entity';

export class MarketDataMapper {
  static toDomain(ormEntity: MarketDataOrmEntity): MarketData {
    return new MarketData(
      ormEntity.id,
      ormEntity.instrumentId,
      Number(ormEntity.high),
      Number(ormEntity.low),
      Number(ormEntity.open),
      Number(ormEntity.close),
      Number(ormEntity.previousClose),
      ormEntity.date,
    );
  }

  static toOrm(domain: MarketData): MarketDataOrmEntity {
    const orm = new MarketDataOrmEntity();
    orm.id = domain.id;
    orm.instrumentId = domain.instrumentId;
    orm.high = domain.high;
    orm.low = domain.low;
    orm.open = domain.open;
    orm.close = domain.close;
    orm.previousClose = domain.previousClose;
    orm.date = domain.date;
    return orm;
  }
}
