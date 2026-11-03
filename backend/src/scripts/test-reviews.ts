import { SalonsService } from '../modules/salons/salons.service';
import { PrismaService } from '../prisma/prisma.service';

async function run() {
  console.log('=============================================================');
  console.log('   KUMBHAKARAN SALONS REVIEW PERSISTENCE TEST');
  console.log('=============================================================');

  const prisma = new PrismaService();
  await prisma.onModuleInit();

  const salonsService = new SalonsService(prisma);

  try {
    // 1. Find a salon in the database or register one
    const salons = await prisma.salon.findMany({ take: 1 });
    let targetSalonId: string;

    if (salons.length > 0) {
      targetSalonId = salons[0].id;
      console.log(`Using existing salon: "${salons[0].name}" (ID: ${targetSalonId})`);
    } else {
      console.log('Registering a temporary salon for review test...');
      const reg = await salonsService.registerSalon({
        name: 'Kumbhkaran Salons Flagship Test Studio',
        ownerName: 'Test Owner',
        phone: '+91 98888 77777',
        email: `test-owner-${Date.now()}@kumbhkaran.com`,
        address: '100 80ft Road',
        locality: 'Koramangala',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560034',
        latitude: 12.9352,
        longitude: 77.6245,
        services: [{ name: 'Executive Cut', price: 200, category: 'Hair' }],
        activeBarbers: 3,
      });
      targetSalonId = reg.salon.id;
    }

    const initialReviewCount = await prisma.salonReview.count({
      where: { salonId: targetSalonId },
    });
    console.log(`Initial DB Review Count for ${targetSalonId}: ${initialReviewCount}`);

    // 2. Submit a new customer review via SalonsService.addReview
    console.log('\n[1/3] Adding customer review via addReview...');
    const createdReview = await salonsService.addReview(targetSalonId, {
      customerName: 'Test Customer Aakash',
      customerAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      rating: 5,
      comment: 'Top quality service! Best fade haircut in the locality.',
      verifiedVisit: true,
      criteria: {
        haircutQuality: 5,
        staffBehaviour: 5,
        cleanliness: 5,
        pricing: 4,
        overallExperience: 5,
      },
    });

    console.log('Created Review Result:', createdReview);

    // 3. Verify it was written to PostgreSQL
    console.log('\n[2/3] Verifying review in PostgreSQL database...');
    const dbReview = await prisma.salonReview.findUnique({
      where: { id: createdReview.id },
    });

    if (!dbReview) {
      throw new Error(`Review with ID ${createdReview.id} not found in PostgreSQL!`);
    }
    console.log(`✓ Review found in PostgreSQL! Customer: ${dbReview.customerName}, Rating: ${dbReview.rating}`);

    // 4. Verify public salon profile includes this review
    console.log('\n[3/3] Checking getPublicSalonById includes newly persisted review...');
    const publicProfile = await salonsService.getPublicSalonById(targetSalonId);
    const reviewInProfile = publicProfile.reviews.find((r: any) => r.id === createdReview.id);

    if (!reviewInProfile) {
      throw new Error(`Review with ID ${createdReview.id} not found in public profile reviews!`);
    }
    console.log(`✓ Review confirmed in public profile! Total reviews returned: ${publicProfile.reviews.length}`);
    console.log(`  Updated Salon Rating: ${publicProfile.rating} (${publicProfile.reviewCount} total reviews)`);

    console.log('\n=============================================================');
    console.log('   ALL REVIEW PERSISTENCE TESTS PASSED! ✓');
    console.log('=============================================================');
  } finally {
    await prisma.onModuleDestroy();
  }
}

run().catch((e) => {
  console.error('Test failed:', e);
  process.exit(1);
});
