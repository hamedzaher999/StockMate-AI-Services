import { Global, Module } from '@nestjs/common';
import { Pool } from 'pg';
import { ConfigService } from '@nestjs/config';

export const PG_POOL = Symbol('PG_POOL');

@Global()
@Module({
  providers: [
    {
      provide: PG_POOL,
      useFactory: (configService: ConfigService) => {
        return new Pool({
          connectionString: configService.get<string>('database.url'),
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [PG_POOL],
})
export class DbModule {}
