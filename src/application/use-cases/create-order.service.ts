import { Injectable, Inject } from '@nestjs/common';
import {
  CreateOrderUseCase,
  CreateOrderCommand,
} from '../../domain/ports/inbound/create-order.use-case';
import { Order } from '../../domain/entities/order.entity';
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
import { InsufficientFundsException } from '../../domain/exceptions/insufficient-funds.exception';
import { InsufficientSharesException } from '../../domain/exceptions/insufficient-shares.exception';
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
    // Validate user exists
    const user = await this.userRepository.findById(command.userId);
    if (!user) {
      throw new EntityNotFoundException('User', command.userId);
    }

    // Validate instrument exists
    const instrument = await this.instrumentRepository.findById(command.instrumentId);
    if (!instrument) {
      throw new EntityNotFoundException('Instrument', command.instrumentId);
    }

    // Validate order has quantity or totalAmount
    if (!command.quantity && !command.totalAmount) {
      throw new InvalidOrderException('Either quantity or totalAmount must be provided');
    }

    // Get price for the order
    const price = await this.resolvePrice(command);

    // Calculate quantity
    const quantity = this.calculateQuantity(command, price);

    if (quantity <= 0) {
      throw new InvalidOrderException('Order quantity must be greater than 0');
    }

    // Validate user has sufficient funds/shares
    await this.validateSufficientBalance(command.userId, command.side, command.instrumentId, quantity, price);

    // Determine order status based on type
    const status = command.type === OrderType.MARKET ? OrderStatus.FILLED : OrderStatus.NEW;

    // Create order
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

  private async resolvePrice(command: CreateOrderCommand): Promise<number> {
    if (command.type === OrderType.LIMIT) {
      if (!command.price || command.price <= 0) {
        throw new InvalidOrderException('LIMIT orders require a valid price');
      }
      return command.price;
    }

    // MARKET order - use current market price
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

    // Calculate quantity from totalAmount (no fractional shares)
    return Math.floor(command.totalAmount / price);
  }

  private async validateSufficientBalance(
    userId: number,
    side: OrderSide,
    instrumentId: number,
    quantity: number,
    price: number,
  ): Promise<void> {
    const portfolio = await this.getPortfolioService.execute(userId);

    if (side === OrderSide.BUY) {
      const requiredAmount = quantity * price;
      if (portfolio.availableCash < requiredAmount) {
        throw new InsufficientFundsException(portfolio.availableCash, requiredAmount);
      }
    } else if (side === OrderSide.SELL) {
      const position = portfolio.positions.find((p) => p.instrument.id === instrumentId);
      const availableShares = position?.quantity || 0;
      if (availableShares < quantity) {
        const instrument = await this.instrumentRepository.findById(instrumentId);
        throw new InsufficientSharesException(instrument.ticker, availableShares, quantity);
      }
    }
  }
}
