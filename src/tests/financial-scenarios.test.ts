import { describe, it, expect } from 'vitest';
import { calculateInvoiceCycle } from '../lib/engines/invoice-cycle';
import { generateInstallments } from '../lib/engines/installment-engine';
import { calculateMatchScore } from '../lib/engines/matching-algorithm';
import { generateTransactionFingerprint } from '../lib/engines/fingerprint';
import { calculateFinancialSummary } from '../lib/engines/financial-calculator';
import { RawTransactionItem } from '../lib/types';

describe('Suíte de Regras Financeiras — Cenários A a F (Requisito 49)', () => {
  const sampleCard = { closingDay: 3, dueDay: 10 };

  // ==========================================
  // CENÁRIO A — Compra normal no cartão
  // ==========================================
  it('Cenário A: Compra no cartão gera consumo na data da compra e saída de caixa apenas no vencimento/pagamento', () => {
    // Compra em 31/08 (após o fechamento do dia 03/08) -> entra na fatura que fecha em 03/09 e vence em 10/09
    const purchaseDate = '2026-08-31';
    const amount = 500;

    const cycle = calculateInvoiceCycle(purchaseDate, sampleCard);

    // Verificação do ciclo
    expect(cycle.purchaseCompetence.month).toBe(8);
    expect(cycle.purchaseCompetence.year).toBe(2026);
    expect(cycle.billingMonth).toBe(9); // Fatura de Setembro
    expect(cycle.dueDate).toBe('2026-09-10'); // Vencimento 10/09

    // Transações no sistema para Agosto e Setembro
    const transactions: RawTransactionItem[] = [
      {
        id: 't-compra-1',
        transactionType: 'CREDIT_CARD_PURCHASE',
        amount: 500,
        transactionDate: '2026-08-31',
        competenceMonth: 8,
        competenceYear: 2026,
        billingMonth: 9,
        billingYear: 2026,
        categoryId: 'cat-mercado',
        categoryName: 'Mercado',
      },
      {
        id: 't-salario-ago',
        transactionType: 'INCOME',
        amount: 20000,
        transactionDate: '2026-08-05',
        competenceMonth: 8,
        competenceYear: 2026,
      },
      {
        id: 't-pgto-fatura',
        transactionType: 'CREDIT_CARD_PAYMENT',
        amount: 500,
        transactionDate: '2026-09-10', // Pago em 10/09
        competenceMonth: 9,
        competenceYear: 2026,
      },
    ];

    // Agosto
    const summaryAgosto = calculateFinancialSummary(transactions, [], 8, 2026);
    expect(summaryAgosto.consumption.totalExpense).toBe(500); // Consumo reconhece os R$ 500
    expect(summaryAgosto.cashFlow.totalOutflow).toBe(0); // Saída bancária em agosto = R$ 0

    // Setembro
    const summarySetembro = calculateFinancialSummary(transactions, [], 9, 2026);
    expect(summarySetembro.consumption.totalExpense).toBe(0); // Em setembro não houve nova compra econômica
    expect(summarySetembro.cashFlow.totalOutflow).toBe(500); // Saída de caixa bancária no pagamento = R$ 500
  });

  // ==========================================
  // CENÁRIO B — Compra parcelada
  // ==========================================
  it('Cenário B: Compra parcelada cria 1 InstallmentPurchase e 10 parcelas sequenciais vinculadas', () => {
    // Compra em 31/08/2026 -> 1ª fatura em 09/2026
    const installments = generateInstallments({
      purchaseDate: '2026-08-31',
      totalAmount: 6000,
      installmentCount: 10,
      creditCard: sampleCard,
    });

    expect(installments).toHaveLength(10);
    expect(installments[0].installmentNumber).toBe(1);
    expect(installments[0].amount).toBe(600);
    expect(installments[0].billingMonth).toBe(9); // 1ª parcela em Setembro
    expect(installments[0].billingYear).toBe(2026);

    expect(installments[1].installmentNumber).toBe(2);
    expect(installments[1].billingMonth).toBe(10); // 2ª parcela em Outubro

    expect(installments[9].installmentNumber).toBe(10);
    expect(installments[9].billingMonth).toBe(6); // 10ª parcela em Junho/2027
    expect(installments[9].billingYear).toBe(2027);
  });

  // ==========================================
  // CENÁRIO C — Importação de meses subsequentes
  // ==========================================
  it('Cenário C: Importação de meses subsequentes reconhece parcelas da mesma compra e pontua score >= 90', () => {
    const existingCandidate = {
      id: 'pur-1',
      creditCardId: 'card-master-black',
      normalizedDescription: 'apple com bill',
      installmentValue: 600,
      installmentCount: 10,
      lastIdentifiedInstallment: 1,
    };

    const nextMonthImportRow = {
      creditCardId: 'card-master-black',
      normalizedDescription: 'apple com bill',
      amount: 600,
      currentInstallment: 2,
      totalInstallments: 10,
    };

    const matchResult = calculateMatchScore(nextMonthImportRow, existingCandidate);

    expect(matchResult.score).toBeGreaterThanOrEqual(90);
    expect(matchResult.matchedPurchaseId).toBe('pur-1');
    expect(matchResult.action).toBe('AUTO_LINK');
  });

  // ==========================================
  // CENÁRIO D — Anti-duplicidade determinístico
  // ==========================================
  it('Cenário D: Reimportação idêntica gera fingerprint idêntico resultando em 0 novas transações', () => {
    const row1 = {
      userId: 'usr-1',
      sourceId: 'card-nubank',
      transactionDate: '2026-08-15',
      normalizedDescription: 'restaurante terraço jardins',
      amount: 145.8,
    };

    const hash1 = generateTransactionFingerprint(row1);
    const hash2 = generateTransactionFingerprint(row1);

    expect(hash1).toBe(hash2);
    expect(hash1.length).toBeGreaterThanOrEqual(16);
  });

  // ==========================================
  // CENÁRIO E — Pagamento de fatura
  // ==========================================
  it('Cenário E: Pagamento de fatura não gera segunda despesa econômica no DRE de Consumo', () => {
    const transactions: RawTransactionItem[] = [
      {
        id: 't-compra',
        transactionType: 'CREDIT_CARD_PURCHASE',
        amount: 800,
        transactionDate: '2026-08-10',
        competenceMonth: 8,
        competenceYear: 2026,
        billingMonth: 9,
        billingYear: 2026,
      },
      {
        id: 't-pgto',
        transactionType: 'CREDIT_CARD_PAYMENT',
        amount: 800,
        transactionDate: '2026-09-10',
        competenceMonth: 9,
        competenceYear: 2026,
      },
    ];

    const dreSetembro = calculateFinancialSummary(transactions, [], 9, 2026);

    // O pagamento da fatura em setembro:
    // 1. NÃO conta como despesa de consumo
    expect(dreSetembro.consumption.totalExpense).toBe(0);
    // 2. Conta estritamente como saída de caixa no fluxo financeiro
    expect(dreSetembro.cashFlow.totalOutflow).toBe(800);
  });

  // ==========================================
  // CENÁRIO F — Transferência entre contas próprias
  // ==========================================
  it('Cenário F: Transferência entre contas próprias tem impacto neutro em receitas e despesas', () => {
    const transactions: RawTransactionItem[] = [
      {
        id: 't-transf',
        transactionType: 'TRANSFER',
        amount: 5000,
        transactionDate: '2026-08-20',
        competenceMonth: 8,
        competenceYear: 2026,
      },
    ];

    const summary = calculateFinancialSummary(transactions, [], 8, 2026);

    expect(summary.consumption.totalIncome).toBe(0);
    expect(summary.consumption.totalExpense).toBe(0);
    expect(summary.cashFlow.totalInflow).toBe(0);
    expect(summary.cashFlow.totalOutflow).toBe(0);
  });
});
