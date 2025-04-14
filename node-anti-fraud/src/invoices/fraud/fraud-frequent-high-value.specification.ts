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
export class FrequentHighValueSpecification implements IFraudSpecification {
  private readonly suspiciousInvoicesCount: number;
  private readonly suspiciousTimeframeHours: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService
  ) {
    this.suspiciousInvoicesCount = this.configService.getOrThrow<number>(
      'SUSPICIOUS_INVOICES_COUNT'
    );
    this.suspiciousTimeframeHours = this.configService.getOrThrow<number>(
      'SUSPICIOUS_TIMEFRAME_HOURS'
    );
  }

  async detectFraud(
    context: FraudSpecificationContext
  ): Promise<FraudDetectionResult> {
    const { account } = context;

    const recentDate = new Date();
    recentDate.setHours(recentDate.getHours() - this.suspiciousTimeframeHours);

    const recentInvoices = await this.prisma.invoice.findMany({
      where: {
        accountId: account.id,
        createdAt: { gte: recentDate },
      },
    });

    if (recentInvoices.length >= this.suspiciousInvoicesCount) {
      await this.prisma.account.update({
        where: { id: account.id },
        data: { isSuspicious: true },
      });

      return {
        hasFraud: true,
        reason: FraudReason.FREQUENT_HIGH_VALUE,
        description: `${recentInvoices.length} high-value invoices in the last ${this.suspiciousTimeframeHours} hours`,
      };
    }

    return { hasFraud: false };
  }
}
