import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from '../app.module';
import { AuthService } from '../modules/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

async function runAuthSecurityTests() {
  console.log('\n=============================================================');
  console.log('   KUMBHAKARAN PLATFORM - AUTH & SECURITY VERIFICATION SUITE');
  console.log('   Step 1: Role Invariant, JWT Guard, & Anti-Spoofing Tests');
  console.log('=============================================================\n');

  let passed = 0;
  let failed = 0;

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    { logger: ['error'] },
  );

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  await app.init();
  await app.getHttpAdapter().getInstance().ready();

  const authService = app.get(AuthService);
  const jwtService = app.get(JwtService);
  const prisma = app.get(PrismaService);
  const fastifyInstance = app.getHttpAdapter().getInstance();

  // ---------------------------------------------------------------------------
  // TEST 1: Unauthenticated Access to Protected Endpoint
  // ---------------------------------------------------------------------------
  try {
    process.stdout.write('[1/6] Testing Unauthenticated Request Rejection (/auth/me)... ');
    const res = await fastifyInstance.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
    });

    if (res.statusCode === 401) {
      console.log('✅ PASSED (Properly returned 401 Unauthorized)');
      passed++;
    } else {
      console.log(`❌ FAILED (Expected 401, got ${res.statusCode})`);
      failed++;
    }
  } catch (err) {
    console.log(`❌ ERROR: ${(err as Error).message}`);
    failed++;
  }

  // ---------------------------------------------------------------------------
  // TEST 2: Rejection of Spoofed x-owner-id Header
  // ---------------------------------------------------------------------------
  try {
    process.stdout.write('[2/6] Testing Spoofed x-owner-id Header Rejection... ');
    const res = await fastifyInstance.inject({
      method: 'PATCH',
      url: '/api/v1/salons/salon-1793713039749/queue',
      headers: {
        'x-owner-id': 'owner-arjun-101',
        'content-type': 'application/json',
      },
      payload: { delta: 1 },
    });

    if (res.statusCode === 401) {
      console.log('✅ PASSED (Client-supplied x-owner-id ignored, 401 returned)');
      passed++;
    } else {
      console.log(`❌ FAILED (Expected 401, got ${res.statusCode})`);
      failed++;
    }
  } catch (err) {
    console.log(`❌ ERROR: ${(err as Error).message}`);
    failed++;
  }

  // ---------------------------------------------------------------------------
  // TEST 3: Google Login strictly provisions user with role = 'CUSTOMER'
  // ---------------------------------------------------------------------------
  let customerToken = '';
  let customerUser: any = null;
  try {
    process.stdout.write('[3/6] Testing Google Login Default Role Invariant (CUSTOMER)... ');
    const mockEmail = `test.customer.${Date.now()}@example.com`;
    const testPayload = {
      sub: `google-sub-${Date.now()}`,
      email: mockEmail,
      name: 'Rohan Sharma',
      picture: 'https://example.com/avatar.jpg',
    };
    const testCredential = `test-token:${Buffer.from(JSON.stringify(testPayload)).toString('base64')}`;

    const res = await fastifyInstance.inject({
      method: 'POST',
      url: '/api/v1/auth/google',
      headers: { 'content-type': 'application/json' },
      payload: { credential: testCredential },
    });

    if (res.statusCode === 200) {
      const body = JSON.parse(res.body);
      customerToken = body.accessToken;
      customerUser = body.user;

      if (body.user.role === 'CUSTOMER' && body.accessToken) {
        console.log('✅ PASSED (Newly authenticated user assigned CUSTOMER role)');
        passed++;
      } else {
        console.log(`❌ FAILED (Expected role CUSTOMER, got ${body.user.role})`);
        failed++;
      }
    } else {
      console.log(`❌ FAILED (Expected 200, got ${res.statusCode}: ${res.body})`);
      failed++;
    }
  } catch (err) {
    console.log(`❌ ERROR: ${(err as Error).message}`);
    failed++;
  }

  // ---------------------------------------------------------------------------
  // TEST 4: Authorized Profile Fetch using JWT Token
  // ---------------------------------------------------------------------------
  try {
    process.stdout.write('[4/6] Testing Authenticated Session (/auth/me with Bearer)... ');
    const res = await fastifyInstance.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      headers: {
        authorization: `Bearer ${customerToken}`,
      },
    });

    if (res.statusCode === 200) {
      const body = JSON.parse(res.body);
      if (body.id === customerUser.id && body.role === 'CUSTOMER') {
        console.log('✅ PASSED (Authenticated user profile returned with valid memberships)');
        passed++;
      } else {
        console.log(`❌ FAILED (User data mismatch: ${res.body})`);
        failed++;
      }
    } else {
      console.log(`❌ FAILED (Expected 200, got ${res.statusCode})`);
      failed++;
    }
  } catch (err) {
    console.log(`❌ ERROR: ${(err as Error).message}`);
    failed++;
  }

  // ---------------------------------------------------------------------------
  // TEST 5: Cross-Salon Authorization Enforcement (Forbidden on unowned salon)
  // ---------------------------------------------------------------------------
  try {
    process.stdout.write('[5/6] Testing Multi-Salon Isolation (Customer modifying unowned salon)... ');
    const res = await fastifyInstance.inject({
      method: 'PATCH',
      url: '/api/v1/salons/salon-1793713039749/queue',
      headers: {
        authorization: `Bearer ${customerToken}`,
        'content-type': 'application/json',
      },
      payload: { delta: 1 },
    });

    // Should be 403 Forbidden because customer is not an owner or member of this salon
    if (res.statusCode === 403) {
      console.log('✅ PASSED (Non-owner modification blocked with 403 Forbidden)');
      passed++;
    } else {
      console.log(`❌ FAILED (Expected 403, got ${res.statusCode}: ${res.body})`);
      failed++;
    }
  } catch (err) {
    console.log(`❌ ERROR: ${(err as Error).message}`);
    failed++;
  }

  // ---------------------------------------------------------------------------
  // TEST 6: Session Invalidation on Logout
  // ---------------------------------------------------------------------------
  try {
    process.stdout.write('[6/6] Testing Server-Side Invalidation on Logout... ');
    const logoutRes = await fastifyInstance.inject({
      method: 'POST',
      url: '/api/v1/auth/logout',
      headers: {
        authorization: `Bearer ${customerToken}`,
      },
    });

    if (logoutRes.statusCode === 200) {
      // Small sleep to ensure timestamp comparison is strictly greater
      await new Promise((r) => setTimeout(r, 100));

      // Attempt using the old token again
      const subsequentRes = await fastifyInstance.inject({
        method: 'GET',
        url: '/api/v1/auth/me',
        headers: {
          authorization: `Bearer ${customerToken}`,
        },
      });

      if (subsequentRes.statusCode === 401) {
        console.log('✅ PASSED (Old token rejected after logout with 401)');
        passed++;
      } else {
        console.log(`❌ FAILED (Expected 401 after logout, got ${subsequentRes.statusCode})`);
        failed++;
      }
    } else {
      console.log(`❌ FAILED (Logout returned ${logoutRes.statusCode})`);
      failed++;
    }
  } catch (err) {
    console.log(`❌ ERROR: ${(err as Error).message}`);
    failed++;
  }

  console.log('\n=============================================================');
  console.log(`   TEST RESULTS: ${passed}/6 PASSED | ${failed}/6 FAILED`);
  console.log('=============================================================\n');

  await app.close();
  process.exit(failed > 0 ? 1 : 0);
}

runAuthSecurityTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
