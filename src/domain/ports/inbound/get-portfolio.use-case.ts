import { Position } from '../../entities/position.entity';

export interface PortfolioDto {
  userId: number;
  totalAccountValue: number;
  availableCash: number;
  positions: Position[];
}

export interface GetPortfolioUseCase {
  execute(userId: number): Promise<PortfolioDto>;
}
