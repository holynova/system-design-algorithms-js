/**
 * @file run-all-demos.js
 * @description 一键运行《系统设计面试：内幕指南》第一卷与第二卷经典算法演示
 */

import {
  LRUCache,
  LFUCache,
  CapacityCalculator,
  TokenBucketRateLimiter,
  ConsistentHashRing,
  VectorClock,
  MerkleTree,
  BloomFilter,
  SnowflakeIdGenerator,
  Base62,
  TopKTrie,
  GeoHash,
  QuadTree,
  BoundingBox,
  Haversine,
  AStarPathfinder,
  RoadGraph,
  SlippyMapTile,
  PartitionCommitLog,
  SkipListLeaderboard,
  DoubleEntryLedger,
  LedgerEntry,
  ACCOUNT_TYPE,
  MatchingEngine,
  Order,
} from '../src/index.js';

console.log('\n===============================================================');
console.log('   🚀 系统设计经典算法库 (System Design Algorithms in JS)   ');
console.log('      基于 Alex Xu《系统设计面试：内幕指南》第一卷 & 第二卷    ');
console.log('===============================================================\n');

// 1. LRU 缓存
console.log('【V1-01】LRU Cache 缓存淘汰:');
const lru = new LRUCache(2);
lru.put('A', 1);
lru.put('B', 2);
lru.get('A'); // A 变为最新
lru.put('C', 3); // B 被淘汰
console.log('  -> 写入 A, B，访问 A，写入 C。当前缓存快照:', lru.dump());

// 2. 限流器 (令牌桶)
console.log('\n【V1-04】Token Bucket 令牌桶限流器:');
const tb = new TokenBucketRateLimiter(2, 1);
console.log('  -> 尝试连续获取 3 个令牌:', [tb.tryConsume(), tb.tryConsume(), tb.tryConsume()]);

// 3. 一致性哈希
console.log('\n【V1-05】Consistent Hashing 一致性哈希环 (带虚拟节点):');
const ch = new ConsistentHashRing(['Node-A', 'Node-B', 'Node-C'], 50);
console.log('  -> Key "order_888" 映射节点:', ch.getNode('order_888'));
console.log('  -> Key "user_999"  映射节点:', ch.getNode('user_999'));

// 4. 向量时钟
console.log('\n【V1-06】Vector Clock 向量时钟因果版本检测:');
const vc1 = new VectorClock({ S1: 1 });
const vc2 = new VectorClock({ S1: 1, S2: 1 });
const vc3 = new VectorClock({ S1: 2 });
console.log('  -> vc1 对比 vc2 (因果演进):', vc1.compare(vc2));
console.log('  -> vc2 对比 vc3 (并发冲突):', vc2.compare(vc3));

// 5. 雪花算法
console.log('\n【V1-07】Twitter Snowflake 分布式唯一 ID:');
const sf = new SnowflakeIdGenerator(1, 1);
const id = sf.nextId();
console.log('  -> 生成 64 位整型 ID:', id.toString());
console.log('  -> 反向解析各字段:', sf.parse(id));

// 6. 短网址 Base62
console.log('\n【V1-08】Base62 短网址双向编解码:');
const originalId = 200921430n;
const shortCode = Base62.encode(originalId);
console.log(`  -> ID: ${originalId} => 短码: "${shortCode}" => 还原: ${Base62.decode(shortCode)}`);

// 7. 前缀树 Top-K 补全
console.log('\n【V1-13】Prefix Trie 带 Top-K 预计算搜索补全:');
const trie = new TopKTrie(3);
trie.insert('system', 100);
trie.insert('sysadmin', 50);
trie.insert('syntax', 80);
console.log('  -> 输入前缀 "sy" 补全建议:', trie.autocomplete('sy'));

// 8. 空间索引 GeoHash
console.log('\n【V2-01】GeoHash 经纬度网格编码:');
const gh = GeoHash.encode(39.9163, 116.3971, 6);
console.log('  -> 故宫经纬度编码 (6位):', gh);
console.log('  -> 8 邻域九宫格防漏检编码数:', GeoHash.getNeighbors(gh).length);

// 9. 谷歌地图 A* 寻路
console.log('\n【V2-03】Google Maps A* 启发式路网寻路:');
const road = new RoadGraph();
road.addNode('Home', 0, 0);
road.addNode('Highway', 5, 2);
road.addNode('Office', 10, 0);
road.addDirectedEdge('Home', 'Highway', 15);
road.addDirectedEdge('Highway', 'Office', 15);
const nav = AStarPathfinder.findPath(road, 'Home', 'Office');
console.log('  -> 最短导航路径:', nav.path.join(' -> '), `(预估总代价: ${nav.totalWeight})`);

// 10. 实时排行榜 (跳表)
console.log('\n【V2-10】Real-time Gaming Leaderboard (Skip List):');
const lb = new SkipListLeaderboard();
lb.add('Player_Neo', 990);
lb.add('Player_Morpheus', 950);
lb.add('Player_Trinity', 980);
console.log('  -> 榜单前 3 名:', lb.getTopK(3));
console.log('  -> Trinity 精确名次: 第', lb.getRank('Player_Trinity'), '名');

// 11. 金融复式记账
console.log('\n【V2-11】Double-Entry Bookkeeping 复式记账法:');
const ledger = new DoubleEntryLedger();
ledger.createAccount('RESERVE_CASH', ACCOUNT_TYPE.ASSET);
ledger.createAccount('USER_WALLET', ACCOUNT_TYPE.LIABILITY);
ledger.recordTransaction('tx_001', [
  new LedgerEntry('RESERVE_CASH', 'DEBIT', 10000n),
  new LedgerEntry('USER_WALLET', 'CREDIT', 10000n),
], '用户充值');
console.log('  -> 会计等式恒等校验 (Assets = Liabilities + Equity):', ledger.verifySystemBalance() ? '✅ 平衡' : '❌ 失衡');

// 12. 股票交易所撮合引擎
console.log('\n【V2-13】Stock Exchange Limit Order Book 限价撮合引擎:');
const engine = new MatchingEngine('TSLA');
engine.submitOrder(new Order('Ask1', 'SELL', 200, 10));
const fill = engine.submitOrder(new Order('Bid1', 'BUY', 200, 4));
console.log('  -> 买单 4 手撮合成交:', fill);
console.log('  -> 撮合后盘口卖单剩余:', engine.getOrderBookSnapshot().asks);

console.log('\n===============================================================');
console.log('✨ 演示完毕！运行 `npm test` 可执行全量 49 项算法单元测试。');
console.log('===============================================================\n');
