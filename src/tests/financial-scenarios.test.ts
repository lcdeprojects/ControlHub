import { describe, it, expect } from 'vitest';
import { calculateInvoiceCycle } from '../lib/engines/invoice-cycle';
import { generateInstallments } from '../lib/engines/installment-engine';
import { generateTransactionFingerprint } from '../lib/engines/fingerprint';
import { normalizeTransactionDescription, calculateMatchScore } from '../lib/engines/matching-algorithm';
import { calculateFinancialSummary, RawTransactionItem } from '../lib/engines/financial-calculator';

describe('Suíte de Regras Financeiras — Cenários A a F (Requisito 49)', () => {
  const sampleCard = {
    id: 'card-master-black',
    closingDay: 3, // Corte dia 03
    dueDay: 10,    // Vencimento dia 10
  };

  // ==========================================
  // CENÁRIO A — Compra normal no cartão
  // ==========================================
  it('Cenário A: Compra no cartão gera consumo na data da compra e saída de caixa apenas no vencimento/pagamento', () => {
    const purchaseDate = '2026-08-02';
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
        transactionDate: '2026-08-02',
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
    const installments = generateInstallments({
      purchaseDate: '2026-08-02',
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

    // Soma exata das parcelas deve ser R$ 6.000
    const totalSum = installments.reduce((acc, curr) => acc + curr.amount, 0);
    expect(totalSum).toBe(6000);
  });

  // ==========================================
  // CENÁRIO C — Importação mensal com Matching Score
  // ==========================================
  it('Cenário C: Importação de meses subsequentes reconhece parcelas da mesma compra e pontua score >= 90', () => {
    // Compra existente cadastrada anteriormente
    const existingPurchase = {
      id: 'pur-apple-123',
      creditCardId: sampleCard.id,
      normalizedDescription: 'APPLE STORE',
      installmentValue: 500,
      installmentCount: 10,
    };

    // Item importado na fatura seguinte: "APPLE STORE 02/10"
    const norm = normalizeTransactionDescription('APPLE STORE 02/10');
    expect(norm.normalizedDescription).toBe('APPLE STORE');
    expect(norm.currentInstallment).toBe(2);
    expect(norm.totalInstallments).toBe(10);

    const scoreResult = calculateMatchScore(
      {
        creditCardId: sampleCard.id,
        normalizedDescription: norm.normalizedDescription,
        amount: 500,
        currentInstallment: norm.currentInstallment,
        totalInstallments: norm.totalInstallments,
      },
      existingPurchase
    );

    expect(scoreResult.score).toBeGreaterThanOrEqual(90); // 30 + 30 + 20 + 20 = 100
    expect(scoreResult.action).toBe('AUTO_LINK');
    expect(scoreResult.matchedPurchaseId).toBe('pur-apple-123');
  });

  // ==========================================
  // CENÁRIO D — Arquivo duplicado
  // ==========================================
  it('Cenário D: Reimportação idêntica gera fingerprint idêntico resultando em 0 novas transações', () => {
    const item1 = {
      userId: 'user-1',
      sourceId: 'card-1',
      transactionDate: '2026-08-15',
      normalizedDescription: 'MERCADO CONDOR',
      amount: 450.25,
      installmentNumber: 0,
    };

    const fp1 = generateTransactionFingerprint(item1);
    const fp2 = generateTransactionFingerprint(item1);

    expect(fp1).toBe(fp2);

    const existingFingerprints = new Set([fp1]);
    const isDuplicate = existingFingerprints.has(fp2);
    expect(isDuplicate).toBe(true);
  });

  // ==========================================
  // CENÁRIO E — Pagamento da fatura não duplica despesa
  // ==========================================
  it('Cenário E: Pagamento de fatura não gera segunda despesa econômica no DRE de Consumo', () => {
    const transactions: RawTransactionItem[] = [
      {
        id: 't-item-1',
        transactionType: 'CREDIT_CARD_PURCHASE',
        amount: 3000,
        transactionDate: '2026-08-10',
        competenceMonth: 8,
        competenceYear: 2026,
      },
      {
        id: 't-item-2',
        transactionType: 'CREDIT_CARD_PURCHASE',
        amount: 2000,
        transactionDate: '2026-08-20',
        competenceMonth: 8,
        competenceYear: 2026,
      },
      {
        id: 't-pagamento-fatura',
        transactionType: 'CREDIT_CARD_PAYMENT',
        amount: 5000,
        transactionDate: '2026-09-10',
        competenceMonth: 9,
        competenceYear: 2026,
      },
    ];

    const summaryAgosto = calculateFinancialSummary(transactions, [], 8, 2026);
    expect(summaryAgosto.consumption.totalExpense).toBe(5000); // 3000 + 2000

    const summarySetembro = calculateFinancialSummary(transactions, [], 9, 2026);
    expect(summarySetembro.consumption.totalExpense).toBe(0); // Zero despesa econômica em setembro

    // A despesa econômica total nos 2 meses somados é R$ 5.000, NUNCA R$ 10.000
    const totalEconomicExpense = summaryAgosto.consumption.totalExpense + summarySetembro.consumption.totalExpense;
    expect(totalEconomicExpense).toBe(5000);
  });

  // ==========================================
  // CENÁRIO F — Transferência entre contas próprias
  // ==========================================
  it('Cenário F: Transferência entre contas próprias tem impacto neutro em receitas e despesas', () => {
    const transactions: RawTransactionItem[] = [
      {
        id: 't-transfer-1',
        transactionType: 'TRANSFER',
        amount: 3000,
        transactionDate: '2026-08-12',
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
