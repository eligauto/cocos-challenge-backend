import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { MarketData } from '../../../domain/entities/market-data.entity';
import { MarketDataRepository } from '../../../domain/ports/outbound/market-data.repository';
import { MarketDataOrmEntity } from '../../persistence/entities/market-data.orm-entity';
import { MarketDataMapper } from '../../persistence/mappers/market-data.mapper';

@Injectable()
export class MarketDataRepositoryAdapter implements MarketDataRepository {
  constructor(
    @InjectRepository(MarketDataOrmEntity)
    private readonly marketDataRepository: Repository<MarketDataOrmEntity>,
  ) {}

  async findLatestByInstrumentId(instrumentId: number): Promise<MarketData | null> {
    const entity = await this.marketDataRepository.findOne({
      where: { instrumentId },
      order: { date: 'DESC' },
    });
    return entity ? MarketDataMapper.toDomain(entity) : null;
  }

  async findLatestByInstrumentIds(instrumentIds: number[]): Promise<MarketData[]> {
    if (instrumentIds.length === 0) {
      return [];
    }

    // Subquery to get the latest date for each instrument
    const latestData = await this.marketDataRepository
      .createQueryBuilder('md')
      .where('md.instrumentId IN (:...instrumentIds)', { instrumentIds })
      .andWhere(
        `md.date = (
          SELECT MAX(md2.date) 
          FROM marketdata md2 
          WHERE md2.instrumentId = md.instrumentId
        )`,
      )
      .getMany();

    return latestData.map(MarketDataMapper.toDomain);
  }
}
