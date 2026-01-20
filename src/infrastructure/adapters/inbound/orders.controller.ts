import {
  Controller,
  Post,
  Patch,
  Body,
  Param,
  ParseIntPipe,
  HttpException,
  HttpStatus,
  Inject,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { USE_CASE_TOKENS } from '../../../application/use-cases/use-case.tokens';
import { CreateOrderUseCase } from '../../../domain/ports/inbound/create-order.use-case';
import { CancelOrderUseCase } from '../../../domain/ports/inbound/cancel-order.use-case';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus } from '../../../domain/value-objects/order-status.enum';
import { EntityNotFoundException } from '../../../domain/exceptions/entity-not-found.exception';
import { InvalidOrderException } from '../../../domain/exceptions/invalid-order.exception';
import { OrderCannotBeCancelledException } from '../../../domain/exceptions/order-cannot-be-cancelled.exception';
import { DomainException } from '../../../domain/exceptions/domain.exception';

@Controller('orders')
export class OrdersController {
  constructor(
    @Inject(USE_CASE_TOKENS.CREATE_ORDER)
    private readonly createOrderUseCase: CreateOrderUseCase,
    @Inject(USE_CASE_TOKENS.CANCEL_ORDER)
    private readonly cancelOrderUseCase: CancelOrderUseCase,
  ) {}

  @Post()
  async createOrder(@Body() dto: CreateOrderDto, @Res() res: Response) {
    try {
      const order = await this.createOrderUseCase.execute({
        userId: dto.userId,
        instrumentId: dto.instrumentId,
        side: dto.side,
        type: dto.type,
        quantity: dto.quantity,
        totalAmount: dto.totalAmount,
        price: dto.price,
      });

      const responseBody = {
        id: order.id,
        instrumentId: order.instrumentId,
        userId: order.userId,
        side: order.side,
        size: order.size,
        price: order.price,
        type: order.type,
        status: order.status,
        datetime: order.datetime,
      };

      const statusCode = order.status === OrderStatus.REJECTED 
        ? HttpStatus.UNPROCESSABLE_ENTITY 
        : HttpStatus.CREATED;

      return res.status(statusCode).json(responseBody);
    } catch (error) {
      this.handleError(error);
    }
  }

  @Patch(':id/cancel')
  async cancelOrder(
    @Param('id', ParseIntPipe) orderId: number,
    @Body('userId', ParseIntPipe) userId: number,
  ) {
    try {
      const order = await this.cancelOrderUseCase.execute(orderId, userId);

      return {
        id: order.id,
        instrumentId: order.instrumentId,
        userId: order.userId,
        side: order.side,
        size: order.size,
        price: order.price,
        type: order.type,
        status: order.status,
        datetime: order.datetime,
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  private handleError(error: unknown): never {
    if (error instanceof EntityNotFoundException) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
    if (error instanceof InvalidOrderException) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
    if (error instanceof OrderCannotBeCancelledException) {
      throw new HttpException(error.message, HttpStatus.CONFLICT);
    }
    if (error instanceof DomainException) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
    throw error;
  }
}
