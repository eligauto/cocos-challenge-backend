import { SearchInstrumentsService } from '../../src/application/use-cases/search-instruments.service';
import { InstrumentRepository } from '../../src/domain/ports/outbound/instrument.repository';
import { MarketDataRepository } from '../../src/domain/ports/outbound/market-data.repository';
import { Instrument } from '../../src/domain/entities/instrument.entity';
import { MarketData } from '../../src/domain/entities/market-data.entity';
import { InstrumentType } from '../../src/domain/value-objects/instrument-type.enum';

describe('SearchInstrumentsService', () => {
  let service: SearchInstrumentsService;
  let instrumentRepository: jest.Mocked<InstrumentRepository>;
  let marketDataRepository: jest.Mocked<MarketDataRepository>;

  beforeEach(() => {
    instrumentRepository = {
      findById: jest.fn(),
      findByTicker: jest.fn(),
      search: jest.fn(),
    };

    marketDataRepository = {
      findLatestByInstrumentId: jest.fn(),
      findLatestByInstrumentIds: jest.fn(),
    };

    service = new SearchInstrumentsService(instrumentRepository, marketDataRepository);
  });

  describe('execute', () => {
    it('should return empty array when no instruments match', async () => {
      instrumentRepository.search.mockResolvedValue([]);

      const result = await service.execute('NONEXISTENT');

      expect(result).toEqual([]);
    });

    it('should return instruments with market data', async () => {
      const mockInstrument = new Instrument(1, 'PAMP', 'Pampa Holding', InstrumentType.ACCIONES);
      const mockMarketData = new MarketData(1, 1, 105, 95, 98, 100, 98, new Date());

      instrumentRepository.search.mockResolvedValue([mockInstrument]);
      marketDataRepository.findLatestByInstrumentIds.mockResolvedValue([mockMarketData]);

      const result = await service.execute('PAMP');

      expect(result).toHaveLength(1);
      expect(result[0].instrument).toBe(mockInstrument);
      expect(result[0].marketData).toBe(mockMarketData);
    });

    it('should return instrument without market data when not available', async () => {
      const mockInstrument = new Instrument(1, 'PAMP', 'Pampa Holding', InstrumentType.ACCIONES);

      instrumentRepository.search.mockResolvedValue([mockInstrument]);
      marketDataRepository.findLatestByInstrumentIds.mockResolvedValue([]);

      const result = await service.execute('PAMP');

      expect(result).toHaveLength(1);
      expect(result[0].instrument).toBe(mockInstrument);
      expect(result[0].marketData).toBeNull();
    });

    it('should search by partial ticker', async () => {
      const mockInstruments = [
        new Instrument(1, 'PAMP', 'Pampa Holding', InstrumentType.ACCIONES),
        new Instrument(2, 'PAM2', 'Pampa Holding 2', InstrumentType.ACCIONES),
      ];

      instrumentRepository.search.mockResolvedValue(mockInstruments);
      marketDataRepository.findLatestByInstrumentIds.mockResolvedValue([]);

      const result = await service.execute('PAM');

      expect(instrumentRepository.search).toHaveBeenCalledWith('PAM');
      expect(result).toHaveLength(2);
    });

    it('should search by name', async () => {
      const mockInstrument = new Instrument(1, 'GGAL', 'Grupo Galicia', InstrumentType.ACCIONES);

      instrumentRepository.search.mockResolvedValue([mockInstrument]);
      marketDataRepository.findLatestByInstrumentIds.mockResolvedValue([]);

      const result = await service.execute('Galicia');

      expect(instrumentRepository.search).toHaveBeenCalledWith('Galicia');
      expect(result).toHaveLength(1);
    });

    it('should not call market data repository when no instruments found', async () => {
      instrumentRepository.search.mockResolvedValue([]);

      await service.execute('NONEXISTENT');

      expect(marketDataRepository.findLatestByInstrumentIds).not.toHaveBeenCalled();
    });

    it('should match market data to correct instruments', async () => {
      const instrument1 = new Instrument(1, 'PAMP', 'Pampa Holding', InstrumentType.ACCIONES);
      const instrument2 = new Instrument(2, 'GGAL', 'Galicia', InstrumentType.ACCIONES);
      const marketData1 = new MarketData(1, 1, 105, 95, 98, 100, 98, new Date());
      const marketData2 = new MarketData(2, 2, 210, 195, 198, 200, 198, new Date());

      instrumentRepository.search.mockResolvedValue([instrument1, instrument2]);
      marketDataRepository.findLatestByInstrumentIds.mockResolvedValue([marketData2, marketData1]);

      const result = await service.execute('P');

      expect(result[0].marketData?.close).toBe(100);
      expect(result[1].marketData?.close).toBe(200);
    });
  });
});
