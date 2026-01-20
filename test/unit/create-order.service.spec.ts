import { CreateOrderService } from '../../src/application/use-cases/create-order.service';
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
import { InvalidOrderException } from '../../src/domain/exceptions/invalid-order.exception';

describe('CreateOrderService', () => {
  let service: CreateOrderService;
  let userRepository: jest.Mocked<UserRepository>;
  let orderRepository: jest.Mocked<OrderRepository>;
  let instrumentRepository: jest.Mocked<InstrumentRepository>;
  let marketDataRepository: jest.Mocked<MarketDataRepository>;
  let getPortfolioService: jest.Mocked<GetPortfolioService>;

  const mockUser = new User(1, 'test@example.com', 'ACC-001');
  const mockStockInstrument = new Instrument(1, 'PAMP', 'Pampa Holding', InstrumentType.ACCIONES);
  const mockCurrencyInstrument = new Instrument(66, 'ARS', 'Peso Argentino', InstrumentType.MONEDA);
  const mockMarketData = new MarketData(1, 1, 105, 95, 98, 100, 98, new Date());

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

    getPortfolioService = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetPortfolioService>;

    service = new CreateOrderService(
      userRepository,
      orderRepository,
      instrumentRepository,
      marketDataRepository,
      getPortfolioService,
    );
  });

  describe('execute', () => {
    it('should throw EntityNotFoundException when user does not exist', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(
        service.execute({
          userId: 999,
          instrumentId: 1,
          side: OrderSide.BUY,
          type: OrderType.MARKET,
          quantity: 10,
        }),
      ).rejects.toThrow(EntityNotFoundException);
    });

    it('should throw EntityNotFoundException when instrument does not exist', async () => {
      userRepository.findById.mockResolvedValue(mockUser);
      instrumentRepository.findById.mockResolvedValue(null);

      await expect(
        service.execute({
          userId: 1,
          instrumentId: 999,
          side: OrderSide.BUY,
          type: OrderType.MARKET,
          quantity: 10,
        }),
      ).rejects.toThrow(EntityNotFoundException);
    });

    it('should throw InvalidOrderException when both quantity and totalAmount are provided', async () => {
      userRepository.findById.mockResolvedValue(mockUser);
      instrumentRepository.findById.mockResolvedValue(mockStockInstrument);

      await expect(
        service.execute({
          userId: 1,
          instrumentId: 1,
          side: OrderSide.BUY,
          type: OrderType.MARKET,
          quantity: 10,
          totalAmount: 1000,
        }),
      ).rejects.toThrow(InvalidOrderException);
    });

    it('should throw InvalidOrderException when neither quantity nor totalAmount is provided', async () => {
      userRepository.findById.mockResolvedValue(mockUser);
      instrumentRepository.findById.mockResolvedValue(mockStockInstrument);

      await expect(
        service.execute({
          userId: 1,
          instrumentId: 1,
          side: OrderSide.BUY,
          type: OrderType.MARKET,
        }),
      ).rejects.toThrow(InvalidOrderException);
    });

    it('should throw InvalidOrderException for BUY on currency instrument', async () => {
      userRepository.findById.mockResolvedValue(mockUser);
      instrumentRepository.findById.mockResolvedValue(mockCurrencyInstrument);

      await expect(
        service.execute({
          userId: 1,
          instrumentId: 66,
          side: OrderSide.BUY,
          type: OrderType.MARKET,
          quantity: 10,
        }),
      ).rejects.toThrow(InvalidOrderException);
    });

    it('should throw InvalidOrderException for SELL on currency instrument', async () => {
      userRepository.findById.mockResolvedValue(mockUser);
      instrumentRepository.findById.mockResolvedValue(mockCurrencyInstrument);

      await expect(
        service.execute({
          userId: 1,
          instrumentId: 66,
          side: OrderSide.SELL,
          type: OrderType.MARKET,
          quantity: 10,
        }),
      ).rejects.toThrow(InvalidOrderException);
    });

    it('should throw InvalidOrderException for CASH_IN on stock instrument', async () => {
      userRepository.findById.mockResolvedValue(mockUser);
      instrumentRepository.findById.mockResolvedValue(mockStockInstrument);

      await expect(
        service.execute({
          userId: 1,
          instrumentId: 1,
          side: OrderSide.CASH_IN,
          type: OrderType.MARKET,
          quantity: 1000,
        }),
      ).rejects.toThrow(InvalidOrderException);
    });

    it('should throw InvalidOrderException for CASH_OUT on stock instrument', async () => {
      userRepository.findById.mockResolvedValue(mockUser);
      instrumentRepository.findById.mockResolvedValue(mockStockInstrument);

      await expect(
        service.execute({
          userId: 1,
          instrumentId: 1,
          side: OrderSide.CASH_OUT,
          type: OrderType.MARKET,
          quantity: 1000,
        }),
      ).rejects.toThrow(InvalidOrderException);
    });

    it('should throw InvalidOrderException for LIMIT order without price', async () => {
      userRepository.findById.mockResolvedValue(mockUser);
      instrumentRepository.findById.mockResolvedValue(mockStockInstrument);

      await expect(
        service.execute({
          userId: 1,
          instrumentId: 1,
          side: OrderSide.BUY,
          type: OrderType.LIMIT,
          quantity: 10,
        }),
      ).rejects.toThrow(InvalidOrderException);
    });

    it('should create a FILLED MARKET BUY order with sufficient funds', async () => {
      userRepository.findById.mockResolvedValue(mockUser);
      instrumentRepository.findById.mockResolvedValue(mockStockInstrument);
      marketDataRepository.findLatestByInstrumentId.mockResolvedValue(mockMarketData);
      getPortfolioService.execute.mockResolvedValue({
        userId: 1,
        totalAccountValue: 10000,
        availableCash: 10000,
        positions: [],
      });

      const savedOrder = new Order(
        1,
        1,
        1,
        OrderSide.BUY,
        10,
        100,
        OrderType.MARKET,
        OrderStatus.FILLED,
        new Date(),
      );
      orderRepository.save.mockResolvedValue(savedOrder);

      const result = await service.execute({
        userId: 1,
        instrumentId: 1,
        side: OrderSide.BUY,
        type: OrderType.MARKET,
        quantity: 10,
      });

      expect(result.status).toBe(OrderStatus.FILLED);
      expect(orderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 1,
          instrumentId: 1,
          side: OrderSide.BUY,
          size: 10,
          status: OrderStatus.FILLED,
        }),
      );
    });

    it('should create a REJECTED order when insufficient funds for BUY', async () => {
      userRepository.findById.mockResolvedValue(mockUser);
      instrumentRepository.findById.mockResolvedValue(mockStockInstrument);
      marketDataRepository.findLatestByInstrumentId.mockResolvedValue(mockMarketData);
      getPortfolioService.execute.mockResolvedValue({
        userId: 1,
        totalAccountValue: 100,
        availableCash: 100,
        positions: [],
      });

      const savedOrder = new Order(
        1,
        1,
        1,
        OrderSide.BUY,
        10,
        100,
        OrderType.MARKET,
        OrderStatus.REJECTED,
        new Date(),
      );
      orderRepository.save.mockResolvedValue(savedOrder);

      const result = await service.execute({
        userId: 1,
        instrumentId: 1,
        side: OrderSide.BUY,
        type: OrderType.MARKET,
        quantity: 10,
      });

      expect(result.status).toBe(OrderStatus.REJECTED);
      expect(orderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: OrderStatus.REJECTED,
        }),
      );
    });

    it('should create a REJECTED order when insufficient shares for SELL', async () => {
      userRepository.findById.mockResolvedValue(mockUser);
      instrumentRepository.findById.mockResolvedValue(mockStockInstrument);
      marketDataRepository.findLatestByInstrumentId.mockResolvedValue(mockMarketData);
      getPortfolioService.execute.mockResolvedValue({
        userId: 1,
        totalAccountValue: 10000,
        availableCash: 10000,
        positions: [],
      });

      const savedOrder = new Order(
        1,
        1,
        1,
        OrderSide.SELL,
        10,
        100,
        OrderType.MARKET,
        OrderStatus.REJECTED,
        new Date(),
      );
      orderRepository.save.mockResolvedValue(savedOrder);

      const result = await service.execute({
        userId: 1,
        instrumentId: 1,
        side: OrderSide.SELL,
        type: OrderType.MARKET,
        quantity: 10,
      });

      expect(result.status).toBe(OrderStatus.REJECTED);
    });

    it('should create a NEW LIMIT order', async () => {
      userRepository.findById.mockResolvedValue(mockUser);
      instrumentRepository.findById.mockResolvedValue(mockStockInstrument);
      getPortfolioService.execute.mockResolvedValue({
        userId: 1,
        totalAccountValue: 10000,
        availableCash: 10000,
        positions: [],
      });

      const savedOrder = new Order(
        1,
        1,
        1,
        OrderSide.BUY,
        10,
        90,
        OrderType.LIMIT,
        OrderStatus.NEW,
        new Date(),
      );
      orderRepository.save.mockResolvedValue(savedOrder);

      const result = await service.execute({
        userId: 1,
        instrumentId: 1,
        side: OrderSide.BUY,
        type: OrderType.LIMIT,
        quantity: 10,
        price: 90,
      });

      expect(result.status).toBe(OrderStatus.NEW);
      expect(result.type).toBe(OrderType.LIMIT);
    });

    it('should create a FILLED CASH_IN order', async () => {
      userRepository.findById.mockResolvedValue(mockUser);
      instrumentRepository.findById.mockResolvedValue(mockCurrencyInstrument);
      getPortfolioService.execute.mockResolvedValue({
        userId: 1,
        totalAccountValue: 0,
        availableCash: 0,
        positions: [],
      });

      const savedOrder = new Order(
        1,
        66,
        1,
        OrderSide.CASH_IN,
        10000,
        1,
        OrderType.MARKET,
        OrderStatus.FILLED,
        new Date(),
      );
      orderRepository.save.mockResolvedValue(savedOrder);

      const result = await service.execute({
        userId: 1,
        instrumentId: 66,
        side: OrderSide.CASH_IN,
        type: OrderType.MARKET,
        quantity: 10000,
      });

      expect(result.status).toBe(OrderStatus.FILLED);
      expect(result.side).toBe(OrderSide.CASH_IN);
      expect(orderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          price: 1,
        }),
      );
    });

    it('should calculate quantity from totalAmount', async () => {
      userRepository.findById.mockResolvedValue(mockUser);
      instrumentRepository.findById.mockResolvedValue(mockStockInstrument);
      marketDataRepository.findLatestByInstrumentId.mockResolvedValue(mockMarketData);
      getPortfolioService.execute.mockResolvedValue({
        userId: 1,
        totalAccountValue: 10000,
        availableCash: 10000,
        positions: [],
      });

      const savedOrder = new Order(
        1,
        1,
        1,
        OrderSide.BUY,
        10,
        100,
        OrderType.MARKET,
        OrderStatus.FILLED,
        new Date(),
      );
      orderRepository.save.mockResolvedValue(savedOrder);

      await service.execute({
        userId: 1,
        instrumentId: 1,
        side: OrderSide.BUY,
        type: OrderType.MARKET,
        totalAmount: 1050,
      });

      expect(orderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          size: 10,
        }),
      );
    });
  });
});
