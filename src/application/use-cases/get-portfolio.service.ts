import { Injectable, Inject } from '@nestjs/common';
import { GetPortfolioUseCase, PortfolioDto } from '../../domain/ports/inbound/get-portfolio.use-case';
import { OrderRepository } from '../../domain/ports/outbound/order.repository';
import { InstrumentRepository } from '../../domain/ports/outbound/instrument.repository';
import { MarketDataRepository } from '../../domain/ports/outbound/market-data.repository';
import { UserRepository } from '../../domain/ports/outbound/user.repository';
import { REPOSITORY_TOKENS } from '../../infrastructure/adapters/outbound/repository.tokens';
import { Position } from '../../domain/entities/position.entity';
import { OrderStatus } from '../../domain/value-objects/order-status.enum';
import { OrderSide } from '../../domain/value-objects/order-side.enum';
import { EntityNotFoundException } from '../../domain/exceptions/entity-not-found.exception';

const ARS_TICKER = 'ARS';

@Injectable()
export class GetPortfolioService implements GetPortfolioUseCase {
  constructor(
    @Inject(REPOSITORY_TOKENS.USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(REPOSITORY_TOKENS.ORDER_REPOSITORY)
    private readonly orderRepository: OrderRepository,
    @Inject(REPOSITORY_TOKENS.INSTRUMENT_REPOSITORY)
    private readonly instrumentRepository: InstrumentRepository,
    @Inject(REPOSITORY_TOKENS.MARKET_DATA_REPOSITORY)
    private readonly marketDataRepository: MarketDataRepository,
  ) {}

  async execute(userId: number): Promise<PortfolioDto> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new EntityNotFoundException('User', userId);
    }

    const filledOrders = await this.orderRepository.findByUserIdAndStatus(userId, OrderStatus.FILLED);

    // Calculate cash balance and positions
    const { cashBalance, positionsMap } = this.calculateHoldings(filledOrders);

    // Get instruments and market data for positions
    const positions = await this.buildPositions(positionsMap);

    // Calculate total account value
    const positionsValue = positions.reduce((sum, p) => sum + p.getTotalValue(), 0);
    const totalAccountValue = cashBalance + positionsValue;

    return {
      userId,
      totalAccountValue,
      availableCash: cashBalance,
      positions,
    };
  }

  private calculateHoldings(orders: { side: OrderSide; size: number; price: number; instrumentId: number }[]): {
    cashBalance: number;
    positionsMap: Map<number, { quantity: number; totalCost: number }>;
  } {
    let cashBalance = 0;
    const positionsMap = new Map<number, { quantity: number; totalCost: number }>();

    for (const order of orders) {
      switch (order.side) {
        case OrderSide.CASH_IN:
          cashBalance += order.size * order.price;
          break;
        case OrderSide.CASH_OUT:
          cashBalance -= order.size * order.price;
          break;
        case OrderSide.BUY:
          cashBalance -= order.size * order.price;
          this.addToPosition(positionsMap, order.instrumentId, order.size, order.size * order.price);
          break;
        case OrderSide.SELL:
          cashBalance += order.size * order.price;
          this.subtractFromPosition(positionsMap, order.instrumentId, order.size, order.size * order.price);
          break;
      }
    }

    return { cashBalance, positionsMap };
  }

  private addToPosition(
    map: Map<number, { quantity: number; totalCost: number }>,
    instrumentId: number,
    quantity: number,
    cost: number,
  ): void {
    const current = map.get(instrumentId) || { quantity: 0, totalCost: 0 };
    map.set(instrumentId, {
      quantity: current.quantity + quantity,
      totalCost: current.totalCost + cost,
    });
  }

  private subtractFromPosition(
    map: Map<number, { quantity: number; totalCost: number }>,
    instrumentId: number,
    quantity: number,
    cost: number,
  ): void {
    const current = map.get(instrumentId);
    if (current) {
      const newQuantity = current.quantity - quantity;
      if (newQuantity <= 0) {
        map.delete(instrumentId);
      } else {
        // Proportionally reduce cost
        const avgPrice = current.totalCost / current.quantity;
        map.set(instrumentId, {
          quantity: newQuantity,
          totalCost: newQuantity * avgPrice,
        });
      }
    }
  }

  private async buildPositions(
    positionsMap: Map<number, { quantity: number; totalCost: number }>,
  ): Promise<Position[]> {
    const instrumentIds = Array.from(positionsMap.keys());
    if (instrumentIds.length === 0) {
      return [];
    }

    const marketDataList = await this.marketDataRepository.findLatestByInstrumentIds(instrumentIds);
    const marketDataMap = new Map(marketDataList.map((md) => [md.instrumentId, md]));

    const positions: Position[] = [];

    for (const [instrumentId, holding] of positionsMap) {
      const instrument = await this.instrumentRepository.findById(instrumentId);
      if (!instrument || instrument.isCurrency()) {
        continue;
      }

      const marketData = marketDataMap.get(instrumentId);
      const currentPrice = marketData?.close || 0;
      const previousClose = marketData?.previousClose || currentPrice;
      const avgPrice = holding.quantity > 0 ? holding.totalCost / holding.quantity : 0;

      positions.push(
        new Position(instrument, holding.quantity, avgPrice, currentPrice, previousClose),
      );
    }

    return positions;
  }
}
