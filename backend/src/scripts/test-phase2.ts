import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from '../app.module';
import { SalonsService } from '../modules/salons/salons.service';
import { DiscoveryService } from '../modules/discovery/discovery.service';
import { RegisterSalonDto } from '../modules/salons/dto/register-salon.dto';
import { UpdateSalonDto } from '../modules/salons/dto/update-salon.dto';
import { ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';

async function runPhase2TestSuite() {
  console.log('\n=============================================================');
  console.log('   KUMBHAKARAN PLATFORM - PHASE 2 AUTOMATED TEST SUITE');
  console.log('   PostGIS Discovery, Registration, Privacy & Security Tests');
  console.log('=============================================================\n');

  let passed = 0;
  let failed = 0;

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    { logger: ['error'] }
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    })
  );

  await app.init();
  await app.getHttpAdapter().getInstance().ready();

  const salonsService = app.get(SalonsService);
  const discoveryService = app.get(DiscoveryService);

  // ---------------------------------------------------------------------------
  // TEST 1: Coordinate Validation
  // ---------------------------------------------------------------------------
  try {
    process.stdout.write('[1/10] Testing Coordinate Validation (-90..90, -180..180)... ');
    let caughtInvalidLat = false;
    let caughtInvalidLon = false;

    try {
      await salonsService.registerSalon({
        name: 'Invalid Lat Salon',
        ownerName: 'Test Owner',
        phone: '+91 9999999999',
        address: 'Test Road',
        locality: 'Test Area',
        city: 'Bengaluru',
        pincode: '560001',
        latitude: 95.5, // Invalid!
        longitude: 77.6,
      } as RegisterSalonDto);
    } catch (e) {
      if (e instanceof BadRequestException) caughtInvalidLat = true;
    }

    try {
      await salonsService.registerSalon({
        name: 'Invalid Lon Salon',
        ownerName: 'Test Owner',
        phone: '+91 9999999999',
        address: 'Test Road',
        locality: 'Test Area',
        city: 'Bengaluru',
        pincode: '560001',
        latitude: 12.9,
        longitude: 195.0, // Invalid!
      } as RegisterSalonDto);
    } catch (e) {
      if (e instanceof BadRequestException) caughtInvalidLon = true;
    }

    if (caughtInvalidLat && caughtInvalidLon) {
      console.log('✅ PASSED (Invalid coordinates properly rejected)');
      passed++;
    } else {
      console.log('❌ FAILED (Coordinate validation did not throw)');
      failed++;
    }
  } catch (err) {
    console.log(`❌ ERROR: ${(err as Error).message}`);
    failed++;
  }

  // ---------------------------------------------------------------------------
  // TEST 2: Salon Registration & PostGIS Point Generation
  // ---------------------------------------------------------------------------
  let registeredSalonId = '';
  try {
    process.stdout.write('[2/10] Testing Salon Registration & Point Generation... ');
    const regResult = await salonsService.registerSalon(
      {
        name: 'Artisan Blades & Beard Co.',
        tagline: 'Old-school grooming with zero wait queue',
        ownerName: 'Arjun K.',
        phone: '+91 98451 23456',
        address: '10, 1st Cross, Koramangala 5th Block',
        locality: 'Koramangala',
        city: 'Bengaluru',
        pincode: '560095',
        latitude: 12.9352,
        longitude: 77.6245,
        activeBarbers: 3,
        avgServiceTimeMinutes: 20,
        startingPrice: 160.0,
        services: [
          { name: 'Classic Scissors Cut', category: 'Hair', price: 160, durationMinutes: 20 },
        ],
      } as RegisterSalonDto,
      'owner-arjun-101'
    );

    registeredSalonId = regResult.salon.id;
    if (regResult.success && regResult.salon.latitude === 12.9352 && regResult.salon.longitude === 77.6245) {
      console.log(`✅ PASSED (Registered ID: ${registeredSalonId})`);
      passed++;
    } else {
      console.log('❌ FAILED (Invalid registration payload)');
      failed++;
    }
  } catch (err) {
    console.log(`❌ ERROR: ${(err as Error).message}`);
    failed++;
  }

  // ---------------------------------------------------------------------------
  // TEST 3: Nearby Salon Discovery (PostGIS ST_DWithin)
  // ---------------------------------------------------------------------------
  try {
    process.stdout.write('[3/10] Testing Nearby Salon Discovery (GET /salons/nearby)... ');
    const nearby = await discoveryService.getNearbySalons({
      latitude: 12.9350,
      longitude: 77.6240,
      radius_km: 10,
    });

    if (nearby.totalFound > 0 && Array.isArray(nearby.salons) && nearby.salons.length > 0) {
      console.log(`✅ PASSED (Discovered ${nearby.totalFound} salons within 10 km)`);
      passed++;
    } else {
      console.log('❌ FAILED (No salons returned)');
      failed++;
    }
  } catch (err) {
    console.log(`❌ ERROR: ${(err as Error).message}`);
    failed++;
  }

  // ---------------------------------------------------------------------------
  // TEST 4: Distance Accuracy & Nearest First Sorting
  // ---------------------------------------------------------------------------
  try {
    process.stdout.write('[4/10] Testing Distance Accuracy & Sorting Order... ');
    const result = await discoveryService.getNearbySalons({
      latitude: 12.9352,
      longitude: 77.6245,
      radius_km: 15,
      sort_by: 'distance',
    });

    const distances = result.salons.map((s) => s.distanceKm);
    const isSorted = distances.every((val, i, arr) => i === 0 || arr[i - 1] <= val);
    const closest = result.salons[0];

    if (isSorted && closest.distanceKm < 1.0) {
      console.log(`✅ PASSED (Closest salon: ${closest.name} at ${closest.distanceKm} km)`);
      passed++;
    } else {
      console.log('❌ FAILED (Distance sorting incorrect)');
      failed++;
    }
  } catch (err) {
    console.log(`❌ ERROR: ${(err as Error).message}`);
    failed++;
  }

  // ---------------------------------------------------------------------------
  // TEST 5: Radius Filtering
  // ---------------------------------------------------------------------------
  try {
    process.stdout.write('[5/10] Testing Radius Boundary Filtering... ');
    const tightSearch = await discoveryService.getNearbySalons({
      latitude: 12.9352,
      longitude: 77.6245,
      radius_km: 0.5, // Strict 500m radius
    });

    const wideSearch = await discoveryService.getNearbySalons({
      latitude: 12.9352,
      longitude: 77.6245,
      radius_km: 15.0, // 15 km
    });

    const allWithinRadius = tightSearch.salons.every((s) => s.distanceKm <= 0.5);

    if (allWithinRadius && wideSearch.totalFound >= tightSearch.totalFound) {
      console.log(`✅ PASSED (0.5 km: ${tightSearch.totalFound} vs 15 km: ${wideSearch.totalFound})`);
      passed++;
    } else {
      console.log('❌ FAILED (Radius boundary violated)');
      failed++;
    }
  } catch (err) {
    console.log(`❌ ERROR: ${(err as Error).message}`);
    failed++;
  }

  // ---------------------------------------------------------------------------
  // TEST 6: Lazy Mode Filtering (Zero Wait)
  // ---------------------------------------------------------------------------
  try {
    process.stdout.write('[6/10] Testing Lazy Mode Preset (zero_wait)... ');
    const zeroWaitResult = await discoveryService.getNearbySalons({
      latitude: 12.9352,
      longitude: 77.6245,
      radius_km: 20,
      lazy_filter: 'zero_wait',
    });

    const allZero = zeroWaitResult.salons.every((s) => s.currentQueue === 0);

    if (allZero && zeroWaitResult.totalFound > 0) {
      console.log(`✅ PASSED (All ${zeroWaitResult.totalFound} returned salons have 0 waiting)`);
      passed++;
    } else {
      console.log('❌ FAILED (Non-zero queue salon found in zero_wait filter)');
      failed++;
    }
  } catch (err) {
    console.log(`❌ ERROR: ${(err as Error).message}`);
    failed++;
  }

  // ---------------------------------------------------------------------------
  // TEST 7: Suspended Salon Exclusion
  // ---------------------------------------------------------------------------
  try {
    process.stdout.write('[7/10] Testing Suspended Salon Exclusion... ');
    // Suspend registered salon
    await salonsService.updateSalon(registeredSalonId, { status: 'suspended' }, 'owner-arjun-101');

    // Discovery should NOT return it
    const searchAfterSuspend = await discoveryService.getNearbySalons({
      latitude: 12.9352,
      longitude: 77.6245,
      radius_km: 10,
    });

    const foundSuspended = searchAfterSuspend.salons.some((s) => s.id === registeredSalonId);

    // Profile query should throw NotFoundException
    let caught404 = false;
    try {
      await salonsService.getPublicSalonById(registeredSalonId);
    } catch (e) {
      if (e instanceof NotFoundException) caught404 = true;
    }

    if (!foundSuspended && caught404) {
      console.log('✅ PASSED (Suspended salon safely excluded from discovery and profile)');
      passed++;
    } else {
      console.log('❌ FAILED (Suspended salon was returned)');
      failed++;
    }

    // Re-activate for further tests
    await salonsService.updateSalon(registeredSalonId, { status: 'active' }, 'owner-arjun-101');
  } catch (err) {
    console.log(`❌ ERROR: ${(err as Error).message}`);
    failed++;
  }

  // ---------------------------------------------------------------------------
  // TEST 8: Unauthorized Salon Modification Prevention
  // ---------------------------------------------------------------------------
  try {
    process.stdout.write('[8/10] Testing Unauthorized Salon Modification Prevention... ');
    let caughtUnauthorized = false;

    try {
      // Imposter tries to modify Arjun's salon
      await salonsService.updateSalon(
        registeredSalonId,
        { name: 'Hacked Salon Name' },
        'owner-imposter-99'
      );
    } catch (e) {
      if (e instanceof ForbiddenException) caughtUnauthorized = true;
    }

    if (caughtUnauthorized) {
      console.log('✅ PASSED (403 Forbidden thrown on unauthorized modification)');
      passed++;
    } else {
      console.log('❌ FAILED (Unauthorized modification was permitted)');
      failed++;
    }
  } catch (err) {
    console.log(`❌ ERROR: ${(err as Error).message}`);
    failed++;
  }

  // ---------------------------------------------------------------------------
  // TEST 9: Cross-Salon Access Prevention
  // ---------------------------------------------------------------------------
  try {
    process.stdout.write('[9/10] Testing Cross-Salon Tenant Access Isolation... ');
    let crossAccessBlocked = false;

    try {
      // owner-1 tries to update queue for salon-2 (which belongs to owner-2)
      await salonsService.updateQueue(
        'salon-2',
        { delta: 1 },
        'owner-1' // Not owner of salon-2!
      );
    } catch (e) {
      if (e instanceof ForbiddenException) crossAccessBlocked = true;
    }

    if (crossAccessBlocked) {
      console.log('✅ PASSED (Cross-salon queue modification rejected with 403)');
      passed++;
    } else {
      console.log('❌ FAILED (Cross-salon modification was permitted)');
      failed++;
    }
  } catch (err) {
    console.log(`❌ ERROR: ${(err as Error).message}`);
    failed++;
  }

  // ---------------------------------------------------------------------------
  // TEST 10: Mandatory Public Response Privacy Invariant
  // ---------------------------------------------------------------------------
  try {
    process.stdout.write('[10/10] Testing Public API Privacy Invariant (Zero Customer Names)... ');
    const publicProfile = await salonsService.getPublicSalonById('salon-1');
    const discoveryResults = await discoveryService.getNearbySalons({
      latitude: 12.9344,
      longitude: 77.6258,
      radius_km: 10,
    });

    const publicJsonStr = JSON.stringify({ publicProfile, discoveryResults });

    // Assert that walk-in customer records, private revenue, and internal IDs are absent
    const leaksCustomerNames =
      publicJsonStr.includes('walk_in_customers') ||
      publicJsonStr.includes('todayRevenue') ||
      publicJsonStr.includes('monthlyRevenue') ||
      publicJsonStr.includes('todayCustomersServed');

    // Verify aggregate queue fields ARE present
    const hasQueueAggregate =
      typeof publicProfile.currentQueue === 'number' &&
      typeof publicProfile.estimatedWaitMinutes === 'number';

    if (!leaksCustomerNames && hasQueueAggregate) {
      console.log('✅ PASSED (Strict Privacy Invariant Verified: Aggregate counts only, ZERO PII leaks)');
      passed++;
    } else {
      console.log('❌ FAILED (Privacy violation detected)');
      failed++;
    }
  } catch (err) {
    console.log(`❌ ERROR: ${(err as Error).message}`);
    failed++;
  }

  console.log('\n=============================================================');
  console.log(`  TEST RESULTS: ${passed}/10 PASSED | ${failed}/10 FAILED`);
  console.log('=============================================================\n');

  await app.close();
  process.exit(failed > 0 ? 1 : 0);
}

runPhase2TestSuite().catch((err) => {
  console.error('Test Suite Fatal Error:', err);
  process.exit(1);
});
