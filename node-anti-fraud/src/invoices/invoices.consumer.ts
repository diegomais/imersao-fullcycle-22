import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { FraudService } from './fraud/fraud.service';

export type PendingInvoicesMessage = {
  account_id: string;
  amount: number;
  invoice_id: string;
};

@Controller()
export class InvoicesConsumer {
  private readonly logger = new Logger(InvoicesConsumer.name);

  constructor(private readonly fraudService: FraudService) {}

  @EventPattern('transactions_pending')
  async handlePendingInvoices(@Payload() message: PendingInvoicesMessage) {
    this.logger.log(`Processing invoice: ${message.invoice_id}`);
    await this.fraudService.processInvoice({
      account_id: message.account_id,
      amount: message.amount,
      invoice_id: message.invoice_id,
    });
    this.logger.log(`Invoice processed: ${message.invoice_id}`);
  }
}
