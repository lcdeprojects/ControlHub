import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';
import fs from 'fs';
import path from 'path';
import { ensureDatabaseSchema } from './auto-migrate';

const rawUrl = process.env.DATABASE_URL || 'file:controlhub.db';

// Se for arquivo local (ex: file:/data/controlhub.db ou file:controlhub.db), garante que a pasta pai exista
if (rawUrl.startsWith('file:')) {
  try {
    const filePath = rawUrl.replace('file:', '');
    const dir = path.dirname(path.resolve(filePath));
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (err) {
    console.error('Error ensuring database directory:', err);
  }
}

const client = createClient({
  url: rawUrl,
  authToken: process.env.DATABASE_AUTH_TOKEN || undefined,
});

export const db = drizzle(client, { schema });

// Auto inicializar esquema em runtime (somente fora da fase de build estático do Next.js)
if (process.env.NEXT_PHASE !== 'phase-production-build' && typeof window === 'undefined') {
  ensureDatabaseSchema().catch((err) => {
    console.error('Failed to run ensureDatabaseSchema on startup:', err);
  });
}

export { ensureDatabaseSchema };
