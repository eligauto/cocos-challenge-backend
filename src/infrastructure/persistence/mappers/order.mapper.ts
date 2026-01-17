import { Order } from '../../../domain/entities/order.entity';
import { OrderSide } from '../../../domain/value-objects/order-side.enum';
import { OrderStatus } from '../../../domain/value-objects/order-status.enum';
import { OrderType } from '../../../domain/value-objects/order-type.enum';
import { OrderOrmEntity } from '../entities/order.orm-entity';

export class OrderMapper {
  static toDomain(ormEntity: OrderOrmEntity): Order {
    return new Order(
      ormEntity.id,
      ormEntity.instrumentId,
      ormEntity.userId,
      ormEntity.side as OrderSide,
      ormEntity.size,
      Number(ormEntity.price),
      ormEntity.type as OrderType,
      ormEntity.status as OrderStatus,
      ormEntity.datetime,
    );
  }

  static toOrm(domain: Order): OrderOrmEntity {
    const orm = new OrderOrmEntity();
    orm.id = domain.id;
    orm.instrumentId = domain.instrumentId;
    orm.userId = domain.userId;
    orm.side = domain.side;
    orm.size = domain.size;
    orm.price = domain.price;
    orm.type = domain.type;
    orm.status = domain.status;
    orm.datetime = domain.datetime;
    return orm;
  }
}
