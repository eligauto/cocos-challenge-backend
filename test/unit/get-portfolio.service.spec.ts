import { GetPortfolioService } from '../../src/application/use-cases/get-portfolio.service';
import { UserRepository } from '../../src/domain/ports/outbound/user.repository';
import { OrderRepository } from '../../src/domain/ports/outbound/order.repository';
import { InstrumentRepository } from '../../src/domain/ports/outbound/instrument.repository';
import { MarketDataRepository } from '../../src/domain/ports/outbound/market-data.repository';
import { User } from '../../src/domain/entities/user.entity';
import { Instrument } from '../../src/domain/entities/instrument.entity';
import { Order } from '../../src/domain/entities/order.entity';
import { MarketData } from '../../src/domain/entities/market-data.entity';
import { OrderSide } from '../../src/domain/value-objects/order-side.enum';
import { OrderType } from '../../src/domain/value-objects/order-type.enum';
import { OrderStatus } from '../../src/domain/value-objects/order-status.enum';
import { InstrumentType } from '../../src/domain/value-objects/instrument-type.enum';
import { EntityNotFoundException } from '../../src/domain/exceptions/entity-not-found.exception';

describe('GetPortfolioService', () => {
  let service: GetPortfolioService;
  let userRepository: jest.Mocked<UserRepository>;
  let orderRepository: jest.Mocked<OrderRepository>;
  let instrumentRepository: jest.Mocked<InstrumentRepository>;
  let marketDataRepository: jest.Mocked<MarketDataRepository>;

  const mockUser = new User(1, 'test@example.com', 'ACC-001');
  const mockStockInstrument = new Instrument(1, 'PAMP', 'Pampa Holding', InstrumentType.ACCIONES);

  const createOrder = (
    id: number,
    instrumentId: number,
    side: OrderSide,
    size: number,
    price: number,
  ): Order =>
    new Order(
      id,
      instrumentId,
      1,
      side,
      size,
      price,
      OrderType.MARKET,
      OrderStatus.FILLED,
      new Date(),
    );

  beforeEach(() => {
    userRepository = {
      findById: jest.fn(),
      findByAccountNumber: jest.fn(),
    };

    orderRepository = {
      findById: jest.fn(),
      findByUserId: jest.fn(),
      findByUserIdAndStatus: jest.fn(),
      save: jest.fn(),
      updateStatus: jest.fn(),
    };

    instrumentRepository = {
      findById: jest.fn(),
      findByTicker: jest.fn(),
      search: jest.fn(),
    };

    marketDataRepository = {
      findLatestByInstrumentId: jest.fn(),
      findLatestByInstrumentIds: jest.fn(),
    };

    service = new GetPortfolioService(
      userRepository,
      orderRepository,
      instrumentRepository,
      marketDataRepository,
    );
  });

  describe('execute', () => {
    it('should throw EntityNotFoundException when user does not exist', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(service.execute(999)).rejects.toThrow(EntityNotFoundException);
    });

    it('should return empty portfolio for user with no orders', async () => {
      userRepository.findById.mockResolvedValue(mockUser);
      orderRepository.findByUserIdAndStatus.mockResolvedValue([]);

      const result = await service.execute(1);

      expect(result).toEqual({
        userId: 1,
        totalAccountValue: 0,
        availableCash: 0,
        positions: [],
      });
    });

    it('should calculate cash balance correctly after CASH_IN', async () => {
      userRepository.findById.mockResolvedValue(mockUser);
      orderRepository.findByUserIdAndStatus.mockResolvedValue([
        createOrder(1, 66, OrderSide.CASH_IN, 10000, 1),
      ]);

      const result = await service.execute(1);

      expect(result.availableCash).toBe(10000);
      expect(result.totalAccountValue).toBe(10000);
    });

    it('should calculate cash balance correctly after CASH_IN and CASH_OUT', async () => {
      userRepository.findById.mockResolvedValue(mockUser);
      orderRepository.findByUserIdAndStatus.mockResolvedValue([
        createOrder(1, 66, OrderSide.CASH_IN, 10000, 1),
        createOrder(2, 66, OrderSide.CASH_OUT, 3000, 1),
      ]);

      const result = await service.execute(1);

      expect(result.availableCash).toBe(7000);
    });

    it('should calculate positions correctly after BUY', async () => {
      userRepository.findById.mockResolvedValue(mockUser);
      orderRepository.findByUserIdAndStatus.mockResolvedValue([
        createOrder(1, 66, OrderSide.CASH_IN, 10000, 1),
        createOrder(2, 1, OrderSide.BUY, 10, 100),
      ]);
      instrumentRepository.findById.mockResolvedValue(mockStockInstrument);
      marketDataRepository.findLatestByInstrumentIds.mockResolvedValue([
        new MarketData(1, 1, 115, 100, 98, 110, 100, new Date()),
      ]);

      const result = await service.execute(1);

      expect(result.availableCash).toBe(9000); // 10000 - 1000
      expect(result.positions).toHaveLength(1);
      expect(result.positions[0].quantity).toBe(10);
      expect(result.positions[0].averagePrice).toBe(100);
      expect(result.positions[0].currentPrice).toBe(110);
    });

    it('should calculate positions correctly after BUY and SELL', async () => {
      userRepository.findById.mockResolvedValue(mockUser);
      orderRepository.findByUserIdAndStatus.mockResolvedValue([
        createOrder(1, 66, OrderSide.CASH_IN, 10000, 1),
        createOrder(2, 1, OrderSide.BUY, 10, 100),
        createOrder(3, 1, OrderSide.SELL, 5, 110),
      ]);
      instrumentRepository.findById.mockResolvedValue(mockStockInstrument);
      marketDataRepository.findLatestByInstrumentIds.mockResolvedValue([
        new MarketData(1, 1, 115, 100, 98, 110, 100, new Date()),
      ]);

      const result = await service.execute(1);

      expect(result.availableCash).toBe(9550); // 10000 - 1000 + 550
      expect(result.positions).toHaveLength(1);
      expect(result.positions[0].quantity).toBe(5);
    });

    it('should remove position when all shares are sold', async () => {
      userRepository.findById.mockResolvedValue(mockUser);
      orderRepository.findByUserIdAndStatus.mockResolvedValue([
        createOrder(1, 66, OrderSide.CASH_IN, 10000, 1),
        createOrder(2, 1, OrderSide.BUY, 10, 100),
        createOrder(3, 1, OrderSide.SELL, 10, 110),
      ]);
      marketDataRepository.findLatestByInstrumentIds.mockResolvedValue([]);

      const result = await service.execute(1);

      expect(result.availableCash).toBe(10100); // 10000 - 1000 + 1100
      expect(result.positions).toHaveLength(0);
    });

    it('should calculate average price correctly for multiple buys', async () => {
      userRepository.findById.mockResolvedValue(mockUser);
      orderRepository.findByUserIdAndStatus.mockResolvedValue([
        createOrder(1, 66, OrderSide.CASH_IN, 20000, 1),
        createOrder(2, 1, OrderSide.BUY, 10, 100),
        createOrder(3, 1, OrderSide.BUY, 10, 200),
      ]);
      instrumentRepository.findById.mockResolvedValue(mockStockInstrument);
      marketDataRepository.findLatestByInstrumentIds.mockResolvedValue([
        new MarketData(1, 1, 160, 140, 145, 150, 140, new Date()),
      ]);

      const result = await service.execute(1);

      expect(result.positions[0].quantity).toBe(20);
      expect(result.positions[0].averagePrice).toBe(150); // (1000 + 2000) / 20
    });

    it('should handle multiple instruments', async () => {
      const mockInstrument2 = new Instrument(2, 'GGAL', 'Galicia', InstrumentType.ACCIONES);

      userRepository.findById.mockResolvedValue(mockUser);
      orderRepository.findByUserIdAndStatus.mockResolvedValue([
        createOrder(1, 66, OrderSide.CASH_IN, 20000, 1),
        createOrder(2, 1, OrderSide.BUY, 10, 100),
        createOrder(3, 2, OrderSide.BUY, 20, 50),
      ]);
      instrumentRepository.findById
        .mockResolvedValueOnce(mockStockInstrument)
        .mockResolvedValueOnce(mockInstrument2);
      marketDataRepository.findLatestByInstrumentIds.mockResolvedValue([
        new MarketData(1, 1, 115, 100, 98, 110, 100, new Date()),
        new MarketData(2, 2, 60, 50, 48, 55, 50, new Date()),
      ]);

      const result = await service.execute(1);

      expect(result.positions).toHaveLength(2);
      expect(result.availableCash).toBe(18000);
    });
  });
});
