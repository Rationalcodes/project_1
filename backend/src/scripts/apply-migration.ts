import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();

async function runMigration() {
  console.log('Applying incremental migration 002_add_owner_id_and_audit.sql...');
  const sqlPath = path.resolve(__dirname, '../../migrations/002_add_owner_id_and_audit.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  // Split by statements or execute
  await prisma.$executeRawUnsafe(`ALTER TABLE salons ADD COLUMN IF NOT EXISTS owner_id VARCHAR(64);`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_salons_owner_id ON salons (owner_id);`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_salons_status ON salons (status);`);

  console.log('✅ Incremental migration successfully applied!');
  await prisma.$disconnect();
}

runMigration().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
