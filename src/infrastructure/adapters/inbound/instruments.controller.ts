import { Controller, Get, Query } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { USE_CASE_TOKENS } from '../../../application/use-cases/use-case.tokens';
import { SearchInstrumentsUseCase } from '../../../domain/ports/inbound/search-instruments.use-case';

@Controller('instruments')
export class InstrumentsController {
  constructor(
    @Inject(USE_CASE_TOKENS.SEARCH_INSTRUMENTS)
    private readonly searchInstrumentsUseCase: SearchInstrumentsUseCase,
  ) {}

  @Get('search')
  async search(@Query('q') query: string) {
    const results = await this.searchInstrumentsUseCase.execute(query || '');

    return results.map((result) => ({
      instrument: {
        id: result.instrument.id,
        ticker: result.instrument.ticker,
        name: result.instrument.name,
        type: result.instrument.type,
      },
      marketData: result.marketData
        ? {
            close: result.marketData.close,
            previousClose: result.marketData.previousClose,
            dailyReturn: result.marketData.getDailyReturn(),
            high: result.marketData.high,
            low: result.marketData.low,
            date: result.marketData.date,
          }
        : null,
    }));
  }
}
