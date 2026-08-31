import { calculateInvoiceCycle } from './invoice-cycle';
import { CreditCardConfig } from '../types';

export interface GenerateInstallmentsParams {
  purchaseDate: string;
  totalAmount: number;
  installmentCount: number;
  creditCard: Pick<CreditCardConfig, 'closingDay' | 'dueDay'>;
}

export interface GeneratedInstallmentItem {
  installmentNumber: number;
  totalInstallments: number;
  amount: number;
  billingMonth: number;
  billingYear: number;
  invoiceReference: string;
  dueDate: string;
}

/**
 * Requisitos 14, 15, 16:
 * Ao criar uma compra parcelada:
 * 1. Identificar a data da compra e o cartão.
 * 2. Calcular em qual fatura entra a 1ª parcela usando calculateInvoiceCycle.
 * 3. Gerar as demais parcelas sequencialmente nas faturas dos meses subsequentes.
 * Nunca criar N compras independentes.
 */
export function generateInstallments(params: GenerateInstallmentsParams): GeneratedInstallmentItem[] {
  const { purchaseDate, totalAmount, installmentCount, creditCard } = params;

  if (installmentCount <= 0) {
    throw new Error('Quantidade de parcelas deve ser maior que zero.');
  }

  // Calcula a primeira fatura com base no ciclo real
  const firstCycle = calculateInvoiceCycle(purchaseDate, creditCard);
  
  // Divisão precisa do valor para evitar perdas de centavos
  const baseValue = Math.floor((totalAmount / installmentCount) * 100) / 100;
  const remainder = Math.round((totalAmount - baseValue * installmentCount) * 100) / 100;

  const items: GeneratedInstallmentItem[] = [];

  let currentMonth = firstCycle.billingMonth;
  let currentYear = firstCycle.billingYear;

  for (let i = 1; i <= installmentCount; i++) {
    // Adiciona eventuais centavos de arredondamento na 1ª parcela
    const itemAmount = i === 1 ? Math.round((baseValue + remainder) * 100) / 100 : baseValue;
    const dueDay = Math.min(creditCard.dueDay || 10, new Date(currentYear, currentMonth, 0).getDate());
    const dueDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(dueDay).padStart(2, '0')}`;
    const invoiceReference = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

    items.push({
      installmentNumber: i,
      totalInstallments: installmentCount,
      amount: itemAmount,
      billingMonth: currentMonth,
      billingYear: currentYear,
      invoiceReference,
      dueDate,
    });

    // Avança 1 mês para a próxima parcela
    currentMonth += 1;
    if (currentMonth > 12) {
      currentMonth = 1;
      currentYear += 1;
    }
  }

  return items;
}
