import { FraudReason, Invoice } from '../../../generated/prisma';

export class InvoiceProcessedEvent {
  constructor(
    readonly invoice: Invoice,
    readonly fraudResult: {
      description?: string;
      hasFraud: boolean;
      reason?: FraudReason;
    }
  ) {}
}
