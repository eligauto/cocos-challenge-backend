import { Order } from '../../entities/order.entity';
import { OrderStatus } from '../../value-objects/order-status.enum';

export interface OrderRepository {
  findById(id: number): Promise<Order | null>;
  findByUserId(userId: number): Promise<Order[]>;
  findByUserIdAndStatus(userId: number, status: OrderStatus): Promise<Order[]>;
  save(order: Omit<Order, 'id'>): Promise<Order>;
  updateStatus(id: number, status: OrderStatus): Promise<Order>;
}
