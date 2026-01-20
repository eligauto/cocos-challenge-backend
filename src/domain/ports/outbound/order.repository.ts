import { Order } from '../../entities/order.entity';
import { OrderSide } from '../../value-objects/order-side.enum';
import { OrderStatus } from '../../value-objects/order-status.enum';
import { OrderType } from '../../value-objects/order-type.enum';

export interface CreateOrderData {
  instrumentId: number;
  userId: number;
  side: OrderSide;
  size: number;
  price: number;
  type: OrderType;
  status: OrderStatus;
  datetime: Date;
}

export interface OrderRepository {
  findById(id: number): Promise<Order | null>;
  findByUserId(userId: number): Promise<Order[]>;
  findByUserIdAndStatus(userId: number, status: OrderStatus): Promise<Order[]>;
  save(order: CreateOrderData): Promise<Order>;
  updateStatus(id: number, status: OrderStatus): Promise<Order>;
}
