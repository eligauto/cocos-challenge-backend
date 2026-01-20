import { Injectable, Inject } from '@nestjs/common';
import {
  CreateOrderUseCase,
  CreateOrderCommand,
} from '../../domain/ports/inbound/create-order.use-case';
import { Order } from '../../domain/entities/order.entity';
import { Instrument } from '../../domain/entities/instrument.entity';
import { OrderRepository } from '../../domain/ports/outbound/order.repository';
import { InstrumentRepository } from '../../domain/ports/outbound/instrument.repository';
import { MarketDataRepository } from '../../domain/ports/outbound/market-data.repository';
import { UserRepository } from '../../domain/ports/outbound/user.repository';
import { REPOSITORY_TOKENS } from '../../infrastructure/adapters/outbound/repository.tokens';
import { OrderStatus } from '../../domain/value-objects/order-status.enum';
import { OrderType } from '../../domain/value-objects/order-type.enum';
import { OrderSide } from '../../domain/value-objects/order-side.enum';
import { EntityNotFoundException } from '../../domain/exceptions/entity-not-found.exception';
import { InvalidOrderException } from '../../domain/exceptions/invalid-order.exception';
import { GetPortfolioService } from './get-portfolio.service';

@Injectable()
export class CreateOrderService implements CreateOrderUseCase {
  constructor(
    @Inject(REPOSITORY_TOKENS.USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(REPOSITORY_TOKENS.ORDER_REPOSITORY)
    private readonly orderRepository: OrderRepository,
    @Inject(REPOSITORY_TOKENS.INSTRUMENT_REPOSITORY)
    private readonly instrumentRepository: InstrumentRepository,
    @Inject(REPOSITORY_TOKENS.MARKET_DATA_REPOSITORY)
    private readonly marketDataRepository: MarketDataRepository,
    private readonly getPortfolioService: GetPortfolioService,
  ) {}

  async execute(command: CreateOrderCommand): Promise<Order> {
    const user = await this.userRepository.findById(command.userId);
    if (!user) {
      throw new EntityNotFoundException('User', command.userId);
    }

    const instrument = await this.instrumentRepository.findById(command.instrumentId);
    if (!instrument) {
      throw new EntityNotFoundException('Instrument', command.instrumentId);
    }

    this.validateSideForInstrumentType(command.side, instrument);

    if (!command.quantity && !command.totalAmount) {
      throw new InvalidOrderException('Either quantity or totalAmount must be provided');
    }

    if (command.quantity && command.totalAmount) {
      throw new InvalidOrderException('Cannot specify both quantity and totalAmount. Use only one.');
    }

    const price = await this.resolvePrice(command, instrument);

    const quantity = this.calculateQuantity(command, price);

    if (quantity <= 0) {
      throw new InvalidOrderException('Order quantity must be greater than 0');
    }

    const rejectionReason = await this.checkBalance(command.userId, command.side, command.instrumentId, quantity, price);

    let status: OrderStatus;
    if (rejectionReason) {
      status = OrderStatus.REJECTED;
    } else {
      const isCashOperation = command.side === OrderSide.CASH_IN || command.side === OrderSide.CASH_OUT;
      status = isCashOperation || command.type === OrderType.MARKET 
        ? OrderStatus.FILLED 
        : OrderStatus.NEW;
    }

    const orderData = {
      instrumentId: command.instrumentId,
      userId: command.userId,
      side: command.side,
      size: quantity,
      price,
      type: command.type,
      status,
      datetime: new Date(),
    };

    return this.orderRepository.save(orderData);
  }

  private async resolvePrice(command: CreateOrderCommand, instrument: Instrument): Promise<number> {
    if (command.side === OrderSide.CASH_IN || command.side === OrderSide.CASH_OUT) {
      return 1;
    }

    if (command.type === OrderType.LIMIT) {
      if (!command.price || command.price <= 0) {
        throw new InvalidOrderException('LIMIT orders require a valid price');
      }
      return command.price;
    }

    const marketData = await this.marketDataRepository.findLatestByInstrumentId(command.instrumentId);
    if (!marketData) {
      throw new InvalidOrderException('No market data available for this instrument');
    }
    return marketData.close;
  }

  private calculateQuantity(command: CreateOrderCommand, price: number): number {
    if (command.quantity) {
      return command.quantity;
    }

    return Math.floor(command.totalAmount / price);
  }

  private async checkBalance(
    userId: number,
    side: OrderSide,
    instrumentId: number,
    quantity: number,
    price: number,
  ): Promise<string | null> {
    const portfolio = await this.getPortfolioService.execute(userId);

    if (side === OrderSide.BUY) {
      const requiredAmount = quantity * price;
      if (portfolio.availableCash < requiredAmount) {
        return `INSUFFICIENT_FUNDS: Available ${portfolio.availableCash}, required ${requiredAmount}`;
      }
    } else if (side === OrderSide.SELL) {
      const position = portfolio.positions.find((p) => p.instrument.id === instrumentId);
      const availableShares = position?.quantity || 0;
      if (availableShares < quantity) {
        const instrument = await this.instrumentRepository.findById(instrumentId);
        return `INSUFFICIENT_SHARES: Available ${availableShares} shares of ${instrument.ticker}, required ${quantity}`;
      }
    } else if (side === OrderSide.CASH_OUT) {
      const requiredAmount = quantity * price;
      if (portfolio.availableCash < requiredAmount) {
        return `INSUFFICIENT_FUNDS: Available ${portfolio.availableCash}, required ${requiredAmount}`;
      }
    }

    return null;
  }

  private validateSideForInstrumentType(side: OrderSide, instrument: Instrument): void {
    const isCashOperation = side === OrderSide.CASH_IN || side === OrderSide.CASH_OUT;
    const isTradeOperation = side === OrderSide.BUY || side === OrderSide.SELL;

    if (isCashOperation && !instrument.isCurrency()) {
      throw new InvalidOrderException(
        `CASH_IN/CASH_OUT operations are only allowed for currency instruments (MONEDA). Instrument ${instrument.ticker} is of type ${instrument.type}`,
      );
    }

    if (isTradeOperation && !instrument.isStock()) {
      throw new InvalidOrderException(
        `BUY/SELL operations are only allowed for stock instruments (ACCIONES). Instrument ${instrument.ticker} is of type ${instrument.type}`,
      );
    }
  }
}
