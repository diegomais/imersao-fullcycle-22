import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { InvoicesModule } from './invoices/invoices.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule,
    InvoicesModule,
    PrismaModule
  ]
})
export class AppModule {}
