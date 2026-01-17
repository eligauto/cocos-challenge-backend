import { Injectable, Inject } from '@nestjs/common';
import {
  SearchInstrumentsUseCase,
  InstrumentWithMarketData,
} from '../../domain/ports/inbound/search-instruments.use-case';
import { InstrumentRepository } from '../../domain/ports/outbound/instrument.repository';
import { MarketDataRepository } from '../../domain/ports/outbound/market-data.repository';
import { REPOSITORY_TOKENS } from '../../infrastructure/adapters/outbound/repository.tokens';

@Injectable()
export class SearchInstrumentsService implements SearchInstrumentsUseCase {
  constructor(
    @Inject(REPOSITORY_TOKENS.INSTRUMENT_REPOSITORY)
    private readonly instrumentRepository: InstrumentRepository,
    @Inject(REPOSITORY_TOKENS.MARKET_DATA_REPOSITORY)
    private readonly marketDataRepository: MarketDataRepository,
  ) {}

  async execute(query: string): Promise<InstrumentWithMarketData[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const instruments = await this.instrumentRepository.search(query.trim());

    if (instruments.length === 0) {
      return [];
    }

    const instrumentIds = instruments.map((i) => i.id);
    const marketDataList = await this.marketDataRepository.findLatestByInstrumentIds(instrumentIds);
    const marketDataMap = new Map(marketDataList.map((md) => [md.instrumentId, md]));

    return instruments.map((instrument) => ({
      instrument,
      marketData: marketDataMap.get(instrument.id) || null,
    }));
  }
}
