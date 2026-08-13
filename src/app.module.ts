import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import databaseConfig from './config/database.config';
import securityConfig from './config/security.config';
import { validationSchema } from './config/validation.schema';
import { ChatModule } from './chat/chat.module';
import { IngestionModule } from './ingestion/ingestion.module';
import { DbModule } from './common/db.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
      load: [databaseConfig, securityConfig],
    }),
    DbModule,
    ChatModule,
    IngestionModule,
  ],
})
export class AppModule {}
