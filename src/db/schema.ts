import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// 1. Users
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  pinHash: text('pin_hash'),
  avatarColor: text('avatar_color').default('#6366f1'),
  role: text('role').$type<'ADMIN' | 'USER'>().default('USER'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// 1b. Sessions
export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// 2. Accounts (Minhas Contas)
export const accounts = sqliteTable('accounts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: text('type').notNull().$type<'CHECKING' | 'SAVINGS' | 'WALLET' | 'INVESTMENT' | 'CASH' | 'OTHER'>(),
  initialBalance: real('initial_balance').notNull().default(0),
  currentBalance: real('current_balance').notNull().default(0),
  color: text('color').default('#3b82f6'),
  icon: text('icon').default('wallet'),
  bankName: text('bank_name'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// 3. Credit Cards (Meus Cartões)
export const creditCards = sqliteTable('credit_cards', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  defaultAccountId: text('default_account_id').references(() => accounts.id),
  name: text('name').notNull(),
  brand: text('brand').notNull().default('Mastercard'),
  bank: text('bank').notNull().default('Nubank'),
  last4Digits: text('last_4_digits').default('1234'),
  creditLimit: real('credit_limit').notNull().default(5000),
  closingDay: integer('closing_day').notNull().default(3), // Dia de corte/fechamento
  dueDay: integer('due_day').notNull().default(10),       // Dia de vencimento
  color: text('color').default('#1e293b'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// 4. Invoices (Faturas)
export const invoices = sqliteTable('invoices', {
  id: text('id').primaryKey(),
  creditCardId: text('credit_card_id').notNull().references(() => creditCards.id, { onDelete: 'cascade' }),
  referenceMonth: integer('reference_month').notNull(), // 1 - 12
  referenceYear: integer('reference_year').notNull(),   // Ex: 2026
  cycleStartDate: text('cycle_start_date').notNull(),   // YYYY-MM-DD
  cycleEndDate: text('cycle_end_date').notNull(),       // YYYY-MM-DD
  dueDate: text('due_date').notNull(),                 // YYYY-MM-DD
  totalAmount: real('total_amount').notNull().default(0),
  paidAmount: real('paid_amount').notNull().default(0),
  status: text('status').notNull().$type<'OPEN' | 'CLOSED' | 'PAID' | 'OVERDUE' | 'PARTIALLY_PAID'>().default('OPEN'),
  paidAt: text('paid_at'),
  paymentTransactionId: text('payment_transaction_id'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// 5. Categories & Subcategories
export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  icon: text('icon').notNull().default('tag'),
  color: text('color').notNull().default('#64748b'),
  type: text('type').notNull().$type<'INCOME' | 'EXPENSE' | 'HOUSEHOLD' | 'INVESTMENT'>().default('EXPENSE'),
  isSystem: integer('is_system', { mode: 'boolean' }).default(false),
  parentId: text('parent_id'),
});

// 6. Merchants (Estabelecimentos Normalizados)
export const merchants = sqliteTable('merchants', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  normalizedName: text('normalized_name').notNull(),
  defaultCategoryId: text('default_category_id').references(() => categories.id),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// 7. Installment Purchases (Compras Parceladas Originais)
export const installmentPurchases = sqliteTable('installment_purchases', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  creditCardId: text('credit_card_id').notNull().references(() => creditCards.id, { onDelete: 'cascade' }),
  categoryId: text('category_id').references(() => categories.id),
  merchantId: text('merchant_id').references(() => merchants.id),
  description: text('description').notNull(),
  normalizedDescription: text('normalized_description').notNull(),
  totalAmount: real('total_amount').notNull(),
  installmentCount: integer('installment_count').notNull(),
  installmentValue: real('installment_value').notNull(),
  purchaseDate: text('purchase_date').notNull(), // YYYY-MM-DD
  firstBillingMonth: integer('first_billing_month').notNull(),
  firstBillingYear: integer('first_billing_year').notNull(),
  status: text('status').notNull().$type<'ACTIVE' | 'FINISHED' | 'CANCELLED'>().default('ACTIVE'),
  notes: text('notes'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// 8. Installments (Parcelas Individuais Vinculadas)
export const installments = sqliteTable('installments', {
  id: text('id').primaryKey(),
  installmentPurchaseId: text('installment_purchase_id').notNull().references(() => installmentPurchases.id, { onDelete: 'cascade' }),
  invoiceId: text('invoice_id').references(() => invoices.id),
  installmentNumber: integer('installment_number').notNull(),
  totalInstallments: integer('total_installments').notNull(),
  amount: real('amount').notNull(),
  billingMonth: integer('billing_month').notNull(),
  billingYear: integer('billing_year').notNull(),
  status: text('status').notNull().$type<'PENDING' | 'BILLED' | 'PAID'>().default('PENDING'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// 9. Transactions (Transações / Lançamentos)
export const transactions = sqliteTable('transactions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  accountId: text('account_id').references(() => accounts.id),
  creditCardId: text('credit_card_id').references(() => creditCards.id),
  invoiceId: text('invoice_id').references(() => invoices.id),
  categoryId: text('category_id').references(() => categories.id),
  merchantId: text('merchant_id').references(() => merchants.id),
  installmentId: text('installment_id').references(() => installments.id),
  transactionType: text('transaction_type').notNull().$type<
    'INCOME' | 'EXPENSE' | 'CREDIT_CARD_PURCHASE' | 'INSTALLMENT' | 'TRANSFER' | 'CREDIT_CARD_PAYMENT' | 'REFUND' | 'INVESTMENT' | 'INVESTMENT_RETURN'
  >(),
  paymentMethod: text('payment_method').notNull().$type<
    'CASH' | 'PIX' | 'DEBIT' | 'CREDIT' | 'TRANSFER' | 'BOLETO' | 'AUTO_DEBIT'
  >(),
  description: text('description').notNull(),
  normalizedDescription: text('normalized_description').notNull(),
  amount: real('amount').notNull(),
  transactionDate: text('transaction_date').notNull(), // YYYY-MM-DD (Data real do consumo/fato gerador)
  competenceMonth: integer('competence_month').notNull(), // Mês da competência
  competenceYear: integer('competence_year').notNull(),   // Ano da competência
  billingMonth: integer('billing_month'),                 // Mês da fatura (se cartão)
  billingYear: integer('billing_year'),                   // Ano da fatura (se cartão)
  fingerprint: text('fingerprint').notNull().unique(),    // Hash determinístico anti-duplicidade
  importBatchId: text('import_batch_id'),
  externalId: text('external_id'),
  source: text('source'),
  isRecurring: integer('is_recurring', { mode: 'boolean' }).default(false),
  notes: text('notes'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// 10. Transfers (Transferências entre Contas Próprias)
export const transfers = sqliteTable('transfers', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  sourceAccountId: text('source_account_id').notNull().references(() => accounts.id),
  destinationAccountId: text('destination_account_id').notNull().references(() => accounts.id),
  amount: real('amount').notNull(),
  transferDate: text('transfer_date').notNull(),
  description: text('description').default('Transferência entre contas'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// 11. Recurring Transactions (Contas Fixas / Recorrentes)
export const recurringTransactions = sqliteTable('recurring_transactions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  description: text('description').notNull(),
  amount: real('amount').notNull(),
  type: text('type').notNull().$type<'INCOME' | 'EXPENSE'>(),
  categoryId: text('category_id').references(() => categories.id),
  accountId: text('account_id').references(() => accounts.id),
  creditCardId: text('credit_card_id').references(() => creditCards.id),
  dayOfMonth: integer('day_of_month').notNull().default(5),
  startMonth: integer('start_month').notNull().default(9),
  startYear: integer('start_year').notNull().default(2026),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  notes: text('notes'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// 12. Budgets (Planejamento / Limites por Categoria)
export const budgets = sqliteTable('budgets', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  categoryId: text('category_id').notNull().references(() => categories.id, { onDelete: 'cascade' }),
  month: integer('month').notNull(),
  year: integer('year').notNull(),
  limitAmount: real('limit_amount').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// 13. Investments & Assets (Patrimônio & Rendimentos)
export const investments = sqliteTable('investments', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: text('type').notNull().$type<'CDB' | 'TREASURY' | 'STOCKS' | 'FUNDS' | 'CRYPTO' | 'REAL_ESTATE' | 'VEHICLE' | 'OTHER'>(),
  investedAmount: real('invested_amount').notNull().default(0),
  currentValue: real('current_value').notNull().default(0),
  institution: text('institution'),
  notes: text('notes'),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// 14. Import Batches & Rules
export const importBatches = sqliteTable('import_batches', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  fileName: text('file_name').notNull(),
  sourceBank: text('source_bank').default('Manual'),
  targetCardId: text('target_card_id').references(() => creditCards.id),
  targetAccountId: text('target_account_id').references(() => accounts.id),
  totalRows: integer('total_rows').notNull().default(0),
  newRows: integer('new_rows').notNull().default(0),
  duplicateRows: integer('duplicate_rows').notNull().default(0),
  matchedInstallments: integer('matched_installments').notNull().default(0),
  pendingConfirmationRows: integer('pending_confirmation_rows').notNull().default(0),
  columnMapping: text('column_mapping'), // JSON string
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const merchantRules = sqliteTable('merchant_rules', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  rawPattern: text('raw_pattern').notNull(),
  normalizedName: text('normalized_name').notNull(),
  suggestedCategoryId: text('suggested_category_id').references(() => categories.id),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// 15. Audit Logs (Auditoria Completa)
export const auditLogs = sqliteTable('audit_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  action: text('action').notNull().$type<'CREATE' | 'UPDATE' | 'DELETE' | 'IMPORT' | 'MATCH' | 'UNMATCH'>(),
  oldValues: text('old_values'), // JSON
  newValues: text('new_values'), // JSON
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});
