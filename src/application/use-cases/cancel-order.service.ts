import { Injectable, Inject } from '@nestjs/common';
import { CancelOrderUseCase } from '../../domain/ports/inbound/cancel-order.use-case';
import { Order } from '../../domain/entities/order.entity';
import { OrderRepository } from '../../domain/ports/outbound/order.repository';
import { REPOSITORY_TOKENS } from '../../infrastructure/adapters/outbound/repository.tokens';
import { OrderStatus } from '../../domain/value-objects/order-status.enum';
import { EntityNotFoundException } from '../../domain/exceptions/entity-not-found.exception';
import { OrderCannotBeCancelledException } from '../../domain/exceptions/order-cannot-be-cancelled.exception';

@Injectable()
export class CancelOrderService implements CancelOrderUseCase {
  constructor(
    @Inject(REPOSITORY_TOKENS.ORDER_REPOSITORY)
    private readonly orderRepository: OrderRepository,
  ) {}

  async execute(orderId: number, userId: number): Promise<Order> {
    const order = await this.orderRepository.findById(orderId);

    if (!order) {
      throw new EntityNotFoundException('Order', orderId);
    }

    if (order.userId !== userId) {
      throw new EntityNotFoundException('Order', orderId);
    }

    if (!order.canBeCancelled()) {
      throw new OrderCannotBeCancelledException(orderId, order.status);
    }

    return this.orderRepository.updateStatus(orderId, OrderStatus.CANCELLED);
  }
}
