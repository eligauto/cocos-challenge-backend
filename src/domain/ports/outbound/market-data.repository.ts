import { MarketData } from '../../entities/market-data.entity';

export interface MarketDataRepository {
  findLatestByInstrumentId(instrumentId: number): Promise<MarketData | null>;
  findLatestByInstrumentIds(instrumentIds: number[]): Promise<MarketData[]>;
}
