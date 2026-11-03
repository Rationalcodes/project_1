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

  const s = await prisma.salon.findUnique({
    where: { id: 'salon-1793713039749' },
    include: { services: true, staff: true, reviews: true, members: true }
  });
  console.log('Salon details:', JSON.stringify(s, null, 2));

  const users = await prisma.user.findMany();
  console.log(`Total Users: ${users.length}`);
  users.forEach((u) => {
    console.log(`  User ID: ${u.id} | Email: ${u.email} | Name: ${u.name} | Role: ${u.role}`);
  });

  const members = await prisma.salonMember.findMany();
  console.log(`Total Salon Members: ${members.length}`);
  members.forEach((m) => {
    console.log(`  Member ID: ${m.id} | Salon ID: ${m.salonId} | User ID: ${m.userId} | Role: ${m.role}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
