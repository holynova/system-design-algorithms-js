import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  LRUCache,
  LFUCache,
  CapacityCalculator,
  LATENCY_TABLE,
  POWER_OF_TWO,
  SystemDesignInterviewEvaluator,
  INTERVIEW_STEPS,
  TokenBucketRateLimiter,
  LeakyBucketRateLimiter,
  FixedWindowRateLimiter,
  SlidingWindowLogRateLimiter,
  SlidingWindowCounterRateLimiter,
  ConsistentHashRing,
  VectorClock,
  MerkleTree,
  BloomFilter,
  GossipNode,
  QuorumCoordinator,
  QuorumReplica,
  SnowflakeIdGenerator,
  Base62,
  ShortHashResolver,
  PoliteUrlFrontier,
  SimHash,
  ExponentialBackoff,
  IdempotencyDeduplicator,
  HybridFanoutFeedSystem,
  TimelineMerger,
  ConversationMessageSequencer,
  ChatClientReceiver,
  PresenceManager,
  TopKTrie,
  DAGTaskScheduler,
  DeltaSyncClient,
  ChunkServerStorage,
} from '../src/index.js';

describe('Volume 1: Comprehensive System Design Algorithm Tests', () => {
  // === Chapter 01: Cache (LRU & LFU) ===
  describe('Ch01: Cache Eviction Policies', () => {
    it('LRU Cache: rejects non-positive capacity', () => {
      assert.throws(() => new LRUCache(0), /positive integer/);
      assert.throws(() => new LRUCache(-5), /positive integer/);
    });

    it('LRU Cache: handles get, put, update existing, and eviction order', () => {
      const lru = new LRUCache(2);
      assert.equal(lru.get('missing'), undefined);

      lru.put('a', 1);
      lru.put('b', 2);
      assert.equal(lru.size, 2);

      // Updating 'a' does not increase size
      lru.put('a', 10);
      assert.equal(lru.get('a'), 10);
      assert.equal(lru.size, 2);

      // Insert 'c', 'b' should be evicted because 'a' was recently accessed
      lru.put('c', 3);
      assert.equal(lru.get('b'), undefined);
      assert.equal(lru.get('a'), 10);
      assert.equal(lru.get('c'), 3);
    });

    it('LRU Cache: delete method removes item correctly', () => {
      const lru = new LRUCache(2);
      lru.put('x', 100);
      assert.equal(lru.delete('x'), true);
      assert.equal(lru.get('x'), undefined);
      assert.equal(lru.delete('non_existent'), false);
      assert.equal(lru.size, 0);
    });

    it('LFU Cache: rejects non-positive capacity', () => {
      assert.throws(() => new LFUCache(0), /positive integer/);
    });

    it('LFU Cache: evicts least frequently used, breaking ties with LRU', () => {
      const lfu = new LFUCache(2);
      lfu.put('k1', 'v1');
      lfu.put('k2', 'v2');

      // Access k1 twice (freq=3 including initial put)
      lfu.get('k1');
      lfu.get('k1');

      // Put k3 -> k2 has lowest freq (1), so k2 is evicted
      lfu.put('k3', 'v3');
      assert.equal(lfu.get('k2'), undefined);
      assert.equal(lfu.get('k1'), 'v1');
      assert.equal(lfu.get('k3'), 'v3');

      // When ties occur between same frequencies, LRU order is used
      const lfuTie = new LFUCache(2);
      lfuTie.put('a', 1); // freq=1
      lfuTie.put('b', 2); // freq=1
      lfuTie.put('c', 3); // 'a' was put before 'b', so 'a' is evicted
      assert.equal(lfuTie.get('a'), undefined);
      assert.equal(lfuTie.get('b'), 2);
      assert.equal(lfuTie.get('c'), 3);
    });
  });

  // === Chapter 02: Estimation ===
  describe('Ch02: Back-of-the-envelope Estimations', () => {
    it('calculates QPS and Peak QPS accurately', () => {
      const qps = CapacityCalculator.estimateQPS(100_000_000, 2, 86400);
      assert.equal(qps, 2315);
      const peak = CapacityCalculator.estimatePeakQPS(qps, 2);
      assert.equal(peak, 4630);
    });

    it('calculates Storage and Pareto 80/20 Cache Memory', () => {
      const storage = CapacityCalculator.estimateStorage(10_000_000, 1000, 5);
      assert.equal(storage.dailyBytes, 10_000_000 * 1000);
      assert.equal(storage.totalBytes, 10_000_000 * 1000 * 365 * 5);

      const cache = CapacityCalculator.estimateCacheMemory(storage.dailyBytes, 0.2);
      assert.equal(cache.cacheBytes, storage.dailyBytes * 0.2);
    });

    it('formats bytes into readable units', () => {
      assert.equal(CapacityCalculator.formatBytes(0), '0 B');
      assert.equal(CapacityCalculator.formatBytes(1024), '1.00 KB');
      assert.equal(CapacityCalculator.formatBytes(1024 * 1024 * 5), '5.00 MB');
    });

    it('exposes latency constants and power of two table', () => {
      assert.ok(LATENCY_TABLE.L1_CACHE_REFERENCE_NS < LATENCY_TABLE.DISK_SEEK_NS);
      assert.equal(POWER_OF_TWO.KB, 1024);
      assert.equal(POWER_OF_TWO.MB, 1024 * 1024);
    });
  });

  // === Chapter 03: Framework ===
  describe('Ch03: System Design Interview Framework', () => {
    it('evaluates interview readiness based on completed steps', () => {
      const evalSession = new SystemDesignInterviewEvaluator('Design Chat System');
      assert.throws(() => evalSession.check('invalidStep', 'item', true));

      evalSession.check('step1', 'functionalRequirementsDefined', true);
      evalSession.check('step1', 'nonFunctionalRequirementsDefined', true);
      let report = evalSession.evaluate();
      assert.equal(report.readyForInterview, false);

      // Check remaining required items
      for (const step of ['step1', 'step2', 'step3', 'step4']) {
        for (const itemKey of Object.keys(evalSession.checklist[step])) {
          evalSession.check(step, itemKey, true);
        }
      }
      report = evalSession.evaluate();
      assert.equal(report.percentage, 100);
      assert.equal(report.readyForInterview, true);
      assert.equal(report.missingItems.length, 0);
    });
  });

  // === Chapter 04: Rate Limiter ===
  describe('Ch04: Rate Limiting Algorithms', () => {
    it('Token Bucket: throws on invalid params, refills lazily', () => {
      assert.throws(() => new TokenBucketRateLimiter(0, 1));
      assert.throws(() => new TokenBucketRateLimiter(5, -1));

      const tb = new TokenBucketRateLimiter(5, 2); // 5 max, 2/sec
      const t0 = 1000;
      assert.equal(tb.tryConsume(3, t0), true);
      assert.equal(tb.tryConsume(3, t0), false); // only 2 left

      // 1.5 seconds later: 2 * 1.5 = 3 tokens added (2 + 3 = 5 full)
      assert.equal(tb.tryConsume(4, t0 + 1500), true);
    });

    it('Leaky Bucket: smooths traffic and drops on overflow', () => {
      assert.throws(() => new LeakyBucketRateLimiter(-1, 2));
      const lb = new LeakyBucketRateLimiter(3, 1);
      const t0 = 1000;

      assert.equal(lb.tryAcquire(2, t0), true);
      assert.equal(lb.tryAcquire(1, t0), true);
      assert.equal(lb.tryAcquire(1, t0), false); // queue is full

      // 2 seconds later, 2 units leaked out
      assert.equal(lb.tryAcquire(2, t0 + 2000), true);
    });

    it('Fixed Window: handles window transitions and rejects boundary overflows', () => {
      assert.throws(() => new FixedWindowRateLimiter(-1, 1000));
      const fw = new FixedWindowRateLimiter(2, 1000);

      assert.equal(fw.allowRequest(100), true);
      assert.equal(fw.allowRequest(500), true);
      assert.equal(fw.allowRequest(999), false);

      // Next window begins at 1000
      assert.equal(fw.allowRequest(1000), true);
      assert.equal(fw.currentCount, 1);
    });

    it('Sliding Window Log: precisely cleans old timestamps', () => {
      const swl = new SlidingWindowLogRateLimiter(2, 1000);
      assert.equal(swl.allowRequest(100), true);
      assert.equal(swl.allowRequest(200), true);
      assert.equal(swl.allowRequest(300), false);

      // t=1101ms, the request at 100ms is outside [101, 1101]
      assert.equal(swl.allowRequest(1101), true);
      assert.equal(swl.currentLogCount, 2);
    });

    it('Sliding Window Counter: weights previous window progress', () => {
      const swc = new SlidingWindowCounterRateLimiter(10, 1000);
      for (let i = 0; i < 8; i++) {
        swc.allowRequest(500); // 8 in window 0
      }

      // In window 1 at progress 25% (t=1250):
      // previous weight = 8 * (1 - 0.25) = 6
      // can accept up to 4 more before exceeding 10
      assert.equal(swc.allowRequest(1250), true);
      assert.ok(swc.getEstimatedCount(1250) > 0);
    });
  });

  // === Chapter 05: Consistent Hashing ===
  describe('Ch05: Consistent Hashing Ring', () => {
    it('returns null on empty ring, idempotently handles node additions', () => {
      const ring = new ConsistentHashRing([], 10);
      assert.equal(ring.getNode('key1'), null);

      ring.addNode('ServerA');
      ring.addNode('ServerA'); // duplicate is ignored
      assert.equal(ring.getNode('key1'), 'ServerA');

      ring.removeNode('NonExistent'); // safe
      ring.removeNode('ServerA');
      assert.equal(ring.getNode('key1'), null);
    });

    it('distributes keys evenly and computes migration ratio on node add', () => {
      const ring = new ConsistentHashRing(['Node1', 'Node2', 'Node3'], 100);
      const keys = Array.from({ length: 500 }, (_, i) => `k_${i}`);

      const migration = ring.simulateAddNodeMigration(keys, 'Node4');
      // For 3 to 4 nodes, expected migration is ~25% (tolerance between 15% and 35%)
      assert.ok(migration.migrationRatio > 0.15 && migration.migrationRatio < 0.38);
    });
  });

  // === Chapter 06: KV Store ===
  describe('Ch06: Key-Value Store Algorithms', () => {
    it('Vector Clock: detects EQUAL, ANCESTOR, DESCENDANT, and CONFLICT', () => {
      const v1 = new VectorClock();
      v1.increment('NodeA');

      const v2 = v1.clone().increment('NodeB');
      assert.equal(v1.compare(v2), 'ANCESTOR');
      assert.equal(v2.compare(v1), 'DESCENDANT');

      const v3 = v1.clone().increment('NodeC');
      assert.equal(v2.compare(v3), 'CONFLICT');

      const vMerged = v2.clone();
      vMerged.merge(v3);
      assert.equal(vMerged.compare(v2), 'DESCENDANT');
      assert.equal(vMerged.compare(v3), 'DESCENDANT');
    });

    it('Merkle Tree: handles empty, single-item, and locates differences', () => {
      const emptyTree = new MerkleTree([]);
      assert.ok(emptyTree.rootHash);

      const t1 = new MerkleTree([
        { key: 'a', value: '1' },
        { key: 'b', value: '2' },
        { key: 'c', value: '3' },
      ]);
      const t2 = new MerkleTree([
        { key: 'a', value: '1' },
        { key: 'b', value: '2' },
        { key: 'c', value: '3' },
      ]);
      assert.equal(t1.rootHash, t2.rootHash);
      assert.deepEqual(t1.findDifferences(t2), []);

      const t3 = new MerkleTree([
        { key: 'a', value: '1' },
        { key: 'b', value: 'MODIFIED' },
        { key: 'c', value: '3' },
      ]);
      assert.notEqual(t1.rootHash, t3.rootHash);
      assert.deepEqual(t1.findDifferences(t3), ['b']);
    });

    it('Bloom Filter: guarantees zero false negatives', () => {
      const bf = new BloomFilter(200, 0.01);
      const inserted = ['apple', 'orange', 'grape', 'banana'];
      inserted.forEach(w => bf.add(w));

      for (const w of inserted) {
        assert.equal(bf.mightContain(w), true);
      }
      assert.equal(bf.mightContain('completely_random_absent_string_123'), false);
    });

    it('Gossip Protocol: merges member heartbeats and detects dead nodes', () => {
      const g1 = new GossipNode('G1', 2000);
      const g2 = new GossipNode('G2', 2000);
      g1.setPeers([g1, g2]);
      g2.setPeers([g1, g2]);

      g1.tick(1000);
      g2.tick(1000);
      g1.receiveGossip('G2', g2.exportMembership(), 1000);

      assert.deepEqual(g1.getClusterStatus().alive, ['G1', 'G2']);

      // G2 goes silent; G1 ticks at 4000 (> 2000 timeout)
      g1.tick(4000);
      assert.ok(g1.getClusterStatus().dead.includes('G2'));
    });

    it('Quorum Consensus: verifies read/write quorum and version selection', () => {
      const replicas = [new QuorumReplica('R1'), new QuorumReplica('R2'), new QuorumReplica('R3')];
      const coord = new QuorumCoordinator(replicas, 2, 2);

      const w = coord.write('key', 'val1');
      assert.equal(w.success, true);

      // Node R3 dies
      replicas[2].isAlive = false;
      const r = coord.read('key');
      assert.equal(r.success, true);
      assert.equal(r.value, 'val1');

      // Node R2 also dies -> only 1 node alive, W=2, R=2 cannot be met
      replicas[1].isAlive = false;
      assert.equal(coord.read('key').success, false);
      assert.equal(coord.write('key', 'val2').success, false);
    });
  });

  // === Chapter 07: Snowflake ===
  describe('Ch07: Distributed Unique ID (Snowflake)', () => {
    it('throws on out-of-range machine IDs', () => {
      assert.throws(() => new SnowflakeIdGenerator(32, 1));
      assert.throws(() => new SnowflakeIdGenerator(1, 32));
      assert.throws(() => new SnowflakeIdGenerator(-1, 0));
    });

    it('generates strictly unique, ascending IDs and parses correctly', () => {
      const gen = new SnowflakeIdGenerator(5, 10);
      const id1 = gen.nextId();
      const id2 = gen.nextId();
      assert.ok(id2 > id1);

      const parsed = gen.parse(id1);
      assert.equal(parsed.datacenterId, 5);
      assert.equal(parsed.workerId, 10);
      assert.ok(parsed.timestamp > 0);
    });
  });

  // === Chapter 08: URL Shortener ===
  describe('Ch08: URL Shortener', () => {
    it('Base62: encodes 0n, handles minLength, decodes correctly', () => {
      assert.equal(Base62.encode(0n, 4), '0000');
      assert.equal(Base62.decode('0000'), 0n);

      const large = 9876543210123456789n;
      const encoded = Base62.encode(large);
      assert.equal(Base62.decode(encoded), large);

      assert.throws(() => Base62.decode('invalid!chars#'));
    });

    it('ShortHashResolver: creates short links and resolves collisions', () => {
      const resolver = new ShortHashResolver(6);
      const urlA = 'https://google.com/test';
      const resA = resolver.shorten(urlA);
      assert.equal(resA.shortCode.length, 6);
      assert.equal(resolver.resolve(resA.shortCode), urlA);

      // Re-shortening same URL returns cached code
      assert.equal(resolver.shorten(urlA).shortCode, resA.shortCode);
      assert.equal(resolver.resolve('UNKNOWN'), undefined);
    });
  });

  // === Chapter 09: Web Crawler ===
  describe('Ch09: Web Crawler (URL Frontier & SimHash)', () => {
    it('PoliteUrlFrontier: extracts hosts, deduplicates, and obeys delay', () => {
      const frontier = new PoliteUrlFrontier(500);
      assert.equal(frontier.extractHost('malformed-url'), 'unknown_host');

      assert.equal(frontier.enqueue('https://a.com/page1', 1), true);
      assert.equal(frontier.enqueue('https://a.com/page1', 1), false); // duplicate
      assert.equal(frontier.enqueue('https://b.com/page1', 0), true);

      // Both a.com and b.com are unvisited, should be immediately dequeued
      const first = frontier.dequeue(100);
      assert.ok(['a.com', 'b.com'].includes(first.host));

      const second = frontier.dequeue(100);
      assert.ok(['a.com', 'b.com'].includes(second.host));
      assert.notEqual(first.host, second.host);

      // Both now in 500ms cooldown, next dequeue at t=100 returns null
      assert.equal(frontier.dequeue(100), null);
      assert.equal(frontier.pendingCount, 0);
    });

    it('SimHash: computes 64-bit fingerprint and detects near-duplicates', () => {
      assert.equal(SimHash.hash(''), 0n);

      const text1 = 'System design interview by Alex Xu covers distributed architecture and cache systems. '.repeat(4);
      const text2 = 'System design interview by Alex Xu covers distributed architecture and caching systems. '.repeat(4);
      const text3 = 'Italian pasta recipe with tomato sauce, basil, garlic, and grated parmesan cheese. '.repeat(4);

      assert.equal(SimHash.isDuplicate(text1, text2, 10), true);
      assert.equal(SimHash.isDuplicate(text1, text3, 10), false);
    });
  });

  // === Chapter 10: Notification System ===
  describe('Ch10: Notification System (Backoff & Idempotency)', () => {
    it('ExponentialBackoff: respects jitter types and executes retries', async () => {
      const eb = new ExponentialBackoff(50, 500, 'NO_JITTER');
      assert.equal(eb.calculateDelay(0), 50);
      assert.equal(eb.calculateDelay(1), 100);
      assert.equal(eb.calculateDelay(5), 500); // capped

      let attempts = 0;
      const result = await eb.executeWithRetry(async () => {
        attempts++;
        if (attempts < 2) throw new Error('Temporary failure');
        return 'SUCCESS';
      }, 3);

      assert.equal(result, 'SUCCESS');
      assert.equal(attempts, 2);
    });

    it('IdempotencyDeduplicator: caches responses and rejects concurrent executions', async () => {
      const dedup = new IdempotencyDeduplicator(5000);
      let callCount = 0;
      const op = async () => {
        callCount++;
        return { orderId: '123' };
      };

      const res1 = await dedup.process('k1', op);
      assert.equal(res1.executed, true);
      assert.equal(res1.result.orderId, '123');

      const res2 = await dedup.process('k1', op);
      assert.equal(res2.executed, false);
      assert.equal(res2.result.orderId, '123');
      assert.equal(callCount, 1);
    });
  });

  // === Chapter 11: News Feed System ===
  describe('Ch11: News Feed System (Hybrid Fan-out & Timeline Merger)', () => {
    it('HybridFanoutFeedSystem: pushes for normal users, pulls for celebrities', () => {
      const feed = new HybridFanoutFeedSystem(2); // celebrity threshold = 2 followers
      feed.follow('f1', 'star');
      feed.follow('f2', 'star');
      assert.equal(feed.isCelebrity('star'), true);
      assert.equal(feed.isCelebrity('user_norm'), false);

      feed.follow('reader', 'star');
      feed.follow('reader', 'user_norm');

      const pushPost = feed.postFeed('user_norm', 'Normal hello', 100);
      assert.equal(pushPost.fanoutType, 'PUSH');

      const pullPost = feed.postFeed('star', 'Celebrity hello', 200);
      assert.equal(pullPost.fanoutType, 'PULL');

      const timeline = feed.getNewsFeed('reader');
      assert.equal(timeline.length, 2);
      assert.equal(timeline[0].authorId, 'star'); // newer timestamp first
      assert.equal(timeline[1].authorId, 'user_norm');
    });

    it('TimelineMerger: merges multi-way streams using priority queue', () => {
      const s1 = [{ id: 'A', timestamp: 100, content: 'a' }];
      const s2 = [{ id: 'B', timestamp: 300, content: 'b' }];
      const s3 = [{ id: 'C', timestamp: 200, content: 'c' }];

      const merged = TimelineMerger.merge([s1, s2, s3], 2);
      assert.equal(merged.length, 2);
      assert.equal(merged[0].id, 'B');
      assert.equal(merged[1].id, 'C');
    });
  });

  // === Chapter 12: Chat System ===
  describe('Ch12: Chat System (Message Sequencer & Presence)', () => {
    it('ConversationMessageSequencer: maintains monotonically increasing sequences and detects gaps', () => {
      const seq = new ConversationMessageSequencer();
      const s1 = seq.nextSequence('c1');
      const s2 = seq.nextSequence('c1');
      assert.equal(s2, s1 + 1n);

      const client = new ChatClientReceiver('bob');
      assert.equal(client.receiveMessage('c1', s1, 'hi').status, 'OK');
      assert.equal(client.receiveMessage('c1', s1, 'hi').status, 'DUPLICATE');

      // Send s4, skipping s2 and s3
      const s4 = s2 + 2n;
      const gap = client.receiveMessage('c1', s4, 'gap');
      assert.equal(gap.status, 'GAP_DETECTED');
      assert.deepEqual(gap.missingRange, [2n, 3n]);
    });

    it('PresenceManager: updates heartbeats and sweeps offline users', () => {
      const pm = new PresenceManager(2000);
      pm.heartbeat('alice', 1000);
      assert.equal(pm.isOnline('alice', 2500), true);
      assert.equal(pm.isOnline('alice', 3500), false);

      const offline = pm.sweepOfflineUsers(3500);
      assert.deepEqual(offline, ['alice']);

      pm.heartbeat('bob', 4000);
      pm.logout('bob');
      assert.equal(pm.isOnline('bob', 4001), false);
    });
  });

  // === Chapter 13: Search Autocomplete ===
  describe('Ch13: Search Autocomplete (Top-K Trie)', () => {
    it('TopKTrie: prefixes match, top-K cached, ties broken alphabetically', () => {
      const trie = new TopKTrie(2);
      assert.deepEqual(trie.autocomplete('c'), []);

      trie.insert('car', 10);
      trie.insert('cat', 10);
      trie.insert('camera', 5);

      const res = trie.autocomplete('ca');
      assert.equal(res.length, 2);
      assert.equal(res[0].frequency, 10);
      assert.equal(res[1].frequency, 10);
      // 'car' vs 'cat': 'car' comes first alphabetically
      assert.equal(res[0].word, 'car');
      assert.equal(res[1].word, 'cat');
    });
  });

  // === Chapter 14: YouTube Video Processing ===
  describe('Ch14: Video Transcoding Pipeline (DAG Task Scheduler)', () => {
    it('DAGTaskScheduler: executes dependencies in topological order and detects cycles', async () => {
      const dag = new DAGTaskScheduler();
      const order = [];

      dag.addTask('upload', [], async () => { order.push('upload'); return 'raw.mp4'; });
      dag.addTask('split', ['upload'], async () => { order.push('split'); return 'chunks'; });
      dag.addTask('encode', ['split'], async () => { order.push('encode'); return 'encoded'; });

      assert.equal(dag.isValidDAG(), true);
      const results = await dag.run();
      assert.deepEqual(order, ['upload', 'split', 'encode']);
      assert.equal(results.get('encode'), 'encoded');

      // Cyclic graph
      const cycleDag = new DAGTaskScheduler();
      cycleDag.addTask('A', ['B']);
      cycleDag.addTask('B', ['A']);
      assert.equal(cycleDag.isValidDAG(), false);
      await assert.rejects(() => cycleDag.run(), /Cycle detected/);
    });
  });

  // === Chapter 15: Google Drive ===
  describe('Ch15: Cloud Storage (Chunk Delta Sync)', () => {
    it('DeltaSyncClient: deduplicates and reuses unchanged chunks', () => {
      const server = new ChunkServerStorage();
      const client = new DeltaSyncClient(server, 4);

      const firstSync = client.syncFile('doc.txt', '111122223333');
      assert.equal(firstSync.totalChunks, 3);
      assert.equal(firstSync.uploadedChunks, 3);
      assert.equal(firstSync.reusedChunks, 0);

      // Only modify the second chunk
      const secondSync = client.syncFile('doc.txt', '111199993333');
      assert.equal(secondSync.totalChunks, 3);
      assert.equal(secondSync.uploadedChunks, 1);
      assert.equal(secondSync.reusedChunks, 2);
    });
  });
});
