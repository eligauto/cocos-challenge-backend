import { Order } from '../../entities/order.entity';

export interface CancelOrderUseCase {
  execute(orderId: number, userId: number): Promise<Order>;
}
