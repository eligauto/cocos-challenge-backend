import { IsEnum, IsNumber, IsOptional, IsPositive, ValidateIf } from 'class-validator';
import { OrderSide } from '../../../../domain/value-objects/order-side.enum';
import { OrderType } from '../../../../domain/value-objects/order-type.enum';

export class CreateOrderDto {
  @IsNumber()
  userId: number;

  @IsNumber()
  instrumentId: number;

  @IsEnum(OrderSide, { message: 'side must be one of: BUY, SELL, CASH_IN, CASH_OUT' })
  side: OrderSide;

  @IsEnum(OrderType, { message: 'type must be one of: MARKET, LIMIT' })
  type: OrderType;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  quantity?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  totalAmount?: number;

  @ValidateIf((o) => o.type === OrderType.LIMIT)
  @IsNumber()
  @IsPositive()
  price?: number;
}
