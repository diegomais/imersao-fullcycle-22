import { Injectable } from '@nestjs/common';
import { InvoiceStatus } from '../../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InvoicesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filter?: { withFraud?: boolean; accountId?: string }) {
    const where = {
      ...(filter?.accountId && { accountId: filter.accountId }),
      ...(filter?.withFraud && { status: InvoiceStatus.REJECTED }),
    };

    return this.prisma.invoice.findMany({
      include: { account: true },
      where
    });
  }

  async findOne(id: string) {
    return this.prisma.invoice.findUnique({
      include: { account: true },
      where: { id }
    });
  }
}
