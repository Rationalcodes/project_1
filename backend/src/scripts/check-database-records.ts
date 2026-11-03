import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();

async function main() {
  const salons = await prisma.salon.findMany({
    select: {
      id: true,
      name: true,
      ownerName: true,
      ownerId: true,
      locality: true,
      status: true,
      isVerified: true,
      currentQueue: true,
      createdAt: true
    }
  });

  console.log(`\n=== SUPABASE DATABASE AUDIT ===`);
  console.log(`Total Salons in Database: ${salons.length}`);
  salons.forEach((s, idx) => {
    console.log(`  [${idx + 1}] ID: ${s.id} | Name: ${s.name} | Owner: ${s.ownerName} (ID: ${s.ownerId}) | Locality: ${s.locality} | Status: ${s.status} | Verified: ${s.isVerified}`);
  });

  const servicesCount = await prisma.salonService.count();
  const staffCount = await prisma.salonStaff.count();
  const reviewsCount = await prisma.salonReview.count();

  console.log(`Total Services: ${servicesCount}`);
  console.log(`Total Staff: ${staffCount}`);
  console.log(`Total Reviews: ${reviewsCount}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
