export class MarketData {
  constructor(
    public readonly id: number,
    public readonly instrumentId: number,
    public readonly high: number,
    public readonly low: number,
    public readonly open: number,
    public readonly close: number,
    public readonly previousClose: number,
    public readonly date: Date,
  ) {}

  getDailyReturn(): number {
    if (this.previousClose === 0) {
      return 0;
    }
    return ((this.close - this.previousClose) / this.previousClose) * 100;
  }

  getDailyChange(): number {
    return this.close - this.previousClose;
  }
}
