export type TransactionType =
  | 'INCOME'
  | 'EXPENSE'
  | 'CREDIT_CARD_PURCHASE'
  | 'INSTALLMENT'
  | 'TRANSFER'
  | 'CREDIT_CARD_PAYMENT'
  | 'REFUND'
  | 'INVESTMENT'
  | 'INVESTMENT_RETURN';

export type PaymentMethod =
  | 'CASH'
  | 'PIX'
  | 'DEBIT'
  | 'CREDIT'
  | 'TRANSFER'
  | 'BOLETO'
  | 'AUTO_DEBIT';

export type InvoiceStatus = 'OPEN' | 'CLOSED' | 'PAID' | 'OVERDUE' | 'PARTIALLY_PAID';

export type AccountType =
  | 'CHECKING'
  | 'SAVINGS'
  | 'WALLET'
  | 'INVESTMENT'
  | 'CASH'
  | 'OTHER';

export type InstallmentPurchaseStatus = 'ACTIVE' | 'FINISHED' | 'CANCELLED';

export type InstallmentStatus = 'PENDING' | 'BILLED' | 'PAID';

export type CategoryType = 'INCOME' | 'EXPENSE' | 'HOUSEHOLD' | 'INVESTMENT';

export interface InvoiceCycleResult {
  invoiceReference: string; // Ex: "2026-09"
  billingMonth: number;      // 1 to 12
  billingYear: number;       // Ex: 2026
  cycleStartDate: string;    // YYYY-MM-DD
  cycleEndDate: string;      // YYYY-MM-DD (Dia de corte)
  dueDate: string;           // YYYY-MM-DD (Dia de vencimento)
  purchaseCompetence: {
    month: number;
    year: number;
    reference: string;       // Ex: "2026-08"
  };
}

export interface CreditCardConfig {
  id: string;
  name: string;
  bank?: string;
  brand?: string;
  last4Digits?: string;
  creditLimit: number;
  closingDay: number; // Dia de corte/fechamento
  dueDay: number;     // Dia de vencimento
  defaultAccountId?: string;
  color?: string;
}

export interface NormalizedMerchantResult {
  rawDescription: string;
  normalizedDescription: string;
  merchantName: string;
  currentInstallment?: number;
  totalInstallments?: number;
  isInstallmentPattern: boolean;
}

export interface MatchScoreResult {
  score: number; // 0 to 100
  details: {
    cardMatch: number;
    merchantMatch: number;
    amountMatch: number;
    installmentSequenceMatch: number;
  };
  matchedPurchaseId?: string;
  action: 'AUTO_LINK' | 'NEEDS_CONFIRMATION' | 'NEW_PURCHASE';
  reason: string;
}

export interface ImportParsedRow {
  date: string;
  description: string;
  amount: number;
  type: 'DEBIT' | 'CREDIT';
  rawCategory?: string;
  suggestedCategory?: string;
  normalizedDescription: string;
  merchantName: string;
  currentInstallment?: number;
  totalInstallments?: number;
  isInstallment: boolean;
  fingerprint: string;
  matchScore?: MatchScoreResult;
  isDuplicate: boolean;
}
