import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();

async function runAudit() {
  console.log('--- SUPABASE LIVE INTEGRATION VERIFICATION ---');
  
  // 1. Connection check
  const res: any[] = await prisma.$queryRawUnsafe('SELECT current_database(), current_user, version();');
  console.log('✅ Connected DB:', res[0]?.current_database);
  console.log('✅ Connected User:', res[0]?.current_user);

  // 2. Table presence check
  const tables: any[] = await prisma.$queryRawUnsafe(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `);
  const tableNames = tables.map(t => t.table_name);
  console.log('📋 Public Tables Found in Supabase:', tableNames);

  // Check specific expected tables
  const expected = ['salons', 'salon_services', 'salon_staff', 'salon_reviews', 'users', 'salon_walkins', 'transactions'];
  expected.forEach(t => {
    console.log(`  - Table "${t}": ${tableNames.includes(t) ? '✅ EXISTS' : '❌ NOT FOUND'}`);
  });

  // 3. PostGIS Check
  const postgisCheck: any[] = await prisma.$queryRawUnsafe('SELECT PostGIS_Version();');
  console.log('✅ PostGIS Version:', postgisCheck[0]?.postgis_version);

  // 4. Safe Read existing salons
  const existingSalons = await prisma.salon.findMany({ select: { id: true, name: true, ownerName: true, status: true } });
  console.log(`✅ Existing Salons in DB: ${existingSalons.length}`);
  existingSalons.forEach(s => console.log(`   * ${s.id}: ${s.name} (Owner: ${s.ownerName}) [${s.status}]`));

  console.log('\n--- AUDIT COMPLETE ---');
}

runAudit()
  .catch(err => console.error('Audit error:', err))
  .finally(() => prisma.$disconnect());
