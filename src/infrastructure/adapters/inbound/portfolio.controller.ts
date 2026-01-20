import { Controller, Get, Param, ParseIntPipe, HttpException, HttpStatus } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { USE_CASE_TOKENS } from '../../../application/use-cases/use-case.tokens';
import { GetPortfolioUseCase } from '../../../domain/ports/inbound/get-portfolio.use-case';
import { EntityNotFoundException } from '../../../domain/exceptions/entity-not-found.exception';

@Controller('portfolio')
export class PortfolioController {
  constructor(
    @Inject(USE_CASE_TOKENS.GET_PORTFOLIO)
    private readonly getPortfolioUseCase: GetPortfolioUseCase,
  ) {}

  @Get(':userId')
  async getPortfolio(@Param('userId', ParseIntPipe) userId: number) {
    try {
      const portfolio = await this.getPortfolioUseCase.execute(userId);

      return {
        userId: portfolio.userId,
        totalAccountValue: portfolio.totalAccountValue,
        availableCash: portfolio.availableCash,
        positions: portfolio.positions.map((position) => ({
          instrument: {
            id: position.instrument.id,
            ticker: position.instrument.ticker,
            name: position.instrument.name,
            type: position.instrument.type,
          },
          quantity: position.quantity,
          averagePrice: position.averagePrice,
          currentPrice: position.currentPrice,
          totalValue: position.getTotalValue(),
          unrealizedPnL: position.getUnrealizedPnL(),
          unrealizedPnLPercentage: position.getUnrealizedPnLPercentage(),
          dailyPnL: position.getDailyPnL(),
          dailyPnLPercentage: position.getDailyPnLPercentage(),
        })),
      };
    } catch (error) {
      if (error instanceof EntityNotFoundException) {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }
      throw error;
    }
  }
}
