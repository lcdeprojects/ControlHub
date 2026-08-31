import { db } from './index';
import * as s from './schema';
import { sql } from 'drizzle-orm';

let isInitialized = false;
let initPromise: Promise<void> | null = null;

async function addColumnIfNotExists(table: string, column: string, definition: string) {
  try {
    await db.run(sql.raw(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`));
  } catch {
    // Coluna já existe ou tabela inexistente, ignorar silenciosamente
  }
}

export async function ensureDatabaseSchema() {
  if (isInitialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      // 1. Users
      await db.run(sql`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 2. Accounts
      await db.run(sql`
        CREATE TABLE IF NOT EXISTS accounts (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          initial_balance REAL NOT NULL DEFAULT 0,
          current_balance REAL NOT NULL DEFAULT 0,
          color TEXT DEFAULT '#3b82f6',
          icon TEXT DEFAULT 'wallet',
          bank_name TEXT,
          is_active INTEGER DEFAULT 1,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 3. Credit Cards
      await db.run(sql`
        CREATE TABLE IF NOT EXISTS credit_cards (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          default_account_id TEXT REFERENCES accounts(id),
          name TEXT NOT NULL,
          brand TEXT NOT NULL DEFAULT 'Mastercard',
          bank TEXT NOT NULL DEFAULT 'Nubank',
          last_4_digits TEXT DEFAULT '1234',
          credit_limit REAL NOT NULL DEFAULT 5000,
          closing_day INTEGER NOT NULL DEFAULT 3,
          due_day INTEGER NOT NULL DEFAULT 10,
          color TEXT DEFAULT '#1e293b',
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 4. Invoices
      await db.run(sql`
        CREATE TABLE IF NOT EXISTS invoices (
          id TEXT PRIMARY KEY,
          credit_card_id TEXT NOT NULL REFERENCES credit_cards(id) ON DELETE CASCADE,
          reference_month INTEGER NOT NULL,
          reference_year INTEGER NOT NULL,
          cycle_start_date TEXT NOT NULL DEFAULT '',
          cycle_end_date TEXT NOT NULL DEFAULT '',
          due_date TEXT NOT NULL,
          total_amount REAL NOT NULL DEFAULT 0,
          paid_amount REAL NOT NULL DEFAULT 0,
          status TEXT NOT NULL DEFAULT 'OPEN',
          paid_at TEXT,
          payment_transaction_id TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 5. Categories
      await db.run(sql`
        CREATE TABLE IF NOT EXISTS categories (
          id TEXT PRIMARY KEY,
          user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          icon TEXT NOT NULL DEFAULT 'tag',
          color TEXT NOT NULL DEFAULT '#64748b',
          type TEXT NOT NULL DEFAULT 'EXPENSE',
          is_system INTEGER DEFAULT 0,
          parent_id TEXT
        );
      `);

      // 6. Merchants
      await db.run(sql`
        CREATE TABLE IF NOT EXISTS merchants (
          id TEXT PRIMARY KEY,
          user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          normalized_name TEXT NOT NULL,
          default_category_id TEXT REFERENCES categories(id),
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 7. Installment Purchases
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
          notes TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 8. Installments
      await db.run(sql`
        CREATE TABLE IF NOT EXISTS installments (
          id TEXT PRIMARY KEY,
          installment_purchase_id TEXT NOT NULL REFERENCES installment_purchases(id) ON DELETE CASCADE,
          invoice_id TEXT REFERENCES invoices(id),
          installment_number INTEGER NOT NULL,
          total_installments INTEGER NOT NULL,
          amount REAL NOT NULL,
          billing_month INTEGER NOT NULL,
          billing_year INTEGER NOT NULL,
          status TEXT NOT NULL DEFAULT 'PENDING',
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 9. Transactions
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

      // 10. Transfers
      await db.run(sql`
        CREATE TABLE IF NOT EXISTS transfers (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          source_account_id TEXT NOT NULL REFERENCES accounts(id),
          destination_account_id TEXT NOT NULL REFERENCES accounts(id),
          amount REAL NOT NULL,
          transfer_date TEXT NOT NULL,
          description TEXT DEFAULT 'Transferência entre contas',
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 11. Recurring Transactions
      await db.run(sql`
        CREATE TABLE IF NOT EXISTS recurring_transactions (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          description TEXT NOT NULL,
          amount REAL NOT NULL,
          type TEXT NOT NULL,
          category_id TEXT REFERENCES categories(id),
          account_id TEXT REFERENCES accounts(id),
          credit_card_id TEXT REFERENCES credit_cards(id),
          day_of_month INTEGER NOT NULL DEFAULT 5,
          is_active INTEGER DEFAULT 1,
          notes TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 12. Budgets
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

      // 13. Investments
      await db.run(sql`
        CREATE TABLE IF NOT EXISTS investments (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          invested_amount REAL NOT NULL DEFAULT 0,
          current_value REAL NOT NULL DEFAULT 0,
          institution TEXT,
          notes TEXT,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 14. Import Batches & Rules
      await db.run(sql`
        CREATE TABLE IF NOT EXISTS import_batches (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          file_name TEXT NOT NULL,
          source_bank TEXT DEFAULT 'Manual',
          target_card_id TEXT REFERENCES credit_cards(id),
          target_account_id TEXT REFERENCES accounts(id),
          total_rows INTEGER NOT NULL DEFAULT 0,
          new_rows INTEGER NOT NULL DEFAULT 0,
          duplicate_rows INTEGER NOT NULL DEFAULT 0,
          matched_installments INTEGER NOT NULL DEFAULT 0,
          pending_confirmation_rows INTEGER NOT NULL DEFAULT 0,
          column_mapping TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await db.run(sql`
        CREATE TABLE IF NOT EXISTS merchant_rules (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          raw_pattern TEXT NOT NULL,
          normalized_name TEXT NOT NULL,
          suggested_category_id TEXT REFERENCES categories(id),
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 15. Audit Logs
      await db.run(sql`
        CREATE TABLE IF NOT EXISTS audit_logs (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          entity_type TEXT NOT NULL,
          entity_id TEXT NOT NULL,
          action TEXT NOT NULL,
          old_values TEXT,
          new_values TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // --- Migrações Incrementais (Garante colunas em bancos já existentes) ---
      // Categories
      await addColumnIfNotExists('categories', 'parent_id', 'TEXT');
      await addColumnIfNotExists('categories', 'is_system', 'INTEGER DEFAULT 0');

      // Invoices
      await addColumnIfNotExists('invoices', 'cycle_start_date', "TEXT NOT NULL DEFAULT ''");
      await addColumnIfNotExists('invoices', 'cycle_end_date', "TEXT NOT NULL DEFAULT ''");
      await addColumnIfNotExists('invoices', 'payment_transaction_id', 'TEXT');

      // Installments
      await addColumnIfNotExists('installments', 'invoice_id', 'TEXT');

      // Installment Purchases
      await addColumnIfNotExists('installment_purchases', 'notes', 'TEXT');

      // Investments
      await addColumnIfNotExists('investments', 'notes', 'TEXT');
      await addColumnIfNotExists('investments', 'institution', 'TEXT');

      // Transactions
      await addColumnIfNotExists('transactions', 'invoice_id', 'TEXT');
      await addColumnIfNotExists('transactions', 'installment_id', 'TEXT');
      await addColumnIfNotExists('transactions', 'is_recurring', 'INTEGER DEFAULT 0');
      await addColumnIfNotExists('transactions', 'notes', 'TEXT');

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
      console.log('✅ Esquema do banco de dados verificado e sincronizado com sucesso.');
    } catch (error) {
      console.error('Database auto-migrate error:', error);
    }
  })();

  return initPromise;
}
