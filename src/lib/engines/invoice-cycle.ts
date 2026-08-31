import { InvoiceCycleResult, CreditCardConfig } from '../types';

/**
 * Função central responsável por determinar a fatura, ciclo e vencimento de qualquer compra.
 * Requisito 8: calculate_invoice_cycle(transaction_date, credit_card)
 */
export function calculateInvoiceCycle(
  transactionDateInput: string | Date,
  creditCard: Pick<CreditCardConfig, 'closingDay' | 'dueDay'>
): InvoiceCycleResult {
  const tDate = typeof transactionDateInput === 'string'
    ? new Date(transactionDateInput + 'T12:00:00')
    : new Date(transactionDateInput);

  const purchaseYear = tDate.getFullYear();
  const purchaseMonth = tDate.getMonth() + 1; // 1 to 12
  const purchaseDay = tDate.getDate();

  const closingDay = Math.min(Math.max(creditCard.closingDay || 1, 1), 31);
  const dueDay = Math.min(Math.max(creditCard.dueDay || 1, 1), 31);

  // Competência real do consumo (data do fato gerador)
  const purchaseCompetence = {
    month: purchaseMonth,
    year: purchaseYear,
    reference: `${purchaseYear}-${String(purchaseMonth).padStart(2, '0')}`,
  };

  // Determinar o ciclo de fechamento:
  // Se a data da compra for MENOR OU IGUAL ao dia de fechamento do mês, fecha no próprio mês da compra.
  // Se a data for MAIOR que o dia de fechamento, fecha no ciclo do mês seguinte.
  let closingMonth: number;
  let closingYear: number;

  if (purchaseDay <= closingDay) {
    closingMonth = purchaseMonth;
    closingYear = purchaseYear;
  } else {
    closingMonth = purchaseMonth + 1;
    closingYear = purchaseYear;
    if (closingMonth > 12) {
      closingMonth = 1;
      closingYear += 1;
    }
  }

  // Ciclo anterior (início do ciclo = dia posterior ao fechamento anterior)
  let prevMonth = closingMonth - 1;
  let prevYear = closingYear;
  if (prevMonth < 1) {
    prevMonth = 12;
    prevYear -= 1;
  }

  const startDay = closingDay + 1;
  const cycleStartDate = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(Math.min(startDay, daysInMonth(prevYear, prevMonth))).padStart(2, '0')}`;
  const cycleEndDate = `${closingYear}-${String(closingMonth).padStart(2, '0')}-${String(Math.min(closingDay, daysInMonth(closingYear, closingMonth))).padStart(2, '0')}`;

  // Determinar mês e ano de vencimento / cobrança (Billing Reference)
  // Regra padrão de mercado de cartões:
  // Se dueDay > closingDay (ex: fecha dia 03, vence dia 10): O vencimento é no MESMO mês do fechamento (dueMonth = closingMonth).
  // Se dueDay <= closingDay (ex: fecha dia 25, vence dia 05): O vencimento é no MÊS SEGUINTE ao fechamento (dueMonth = closingMonth + 1).
  let dueMonth = closingMonth;
  let dueYear = closingYear;

  if (dueDay <= closingDay) {
    dueMonth = closingMonth + 1;
    if (dueMonth > 12) {
      dueMonth = 1;
      dueYear += 1;
    }
  }

  const dueDate = `${dueYear}-${String(dueMonth).padStart(2, '0')}-${String(Math.min(dueDay, daysInMonth(dueYear, dueMonth))).padStart(2, '0')}`;
  const invoiceReference = `${dueYear}-${String(dueMonth).padStart(2, '0')}`;

  return {
    invoiceReference,
    billingMonth: dueMonth,
    billingYear: dueYear,
    cycleStartDate,
    cycleEndDate,
    dueDate,
    purchaseCompetence,
  };
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}
