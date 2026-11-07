import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { JwtService } from '@nestjs/jwt';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
  console.log(`✅ PASS: ${message}`);
}

async function runLiveQueueTest() {
  console.log('=============================================================');
  console.log('   SLOON LIVE QUEUE WORKFLOW & RELIABILITY TEST');
  console.log('=============================================================');

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    { logger: ['error', 'warn'] },
  );

  app.setGlobalPrefix('api/v1');
  await app.init();
  await app.getHttpAdapter().getInstance().ready();

  const fastify = app.getHttpAdapter().getInstance();
  const prisma = app.get(PrismaService);
  const jwtService = app.get(JwtService);

  const salonId = 'salon-1793879435526';
  const salon = await prisma.salon.findUnique({
    where: { id: salonId },
    select: {
      id: true,
      name: true,
      ownerId: true,
      queueStatus: true,
      isOpen: true,
      openingHoursOpen: true,
      openingHoursClose: true,
    },
  });

  if (!salon) {
    throw new Error(`Salon ${salonId} not found in database.`);
  }

  console.log(`Testing against Salon: "${salon.name}" (${salon.id}), Owner: ${salon.ownerId}`);

  // Temporarily set 24h operating hours so test can join outside daytime business hours
  const origOpen = salon.openingHoursOpen;
  const origClose = salon.openingHoursClose;
  const origStatus = salon.queueStatus;
  const origIsOpen = salon.isOpen;

  await prisma.salon.update({
    where: { id: salonId },
    data: {
      openingHoursOpen: '12:00 AM',
      openingHoursClose: '11:59 PM',
      isOpen: true,
      queueStatus: 'open',
    },
  });

  try {
    // 1. Generate Partner Token for salon owner
    const secret = process.env.JWT_SECRET || 'kumbhakaran-jwt-secure-default-key-32chars-min';
    const partnerToken = jwtService.sign(
      {
        sub: salon.ownerId,
        email: 'owner@sloon.in',
        name: 'Adarsh Salon Owner',
        role: 'CUSTOMER',
        memberships: [{ salonId, role: 'PARTNER_OWNER', isActive: true }],
      },
      { secret, expiresIn: '1h' },
    );

  // 2. Fetch Initial Queue Overview
  console.log('\n--- Step 1: Initial Queue Overview ---');
  const initialOverviewRes = await fastify.inject({
    method: 'GET',
    url: `/api/v1/salons/${salonId}/queue-overview`,
    headers: {
      authorization: `Bearer ${partnerToken}`,
    },
  });
  console.log(`Overview response: ${initialOverviewRes.statusCode}`);
  assert(initialOverviewRes.statusCode === 200, 'Initial queue overview returns 200 OK');
  const initialOverview = JSON.parse(initialOverviewRes.body);
  console.log(`Initial waiting count: ${initialOverview.waitingCount || initialOverview.currentQueue || 0}`);

  // 3. Customer Joins Queue
  console.log('\n--- Step 2: Customer Joins Queue ---');
  const customerName = `Verification Customer ${Date.now() % 1000}`;
  const idempotencyKey = `test-join-${Date.now()}`;
  const joinRes = await fastify.inject({
    method: 'POST',
    url: `/api/v1/salons/${salonId}/queue-entries`,
    headers: { 'content-type': 'application/json' },
    payload: {
      customerName,
      phone: '9876543210',
      partySize: 1,
      requestId: idempotencyKey,
    },
  });

  assert(joinRes.statusCode === 201, `Customer joins queue successfully (got ${joinRes.statusCode})`);
  const joinBody = JSON.parse(joinRes.body);
  const ticket = joinBody.entry;
  console.log(`Created Ticket ID: ${ticket.id}, Position: ${ticket.position}, Status: ${ticket.status}`);
  assert(ticket.status === 'waiting', 'New ticket has status waiting');
  assert(typeof ticket.position === 'number', 'New ticket has valid numeric position');

  // Verify ticket in Database
  const dbTicket = await prisma.salonQueueEntry.findUnique({ where: { id: ticket.id } });
  assert(dbTicket !== null, 'Ticket exists in database');
  assert(dbTicket?.customerName === customerName, 'Customer name matches in database');
  console.log('DB entry values:', {
    customerName: dbTicket?.customerName,
    phone: dbTicket?.phone,
    serviceName: dbTicket?.serviceName,
    deviceId: dbTicket?.deviceId,
    userId: dbTicket?.userId,
    assignedStaffId: dbTicket?.assignedStaffId,
    partySize: dbTicket?.partySize,
    serviceId: dbTicket?.serviceId,
    clientRequestId: dbTicket?.clientRequestId,
  });

  // Test idempotency: Join again with same clientRequestId returns identical ticket
  const retryRes = await fastify.inject({
    method: 'POST',
    url: `/api/v1/salons/${salonId}/queue-entries`,
    headers: { 'content-type': 'application/json' },
    payload: {
      customerName,
      phone: '9876543210',
      partySize: 1,
      requestId: idempotencyKey,
    },
  });
  console.log('Retry response:', retryRes.statusCode, retryRes.body);
  assert(retryRes.statusCode === 201 || retryRes.statusCode === 200, 'Idempotent retry succeeds');
  const retryTicket = JSON.parse(retryRes.body).entry;
  assert(retryTicket.id === ticket.id, 'Idempotent retry returned the exact same ticket ID');

  // 4. Partner Pauses Admissions
  console.log('\n--- Step 3: Partner Pauses Queue ---');
  const pauseRes = await fastify.inject({
    method: 'PATCH',
    url: `/api/v1/salons/${salonId}/queue-status`,
    headers: {
      authorization: `Bearer ${partnerToken}`,
      'content-type': 'application/json',
    },
    payload: { status: 'paused' },
  });
  assert(pauseRes.statusCode === 200, `Partner pause returns 200 OK (got ${pauseRes.statusCode})`);

  // Verify queue status in Database
  const pausedSalon = await prisma.salon.findUnique({ where: { id: salonId }, select: { queueStatus: true } });
  assert(pausedSalon?.queueStatus === 'paused', 'Salon queueStatus updated to paused in database');

  // Verify Customer Cannot Join While Paused
  console.log('\n--- Step 4: Rejection While Paused ---');
  const rejectedJoinRes = await fastify.inject({
    method: 'POST',
    url: `/api/v1/salons/${salonId}/queue-entries`,
    headers: { 'content-type': 'application/json' },
    payload: {
      customerName: 'Blocked Customer',
      customerPhone: '9998887776',
      partySize: 1,
    },
  });
  assert(
    rejectedJoinRes.statusCode === 409 || rejectedJoinRes.statusCode === 400,
    `Admissions rejected while queue is paused (got HTTP ${rejectedJoinRes.statusCode})`,
  );

  // 5. Partner Resumes Admissions
  console.log('\n--- Step 5: Partner Resumes Queue ---');
  const resumeRes = await fastify.inject({
    method: 'PATCH',
    url: `/api/v1/salons/${salonId}/queue-status`,
    headers: {
      authorization: `Bearer ${partnerToken}`,
      'content-type': 'application/json',
    },
    payload: { status: 'open' },
  });
  assert(resumeRes.statusCode === 200, 'Partner resume returns 200 OK');

  // 6. Partner Starts Service
  console.log('\n--- Step 6: Start Service ---');
  const startServiceRes = await fastify.inject({
    method: 'POST',
    url: `/api/v1/salons/${salonId}/queue-entries/${ticket.id}/start`,
    headers: {
      authorization: `Bearer ${partnerToken}`,
      'content-type': 'application/json',
    },
    payload: {},
  });
  assert(
    startServiceRes.statusCode === 200 || startServiceRes.statusCode === 201,
    `Start service returns success (got ${startServiceRes.statusCode})`,
  );
  const startedTicket = JSON.parse(startServiceRes.body);
  assert(startedTicket.status === 'in_service', 'Ticket status updated to in_service');

  // 7. Partner Completes Service
  console.log('\n--- Step 7: Complete Service ---');
  const completeServiceRes = await fastify.inject({
    method: 'POST',
    url: `/api/v1/salons/${salonId}/queue-entries/${ticket.id}/complete`,
    headers: {
      authorization: `Bearer ${partnerToken}`,
      'content-type': 'application/json',
    },
    payload: {},
  });
  assert(
    completeServiceRes.statusCode === 200 || completeServiceRes.statusCode === 201,
    `Complete service returns success (got ${completeServiceRes.statusCode})`,
  );
  const completedTicket = JSON.parse(completeServiceRes.body);
  assert(completedTicket.status === 'completed', 'Ticket status updated to completed');

  // Verify final state in database
  const finalDbTicket = await prisma.salonQueueEntry.findUnique({ where: { id: ticket.id } });
  assert(finalDbTicket?.status === 'completed', 'Final database status is completed');
  assert(finalDbTicket?.servedAt !== null, 'Served timestamp is recorded in database');

  // Clean up test ticket
  await prisma.salonQueueEntry.delete({ where: { id: ticket.id } });
  console.log('Cleaned up test ticket from database.');
  } finally {
    // Restore original salon state
    await prisma.salon.update({
      where: { id: salonId },
      data: {
        openingHoursOpen: origOpen,
        openingHoursClose: origClose,
        isOpen: origIsOpen,
        queueStatus: origStatus,
      },
    });
    console.log('Restored original salon operating hours and status.');
    await app.close();
  }

  console.log('\n=============================================================');
  console.log('  LIVE QUEUE LIFECYCLE & INTEGRITY VERIFIED (ALL PASSED)');
  console.log('=============================================================');
}

runLiveQueueTest().catch((err) => {
  console.error('Live queue test failed:', err);
  process.exit(1);
});
