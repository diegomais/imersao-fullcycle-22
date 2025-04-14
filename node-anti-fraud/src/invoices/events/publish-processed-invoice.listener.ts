import { KafkaJS } from '@confluentinc/kafka-javascript';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InvoiceProcessedEvent } from './invoice-processed.event';

@Injectable()
export class PublishProcessedInvoiceListener implements OnModuleInit {
  private readonly logger = new Logger(PublishProcessedInvoiceListener.name);
  private readonly kafkaProducer: KafkaJS.Producer;

  constructor(private readonly kafkaInst: KafkaJS.Kafka) {
    this.kafkaProducer = this.kafkaInst.producer();
  }

  async onModuleInit() {
    await this.kafkaProducer.connect();
  }

  @OnEvent('invoice.processed')
  async handle(event: InvoiceProcessedEvent) {
    await this.kafkaProducer.send({
      topic: 'transactions_result',
      messages: [
        {
          value: JSON.stringify({
            invoice_id: event.invoice.id,
            status: event.fraudResult.hasFraud ? 'rejected' : 'approved',
          }),
        },
      ],
    });
    this.logger.log(`Invoice ${event.invoice.id} processed event published`);
  }
}
