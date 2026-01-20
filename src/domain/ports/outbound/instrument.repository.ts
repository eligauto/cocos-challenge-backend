import { Instrument } from '../../entities/instrument.entity';

export interface InstrumentRepository {
  findById(id: number): Promise<Instrument | null>;
  findByTicker(ticker: string): Promise<Instrument | null>;
  search(query: string): Promise<Instrument[]>;
}
