import { db } from './index';
import * as s from './schema';
import { sql } from 'drizzle-orm';

let isInitialized = false;

export async function ensureDatabaseSchema() {
  if (isInitialized) return;

  try {
    // Cria as tabelas essenciais se não existirem
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        avatar_url TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        bank_name TEXT,
        initial_balance REAL NOT NULL DEFAULT 0,
        current_balance REAL NOT NULL DEFAULT 0,
        color TEXT DEFAULT '#3b82f6',
        icon TEXT DEFAULT 'landmark',
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS credit_cards (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        default_account_id TEXT REFERENCES accounts(id),
        name TEXT NOT NULL,
        brand TEXT NOT NULL,
        bank TEXT NOT NULL,
        last4_digits TEXT NOT NULL,
        credit_limit REAL NOT NULL,
        closing_day INTEGER NOT NULL,
        due_day INTEGER NOT NULL,
        color TEXT DEFAULT '#18181b',
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        icon TEXT NOT NULL,
        color TEXT NOT NULL,
        type TEXT NOT NULL,
        is_system INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS merchants (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        normalized_name TEXT NOT NULL,
        default_category_id TEXT REFERENCES categories(id),
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS installment_purchases (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        credit_card_id TEXT NOT NULL REFERENCES credit_cards(id) ON DELETE CASCADE,
        category_id TEXT REFERENCES categories(id),
        merchant_id TEXT REFERENCES merchants(id),
        description TEXT NOT NULL,
        normalized_description TEXT NOT NULL,
        total_amount REAL NOT NULL,
        installment_count INTEGER NOT NULL,
        installment_value REAL NOT NULL,
        purchase_date TEXT NOT NULL,
        first_billing_month INTEGER NOT NULL,
        first_billing_year INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'ACTIVE',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS installments (
        id TEXT PRIMARY KEY,
        installment_purchase_id TEXT NOT NULL REFERENCES installment_purchases(id) ON DELETE CASCADE,
        installment_number INTEGER NOT NULL,
        total_installments INTEGER NOT NULL,
        amount REAL NOT NULL,
        billing_month INTEGER NOT NULL,
        billing_year INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'PENDING',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS invoices (
        id TEXT PRIMARY KEY,
        credit_card_id TEXT NOT NULL REFERENCES credit_cards(id) ON DELETE CASCADE,
        reference_month INTEGER NOT NULL,
        reference_year INTEGER NOT NULL,
        month_year_reference TEXT NOT NULL,
        total_amount REAL NOT NULL DEFAULT 0,
        paid_amount REAL NOT NULL DEFAULT 0,
        closing_date TEXT NOT NULL,
        due_date TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'OPEN',
        paid_at TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        account_id TEXT REFERENCES accounts(id),
        credit_card_id TEXT REFERENCES credit_cards(id),
        invoice_id TEXT REFERENCES invoices(id),
        category_id TEXT REFERENCES categories(id),
        merchant_id TEXT REFERENCES merchants(id),
        installment_id TEXT REFERENCES installments(id),
        transaction_type TEXT NOT NULL,
        payment_method TEXT NOT NULL,
        description TEXT NOT NULL,
        normalized_description TEXT NOT NULL,
        amount REAL NOT NULL,
        transaction_date TEXT NOT NULL,
        competence_month INTEGER NOT NULL,
        competence_year INTEGER NOT NULL,
        billing_month INTEGER,
        billing_year INTEGER,
        fingerprint TEXT NOT NULL UNIQUE,
        import_batch_id TEXT,
        external_id TEXT,
        source TEXT,
        is_recurring INTEGER DEFAULT 0,
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS budgets (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
        month INTEGER NOT NULL,
        year INTEGER NOT NULL,
        limit_amount REAL NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS investments (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        institution TEXT,
        invested_amount REAL NOT NULL,
        current_value REAL NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id),
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        action TEXT NOT NULL,
        old_values TEXT,
        new_values TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Inserir usuário default e categorias essenciais se não existirem
    await db.insert(s.users).values({
      id: 'usr_default',
      name: 'Leonardo C.',
      email: 'leonardo@controlhub.app',
    }).onConflictDoNothing();

    const defaultCategories = [
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
      { id: 'cat_moradia', name: 'Moradia / Aluguel', icon: 'home', color: '#6366f1', type: 'HOUSEHOLD' as const },
      { id: 'cat_condominio', name: 'Condomínio', icon: 'building', color: '#8b5cf6', type: 'HOUSEHOLD' as const },
      { id: 'cat_energia', name: 'Energia Elétrica', icon: 'zap', color: '#eab308', type: 'HOUSEHOLD' as const },
      { id: 'cat_agua', name: 'Água & Saneamento', icon: 'droplet', color: '#06b6d4', type: 'HOUSEHOLD' as const },
      { id: 'cat_internet', name: 'Internet & Fibra', icon: 'wifi', color: '#3b82f6', type: 'HOUSEHOLD' as const },
      { id: 'cat_salario', name: 'Salário & Remuneração', icon: 'briefcase', color: '#22c55e', type: 'INCOME' as const },
      { id: 'cat_rendimentos', name: 'Rendimentos & Dividendos', icon: 'trending-up', color: '#10b981', type: 'INCOME' as const },
      { id: 'cat_outros', name: 'Outros', icon: 'tag', color: '#94a3b8', type: 'EXPENSE' as const },
    ];

    for (const cat of defaultCategories) {
      await db.insert(s.categories).values({
        ...cat,
        userId: 'usr_default',
        isSystem: true,
      }).onConflictDoNothing();
    }

    isInitialized = true;
    console.log('✅ Esquema do banco de dados verificado e inicializado com sucesso.');
  } catch (error) {
    console.error('Database auto-migrate error:', error);
  }
}
