import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { databaseConfig } from './infrastructure/config/database.config';
import { DatabaseModule } from './infrastructure/persistence/database.module';
import { ControllersModule } from './infrastructure/adapters/inbound/controllers.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),
    DatabaseModule,
    ControllersModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
