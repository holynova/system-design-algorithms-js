import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  GeoHash,
  QuadTree,
  BoundingBox,
  Haversine,
  NearbyFriendsTracker,
  AStarPathfinder,
  RoadGraph,
  SlippyMapTile,
  PartitionCommitLog,
  PartitionAssignor,
  TimeSeriesDownsampler,
  AlertRuleEvaluator,
  WatermarkStreamAggregator,
  HotelInventoryManager,
  EmailInvertedIndex,
  ErasureCoding,
  SkipListLeaderboard,
  DoubleEntryLedger,
  LedgerEntry,
  ACCOUNT_TYPE,
  PaymentReconciliation,
  SagaOrchestrator,
  SagaStep,
  TwoPhaseCommitCoordinator,
  TwoPhaseParticipant,
  MatchingEngine,
  Order,
} from '../src/index.js';

describe('Volume 2: Comprehensive System Design Algorithm Tests', () => {
  // === Chapter 01: Proximity Service ===
  describe('Ch01: Spatial Indexing (GeoHash & QuadTree)', () => {
    it('GeoHash: encodes with specified precision and decodes back with error bound', () => {
      const lat = 39.9163;
      const lon = 116.3971;

      const code8 = GeoHash.encode(lat, lon, 8);
      assert.equal(code8.length, 8);

      const decoded = GeoHash.decode(code8);
      assert.ok(Math.abs(decoded.latitude - lat) <= decoded.error.lat);
      assert.ok(Math.abs(decoded.longitude - lon) <= decoded.error.lon);

      assert.throws(() => GeoHash.decode('invalid!char*'));
    });

    it('GeoHash: returns 9 cells including 8 neighbors', () => {
      const neighbors = GeoHash.getNeighbors('wx4g0d');
      assert.equal(neighbors.length, 9);
      assert.ok(neighbors.includes('wx4g0d'));
    });

    it('QuadTree: inserts points and subdivides when capacity is exceeded', () => {
      const boundary = new BoundingBox(0, 0, 100, 100);
      const qt = new QuadTree(boundary, 2, 4); // capacity 2, max depth 4

      assert.equal(qt.insert({ x: 200, y: 200, data: 'outside' }), false);

      assert.equal(qt.insert({ x: 10, y: 10, data: 'p1' }), true);
      assert.equal(qt.insert({ x: 20, y: 20, data: 'p2' }), true);
      assert.equal(qt.divided, false);

      assert.equal(qt.insert({ x: 30, y: 30, data: 'p3' }), true);
      assert.equal(qt.divided, true);

      // Query range
      const searchBox = new BoundingBox(15, 15, 10, 10);
      const found = qt.queryRange(searchBox);
      assert.ok(found.some(p => p.data === 'p1'));
      assert.ok(found.some(p => p.data === 'p2'));
      assert.ok(!found.some(p => p.data === 'outside'));
    });
  });

  // === Chapter 02: Nearby Friends ===
  describe('Ch02: Proximity Subscriptions (Haversine & Grid PubSub)', () => {
    it('Haversine: computes spherical distance and checks radius bounds', () => {
      // Same point distance is 0
      assert.equal(Haversine.distanceInMeters(40, 116, 40, 116), 0);

      // Beijing to Shanghai is ~1068km
      const distKm = Haversine.distanceInKm(39.9042, 116.4074, 31.2304, 121.4737);
      assert.ok(distKm >= 1000 && distKm <= 1150);

      assert.equal(Haversine.isWithinRadius(39.9, 116.4, 39.91, 116.41, 5000), true);
      assert.equal(Haversine.isWithinRadius(39.9, 116.4, 31.2, 121.4, 5000), false);
    });

    it('NearbyFriendsTracker: alerts friends within radius and sorts results by distance', () => {
      const tracker = new NearbyFriendsTracker(3000); // 3km radius
      tracker.addFriendship('Alice', 'Bob');
      tracker.addFriendship('Alice', 'Charlie');

      let notifiedBob = false;
      tracker.onProximityAlert('Bob', alert => {
        if (alert.friendId === 'Alice') notifiedBob = true;
      });

      tracker.updateLocation('Bob', 39.9163, 116.3971);
      tracker.updateLocation('Charlie', 31.2304, 121.4737); // Charlie is far away in Shanghai

      // Alice moves to Tiananmen (~1.2km from Bob)
      tracker.updateLocation('Alice', 39.9054, 116.3976);
      assert.equal(notifiedBob, true);

      const aliceNearby = tracker.getNearbyFriends('Alice');
      assert.equal(aliceNearby.length, 1);
      assert.equal(aliceNearby[0].friendId, 'Bob');
    });
  });

  // === Chapter 03: Google Maps ===
  describe('Ch03: Navigation & Map Rendering (A* & Slippy Map Tiles)', () => {
    it('AStarPathfinder: finds optimal path on directed road network', () => {
      const graph = new RoadGraph();
      graph.addNode('S', 0, 0);
      graph.addNode('A', 2, 2);
      graph.addNode('B', 2, -2);
      graph.addNode('E', 5, 0);

      // Route through A: 10 + 10 = 20
      graph.addDirectedEdge('S', 'A', 10);
      graph.addDirectedEdge('A', 'E', 10);
      // Route through B: 3 + 4 = 7
      graph.addDirectedEdge('S', 'B', 3);
      graph.addDirectedEdge('B', 'E', 4);

      const route = AStarPathfinder.findPath(graph, 'S', 'E');
      assert.deepEqual(route.path, ['S', 'B', 'E']);
      assert.equal(route.totalWeight, 7);

      // Unconnected node
      graph.addNode('Isolated', 100, 100);
      assert.equal(AStarPathfinder.findPath(graph, 'S', 'Isolated'), null);
    });

    it('SlippyMapTile: converts coordinates to tiles and generates viewport tiles', () => {
      const tile = SlippyMapTile.latLonToTile(51.5007, -0.1246, 10);
      assert.ok(tile.tileX >= 0 && tile.tileX < 1024);
      assert.ok(tile.tileY >= 0 && tile.tileY < 1024);

      const latLon = SlippyMapTile.tileToLatLon(tile.tileX, tile.tileY, 10);
      assert.ok(Math.abs(latLon.latitude - 51.5) < 1);

      const tiles = SlippyMapTile.getTilesForBoundingBox(51.4, 51.6, -0.2, -0.1, 5);
      assert.ok(tiles.length > 0);
      assert.ok(tiles[0].urlPath.startsWith('/tiles/5/'));
    });
  });

  // === Chapter 04: Distributed Message Queue ===
  describe('Ch04: Message Queue (Commit Log & Partition Assignor)', () => {
    it('PartitionCommitLog: manages segment rollups and sparse index lookups', () => {
      const commitLog = new PartitionCommitLog(4); // segment capacity = 4
      for (let i = 0; i < 10; i++) {
        const offset = commitLog.append({ val: i });
        assert.equal(offset, i);
      }

      assert.ok(commitLog.segments.length >= 3);
      const read5 = commitLog.read(5);
      assert.equal(read5.payload.val, 5);
      assert.equal(commitLog.read(999), null);
    });

    it('PartitionAssignor: correctly executes Range and Round-Robin assignments', () => {
      const partitions = ['P0', 'P1', 'P2', 'P3'];
      const consumers = ['C1', 'C2'];

      const range = PartitionAssignor.assignRange(partitions, consumers);
      assert.deepEqual(range.get('C1'), ['P0', 'P1']);
      assert.deepEqual(range.get('C2'), ['P2', 'P3']);

      const rr = PartitionAssignor.assignRoundRobin(partitions, consumers);
      assert.deepEqual(rr.get('C1'), ['P0', 'P2']);
      assert.deepEqual(rr.get('C2'), ['P1', 'P3']);

      // More consumers than partitions leaves excess consumers idle
      const excess = PartitionAssignor.assignRoundRobin(['P0'], ['C1', 'C2']);
      assert.deepEqual(excess.get('C1'), ['P0']);
      assert.deepEqual(excess.get('C2'), []);
    });
  });

  // === Chapter 05: Metrics Monitoring & Alerting ===
  describe('Ch05: Metrics (Time Series Downsampling & Alert Evaluator)', () => {
    it('TimeSeriesDownsampler: downsamples raw metrics into statistical buckets', () => {
      const raw = [
        { timestamp: 1000, value: 10 },
        { timestamp: 2000, value: 20 },
        { timestamp: 3000, value: 30 },
        { timestamp: 65000, value: 100 },
      ];

      const buckets = TimeSeriesDownsampler.downsample(raw, 60000);
      assert.equal(buckets.length, 2);
      assert.equal(buckets[0].count, 3);
      assert.equal(buckets[0].min, 10);
      assert.equal(buckets[0].max, 30);
      assert.equal(buckets[0].avg, 20);
      assert.equal(buckets[1].count, 1);
      assert.equal(buckets[1].avg, 100);

      assert.deepEqual(TimeSeriesDownsampler.downsample([], 60000), []);
    });

    it('AlertRuleEvaluator: transitions OK -> PENDING -> FIRING -> RESOLVED', () => {
      const evaluator = new AlertRuleEvaluator('DiskUsage', 80, 2);

      // Normal
      assert.equal(evaluator.evaluate(50).state, 'OK');
      // 1st breach -> PENDING
      assert.equal(evaluator.evaluate(85).state, 'PENDING');
      // 2nd breach -> FIRING
      const firingRes = evaluator.evaluate(90);
      assert.equal(firingRes.state, 'FIRING');
      assert.equal(firingRes.event, 'FIRED');

      // Continuous breach stays FIRING without duplicate FIRED event
      const stayRes = evaluator.evaluate(88);
      assert.equal(stayRes.state, 'FIRING');
      assert.equal(stayRes.event, 'NONE');

      // Drops below threshold -> RESOLVED
      const resolvedRes = evaluator.evaluate(40);
      assert.equal(resolvedRes.state, 'OK');
      assert.equal(resolvedRes.event, 'RESOLVED');
    });
  });

  // === Chapter 06: Ad Click Event Aggregation ===
  describe('Ch06: Streaming Aggregation (Watermarks & Windows)', () => {
    it('WatermarkStreamAggregator: advances watermarks and isolates late-arriving events', () => {
      const agg = new WatermarkStreamAggregator(5000, 1000); // 5s window, 1s allowed lateness

      // Events in window [0, 5000)
      agg.processEvent({ adId: 'ad_a', eventTime: 1000, clickId: 'c1' });
      agg.processEvent({ adId: 'ad_a', eventTime: 2000, clickId: 'c2' });

      // Event at 7000 advances watermark to 7000 - 1000 = 6000 (past 5000 window end)
      const res = agg.processEvent({ adId: 'ad_b', eventTime: 7000, clickId: 'c3' });
      assert.equal(res.emittedWindows.length, 1);
      assert.equal(res.emittedWindows[0].aggregates.ad_a, 2);

      // Late event for already closed window [0, 5000)
      const lateRes = agg.processEvent({ adId: 'ad_a', eventTime: 3000, clickId: 'c_late' });
      assert.equal(lateRes.isLate, true);
      assert.equal(agg.lateEvents.length, 1);
    });
  });

  // === Chapter 07: Hotel Reservation ===
  describe('Ch07: Inventory Concurrency (Multi-Date Reservation & TTL)', () => {
    it('HotelInventoryManager: manages atomic multi-date holds and timeout releases', () => {
      const hotel = new HotelInventoryManager(
        { '2026-10-01': 2, '2026-10-02': 1 },
        2000 // 2s TTL
      );

      // Alice books both dates
      const resAlice = hotel.holdReservation('alice_order', ['2026-10-01', '2026-10-02'], 1, 1000);
      assert.equal(resAlice.success, true);
      assert.equal(hotel.getAvailable('2026-10-02'), 0);

      // Bob tries same dates -> 10-02 sold out, booking fails
      const resBob = hotel.holdReservation('bob_order', ['2026-10-01', '2026-10-02'], 1, 1000);
      assert.equal(resBob.success, false);

      // Confirm Alice order
      hotel.confirmReservation('alice_order', 1500);

      // Alice cancels
      hotel.cancelReservation('alice_order');
      assert.equal(hotel.getAvailable('2026-10-02'), 1);

      // Bob holds, but lets it expire
      hotel.holdReservation('bob_order_2', ['2026-10-02'], 1, 2000);
      hotel.cleanExpiredHolds(4500); // 2000 + 2000 = 4000 < 4500
      assert.equal(hotel.getAvailable('2026-10-02'), 1);
    });
  });

  // === Chapter 08: Distributed Email Search ===
  describe('Ch08: Full-Text Search (Inverted Index & Boolean Search)', () => {
    it('EmailInvertedIndex: tokenizes text and executes AND / OR searches', () => {
      const idx = new EmailInvertedIndex();
      idx.addEmail('e1', 'Interview Invitation', 'Google System Design Interview');
      idx.addEmail('e2', 'Flight Tickets', 'Your booking to Tokyo is confirmed');

      const andResults = idx.searchAND(['system', 'design']);
      assert.equal(andResults.length, 1);
      assert.equal(andResults[0].emailId, 'e1');

      const orResults = idx.searchOR(['google', 'tokyo']);
      assert.equal(orResults.length, 2);

      assert.deepEqual(idx.searchAND(['nonexistent_keyword']), []);
    });
  });

  // === Chapter 09: S3-Like Object Storage ===
  describe('Ch09: Object Storage (Erasure Coding)', () => {
    it('ErasureCoding: encodes into N+M blocks and reconstructs damaged blocks', () => {
      const ec = new ErasureCoding(4, 2); // 4 data + 2 parity
      const message = 'DistributedObjectStorageSystem2026';
      const rawBytes = new TextEncoder().encode(message);

      const blocks = ec.encode(rawBytes);
      assert.equal(blocks.length, 6);

      // 1 data block lost
      const damaged1 = [...blocks];
      damaged1[0] = null;
      const rec1 = ec.reconstruct(damaged1, rawBytes.length);
      assert.equal(new TextDecoder().decode(rec1), message);

      // Too many blocks lost (3 blocks lost > M=2)
      const severelyDamaged = [...blocks];
      severelyDamaged[0] = null;
      severelyDamaged[1] = null;
      severelyDamaged[2] = null;
      assert.throws(() => ec.reconstruct(severelyDamaged, rawBytes.length), /Data lost/);
    });
  });

  // === Chapter 10: Real-time Gaming Leaderboard ===
  describe('Ch10: Gaming Leaderboard (Skip List)', () => {
    it('SkipListLeaderboard: inserts, calculates rank, and extracts top-K in O(log N)', () => {
      const lb = new SkipListLeaderboard();
      assert.equal(lb.getRank('nobody'), null);

      lb.add('A', 100);
      lb.add('B', 80);
      lb.add('C', 90);

      assert.equal(lb.getRank('A'), 1);
      assert.equal(lb.getRank('C'), 2);
      assert.equal(lb.getRank('B'), 3);

      const top2 = lb.getTopK(2);
      assert.equal(top2.length, 2);
      assert.equal(top2[0].member, 'A');
      assert.equal(top2[1].member, 'C');

      // Update B's score to 120 -> becomes #1
      lb.add('B', 120);
      assert.equal(lb.getRank('B'), 1);
      assert.equal(lb.getRank('A'), 2);

      // Remove member
      assert.equal(lb.remove('A'), true);
      assert.equal(lb.getRank('A'), null);
      assert.equal(lb.remove('A'), false);
    });
  });

  // === Chapter 11: Payment System ===
  describe('Ch11: Financial Payment (Double-Entry Ledger & Reconciliation)', () => {
    it('DoubleEntryLedger: enforces debit-credit balance and accounting equation', () => {
      const ledger = new DoubleEntryLedger();
      ledger.createAccount('BANK_ASSET', ACCOUNT_TYPE.ASSET);
      ledger.createAccount('USER_WALLET', ACCOUNT_TYPE.LIABILITY);

      assert.throws(() => ledger.createAccount('BANK_ASSET', ACCOUNT_TYPE.ASSET)); // duplicate throws

      // Balanced entry
      ledger.recordTransaction('tx1', [
        new LedgerEntry('BANK_ASSET', 'DEBIT', 1000n),
        new LedgerEntry('USER_WALLET', 'CREDIT', 1000n),
      ], 'Deposit');

      assert.equal(ledger.getAccountBalance('BANK_ASSET'), 1000n);
      assert.equal(ledger.getAccountBalance('USER_WALLET'), 1000n);
      assert.equal(ledger.verifySystemBalance(), true);

      // Imbalanced entry throws
      assert.throws(() => {
        ledger.recordTransaction('tx_bad', [
          new LedgerEntry('BANK_ASSET', 'DEBIT', 500n),
          new LedgerEntry('USER_WALLET', 'CREDIT', 400n),
        ], 'Bad');
      }, /Double-entry balance check failed/);
    });

    it('PaymentReconciliation: categorizes match, internal missing, PSP missing, and amount mismatch', () => {
      const internal = [
        { txId: 'T1', amount: 100, status: 'SUCCESS' },
        { txId: 'T2', amount: 200, status: 'SUCCESS' },
        { txId: 'T3', amount: 300, status: 'SUCCESS' },
      ];
      const psp = [
        { txId: 'T1', amount: 100, status: 'SUCCESS' }, // Matched
        { txId: 'T2', amount: 250, status: 'SUCCESS' }, // Amount mismatch
        { txId: 'T4', amount: 400, status: 'SUCCESS' }, // Missing in internal
      ];

      const report = PaymentReconciliation.reconcile(internal, psp);
      assert.equal(report.matched.length, 1);
      assert.equal(report.amountMismatch.length, 1);
      assert.equal(report.missingInPSP.length, 1); // T3
      assert.equal(report.missingInInternal.length, 1); // T4
      assert.equal(report.isAllReconciled, false);
    });
  });

  // === Chapter 12: Digital Wallet ===
  describe('Ch12: Distributed Transactions (Saga & 2PC)', () => {
    it('SagaOrchestrator: runs successful steps and rolls back with compensations on error', async () => {
      const sagaSuccess = new SagaOrchestrator();
      sagaSuccess.addStep(new SagaStep('S1', () => 1, () => 0));
      sagaSuccess.addStep(new SagaStep('S2', () => 2, () => 0));
      const resSuccess = await sagaSuccess.execute();
      assert.equal(resSuccess.status, 'SUCCESS');
      assert.deepEqual(resSuccess.executedSteps, ['S1', 'S2']);

      const sagaFail = new SagaOrchestrator();
      let s1Compensated = false;
      sagaFail.addStep(new SagaStep('Step1', () => 'ok', () => { s1Compensated = true; }));
      sagaFail.addStep(new SagaStep('Step2', () => { throw new Error('DB Down'); }, () => {}));

      const resFail = await sagaFail.execute();
      assert.equal(resFail.status, 'FAILED_COMPENSATED');
      assert.equal(s1Compensated, true);
      assert.deepEqual(resFail.compensatedSteps, ['Step1']);
    });

    it('TwoPhaseCommitCoordinator: commits globally when all vote yes, aborts if any vote no', () => {
      const n1 = new TwoPhaseParticipant('N1');
      const n2 = new TwoPhaseParticipant('N2');
      const coord1 = new TwoPhaseCommitCoordinator([n1, n2]);
      assert.equal(coord1.executeTransaction().status, 'GLOBAL_COMMIT');
      assert.equal(n1.status, 'COMMITTED');

      const n3 = new TwoPhaseParticipant('N3');
      const n4 = new TwoPhaseParticipant('N4');
      n4.failOnPrepare = true;
      const coord2 = new TwoPhaseCommitCoordinator([n3, n4]);
      assert.equal(coord2.executeTransaction().status, 'GLOBAL_ABORT');
      assert.equal(n3.status, 'ABORTED');
      assert.equal(n4.status, 'ABORTED');
    });
  });

  // === Chapter 13: Stock Exchange ===
  describe('Ch13: Matching Engine (Limit Order Book)', () => {
    it('MatchingEngine: executes limit orders price-time priority and partial fills', () => {
      const engine = new MatchingEngine('AAPL');

      // Place 2 sell orders at same price $100: S1 earlier than S2
      engine.submitOrder(new Order('S1', 'SELL', 100, 5, 1000));
      engine.submitOrder(new Order('S2', 'SELL', 100, 5, 2000));

      // Buy order B1 for 7 shares at $100
      const trades = engine.submitOrder(new Order('B1', 'BUY', 100, 7, 3000));
      assert.equal(trades.length, 2);

      // S1 completely filled 5 shares
      assert.equal(trades[0].sellOrderId, 'S1');
      assert.equal(trades[0].quantity, 5);

      // S2 partially filled 2 shares (leaving 3 shares on the book)
      assert.equal(trades[1].sellOrderId, 'S2');
      assert.equal(trades[1].quantity, 2);

      const snapshot = engine.getOrderBookSnapshot();
      assert.equal(snapshot.asks.length, 1);
      assert.equal(snapshot.asks[0].id, 'S2');
      assert.equal(snapshot.asks[0].quantity, 3);

      // Cancel S2
      assert.equal(engine.cancelOrder('S2'), true);
      assert.equal(engine.getOrderBookSnapshot().asks.length, 0);
    });
  });
});
