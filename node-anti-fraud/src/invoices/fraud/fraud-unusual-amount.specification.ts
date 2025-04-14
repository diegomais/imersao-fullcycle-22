import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FraudReason } from '../../../generated/prisma';
import { PrismaService } from '../../prisma/prisma.service';
import {
  FraudDetectionResult,
  FraudSpecificationContext,
  IFraudSpecification,
} from './fraud.specification.interface';

@Injectable()
export class UnusualAmountSpecification implements IFraudSpecification {
  private readonly invoicesHistoryCount: number;
  private readonly suspiciousVariationPercentage: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService
  ) {
    this.invoicesHistoryCount = this.configService.getOrThrow<number>(
      'INVOICES_HISTORY_COUNT'
    );
    this.suspiciousVariationPercentage = this.configService.getOrThrow<number>(
      'SUSPICIOUS_VARIATION_PERCENTAGE'
    );
  }

  async detectFraud(
    context: FraudSpecificationContext
  ): Promise<FraudDetectionResult> {
    const { account, amount } = context;

    const previousInvoices = await this.prisma.invoice.findMany({
      where: { accountId: account.id },
      orderBy: { createdAt: 'desc' },
      take: this.invoicesHistoryCount,
    });

    if (previousInvoices.length > 0) {
      const totalAmount = previousInvoices.reduce(
        (sum, invoice) => sum + invoice.amount,
        0
      );
      const averageAmount = totalAmount / previousInvoices.length;

      if (
        amount >
        averageAmount * (1 + this.suspiciousVariationPercentage / 100)
      ) {
        return {
          hasFraud: true,
          reason: FraudReason.UNUSUAL_PATTERN,
          description: `Amount ${amount} is ${((amount / averageAmount) * 100 - 100).toFixed(2)}% higher than account average of ${averageAmount.toFixed(2)}`,
        };
      }
    }

    return { hasFraud: false };
  }
}
