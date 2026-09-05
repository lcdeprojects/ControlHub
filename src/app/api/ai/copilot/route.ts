import { NextResponse } from 'next/server';
import { requireActiveSubscription } from '@/lib/auth';
import { db } from '@/db';
import * as s from '@/db/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { formatCurrency } from '@/lib/utils';
import { generateTransactionFingerprint } from '@/lib/engines/fingerprint';
import { normalizeTransactionDescription } from '@/lib/engines/matching-algorithm';

export const dynamic = 'force-dynamic';

interface CopilotRequest {
  message: string;
}

export async function POST(req: Request) {
  try {
    const subCheck = await requireActiveSubscription(req);
    if ('error' in subCheck) {
      return NextResponse.json({ error: subCheck.error, isExpired: subCheck.isExpired }, { status: subCheck.status });
    }

    const userId = subCheck.user.id;
    const userName = subCheck.user.name.split(' ')[0];
    const body: CopilotRequest = await req.json().catch(() => ({ message: '' }));
    const message = (body.message || '').trim();

    if (!message) {
      return NextResponse.json({ error: 'Mensagem vazia' }, { status: 400 });
    }

    // 1. Carregar Contexto Financeiro do Usuário
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const [accounts, cards, categories, currentMonthTx] = await Promise.all([
      db.select().from(s.accounts).where(eq(s.accounts.userId, userId)),
      db.select().from(s.creditCards).where(eq(s.creditCards.userId, userId)),
      db.select().from(s.categories).where(eq(s.categories.userId, userId)),
      db.select().from(s.transactions).where(
        and(
          eq(s.transactions.userId, userId),
          eq(s.transactions.competenceMonth, currentMonth),
          eq(s.transactions.competenceYear, currentYear)
        )
      ),
    ]);

    const totalBalance = accounts.reduce((acc, a) => acc + (a.currentBalance || 0), 0);
    const totalIncome = currentMonthTx
      .filter((t) => t.transactionType === 'INCOME')
      .reduce((acc, t) => acc + t.amount, 0);
    const totalExpenses = currentMonthTx
      .filter((t) => t.transactionType !== 'INCOME')
      .reduce((acc, t) => acc + t.amount, 0);

    const netCashFlow = totalIncome - totalExpenses;

    const msgLower = message.toLowerCase();

    // 2. Verificar se é uma solicitação de criação rápida de lançamento (Ex: "gastei 50 no almoço", "lançar 120 mercado")
    const createTxMatch = msgLower.match(
      /(gastei|lançar|adicionar|paguei|compra|recebi)\s+(?:de\s+)?(?:r\$\s*)?(\d+(?:[.,]\d{1,2})?)\s*(?:em|no|na|com|para)?\s*(.*)/i
    );

    if (createTxMatch) {
      const actionTypeWord = createTxMatch[1].toLowerCase();
      const amountStr = createTxMatch[2].replace(',', '.');
      const rawDesc = createTxMatch[3].trim() || 'Lançamento via IA';
      const amountVal = parseFloat(amountStr);

      if (!isNaN(amountVal) && amountVal > 0) {
        const isIncomeAction = actionTypeWord.includes('recebi');
        const txType = isIncomeAction ? 'INCOME' : 'EXPENSE';

        // Tenta encontrar uma categoria compatível
        let matchedCategory = categories.find((c) =>
          rawDesc.toLowerCase().includes(c.name.toLowerCase())
        );

        if (!matchedCategory) {
          if (isIncomeAction) {
            matchedCategory = categories.find((c) => c.type === 'INCOME') || categories[0];
          } else {
            matchedCategory = categories.find((c) => c.name.toLowerCase().includes('mercado') || c.type === 'EXPENSE') || categories[0];
          }
        }

        const defaultAccount = accounts[0];
        const dateStr = now.toISOString().slice(0, 10);
        const norm = normalizeTransactionDescription(rawDesc);
        const txId = `tx_ai_${Date.now()}`;
        const fp = generateTransactionFingerprint({
          userId,
          transactionDate: dateStr,
          amount: amountVal,
          normalizedDescription: norm.normalizedDescription,
          sourceId: defaultAccount?.id || 'GENERIC',
        });

        await db.insert(s.transactions).values({
          id: txId,
          userId,
          accountId: defaultAccount?.id || null,
          categoryId: matchedCategory?.id || null,
          transactionType: txType,
          amount: amountVal,
          transactionDate: dateStr,
          competenceMonth: currentMonth,
          competenceYear: currentYear,
          billingMonth: currentMonth,
          billingYear: currentYear,
          description: rawDesc.charAt(0).toUpperCase() + rawDesc.slice(1),
          normalizedDescription: norm.normalizedDescription,
          paymentMethod: 'DEBIT',
          fingerprint: fp,
        });

        if (defaultAccount && txType === 'EXPENSE') {
          await db
            .update(s.accounts)
            .set({ currentBalance: defaultAccount.currentBalance - amountVal })
            .where(eq(s.accounts.id, defaultAccount.id));
        } else if (defaultAccount && txType === 'INCOME') {
          await db
            .update(s.accounts)
            .set({ currentBalance: defaultAccount.currentBalance + amountVal })
            .where(eq(s.accounts.id, defaultAccount.id));
        }

        return NextResponse.json({
          reply: `✅ **Lançamento Registrado com Sucesso!**\n\n- **Descrição:** ${rawDesc}\n- **Valor:** ${formatCurrency(amountVal)}\n- **Tipo:** ${isIncomeAction ? 'Receita 📈' : 'Despesa 📉'}\n- **Categoria:** ${matchedCategory?.name || 'Geral'}\n- **Conta:** ${defaultAccount?.name || 'Padrão'}\n\nSeu saldo atualizado é **${formatCurrency(totalBalance + (isIncomeAction ? amountVal : -amountVal))}**.`,
          actionTaken: 'CREATED_TRANSACTION',
        });
      }
    }

    // 3. Respostas Inteligentes de Análise Financeira
    if (msgLower.includes('resumo') || msgLower.includes('saldo') || msgLower.includes('como estou')) {
      return NextResponse.json({
        reply: `📊 **Resumo Financeiro de ${userName} (${currentMonth}/${currentYear}):**\n\n` +
          `• **Saldo Total em Contas:** ${formatCurrency(totalBalance)}\n` +
          `• **Receitas no Mês:** ${formatCurrency(totalIncome)}\n` +
          `• **Despesas no Mês:** ${formatCurrency(totalExpenses)}\n` +
          `• **Resultado Líquido:** ${netCashFlow >= 0 ? '🟢 +' : '🔴 '}${formatCurrency(netCashFlow)}\n\n` +
          `${netCashFlow >= 0 ? '🎉 Parabéns! Você está no verde este mês.' : '⚠️ Cuidado: Suas despesas estão superando as receitas este mês.'}`,
      });
    }

    if (msgLower.includes('cartão') || msgLower.includes('cartao') || msgLower.includes('fatura')) {
      if (cards.length === 0) {
        return NextResponse.json({
          reply: `💳 Você ainda não possui cartões de crédito cadastrados. Cadastre seus cartões no módulo **Cartões & Faturas** para acompanhar o limite disponível e o fechamento!`,
        });
      }

      const cardSummary = cards
        .map((c) => `• **${c.name}:** Limite ${formatCurrency(c.creditLimit)} (Fecha dia ${c.closingDay}, Vence dia ${c.dueDay})`)
        .join('\n');

      return NextResponse.json({
        reply: `💳 **Seus Cartões de Crédito Cadastrados (${cards.length}):**\n\n${cardSummary}\n\n💡 *Dica Copilot:* Suas parcelas e faturas futuras são calculadas automaticamente no extrato mensal.`,
      });
    }

    if (msgLower.includes('economizar') || msgLower.includes('dica') || msgLower.includes('ajuda')) {
      // Encontrar maior categoria de despesa
      const catTotals: Record<string, number> = {};
      currentMonthTx.forEach((t) => {
        if (t.transactionType !== 'INCOME' && t.categoryId) {
          catTotals[t.categoryId] = (catTotals[t.categoryId] || 0) + t.amount;
        }
      });

      let highestCatName = 'variados';
      let highestCatVal = 0;
      Object.entries(catTotals).forEach(([catId, val]) => {
        if (val > highestCatVal) {
          highestCatVal = val;
          const match = categories.find((c) => c.id === catId);
          if (match) highestCatName = match.name;
        }
      });

      return NextResponse.json({
        reply: `💡 **Dicas Personalizadas do Nexum Copilot para ${userName}:**\n\n` +
          `1. **Maior Fonte de Gastos:** Sua maior categoria de consumo este mês é **${highestCatName}** com ${formatCurrency(highestCatVal)}.\n` +
          `2. **Regra 50/30/20:** Tente destinar 50% dos seus ${formatCurrency(totalIncome || totalBalance)} para necessidades essenciais, 30% para desejos pessoais e 20% para sua Reserva de Emergência.\n` +
          `3. **Lançamento Rápido:** Você pode mandar por mensagem *"Gastei 45 almoço"* para registrar despesas em 2 segundos!`,
      });
    }

    // Resposta Padrão Interativa
    return NextResponse.json({
      reply: `🤖 **Nexum Copilot à sua disposição, ${userName}!**\n\n` +
        `Eu posso analisar suas finanças e registrar lançamentos instantaneamente.\n\n` +
        `**Exemplos do que você pode digitar:**\n` +
        `• *"Gastei 65 reais na farmácia"* (Registra despesa na hora)\n` +
        `• *"Recebi 1500 reais de freela"* (Registra receita)\n` +
        `• *"Qual é o meu resumo deste mês?"*\n` +
        `• *"Como estão meus cartões de crédito?"*\n` +
        `• *"Como posso economizar?"*`,
    });
  } catch (error: any) {
    console.error('Copilot API Error:', error);
    return NextResponse.json({ error: error.message || 'Erro ao processar consulta da IA' }, { status: 500 });
  }
}
