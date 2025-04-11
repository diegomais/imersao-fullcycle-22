import { Module } from '@nestjs/common';
import { ConfigModule as Config } from '@nestjs/config';
import * as Joi from 'joi';

@Module({
  imports: [
    Config.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().uri().required(),
        INVOICES_HISTORY_COUNT: Joi.number(),
        SUSPICIOUS_INVOICES_COUNT: Joi.number(),
        SUSPICIOUS_TIMEFRAME_HOURS: Joi.number(),
        SUSPICIOUS_VARIATION_PERCENTAGE: Joi.number(),
      }),
    })
  ]
})
export class ConfigModule {}
