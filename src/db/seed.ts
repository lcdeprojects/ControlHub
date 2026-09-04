import { db } from './index';
import * as s from './schema';
import { calculateInvoiceCycle } from '../lib/engines/invoice-cycle';
import { generateInstallments } from '../lib/engines/installment-engine';
import { generateTransactionFingerprint } from '../lib/engines/fingerprint';

export async function seedDatabase() {
  console.log('🌱 Semeando banco de dados do NexumHub...');

  // 1. Criar Usuário Padrão
  const user = {
    id: 'usr_default',
    name: 'Leonardo C.',
    email: 'leonardo@nexumhub.app',
  };
  await db.insert(s.users).values(user).onConflictDoNothing();

  // 2. Criar Categorias Padrão
  const defaultCategories = [
    // Despesas
    { id: 'cat_mercado', name: 'Mercado', icon: 'shopping-cart', color: '#10b981', type: 'EXPENSE' as const },
    { id: 'cat_restaurantes', name: 'Restaurantes', icon: 'utensils', color: '#f59e0b', type: 'EXPENSE' as const },
    { id: 'cat_moradia', name: 'Moradia', icon: 'home', color: '#6366f1', type: 'HOUSEHOLD' as const },
    { id: 'cat_condominio', name: 'Condomínio', icon: 'building', color: '#8b5cf6', type: 'HOUSEHOLD' as const },
    { id: 'cat_energia', name: 'Energia Elétrica', icon: 'zap', color: '#eab308', type: 'HOUSEHOLD' as const },
    { id: 'cat_agua', name: 'Água e Saneamento', icon: 'droplet', color: '#06b6d4', type: 'HOUSEHOLD' as const },
    { id: 'cat_internet', name: 'Internet & Fibra', icon: 'wifi', color: '#3b82f6', type: 'HOUSEHOLD' as const },
    { id: 'cat_transporte', name: 'Transporte / Uber', icon: 'car', color: '#ec4899', type: 'EXPENSE' as const },
    { id: 'cat_combustivel', name: 'Combustível', icon: 'fuel', color: '#f97316', type: 'EXPENSE' as const },
    { id: 'cat_saude', name: 'Saúde & Farmácia', icon: 'heart-pulse', color: '#ef4444', type: 'EXPENSE' as const },
    { id: 'cat_academia', name: 'Academia', icon: 'dumbbell', color: '#14b8a6', type: 'EXPENSE' as const },
    { id: 'cat_educacao', name: 'Educação & Cursos', icon: 'graduation-cap', color: '#a855f7', type: 'EXPENSE' as const },
    { id: 'cat_lazer', name: 'Lazer & Viagens', icon: 'palmtree', color: '#0ea5e9', type: 'EXPENSE' as const },
    { id: 'cat_compras', name: 'Compras & Eletrônicos', icon: 'shopping-bag', color: '#84cc16', type: 'EXPENSE' as const },
    { id: 'cat_assinaturas', name: 'Assinaturas & Streaming', icon: 'film', color: '#d946ef', type: 'EXPENSE' as const },
    { id: 'cat_manutencao', name: 'Manutenção da Casa', icon: 'wrench', color: '#64748b', type: 'HOUSEHOLD' as const },
    
    // Receitas
    { id: 'cat_salario', name: 'Salário & Remuneração', icon: 'briefcase', color: '#22c55e', type: 'INCOME' as const },
    { id: 'cat_rendimentos', name: 'Rendimentos & Dividendos', icon: 'trending-up', color: '#10b981', type: 'INCOME' as const },
    { id: 'cat_freelance', name: 'Freelance & Bônus', icon: 'award', color: '#3b82f6', type: 'INCOME' as const },
  ];

  for (const cat of defaultCategories) {
    await db.insert(s.categories).values({
      ...cat,
      userId: user.id,
      isSystem: true,
    }).onConflictDoNothing();
  }

  // 3. Criar Contas Bancárias
  const accNubank = {
    id: 'acc_nubank',
    userId: user.id,
    name: 'Conta Nubank',
    type: 'CHECKING' as const,
    bankName: 'Nubank',
    initialBalance: 12500,
    currentBalance: 18450,
    color: '#820ad1',
    icon: 'credit-card',
  };

  const accItau = {
    id: 'acc_itau',
    userId: user.id,
    name: 'Itaú Uniclass',
    type: 'CHECKING' as const,
    bankName: 'Itaú',
    initialBalance: 8000,
    currentBalance: 14200,
    color: '#ec7000',
    icon: 'landmark',
  };

  const accInvest = {
    id: 'acc_btg',
    userId: user.id,
    name: 'BTG Pactual Invest',
    type: 'INVESTMENT' as const,
    bankName: 'BTG Pactual',
    initialBalance: 85000,
    currentBalance: 142000,
    color: '#0b1d3a',
    icon: 'trending-up',
  };

  await db.insert(s.accounts).values(accNubank).onConflictDoNothing();
  await db.insert(s.accounts).values(accItau).onConflictDoNothing();
  await db.insert(s.accounts).values(accInvest).onConflictDoNothing();

  // 4. Criar Cartões de Crédito
  const cardMaster = {
    id: 'card_master_black',
    userId: user.id,
    defaultAccountId: accNubank.id,
    name: 'Mastercard Ultravioleta Black',
    brand: 'Mastercard',
    bank: 'Nubank',
    last4Digits: '8842',
    creditLimit: 30000,
    closingDay: 3, // Corte dia 03
    dueDay: 10,    // Vencimento dia 10
    color: '#18181b',
  };

  const cardVisa = {
    id: 'card_visa_infinite',
    userId: user.id,
    defaultAccountId: accItau.id,
    name: 'Visa Infinite Itaú',
    brand: 'Visa',
    bank: 'Itaú',
    last4Digits: '3490',
    creditLimit: 25000,
    closingDay: 20, // Corte dia 20
    dueDay: 28,     // Vencimento dia 28
    color: '#1e3a8a',
  };

  await db.insert(s.creditCards).values(cardMaster).onConflictDoNothing();
  await db.insert(s.creditCards).values(cardVisa).onConflictDoNothing();

  // 5. Criar Faturas Atuais e Próximas
  const invoiceMasterAug = {
    id: 'inv_master_2026_08',
    creditCardId: cardMaster.id,
    referenceMonth: 8,
    referenceYear: 2026,
    cycleStartDate: '2026-07-04',
    cycleEndDate: '2026-08-03',
    dueDate: '2026-08-10',
    totalAmount: 6420,
    paidAmount: 6420,
    status: 'PAID' as const,
    paidAt: '2026-08-10',
  };

  const invoiceMasterSep = {
    id: 'inv_master_2026_09',
    creditCardId: cardMaster.id,
    referenceMonth: 9,
    referenceYear: 2026,
    cycleStartDate: '2026-08-04',
    cycleEndDate: '2026-09-03',
    dueDate: '2026-09-10',
    totalAmount: 8320,
    paidAmount: 0,
    status: 'OPEN' as const,
  };

  const invoiceMasterOct = {
    id: 'inv_master_2026_10',
    creditCardId: cardMaster.id,
    referenceMonth: 10,
    referenceYear: 2026,
    cycleStartDate: '2026-09-04',
    cycleEndDate: '2026-10-03',
    dueDate: '2026-10-10',
    totalAmount: 4130,
    paidAmount: 0,
    status: 'OPEN' as const,
  };

  await db.insert(s.invoices).values(invoiceMasterAug).onConflictDoNothing();
  await db.insert(s.invoices).values(invoiceMasterSep).onConflictDoNothing();
  await db.insert(s.invoices).values(invoiceMasterOct).onConflictDoNothing();

  // 6. Criar Compras Parceladas de Exemplo
  // Exemplo 1: Notebook R$ 6.000 em 10x de R$ 600
  const notebookPurchase = {
    id: 'pur_notebook_pro',
    userId: user.id,
    creditCardId: cardMaster.id,
    categoryId: 'cat_compras',
    description: 'MacBook Pro M3 Max',
    normalizedDescription: 'MACBOOK PRO M3 MAX',
    totalAmount: 6000,
    installmentCount: 10,
    installmentValue: 600,
    purchaseDate: '2026-06-15',
    firstBillingMonth: 7,
    firstBillingYear: 2026,
    status: 'ACTIVE' as const,
  };
  await db.insert(s.installmentPurchases).values(notebookPurchase).onConflictDoNothing();

  // Gerar as 10 parcelas do Notebook
  const noteInstallments = generateInstallments({
    purchaseDate: '2026-06-15',
    totalAmount: 6000,
    installmentCount: 10,
    creditCard: cardMaster,
  });

  for (const inst of noteInstallments) {
    await db.insert(s.installments).values({
      id: `inst_notebook_${inst.installmentNumber}`,
      installmentPurchaseId: notebookPurchase.id,
      installmentNumber: inst.installmentNumber,
      totalInstallments: inst.totalInstallments,
      amount: inst.amount,
      billingMonth: inst.billingMonth,
      billingYear: inst.billingYear,
      status: inst.billingMonth < 8 ? 'PAID' : (inst.billingMonth === 8 ? 'BILLED' : 'PENDING'),
    }).onConflictDoNothing();
  }

  // Exemplo 2: Smart TV 4K R$ 4.200 em 12x de R$ 350
  const tvPurchase = {
    id: 'pur_smart_tv',
    userId: user.id,
    creditCardId: cardMaster.id,
    categoryId: 'cat_compras',
    description: 'Smart TV LG OLED 65"',
    normalizedDescription: 'SMART TV LG OLED',
    totalAmount: 4200,
    installmentCount: 12,
    installmentValue: 350,
    purchaseDate: '2026-02-10',
    firstBillingMonth: 3,
    firstBillingYear: 2026,
    status: 'ACTIVE' as const,
  };
  await db.insert(s.installmentPurchases).values(tvPurchase).onConflictDoNothing();

  const tvInstallments = generateInstallments({
    purchaseDate: '2026-02-10',
    totalAmount: 4200,
    installmentCount: 12,
    creditCard: cardMaster,
  });

  for (const inst of tvInstallments) {
    await db.insert(s.installments).values({
      id: `inst_tv_${inst.installmentNumber}`,
      installmentPurchaseId: tvPurchase.id,
      installmentNumber: inst.installmentNumber,
      totalInstallments: inst.totalInstallments,
      amount: inst.amount,
      billingMonth: inst.billingMonth,
      billingYear: inst.billingYear,
      status: inst.billingMonth < 8 ? 'PAID' : (inst.billingMonth === 8 ? 'BILLED' : 'PENDING'),
    }).onConflictDoNothing();
  }

  // 7. Lançar Transações de Receitas e Despesas Recentes
  const sampleTransactions = [
    // Receitas
    {
      id: 't_sal_ago',
      userId: user.id,
      accountId: accNubank.id,
      categoryId: 'cat_salario',
      transactionType: 'INCOME' as const,
      paymentMethod: 'TRANSFER' as const,
      description: 'Salário Tech Lead',
      normalizedDescription: 'SALARIO TECH LEAD',
      amount: 20000,
      transactionDate: '2026-08-05',
      competenceMonth: 8,
      competenceYear: 2026,
      fingerprint: generateTransactionFingerprint({
        userId: user.id,
        sourceId: accNubank.id,
        transactionDate: '2026-08-05',
        normalizedDescription: 'SALARIO TECH LEAD',
        amount: 20000,
      }),
    },
    {
      id: 't_div_ago',
      userId: user.id,
      accountId: accInvest.id,
      categoryId: 'cat_rendimentos',
      transactionType: 'INCOME' as const,
      paymentMethod: 'TRANSFER' as const,
      description: 'Dividendos Fundos Imobiliários',
      normalizedDescription: 'DIVIDENDOS FII',
      amount: 1450,
      transactionDate: '2026-08-15',
      competenceMonth: 8,
      competenceYear: 2026,
      fingerprint: generateTransactionFingerprint({
        userId: user.id,
        sourceId: accInvest.id,
        transactionDate: '2026-08-15',
        normalizedDescription: 'DIVIDENDOS FII',
        amount: 1450,
      }),
    },

    // Despesas de Casa
    {
      id: 't_cond_ago',
      userId: user.id,
      accountId: accNubank.id,
      categoryId: 'cat_condominio',
      transactionType: 'EXPENSE' as const,
      paymentMethod: 'PIX' as const,
      description: 'Condomínio Residencial',
      normalizedDescription: 'CONDOMINIO RESIDENCIAL',
      amount: 1100,
      transactionDate: '2026-08-10',
      competenceMonth: 8,
      competenceYear: 2026,
      fingerprint: generateTransactionFingerprint({
        userId: user.id,
        sourceId: accNubank.id,
        transactionDate: '2026-08-10',
        normalizedDescription: 'CONDOMINIO RESIDENCIAL',
        amount: 1100,
      }),
    },
    {
      id: 't_luz_ago',
      userId: user.id,
      accountId: accNubank.id,
      categoryId: 'cat_energia',
      transactionType: 'EXPENSE' as const,
      paymentMethod: 'BOLETO' as const,
      description: 'Copel Energia Elétrica',
      normalizedDescription: 'COPEL ENERGIA',
      amount: 380,
      transactionDate: '2026-08-12',
      competenceMonth: 8,
      competenceYear: 2026,
      fingerprint: generateTransactionFingerprint({
        userId: user.id,
        sourceId: accNubank.id,
        transactionDate: '2026-08-12',
        normalizedDescription: 'COPEL ENERGIA',
        amount: 380,
      }),
    },
    {
      id: 't_net_ago',
      userId: user.id,
      accountId: accNubank.id,
      categoryId: 'cat_internet',
      transactionType: 'EXPENSE' as const,
      paymentMethod: 'AUTO_DEBIT' as const,
      description: 'Claro Fibra 500MB',
      normalizedDescription: 'CLARO FIBRA',
      amount: 160,
      transactionDate: '2026-08-18',
      competenceMonth: 8,
      competenceYear: 2026,
      fingerprint: generateTransactionFingerprint({
        userId: user.id,
        sourceId: accNubank.id,
        transactionDate: '2026-08-18',
        normalizedDescription: 'CLARO FIBRA',
        amount: 160,
      }),
    },

    // Compras no Cartão de Crédito
    {
      id: 't_merc_ago',
      userId: user.id,
      creditCardId: cardMaster.id,
      categoryId: 'cat_mercado',
      transactionType: 'CREDIT_CARD_PURCHASE' as const,
      paymentMethod: 'CREDIT' as const,
      description: 'Supermercado Condor Gourmet',
      normalizedDescription: 'SUPERMERCADO CONDOR',
      amount: 850,
      transactionDate: '2026-08-08',
      competenceMonth: 8,
      competenceYear: 2026,
      billingMonth: 9,
      billingYear: 2026,
      fingerprint: generateTransactionFingerprint({
        userId: user.id,
        sourceId: cardMaster.id,
        transactionDate: '2026-08-08',
        normalizedDescription: 'SUPERMERCADO CONDOR',
        amount: 850,
      }),
    },
    {
      id: 't_rest_ago',
      userId: user.id,
      creditCardId: cardMaster.id,
      categoryId: 'cat_restaurantes',
      transactionType: 'CREDIT_CARD_PURCHASE' as const,
      paymentMethod: 'CREDIT' as const,
      description: 'Restaurante Terraza Steakhouse',
      normalizedDescription: 'RESTAURANTE TERRAZA',
      amount: 320,
      transactionDate: '2026-08-14',
      competenceMonth: 8,
      competenceYear: 2026,
      billingMonth: 9,
      billingYear: 2026,
      fingerprint: generateTransactionFingerprint({
        userId: user.id,
        sourceId: cardMaster.id,
        transactionDate: '2026-08-14',
        normalizedDescription: 'RESTAURANTE TERRAZA',
        amount: 320,
      }),
    },
    {
      id: 't_netfl_ago',
      userId: user.id,
      creditCardId: cardMaster.id,
      categoryId: 'cat_assinaturas',
      transactionType: 'CREDIT_CARD_PURCHASE' as const,
      paymentMethod: 'CREDIT' as const,
      description: 'Netflix 4K Premium',
      normalizedDescription: 'NETFLIX',
      amount: 59.90,
      transactionDate: '2026-08-02',
      competenceMonth: 8,
      competenceYear: 2026,
      billingMonth: 9,
      billingYear: 2026,
      fingerprint: generateTransactionFingerprint({
        userId: user.id,
        sourceId: cardMaster.id,
        transactionDate: '2026-08-02',
        normalizedDescription: 'NETFLIX',
        amount: 59.90,
      }),
    },
    {
      id: 't_spot_ago',
      userId: user.id,
      creditCardId: cardMaster.id,
      categoryId: 'cat_assinaturas',
      transactionType: 'CREDIT_CARD_PURCHASE' as const,
      paymentMethod: 'CREDIT' as const,
      description: 'Spotify Premium Duo',
      normalizedDescription: 'SPOTIFY',
      amount: 27.90,
      transactionDate: '2026-08-02',
      competenceMonth: 8,
      competenceYear: 2026,
      billingMonth: 9,
      billingYear: 2026,
      fingerprint: generateTransactionFingerprint({
        userId: user.id,
        sourceId: cardMaster.id,
        transactionDate: '2026-08-02',
        normalizedDescription: 'SPOTIFY',
        amount: 27.90,
      }),
    },
  ];

  for (const t of sampleTransactions) {
    await db.insert(s.transactions).values(t).onConflictDoNothing();
  }

  // 8. Planejamento / Orçamentos do Mês
  const budgetsList = [
    { id: 'b_mercado', userId: user.id, categoryId: 'cat_mercado', month: 8, year: 2026, limitAmount: 2000 },
    { id: 'b_restaurantes', userId: user.id, categoryId: 'cat_restaurantes', month: 8, year: 2026, limitAmount: 1200 },
    { id: 'b_lazer', userId: user.id, categoryId: 'cat_lazer', month: 8, year: 2026, limitAmount: 1000 },
    { id: 'b_compras', userId: user.id, categoryId: 'cat_compras', month: 8, year: 2026, limitAmount: 1500 },
    { id: 'b_combustivel', userId: user.id, categoryId: 'cat_combustivel', month: 8, year: 2026, limitAmount: 800 },
  ];

  for (const b of budgetsList) {
    await db.insert(s.budgets).values(b).onConflictDoNothing();
  }

  // 9. Investimentos e Ativos Patrimoniais
  const investmentsList = [
    {
      id: 'inv_cdb_110',
      userId: user.id,
      name: 'CDB Liquidez Diária 110% CDI',
      type: 'CDB' as const,
      investedAmount: 50000,
      currentValue: 56420,
      institution: 'BTG Pactual',
      notes: 'Reserva de emergência',
    },
    {
      id: 'inv_tesouro_ipca',
      userId: user.id,
      name: 'Tesouro IPCA+ 2035',
      type: 'TREASURY' as const,
      investedAmount: 40000,
      currentValue: 47800,
      institution: 'Tesouro Direto',
      notes: 'Aposentadoria / Longo Prazo',
    },
    {
      id: 'inv_fii_carteira',
      userId: user.id,
      name: 'Carteira Fundos Imobiliários (HGLG, KNCR, MXRF)',
      type: 'FUNDS' as const,
      investedAmount: 30000,
      currentValue: 34500,
      institution: 'XP Investimentos',
      notes: 'Renda mensal passiva',
    },
    {
      id: 'inv_imovel',
      userId: user.id,
      name: 'Apartamento Residencial Batel',
      type: 'REAL_ESTATE' as const,
      investedAmount: 450000,
      currentValue: 620000,
      institution: 'Patrimônio Próprio',
      notes: 'Imóvel residencial',
    },
  ];

  for (const inv of investmentsList) {
    await db.insert(s.investments).values(inv).onConflictDoNothing();
  }

  console.log('✅ Banco de dados semeado com sucesso com dados realistas!');
}

// Executa diretamente se for chamado via CLI
if (require.main === module) {
  seedDatabase().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
  });
}
