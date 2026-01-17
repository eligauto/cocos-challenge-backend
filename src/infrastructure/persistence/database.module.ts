import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserOrmEntity } from './entities/user.orm-entity';
import { InstrumentOrmEntity } from './entities/instrument.orm-entity';
import { OrderOrmEntity } from './entities/order.orm-entity';
import { MarketDataOrmEntity } from './entities/market-data.orm-entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.database'),
        entities: [UserOrmEntity, InstrumentOrmEntity, OrderOrmEntity, MarketDataOrmEntity],
        synchronize: false,
        logging: process.env.NODE_ENV === 'development',
      }),
    }),
    TypeOrmModule.forFeature([
      UserOrmEntity,
      InstrumentOrmEntity,
      OrderOrmEntity,
      MarketDataOrmEntity,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
