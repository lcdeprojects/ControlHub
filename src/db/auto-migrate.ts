import { db } from './index';
import * as s from './schema';
import { sql, eq } from 'drizzle-orm';

let isInitialized = false;
let initPromise: Promise<void> | null = null;

async function addColumnIfNotExists(table: string, column: string, definition: string) {
  try {
    await db.run(sql.raw(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`));
  } catch {
    // Coluna já existe ou tabela inexistente, ignorar silenciosamente
  }
}

async function repairCreditCardsTable() {
  try {
    const tableInfo: any = await db.all(sql.raw('PRAGMA table_info(credit_cards)'));
    const colNames: string[] = Array.isArray(tableInfo) ? tableInfo.map((c: any) => c.name) : [];

    if (colNames.includes('last4_digits')) {
      // 1. Garante que last_4_digits existe
      if (!colNames.includes('last_4_digits')) {
        await addColumnIfNotExists('credit_cards', 'last_4_digits', "TEXT DEFAULT '1234'");
      }
      // 2. Copia valores existentes
      await db.run(sql.raw("UPDATE credit_cards SET last_4_digits = last4_digits WHERE (last_4_digits IS NULL OR last_4_digits = '1234') AND last4_digits IS NOT NULL")).catch(() => {});

      // 3. Tenta remover last4_digits via DROP COLUMN
      let dropSuccess = false;
      try {
        await db.run(sql.raw('ALTER TABLE credit_cards DROP COLUMN last4_digits'));
        dropSuccess = true;
      } catch {
        dropSuccess = false;
      }

      // Se DROP COLUMN falhou, recria a tabela de forma limpa preservando dados
      if (!dropSuccess) {
        await db.run(sql.raw('PRAGMA foreign_keys=OFF'));
        await db.run(sql.raw(`
          CREATE TABLE IF NOT EXISTS credit_cards_new (
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
        `));
        await db.run(sql.raw(`
          INSERT INTO credit_cards_new (id, user_id, default_account_id, name, brand, bank, last_4_digits, credit_limit, closing_day, due_day, color, created_at)
          SELECT id, user_id, default_account_id, name, brand, bank, COALESCE(last_4_digits, last4_digits, '1234'), credit_limit, closing_day, due_day, color, created_at
          FROM credit_cards;
        `));
        await db.run(sql.raw('DROP TABLE credit_cards'));
        await db.run(sql.raw('ALTER TABLE credit_cards_new RENAME TO credit_cards'));
        await db.run(sql.raw('PRAGMA foreign_keys=ON'));
      }
    }
  } catch (err) {
    console.error('Error repairing credit_cards table:', err);
  }
}

async function repairInvoicesTable() {
  try {
    const tableInfo: any = await db.all(sql.raw('PRAGMA table_info(invoices)'));
    const colNames: string[] = Array.isArray(tableInfo) ? tableInfo.map((c: any) => c.name) : [];

    if (colNames.includes('month_year_reference') || colNames.includes('closing_date')) {
      let dropSuccess = true;
      try {
        if (colNames.includes('month_year_reference')) {
          await db.run(sql.raw('ALTER TABLE invoices DROP COLUMN month_year_reference'));
        }
        if (colNames.includes('closing_date')) {
          await db.run(sql.raw('ALTER TABLE invoices DROP COLUMN closing_date'));
        }
      } catch {
        dropSuccess = false;
      }

      if (!dropSuccess) {
        await db.run(sql.raw('PRAGMA foreign_keys=OFF'));
        await db.run(sql.raw(`
          CREATE TABLE IF NOT EXISTS invoices_new (
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
        `));
        await db.run(sql.raw(`
          INSERT INTO invoices_new (id, credit_card_id, reference_month, reference_year, due_date, total_amount, paid_amount, status, paid_at, created_at)
          SELECT id, credit_card_id, reference_month, reference_year, due_date, total_amount, paid_amount, status, paid_at, created_at
          FROM invoices;
        `));
        await db.run(sql.raw('DROP TABLE invoices'));
        await db.run(sql.raw('ALTER TABLE invoices_new RENAME TO invoices'));
        await db.run(sql.raw('PRAGMA foreign_keys=ON'));
      }
    }
  } catch (err) {
    console.error('Error repairing invoices table:', err);
  }
}

async function syncInstallmentTransactions() {
  try {
    const allPurchases = await db.select().from(s.installmentPurchases);
    for (const pur of allPurchases) {
      const insts = await db.select().from(s.installments).where(eq(s.installments.installmentPurchaseId, pur.id));
      for (const it of insts) {
        const txCheck = (await db.select().from(s.transactions).where(eq(s.transactions.installmentId, it.id)))[0];
        if (!txCheck) {
          const compDate = new Date(pur.purchaseDate + 'T12:00:00');
          const fp = `fp_inst_${it.id}_${pur.userId}`;
          await db.insert(s.transactions).values({
            id: `tx_${it.id}`,
            userId: pur.userId,
            creditCardId: pur.creditCardId,
            categoryId: pur.categoryId,
            installmentId: it.id,
            transactionType: 'INSTALLMENT',
            amount: it.amount,
            transactionDate: pur.purchaseDate,
            competenceMonth: compDate.getMonth() + 1,
            competenceYear: compDate.getFullYear(),
            billingMonth: it.billingMonth,
            billingYear: it.billingYear,
            description: `${pur.description} (${it.installmentNumber}/${it.totalInstallments})`,
            normalizedDescription: pur.normalizedDescription,
            paymentMethod: 'CREDIT',
            fingerprint: fp,
          }).onConflictDoNothing();
        }
      }
    }
  } catch (err) {
    console.error('Error syncing installment transactions:', err);
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

      // --- Reparos Estruturais para Bancos Legados ---
      await repairCreditCardsTable();
      await repairInvoicesTable();

      // --- Migrações Incrementais (Garante colunas em bancos já existentes) ---
      // Credit Cards
      await addColumnIfNotExists('credit_cards', 'last_4_digits', "TEXT DEFAULT '1234'");
      await addColumnIfNotExists('credit_cards', 'default_account_id', 'TEXT');
      await addColumnIfNotExists('credit_cards', 'color', "TEXT DEFAULT '#1e293b'");
      await addColumnIfNotExists('credit_cards', 'brand', "TEXT DEFAULT 'Mastercard'");
      await addColumnIfNotExists('credit_cards', 'bank', "TEXT DEFAULT 'Nubank'");
      await addColumnIfNotExists('credit_cards', 'credit_limit', 'REAL DEFAULT 5000');
      await addColumnIfNotExists('credit_cards', 'closing_day', 'INTEGER DEFAULT 3');
      await addColumnIfNotExists('credit_cards', 'due_day', 'INTEGER DEFAULT 10');

      // Accounts
      await addColumnIfNotExists('accounts', 'bank_name', 'TEXT');
      await addColumnIfNotExists('accounts', 'initial_balance', 'REAL DEFAULT 0');
      await addColumnIfNotExists('accounts', 'current_balance', 'REAL DEFAULT 0');
      await addColumnIfNotExists('accounts', 'color', "TEXT DEFAULT '#3b82f6'");
      await addColumnIfNotExists('accounts', 'icon', "TEXT DEFAULT 'wallet'");
      await addColumnIfNotExists('accounts', 'is_active', 'INTEGER DEFAULT 1');

      // Categories
      await addColumnIfNotExists('categories', 'parent_id', 'TEXT');
      await addColumnIfNotExists('categories', 'is_system', 'INTEGER DEFAULT 0');
      await addColumnIfNotExists('categories', 'icon', "TEXT DEFAULT 'tag'");
      await addColumnIfNotExists('categories', 'color', "TEXT DEFAULT '#64748b'");
      await addColumnIfNotExists('categories', 'type', "TEXT DEFAULT 'EXPENSE'");

      // Invoices
      await addColumnIfNotExists('invoices', 'cycle_start_date', "TEXT NOT NULL DEFAULT ''");
      await addColumnIfNotExists('invoices', 'cycle_end_date', "TEXT NOT NULL DEFAULT ''");
      await addColumnIfNotExists('invoices', 'payment_transaction_id', 'TEXT');
      await addColumnIfNotExists('invoices', 'total_amount', 'REAL DEFAULT 0');
      await addColumnIfNotExists('invoices', 'paid_amount', 'REAL DEFAULT 0');
      await addColumnIfNotExists('invoices', 'status', "TEXT DEFAULT 'OPEN'");
      await addColumnIfNotExists('invoices', 'paid_at', 'TEXT');

      // Installments
      await addColumnIfNotExists('installments', 'invoice_id', 'TEXT');
      await addColumnIfNotExists('installments', 'status', "TEXT DEFAULT 'PENDING'");

      // Installment Purchases
      await addColumnIfNotExists('installment_purchases', 'notes', 'TEXT');
      await addColumnIfNotExists('installment_purchases', 'status', "TEXT DEFAULT 'ACTIVE'");
      await addColumnIfNotExists('installment_purchases', 'first_billing_month', 'INTEGER DEFAULT 1');
      await addColumnIfNotExists('installment_purchases', 'first_billing_year', 'INTEGER DEFAULT 2026');

      // Investments
      await addColumnIfNotExists('investments', 'notes', 'TEXT');
      await addColumnIfNotExists('investments', 'institution', 'TEXT');
      await addColumnIfNotExists('investments', 'invested_amount', 'REAL DEFAULT 0');
      await addColumnIfNotExists('investments', 'current_value', 'REAL DEFAULT 0');

      // Transactions
      await addColumnIfNotExists('transactions', 'account_id', 'TEXT');
      await addColumnIfNotExists('transactions', 'credit_card_id', 'TEXT');
      await addColumnIfNotExists('transactions', 'invoice_id', 'TEXT');
      await addColumnIfNotExists('transactions', 'category_id', 'TEXT');
      await addColumnIfNotExists('transactions', 'merchant_id', 'TEXT');
      await addColumnIfNotExists('transactions', 'installment_id', 'TEXT');
      await addColumnIfNotExists('transactions', 'billing_month', 'INTEGER');
      await addColumnIfNotExists('transactions', 'billing_year', 'INTEGER');
      await addColumnIfNotExists('transactions', 'import_batch_id', 'TEXT');
      await addColumnIfNotExists('transactions', 'external_id', 'TEXT');
      await addColumnIfNotExists('transactions', 'source', 'TEXT');
      await addColumnIfNotExists('transactions', 'notes', 'TEXT');

      // Recurring Transactions
      await addColumnIfNotExists('recurring_transactions', 'start_month', 'INTEGER DEFAULT 9');
      await addColumnIfNotExists('recurring_transactions', 'start_year', 'INTEGER DEFAULT 2026');

      // Atualizar itens existentes que foram criados em Setembro para não vazarem retroativamente
      try {
        await db.run(sql`UPDATE recurring_transactions SET start_month = 9, start_year = 2026 WHERE start_month IS NULL OR start_month = 0`);
      } catch {}

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

      // Sincronizar transações de parcelas existentes
      await syncInstallmentTransactions();

      isInitialized = true;
      console.log('✅ Esquema do banco de dados verificado e sincronizado com sucesso.');
    } catch (error) {
      console.error('Database auto-migrate error:', error);
    }
  })();

  return initPromise;
}
