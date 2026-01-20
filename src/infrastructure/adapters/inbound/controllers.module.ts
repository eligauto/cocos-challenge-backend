import { Module } from '@nestjs/common';
import { UseCasesModule } from '../../../application/use-cases/use-cases.module';
import { PortfolioController } from './portfolio.controller';
import { InstrumentsController } from './instruments.controller';
import { OrdersController } from './orders.controller';

@Module({
  imports: [UseCasesModule],
  controllers: [PortfolioController, InstrumentsController, OrdersController],
})
export class ControllersModule {}
