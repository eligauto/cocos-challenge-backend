import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../persistence/database.module';
import { REPOSITORY_TOKENS } from './repository.tokens';
import { UserRepositoryAdapter } from './user.repository.adapter';
import { InstrumentRepositoryAdapter } from './instrument.repository.adapter';
import { OrderRepositoryAdapter } from './order.repository.adapter';
import { MarketDataRepositoryAdapter } from './market-data.repository.adapter';

const repositories = [
  {
    provide: REPOSITORY_TOKENS.USER_REPOSITORY,
    useClass: UserRepositoryAdapter,
  },
  {
    provide: REPOSITORY_TOKENS.INSTRUMENT_REPOSITORY,
    useClass: InstrumentRepositoryAdapter,
  },
  {
    provide: REPOSITORY_TOKENS.ORDER_REPOSITORY,
    useClass: OrderRepositoryAdapter,
  },
  {
    provide: REPOSITORY_TOKENS.MARKET_DATA_REPOSITORY,
    useClass: MarketDataRepositoryAdapter,
  },
];

@Module({
  imports: [DatabaseModule],
  providers: [...repositories],
  exports: [...repositories],
})
export class RepositoriesModule {}
