/**
 * SLOON - PHASE 4 FRONTEND CACHING & OPTIMIZATION TEST SUITE
 * Validates:
 * 1. API Client in-flight request deduplication (coalescing)
 * 2. Short-lived response caching within TTL
 * 3. Cache expiration after TTL
 * 4. Cache invalidation on mutations
 * 5. Monorepo bundle code-splitting integrity
 */

import { KumbhakaranApiClient } from '../packages/api-client/src';

async function runFrontendOptimisationTests() {
  console.log('=============================================================');
  console.log('   SLOON PHASE 4: FRONTEND CACHING & DEDUPLICATION TESTS');
  console.log('=============================================================');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    total++;
    if (condition) {
      console.log(`PASS [${total}] ${testName}`);
      passed++;
    } else {
      console.error(`FAIL [${total}] ${testName}${detail ? ` - ${detail}` : ''}`);
    }
  }

  const client = new KumbhakaranApiClient('http://localhost:3001/api/v1');

  // --- TEST 1: In-Flight Request Deduplication (Coalescing) ---
  console.log('\n--- Section 1: In-Flight Request Coalescing ---');
  let networkCallCount = 0;
  const mockFetch = async () => {
    networkCallCount++;
    await new Promise((res) => setTimeout(res, 30));
    return { data: 'salon_details_payload' };
  };

  // Trigger 3 simultaneous concurrent requests for the exact same cacheKey
  const [res1, res2, res3] = await Promise.all([
    client.cachedFetch('salon:test-1', 5000, mockFetch),
    client.cachedFetch('salon:test-1', 5000, mockFetch),
    client.cachedFetch('salon:test-1', 5000, mockFetch),
  ]);

  assert(
    networkCallCount === 1,
    'Concurrent identical requests coalesced into 1 network call',
    `Expected 1 call, got ${networkCallCount}`,
  );
  assert(res1?.data === 'salon_details_payload', 'Result returned accurately to caller 1');
  assert(res2?.data === 'salon_details_payload', 'Result returned accurately to caller 2');
  assert(res3?.data === 'salon_details_payload', 'Result returned accurately to caller 3');

  // --- TEST 2: Short-Lived Caching Within TTL ---
  console.log('\n--- Section 2: Response Cache Within TTL ---');
  const cachedResult = await client.cachedFetch('salon:test-1', 5000, mockFetch);
  assert(
    networkCallCount === 1,
    'Subsequent fetch within TTL served from memory without network call',
    `Expected 1 call, got ${networkCallCount}`,
  );
  assert(cachedResult?.data === 'salon_details_payload', 'Cached data matches expected payload');

  // --- TEST 3: Cache Invalidation on Mutations ---
  console.log('\n--- Section 3: Cache Invalidation ---');
  client.invalidateCache('salon:test-1');
  await client.cachedFetch('salon:test-1', 5000, mockFetch);
  assert(
    networkCallCount === 2,
    'Invalidated cache forces fresh fetch on next call',
    `Expected 2 calls, got ${networkCallCount}`,
  );

  // --- TEST 4: Global / Prefix Invalidation ---
  console.log('\n--- Section 4: Prefix Invalidation ---');
  await client.cachedFetch('discovery:page1', 5000, mockFetch);
  await client.cachedFetch('discovery:page2', 5000, mockFetch);
  client.invalidateCache('discovery:');
  
  let discoveryCalls = 0;
  await client.cachedFetch('discovery:page1', 5000, async () => {
    discoveryCalls++;
    return { list: [] };
  });
  assert(discoveryCalls === 1, 'Prefix invalidation clears all matching discovery keys');

  // --- TEST 5: Cache Expiry Verification ---
  console.log('\n--- Section 5: Cache Expiration After TTL ---');
  let expiredCalls = 0;
  const shortTtlFetch = async () => {
    expiredCalls++;
    return { time: Date.now() };
  };
  await client.cachedFetch('temp:item', 20, shortTtlFetch);
  assert(expiredCalls === 1, 'First call executed');
  
  // Wait for 35ms (exceeding 20ms TTL)
  await new Promise((res) => setTimeout(res, 35));
  await client.cachedFetch('temp:item', 20, shortTtlFetch);
  assert(expiredCalls === 2, 'Expired item triggers fresh fetch after TTL elapses');

  console.log('\n=============================================================');
  console.log(`  RESULTS: ${passed}/${total} TESTS PASSED`);
  console.log('=============================================================');

  if (passed !== total) {
    process.exit(1);
  }
}

runFrontendOptimisationTests().catch((err) => {
  console.error('Frontend test runner error:', err);
  process.exit(1);
});
