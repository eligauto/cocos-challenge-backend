import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Instrument } from '../../../domain/entities/instrument.entity';
import { InstrumentRepository } from '../../../domain/ports/outbound/instrument.repository';
import { InstrumentOrmEntity } from '../../persistence/entities/instrument.orm-entity';
import { InstrumentMapper } from '../../persistence/mappers/instrument.mapper';

@Injectable()
export class InstrumentRepositoryAdapter implements InstrumentRepository {
  constructor(
    @InjectRepository(InstrumentOrmEntity)
    private readonly instrumentRepository: Repository<InstrumentOrmEntity>,
  ) {}

  async findById(id: number): Promise<Instrument | null> {
    const entity = await this.instrumentRepository.findOne({ where: { id } });
    return entity ? InstrumentMapper.toDomain(entity) : null;
  }

  async findByTicker(ticker: string): Promise<Instrument | null> {
    const entity = await this.instrumentRepository.findOne({
      where: { ticker: ticker.toUpperCase() },
    });
    return entity ? InstrumentMapper.toDomain(entity) : null;
  }

  async search(query: string): Promise<Instrument[]> {
    const entities = await this.instrumentRepository.find({
      where: [
        { ticker: ILike(`%${query}%`) },
        { name: ILike(`%${query}%`) },
      ],
      order: { ticker: 'ASC' },
    });
    return entities.map(InstrumentMapper.toDomain);
  }
}
