import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../../../domain/entities/order.entity';
import { OrderStatus } from '../../../domain/value-objects/order-status.enum';
import { OrderRepository, CreateOrderData } from '../../../domain/ports/outbound/order.repository';
import { OrderOrmEntity } from '../../persistence/entities/order.orm-entity';
import { OrderMapper } from '../../persistence/mappers/order.mapper';

@Injectable()
export class OrderRepositoryAdapter implements OrderRepository {
  constructor(
    @InjectRepository(OrderOrmEntity)
    private readonly orderRepository: Repository<OrderOrmEntity>,
  ) {}

  async findById(id: number): Promise<Order | null> {
    const entity = await this.orderRepository.findOne({ where: { id } });
    return entity ? OrderMapper.toDomain(entity) : null;
  }

  async findByUserId(userId: number): Promise<Order[]> {
    const entities = await this.orderRepository.find({
      where: { userId },
      order: { datetime: 'DESC' },
    });
    return entities.map(OrderMapper.toDomain);
  }

  async findByUserIdAndStatus(userId: number, status: OrderStatus): Promise<Order[]> {
    const entities = await this.orderRepository.find({
      where: { userId, status },
      order: { datetime: 'ASC' }, // Chronological order for correct portfolio calculation
    });
    return entities.map(OrderMapper.toDomain);
  }

  async save(order: CreateOrderData): Promise<Order> {
    const ormEntity = new OrderOrmEntity();
    ormEntity.instrumentId = order.instrumentId;
    ormEntity.userId = order.userId;
    ormEntity.side = order.side;
    ormEntity.size = order.size;
    ormEntity.price = order.price;
    ormEntity.type = order.type;
    ormEntity.status = order.status;
    ormEntity.datetime = order.datetime;

    const saved = await this.orderRepository.save(ormEntity);
    return OrderMapper.toDomain(saved);
  }

  async updateStatus(id: number, status: OrderStatus): Promise<Order> {
    await this.orderRepository.update(id, { status });
    const updated = await this.orderRepository.findOne({ where: { id } });
    return OrderMapper.toDomain(updated);
  }
}
