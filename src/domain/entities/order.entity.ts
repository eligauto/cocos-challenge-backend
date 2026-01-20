import { OrderSide } from '../value-objects/order-side.enum';
import { OrderStatus } from '../value-objects/order-status.enum';
import { OrderType } from '../value-objects/order-type.enum';

export class Order {
  constructor(
    public readonly id: number,
    public readonly instrumentId: number,
    public readonly userId: number,
    public readonly side: OrderSide,
    public readonly size: number,
    public readonly price: number,
    public readonly type: OrderType,
    public readonly status: OrderStatus,
    public readonly datetime: Date,
  ) {}

  isBuy(): boolean {
    return this.side === OrderSide.BUY;
  }

  isSell(): boolean {
    return this.side === OrderSide.SELL;
  }

  isCashIn(): boolean {
    return this.side === OrderSide.CASH_IN;
  }

  isCashOut(): boolean {
    return this.side === OrderSide.CASH_OUT;
  }

  isFilled(): boolean {
    return this.status === OrderStatus.FILLED;
  }

  isNew(): boolean {
    return this.status === OrderStatus.NEW;
  }

  canBeCancelled(): boolean {
    return this.status === OrderStatus.NEW;
  }

  getTotalValue(): number {
    return this.size * this.price;
  }
}
