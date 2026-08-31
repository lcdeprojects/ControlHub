import { db } from './index';
import * as s from './schema';

export async function resetDatabase() {
  console.log('🧹 Limpando todos os dados transacionais e cadastrais do ControlHub...');

  // 1. Limpar tabelas dependentes
  await db.delete(s.transactions);
  await db.delete(s.installments);
  await db.delete(s.installmentPurchases);
  await db.delete(s.invoices);
  await db.delete(s.transfers);
  await db.delete(s.recurringTransactions);
  await db.delete(s.budgets);
  await db.delete(s.investments);
  await db.delete(s.importBatches);
  await db.delete(s.merchantRules);
  await db.delete(s.auditLogs);
  await db.delete(s.creditCards);
  await db.delete(s.accounts);

  // 2. Garantir que o usuário e as categorias essenciais estejam disponíveis
  const user = {
    id: 'usr_default',
    name: 'Leonardo C.',
    email: 'leonardo@controlhub.app',
  };
  await db.insert(s.users).values(user).onConflictDoNothing();

  const defaultCategories = [
    // Despesas Gerais
    { id: 'cat_mercado', name: 'Mercado', icon: 'shopping-cart', color: '#10b981', type: 'EXPENSE' as const },
    { id: 'cat_restaurantes', name: 'Restaurantes', icon: 'utensils', color: '#f59e0b', type: 'EXPENSE' as const },
    { id: 'cat_transporte', name: 'Transporte / Uber', icon: 'car', color: '#ec4899', type: 'EXPENSE' as const },
    { id: 'cat_combustivel', name: 'Combustível', icon: 'fuel', color: '#f97316', type: 'EXPENSE' as const },
    { id: 'cat_saude', name: 'Saúde & Farmácia', icon: 'heart-pulse', color: '#ef4444', type: 'EXPENSE' as const },
    { id: 'cat_academia', name: 'Academia', icon: 'dumbbell', color: '#14b8a6', type: 'EXPENSE' as const },
    { id: 'cat_educacao', name: 'Educação & Cursos', icon: 'graduation-cap', color: '#a855f7', type: 'EXPENSE' as const },
    { id: 'cat_lazer', name: 'Lazer & Viagens', icon: 'palmtree', color: '#0ea5e9', type: 'EXPENSE' as const },
    { id: 'cat_compras', name: 'Compras & Eletrônicos', icon: 'shopping-bag', color: '#84cc16', type: 'EXPENSE' as const },
    { id: 'cat_assinaturas', name: 'Assinaturas & Streaming', icon: 'film', color: '#d946ef', type: 'EXPENSE' as const },

    // Despesas da Casa
    { id: 'cat_moradia', name: 'Moradia / Aluguel', icon: 'home', color: '#6366f1', type: 'HOUSEHOLD' as const },
    { id: 'cat_condominio', name: 'Condomínio', icon: 'building', color: '#8b5cf6', type: 'HOUSEHOLD' as const },
    { id: 'cat_energia', name: 'Energia Elétrica', icon: 'zap', color: '#eab308', type: 'HOUSEHOLD' as const },
    { id: 'cat_agua', name: 'Água & Saneamento', icon: 'droplet', color: '#06b6d4', type: 'HOUSEHOLD' as const },
    { id: 'cat_internet', name: 'Internet & Fibra', icon: 'wifi', color: '#3b82f6', type: 'HOUSEHOLD' as const },
    { id: 'cat_manutencao', name: 'Manutenção da Casa', icon: 'wrench', color: '#64748b', type: 'HOUSEHOLD' as const },

    // Receitas
    { id: 'cat_salario', name: 'Salário & Remuneração', icon: 'briefcase', color: '#22c55e', type: 'INCOME' as const },
    { id: 'cat_rendimentos', name: 'Rendimentos & Dividendos', icon: 'trending-up', color: '#10b981', type: 'INCOME' as const },
    { id: 'cat_freelance', name: 'Freelance & Bônus', icon: 'award', color: '#3b82f6', type: 'INCOME' as const },
    { id: 'cat_outros', name: 'Outros', icon: 'tag', color: '#94a3b8', type: 'EXPENSE' as const },
  ];

  for (const cat of defaultCategories) {
    await db.insert(s.categories).values({
      ...cat,
      userId: user.id,
      isSystem: true,
    }).onConflictDoNothing();
  }

  console.log('✅ Banco de dados zerado com sucesso! Pronto para novos lançamentos.');
}

if (require.main === module) {
  resetDatabase().then(() => process.exit(0)).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
