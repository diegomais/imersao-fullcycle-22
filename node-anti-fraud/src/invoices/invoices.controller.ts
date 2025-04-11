import { Controller, Get, Param, Query } from '@nestjs/common';
import { InvoicesService } from './invoices.service';

@Controller('invoices')
export class InvoicesController {
  constructor(private readonly service: InvoicesService) {}

  @Get()
  findAll(
    @Query('account_id') accountId: string,
    @Query('with_fraud') withFraud: boolean
  ) {
    return this.service.findAll({ accountId, withFraud });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
