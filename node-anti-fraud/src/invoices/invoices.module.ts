import { KafkaJS } from '@confluentinc/kafka-javascript';
import { Module } from '@nestjs/common';
import { KAFKA_DEFAULT_BROKER } from '@nestjs/microservices/constants';
import { PublishProcessedInvoiceListener } from './events/publish-processed-invoice.listener';
import { FraudAggregateSpecification } from './fraud/fraud-aggregate.specification';
import { FrequentHighValueSpecification } from './fraud/fraud-frequent-high-value.specification';
import { SuspiciousAccountSpecification } from './fraud/fraud-suspicious-account.specification';
import { UnusualAmountSpecification } from './fraud/fraud-unusual-amount.specification';
import { FraudService } from './fraud/fraud.service';
import { InvoicesConsumer } from './invoices.consumer';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';

@Module({
  providers: [
    FraudAggregateSpecification,
    FraudService,
    FrequentHighValueSpecification,
    InvoicesService,
    PublishProcessedInvoiceListener,
    SuspiciousAccountSpecification,
    UnusualAmountSpecification,
    {
      inject: [
        FrequentHighValueSpecification,
        SuspiciousAccountSpecification,
        UnusualAmountSpecification,
      ],
      provide: 'FRAUD_SPECIFICATIONS',
      useFactory: (
        frequentHighValueSpec: FrequentHighValueSpecification,
        suspiciousAccountSpec: SuspiciousAccountSpecification,
        unusualAmountSpec: UnusualAmountSpecification
      ) => {
        return [
          frequentHighValueSpec,
          suspiciousAccountSpec,
          unusualAmountSpec,
        ];
      },
    },
    {
      provide: KafkaJS.Kafka,
      useValue: new KafkaJS.Kafka({
        'bootstrap.servers':
          process.env.KAFKA_BOOTSTRAP_SERVER ?? KAFKA_DEFAULT_BROKER,
      }),
    },
  ],
  controllers: [InvoicesConsumer, InvoicesController],
})
export class InvoicesModule {}
