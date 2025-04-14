import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InvoiceStatus } from '../../../generated/prisma';
import { PrismaService } from '../../prisma/prisma.service';
import { InvoiceProcessedEvent } from '../events/invoice-processed.event';
import { FraudAggregateSpecification } from './fraud-aggregate.specification';

@Injectable()
export class FraudService {
  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly fraudAggregateSpec: FraudAggregateSpecification,
    private readonly prismaService: PrismaService
  ) {}

  async processInvoice(payload: {
    account_id: string;
    amount: number;
    invoice_id: string;
  }) {
    const { account_id, amount, invoice_id } = payload;

    return await this.prismaService.$transaction(async (prisma) => {
      const foundInvoice = await prisma.invoice.findUnique({
        where: {
          id: invoice_id,
        },
      });

      if (foundInvoice) {
        throw new Error('Invoice has already been processed');
      }

      const account = await prisma.account.upsert({
        where: {
          id: account_id,
        },
        update: {},
        create: {
          id: account_id,
        },
      });

      const fraudResult = await this.fraudAggregateSpec.detectFraud({
        account,
        amount,
        invoiceId: invoice_id,
      });

      const invoice = await prisma.invoice.create({
        data: {
          id: invoice_id,
          accountId: account.id,
          amount,
          ...(fraudResult.hasFraud && {
            fraudHistory: {
              create: {
                reason: fraudResult.reason!,
                description: fraudResult.description,
              },
            },
          }),
          status: fraudResult.hasFraud
            ? InvoiceStatus.REJECTED
            : InvoiceStatus.APPROVED,
        },
      });

      await this.eventEmitter.emitAsync(
        'invoice.processed',
        new InvoiceProcessedEvent(invoice, fraudResult)
      );

      return {
        invoice,
        fraudResult,
      };
    });
  }
}
