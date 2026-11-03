import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local or .env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const prisma = new PrismaClient();

async function runDatabaseDiagnostics() {
  console.log('\n=============================================================');
  console.log('  KUMBHAKARAN PLATFORM - POSTGIS & DATABASE DIAGNOSTIC SUITE');
  console.log('=============================================================\n');

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.log('⚠️  DATABASE_URL environment variable is NOT set.');
    console.log('    Please set DATABASE_URL in .env.local or backend/.env.local');
    console.log('    Format: postgresql://[user]:[password]@[host]:[port]/[database]\n');
    process.exit(0);
  }

  // Sanitize connection string for display (hide password)
  const sanitizedUrl = dbUrl.replace(/:([^:@]+)@/, ':****@');
  console.log(`🔌 Target Database: ${sanitizedUrl}`);

  try {
    // 1. PostgreSQL Connectivity
    console.log('\n[1/5] Testing PostgreSQL Connectivity...');
    const pgVersion: any[] = await prisma.$queryRawUnsafe('SELECT version() AS version;');
    console.log(`  ✅ PostgreSQL Connected!`);
    console.log(`     Engine: ${pgVersion[0]?.version}`);

    // 2. PostGIS Extension Availability
    console.log('\n[2/5] Testing PostGIS Extension Availability...');
    try {
      const postgisVersion: any[] = await prisma.$queryRawUnsafe('SELECT PostGIS_Full_Version() AS full_version;');
      console.log(`  ✅ PostGIS is Active & Functional!`);
      console.log(`     Version Details: ${postgisVersion[0]?.full_version}`);
    } catch {
      const ext: any[] = await prisma.$queryRawUnsafe("SELECT extname, extversion FROM pg_extension WHERE extname = 'postgis';");
      if (ext.length > 0) {
        console.log(`  ✅ PostGIS extension installed (v${ext[0].extversion})`);
      } else {
        console.log(`  ❌ PostGIS extension is NOT detected.`);
      }
    }

    // 3. Existing Salon Tables
    console.log('\n[3/5] Inspecting Existing Platform Tables...');
    const tables: any[] = await prisma.$queryRawUnsafe(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('salons', 'salon_services', 'salon_staff', 'salon_reviews')
      ORDER BY table_name;
    `);

    const tableNames = tables.map((t) => t.table_name);
    console.log(`  Found ${tables.length}/4 Tables: ${tableNames.join(', ')}`);
    ['salons', 'salon_services', 'salon_staff', 'salon_reviews'].forEach((expected) => {
      if (tableNames.includes(expected)) {
        console.log(`    ✅ Table "${expected}" present`);
      } else {
        console.log(`    ⚠️  Table "${expected}" missing`);
      }
    });

    // 4. Spatial Geography Column in salons table
    console.log('\n[4/5] Checking Spatial Column (salons.location)...');
    const cols: any[] = await prisma.$queryRawUnsafe(`
      SELECT column_name, udt_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'salons' AND column_name = 'location';
    `);

    if (cols.length > 0) {
      console.log(`  ✅ Spatial column "location" exists!`);
      console.log(`     Data Type: ${cols[0].data_type} (UDT: ${cols[0].udt_name})`);
    } else {
      console.log(`  ⚠️  Spatial column "location" not found in "salons" table.`);
    }

    // 5. Existing GiST Spatial Index
    console.log('\n[5/5] Checking Spatial GiST Index (idx_salons_location_gist)...');
    const indexes: any[] = await prisma.$queryRawUnsafe(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'salons' AND (indexname = 'idx_salons_location_gist' OR indexdef LIKE '%gist%location%');
    `);

    if (indexes.length > 0) {
      console.log(`  ✅ Spatial GiST Index Found!`);
      console.log(`     Index Name: ${indexes[0].indexname}`);
      console.log(`     Definition: ${indexes[0].indexdef}`);
    } else {
      console.log(`  ⚠️  GiST index "idx_salons_location_gist" not found.`);
    }

    console.log('\n=============================================================');
    console.log('  DIAGNOSTICS COMPLETE - ALL CHECKS FINISHED');
    console.log('=============================================================\n');
  } catch (error) {
    console.error(`\n❌ Diagnostic failed: ${(error as Error).message}`);
  } finally {
    await prisma.$disconnect();
  }
}

runDatabaseDiagnostics();
