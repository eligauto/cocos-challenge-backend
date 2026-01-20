import { Instrument } from './instrument.entity';

export class Position {
  constructor(
    public readonly instrument: Instrument,
    public readonly quantity: number,
    public readonly averagePrice: number,
    public readonly currentPrice: number,
    public readonly previousClosePrice: number,
  ) {}

  getTotalValue(): number {
    return this.quantity * this.currentPrice;
  }

  getTotalCost(): number {
    return this.quantity * this.averagePrice;
  }

  getUnrealizedPnL(): number {
    return this.getTotalValue() - this.getTotalCost();
  }

  getUnrealizedPnLPercentage(): number {
    const totalCost = this.getTotalCost();
    if (totalCost === 0) {
      return 0;
    }
    return (this.getUnrealizedPnL() / totalCost) * 100;
  }

  getDailyPnL(): number {
    return (this.currentPrice - this.previousClosePrice) * this.quantity;
  }

  getDailyPnLPercentage(): number {
    if (this.previousClosePrice === 0) {
      return 0;
    }
    return ((this.currentPrice - this.previousClosePrice) / this.previousClosePrice) * 100;
  }
}
