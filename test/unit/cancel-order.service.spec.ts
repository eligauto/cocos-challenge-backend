import { CancelOrderService } from '../../src/application/use-cases/cancel-order.service';
import { OrderRepository } from '../../src/domain/ports/outbound/order.repository';
import { Order } from '../../src/domain/entities/order.entity';
import { OrderSide } from '../../src/domain/value-objects/order-side.enum';
import { OrderType } from '../../src/domain/value-objects/order-type.enum';
import { OrderStatus } from '../../src/domain/value-objects/order-status.enum';
import { EntityNotFoundException } from '../../src/domain/exceptions/entity-not-found.exception';
import { OrderCannotBeCancelledException } from '../../src/domain/exceptions/order-cannot-be-cancelled.exception';

describe('CancelOrderService', () => {
  let service: CancelOrderService;
  let orderRepository: jest.Mocked<OrderRepository>;

  beforeEach(() => {
    orderRepository = {
      findById: jest.fn(),
      findByUserId: jest.fn(),
      findByUserIdAndStatus: jest.fn(),
      save: jest.fn(),
      updateStatus: jest.fn(),
    };

    service = new CancelOrderService(orderRepository);
  });

  describe('execute', () => {
    it('should throw EntityNotFoundException when order does not exist', async () => {
      orderRepository.findById.mockResolvedValue(null);

      await expect(service.execute(999, 1)).rejects.toThrow(EntityNotFoundException);
    });

    it('should throw EntityNotFoundException when order belongs to different user', async () => {
      const mockOrder = new Order(
        1,
        1,
        2,
        OrderSide.BUY,
        10,
        100,
        OrderType.LIMIT,
        OrderStatus.NEW,
        new Date(),
      );
      orderRepository.findById.mockResolvedValue(mockOrder);

      await expect(service.execute(1, 1)).rejects.toThrow(EntityNotFoundException);
    });

    it('should throw OrderCannotBeCancelledException when order is FILLED', async () => {
      const mockOrder = new Order(
        1,
        1,
        1,
        OrderSide.BUY,
        10,
        100,
        OrderType.MARKET,
        OrderStatus.FILLED,
        new Date(),
      );
      orderRepository.findById.mockResolvedValue(mockOrder);

      await expect(service.execute(1, 1)).rejects.toThrow(OrderCannotBeCancelledException);
    });

    it('should throw OrderCannotBeCancelledException when order is REJECTED', async () => {
      const mockOrder = new Order(
        1,
        1,
        1,
        OrderSide.BUY,
        10,
        100,
        OrderType.MARKET,
        OrderStatus.REJECTED,
        new Date(),
      );
      orderRepository.findById.mockResolvedValue(mockOrder);

      await expect(service.execute(1, 1)).rejects.toThrow(OrderCannotBeCancelledException);
    });

    it('should throw OrderCannotBeCancelledException when order is already CANCELLED', async () => {
      const mockOrder = new Order(
        1,
        1,
        1,
        OrderSide.BUY,
        10,
        100,
        OrderType.LIMIT,
        OrderStatus.CANCELLED,
        new Date(),
      );
      orderRepository.findById.mockResolvedValue(mockOrder);

      await expect(service.execute(1, 1)).rejects.toThrow(OrderCannotBeCancelledException);
    });

    it('should cancel a NEW order successfully', async () => {
      const mockOrder = new Order(
        1,
        1,
        1,
        OrderSide.BUY,
        10,
        100,
        OrderType.LIMIT,
        OrderStatus.NEW,
        new Date(),
      );
      const cancelledOrder = new Order(
        1,
        1,
        1,
        OrderSide.BUY,
        10,
        100,
        OrderType.LIMIT,
        OrderStatus.CANCELLED,
        new Date(),
      );

      orderRepository.findById.mockResolvedValue(mockOrder);
      orderRepository.updateStatus.mockResolvedValue(cancelledOrder);

      const result = await service.execute(1, 1);

      expect(result.status).toBe(OrderStatus.CANCELLED);
      expect(orderRepository.updateStatus).toHaveBeenCalledWith(1, OrderStatus.CANCELLED);
    });
  });
});
