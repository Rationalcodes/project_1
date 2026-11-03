import { SalonsService } from '../modules/salons/salons.service';
import { DiscoveryService } from '../modules/discovery/discovery.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';
import { AuthenticatedUser } from '../modules/auth/interfaces/jwt-payload.interface';

async function run() {
  console.log('=============================================================');
  console.log('   ADMIN SALON VERIFICATION & DELETION TEST SUITE');
  console.log('=============================================================');

  const prisma = new PrismaService();
  await prisma.onModuleInit();

  const salonsService = new SalonsService(prisma);
  const discoveryService = new DiscoveryService(prisma, salonsService);

  try {
    const adminUser: AuthenticatedUser = {
      id: 'usr-admin-test',
      email: 'prabhatshinde.ggv2024@gmail.com',
      name: 'Prabhat Shinde',
      role: 'ADMIN',
      memberships: [],
    };

    const uniqueTimestamp = Date.now();

    // Step 1: Register a test salon using SalonsService
    console.log('\n[1/5] Creating a test salon with child records...');
    const regResult = await salonsService.registerSalon({
      name: 'Temporary Test Grooming Barbershop',
      ownerName: 'Test Owner Dave',
      phone: '+91 99999 00000',
      email: `owner-${uniqueTimestamp}@testgrooming.com`,
      address: '100 MG Road',
      locality: 'Indiranagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560038',
      latitude: 12.9783,
      longitude: 77.6408,
      services: [
        { name: 'Test Cut', price: 150, durationMinutes: 20, category: 'Hair' },
        { name: 'Test Shave', price: 100, durationMinutes: 15, category: 'Beard' },
      ],
      activeBarbers: 2,
    });

    const registered = regResult.salon;
    console.log(`✅ Created test salon: "${registered.name}" (ID: ${registered.id})`);
    console.log(`   Initial Status: ${registered.status}`);

    // Step 2: Discovery Check (Should NOT appear in discovery because isVerified is false)
    console.log('\n[2/5] Checking Public Discovery Excludes Unverified Salon...');
    const nearbyResult = await discoveryService.getNearbySalons({
      latitude: 12.9783,
      longitude: 77.6408,
      radius_km: 25,
    });
    const foundInDiscovery = nearbyResult.salons.some((s: any) => s.id === registered.id);
    if (foundInDiscovery) {
      throw new Error('FAILED: Unverified salon appeared in public discovery!');
    }
    console.log(`✅ PASSED: Unverified salon is excluded from public discovery (${nearbyResult.salons.length} public salons returned)`);

    // Step 3: Verification Toggle Test
    console.log('\n[3/5] Testing Admin Salon Verification...');
    const verifiedResult = await salonsService.verifySalon(registered.id, true, adminUser);
    if (!verifiedResult.isVerified) {
      throw new Error('FAILED: Salon isVerified was not updated to true!');
    }
    console.log(`✅ PASSED: Salon verified successfully by admin (isVerified: ${verifiedResult.isVerified})`);

    // Verify it now appears in discovery
    const afterVerifiedResult = await discoveryService.getNearbySalons({
      latitude: 12.9783,
      longitude: 77.6408,
      radius_km: 25,
    });
    const nowInDiscovery = afterVerifiedResult.salons.some((s: any) => s.id === registered.id);
    if (!nowInDiscovery) {
      throw new Error('FAILED: Verified salon did not appear in public discovery!');
    }
    console.log(`✅ PASSED: Verified salon now appears in public discovery!`);

    // Step 4: Deletion Safeguards (Mismatched Name Confirmation)
    console.log('\n[4/5] Testing Deletion Safeguard (Mismatched Confirmation Name)...');
    try {
      await salonsService.deleteSalon(
        registered.id,
        'Wrong Salon Name',
        adminUser,
      );
      throw new Error('FAILED: Deletion succeeded with wrong confirmation name!');
    } catch (err: any) {
      if (err instanceof BadRequestException && err.message.includes('does not match')) {
        console.log(`✅ PASSED: Blocked deletion with mismatched name (${err.message})`);
      } else {
        throw err;
      }
    }

    // Step 5: Transactional Permanent Deletion & Audit Trail
    console.log('\n[5/5] Testing Permanent Cascading Deletion & Audit Logging...');
    const deleteResult = await salonsService.deleteSalon(
      registered.id,
      'Temporary Test Grooming Barbershop',
      adminUser,
    );

    console.log('   Deletion Response:', deleteResult.message);

    // Verify salon is gone from DB
    const salonInDb = await prisma.salon.findUnique({
      where: { id: registered.id },
    });
    if (salonInDb) {
      throw new Error('FAILED: Salon still exists in database after deletion!');
    }

    // Verify services, staff are cascaded
    const orphanedServices = await prisma.salonService.findMany({
      where: { salonId: registered.id },
    });
    const orphanedStaff = await prisma.salonStaff.findMany({
      where: { salonId: registered.id },
    });

    if (orphanedServices.length > 0 || orphanedStaff.length > 0) {
      throw new Error(
        `FAILED: Cascade deletion left orphaned records: ${orphanedServices.length} services, ${orphanedStaff.length} staff`,
      );
    }

    // Verify audit log entry
    const auditLogs = await prisma.adminAuditLog.findMany({
      where: {
        targetId: registered.id,
        action: 'DELETE_SALON',
      },
    });

    if (auditLogs.length === 0) {
      throw new Error('FAILED: Audit log entry was not created for salon deletion!');
    }

    console.log(`✅ PASSED: Cascaded deletion verified. All related services and staff automatically purged.`);
    console.log(`✅ PASSED: Audit log recorded: action=${auditLogs[0].action}, targetName="${auditLogs[0].targetName}", actor=${auditLogs[0].actorEmail}`);

    console.log('\n=============================================================');
    console.log('   ALL 5 TESTS PASSED SUCCESSFULLY! 🚀');
    console.log('=============================================================');
  } finally {
    await prisma.onModuleDestroy();
  }
}

run().catch((e) => {
  console.error('Test suite failed:', e);
  process.exit(1);
});
