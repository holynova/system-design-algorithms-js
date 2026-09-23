/**
 * @file index.js
 * @description 系统设计经典算法库 (System Design Algorithms in JavaScript)
 * 统一导出 Alex Xu《系统设计面试：内幕指南》第一卷与第二卷全部经典算法实现
 */

// === 第一卷 (Volume 1) ===
export { LRUCache } from './v1/ch01-cache/lru-cache.js';
export { LFUCache } from './v1/ch01-cache/lfu-cache.js';
export { CapacityCalculator, LATENCY_TABLE, POWER_OF_TWO } from './v1/ch02-estimation/capacity-calculator.js';
export { SystemDesignInterviewEvaluator, INTERVIEW_STEPS } from './v1/ch03-framework/interview-evaluator.js';
export { TokenBucketRateLimiter } from './v1/ch04-rate-limiter/token-bucket.js';
export { LeakyBucketRateLimiter } from './v1/ch04-rate-limiter/leaky-bucket.js';
export { FixedWindowRateLimiter } from './v1/ch04-rate-limiter/fixed-window.js';
export { SlidingWindowLogRateLimiter } from './v1/ch04-rate-limiter/sliding-window-log.js';
export { SlidingWindowCounterRateLimiter } from './v1/ch04-rate-limiter/sliding-window-counter.js';
export { ConsistentHashRing } from './v1/ch05-consistent-hash/consistent-hash-ring.js';
export { VectorClock } from './v1/ch06-kv-store/vector-clock.js';
export { MerkleTree } from './v1/ch06-kv-store/merkle-tree.js';
export { BloomFilter } from './v1/ch06-kv-store/bloom-filter.js';
export { GossipNode } from './v1/ch06-kv-store/gossip-protocol.js';
export { QuorumCoordinator, QuorumReplica } from './v1/ch06-kv-store/quorum-consensus.js';
export { SnowflakeIdGenerator } from './v1/ch07-unique-id/snowflake.js';
export { Base62 } from './v1/ch08-url-shortener/base62.js';
export { ShortHashResolver } from './v1/ch08-url-shortener/short-hash-resolver.js';
export { PoliteUrlFrontier } from './v1/ch09-crawler/polite-url-frontier.js';
export { SimHash } from './v1/ch09-crawler/sim-hash.js';
export { ExponentialBackoff } from './v1/ch10-notification/exponential-backoff.js';
export { IdempotencyDeduplicator } from './v1/ch10-notification/idempotency-deduplicator.js';
export { HybridFanoutFeedSystem } from './v1/ch11-news-feed/hybrid-fanout.js';
export { TimelineMerger } from './v1/ch11-news-feed/timeline-merger.js';
export { ConversationMessageSequencer, ChatClientReceiver } from './v1/ch12-chat/message-sequencer.js';
export { PresenceManager } from './v1/ch12-chat/presence-manager.js';
export { TopKTrie } from './v1/ch13-autocomplete/topk-trie.js';
export { DAGTaskScheduler } from './v1/ch14-youtube/dag-task-scheduler.js';
export { DeltaSyncClient, ChunkServerStorage } from './v1/ch15-google-drive/delta-sync.js';

// === 第二卷 (Volume 2) ===
export { GeoHash } from './v2/ch01-proximity/geohash.js';
export { QuadTree, BoundingBox } from './v2/ch01-proximity/quad-tree.js';
export { Haversine } from './v2/ch02-nearby-friends/haversine.js';
export { NearbyFriendsTracker } from './v2/ch02-nearby-friends/grid-pubsub.js';
export { AStarPathfinder, RoadGraph } from './v2/ch03-google-maps/astar-pathfinding.js';
export { SlippyMapTile } from './v2/ch03-google-maps/slippy-map-tile.js';
export { PartitionCommitLog, LogSegment } from './v2/ch04-message-queue/commit-log.js';
export { PartitionAssignor } from './v2/ch04-message-queue/partition-assignor.js';
export { TimeSeriesDownsampler } from './v2/ch05-metrics/time-series-downsampler.js';
export { AlertRuleEvaluator } from './v2/ch05-metrics/alert-window-evaluator.js';
export { WatermarkStreamAggregator } from './v2/ch06-ad-aggregation/watermark-stream-window.js';
export { HotelInventoryManager } from './v2/ch07-hotel-reserve/inventory-reservation.js';
export { EmailInvertedIndex } from './v2/ch08-email-search/inverted-index.js';
export { ErasureCoding } from './v2/ch09-s3-storage/erasure-coding.js';
export { SkipListLeaderboard } from './v2/ch10-leaderboard/skip-list.js';
export { DoubleEntryLedger, LedgerEntry, ACCOUNT_TYPE } from './v2/ch11-payment/double-entry-ledger.js';
export { PaymentReconciliation } from './v2/ch11-payment/payment-reconciliation.js';
export { SagaOrchestrator, SagaStep } from './v2/ch12-wallet/saga-orchestrator.js';
export { TwoPhaseCommitCoordinator, TwoPhaseParticipant } from './v2/ch12-wallet/two-phase-commit.js';
export { MatchingEngine, Order } from './v2/ch13-exchange/matching-engine.js';
