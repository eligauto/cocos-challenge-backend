import { Instrument } from '../../entities/instrument.entity';
import { MarketData } from '../../entities/market-data.entity';

export interface InstrumentWithMarketData {
  instrument: Instrument;
  marketData: MarketData | null;
}

export interface SearchInstrumentsUseCase {
  execute(query: string): Promise<InstrumentWithMarketData[]>;
}
