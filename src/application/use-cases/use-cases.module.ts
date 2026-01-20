import { Module } from '@nestjs/common';
import { RepositoriesModule } from '../../infrastructure/adapters/outbound/repositories.module';
import { USE_CASE_TOKENS } from './use-case.tokens';
import { GetPortfolioService } from './get-portfolio.service';
import { SearchInstrumentsService } from './search-instruments.service';
import { CreateOrderService } from './create-order.service';
import { CancelOrderService } from './cancel-order.service';

const useCases = [
  {
    provide: USE_CASE_TOKENS.GET_PORTFOLIO,
    useClass: GetPortfolioService,
  },
  {
    provide: USE_CASE_TOKENS.SEARCH_INSTRUMENTS,
    useClass: SearchInstrumentsService,
  },
  {
    provide: USE_CASE_TOKENS.CREATE_ORDER,
    useClass: CreateOrderService,
  },
  {
    provide: USE_CASE_TOKENS.CANCEL_ORDER,
    useClass: CancelOrderService,
  },
];

@Module({
  imports: [RepositoriesModule],
  providers: [
    GetPortfolioService,
    SearchInstrumentsService,
    CreateOrderService,
    CancelOrderService,
    ...useCases,
  ],
  exports: [...useCases],
})
export class UseCasesModule {}
