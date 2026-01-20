import { Order } from '../../entities/order.entity';
import { OrderSide } from '../../value-objects/order-side.enum';
import { OrderType } from '../../value-objects/order-type.enum';

export interface CreateOrderCommand {
  userId: number;
  instrumentId: number;
  side: OrderSide;
  type: OrderType;
  quantity?: number;
  totalAmount?: number;
  price?: number;
}

export interface CreateOrderUseCase {
  execute(command: CreateOrderCommand): Promise<Order>;
}
