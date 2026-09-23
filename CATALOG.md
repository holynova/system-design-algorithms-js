# 系统设计经典算法与数据结构 (System Design Algorithms in JavaScript)

> 基于 Alex Xu 经典著作《System Design Interview: An Insider's Guide》（系统设计面试：内幕指南）第一卷与第二卷的全部 28 个章节，用现代 JavaScript (Node.js ES Modules) 完整实现书中的核心算法与数据结构。

本项目专为**学习与技术面试准备**打造，坚持**可读性第一、零外部依赖、自包含可运行、教学注释详尽**的设计原则。

---

## 目录与算法全景索引 (Algorithm Catalog)

### 第一卷（Volume 1: 系统设计核心组件与经典服务）

| 章节 | 章节主题 | 核心经典算法与数据结构 | 源码文件 | 时间复杂度 |
| :--- | :--- | :--- | :--- | :--- |
| **第01章** | 从零到百万用户 | **LRU / LFU 缓存淘汰算法**<br>• 双向链表 + Map 实现 O(1) LRU<br>• 多频次链表桶实现 O(1) LFU | [`lru-cache.js`](src/v1/ch01-cache/lru-cache.js)<br>[`lfu-cache.js`](src/v1/ch01-cache/lfu-cache.js) | Get: $O(1)$<br>Put: $O(1)$ |
| **第02章** | 粗略估算 | **容量估算计算器**<br>• QPS、峰值、存储、带宽、Pareto 80/20 缓存内存<br>• Jeff Dean 经典延迟数据表与 2 的幂换算 | [`capacity-calculator.js`](src/v1/ch02-estimation/capacity-calculator.js) | $O(1)$ |
| **第03章** | 面试框架 | **系统设计 4 步法评估器与自查清单**<br>• 需求范围、概要设计、深入细节、总结延伸 | [`interview-evaluator.js`](src/v1/ch03-framework/interview-evaluator.js) | $O(1)$ |
| **第04章** | 设计限流器 | **五大经典限流算法全实现**：<br>1. 令牌桶 (Token Bucket)<br>2. 漏桶 (Leaky Bucket)<br>3. 固定窗口计数 (Fixed Window)<br>4. 滑动窗口日志 (Sliding Window Log)<br>5. 滑动窗口计数器 (Sliding Window Counter) | [`token-bucket.js`](src/v1/ch04-rate-limiter/token-bucket.js)<br>[`leaky-bucket.js`](src/v1/ch04-rate-limiter/leaky-bucket.js)<br>[`fixed-window.js`](src/v1/ch04-rate-limiter/fixed-window.js)<br>[`sliding-window-log.js`](src/v1/ch04-rate-limiter/sliding-window-log.js)<br>[`sliding-window-counter.js`](src/v1/ch04-rate-limiter/sliding-window-counter.js) | 常数级 $O(1)$<br>(日志为 $O(M)$) |
| **第05章** | 一致性哈希 | **一致性哈希环 (Consistent Hashing Ring)**<br>• 虚拟节点 (Virtual Nodes) 均衡负载<br>• 二分查找顺时针后继节点<br>• 节点扩缩容最小化数据迁移分析 | [`consistent-hash-ring.js`](src/v1/ch05-consistent-hash/consistent-hash-ring.js) | Lookup: $O(\log(M \cdot V))$ |
| **第06章** | Key-Value 存储 | **分布式 KV 存储四大支柱算法**：<br>1. 向量时钟 (Vector Clock 因果版本检测与分支合并)<br>2. 默克尔树 (Merkle Tree 反熵差异快速定位)<br>3. 布隆过滤器 (Bloom Filter 双哈希低开销判存)<br>4. 流言协议 (Gossip Protocol 节点心跳与故障检测)<br>5. 法定人数共识 (Quorum Consensus $W + R > N$) | [`vector-clock.js`](src/v1/ch06-kv-store/vector-clock.js)<br>[`merkle-tree.js`](src/v1/ch06-kv-store/merkle-tree.js)<br>[`bloom-filter.js`](src/v1/ch06-kv-store/bloom-filter.js)<br>[`gossip-protocol.js`](src/v1/ch06-kv-store/gossip-protocol.js)<br>[`quorum-consensus.js`](src/v1/ch06-kv-store/quorum-consensus.js) | 树比对: $O(\log N)$<br>布隆: $O(K)$ |
| **第07章** | 分布式唯一 ID | **Twitter Snowflake 雪花算法**<br>• 64 位 BigInt 比特布局 (时间戳41位 + 机房5位 + 机器5位 + 序列号12位)<br>• 时钟回拨防御与反向解码解析器 | [`snowflake.js`](src/v1/ch07-unique-id/snowflake.js) | $O(1)$ |
| **第08章** | 短网址系统 | **短码生成与哈希碰撞算法**：<br>1. Base62 双向双射编解码 (自增 ID 转 62 进制)<br>2. 截断哈希加盐探测 (Hash Truncation with Probing) | [`base62.js`](src/v1/ch08-url-shortener/base62.js)<br>[`short-hash-resolver.js`](src/v1/ch08-url-shortener/short-hash-resolver.js) | $O(\log_{62} N) \approx O(1)$ |
| **第09章** | 网络爬虫 | **爬虫调度与查重算法**：<br>1. 礼貌性与优先级 URL Frontier (双层队列 + 域名限速)<br>2. SimHash 局部敏感哈希 (64 位指纹与海明距离判定) | [`polite-url-frontier.js`](src/v1/ch09-crawler/polite-url-frontier.js)<br>[`sim-hash.js`](src/v1/ch09-crawler/sim-hash.js) | SimHash: $O(L)$<br>Frontier: $O(1)$ |
| **第10章** | 通知系统 | **高可靠投递与防重**：<br>1. 带抖动的指数退避重试 (Full Jitter / Equal Jitter)<br>2. 幂等性去重器 (Idempotency Key 滑动窗口防重入) | [`exponential-backoff.js`](src/v1/ch10-notification/exponential-backoff.js)<br>[`idempotency-deduplicator.js`](src/v1/ch10-notification/idempotency-deduplicator.js) | $O(1)$ |
| **第11章** | 新闻提要系统 | **信息流分发与归并**：<br>1. 推拉结合混合扇出模型 (Hybrid Fan-out)<br>2. 多路时间线归并排序 (K-Way Merge with Heap) | [`hybrid-fanout.js`](src/v1/ch11-news-feed/hybrid-fanout.js)<br>[`timeline-merger.js`](src/v1/ch11-news-feed/timeline-merger.js) | 归并: $O(N \log K)$ |
| **第12章** | 聊天系统 | **消息定序与在线感知**：<br>1. 会话级单调有序序列号分配器与空洞检测 (Gap Detection)<br>2. 心跳与在线状态管理器 (Heartbeat Presence Manager) | [`message-sequencer.js`](src/v1/ch12-chat/message-sequencer.js)<br>[`presence-manager.js`](src/v1/ch12-chat/presence-manager.js) | $O(1)$ |
| **第13章** | 搜索自动补全 | **带 Top-K 预计算的前缀树 (Prefix Trie with Top-K)**<br>• 沿途节点缓存高频词，输入前缀 $O(p)$ 瞬间响应 | [`topk-trie.js`](src/v1/ch13-autocomplete/topk-trie.js) | 查询: $O(p)$<br>插入: $O(p \cdot K \log K)$ |
| **第14章** | 设计 YouTube | **DAG 视频处理任务调度器**<br>• 拓扑排序 (Topological Sorting) 与入度计算<br>• 环检测与并行流水线执行 | [`dag-task-scheduler.js`](src/v1/ch14-youtube/dag-task-scheduler.js) | $O(V + E)$ |
| **第15章** | 设计 Google Drive | **块级差量同步与去重算法 (Delta Sync & Deduplication)**<br>• 文件切块、内容寻址哈希与修改块差量上传 | [`delta-sync.js`](src/v1/ch15-google-drive/delta-sync.js) | $O(\text{Chunks})$ |

---

### 第二卷（Volume 2: 高并发大规模实战系统）

| 章节 | 章节主题 | 核心经典算法与数据结构 | 源码文件 | 时间复杂度 |
| :--- | :--- | :--- | :--- | :--- |
| **第01章** | 邻近服务 | **地理空间索引算法**：<br>1. GeoHash (经纬度转 Base32 编码及 8 邻域相邻九宫格搜索)<br>2. 空间四叉树 (QuadTree 自适应象限分裂与范围检索) | [`geohash.js`](src/v2/ch01-proximity/geohash.js)<br>[`quad-tree.js`](src/v2/ch01-proximity/quad-tree.js) | GeoHash: $O(1)$<br>QuadTree: $O(\log N)$ |
| **第02章** | 附近的好友 | **地理位置动态订阅与距离计算**：<br>1. Haversine 球面大圆距离公式 (地球表面物理距离计算)<br>2. 空间网格发布订阅追踪器 (Grid Pub/Sub 移动通知) | [`haversine.js`](src/v2/ch02-nearby-friends/haversine.js)<br>[`grid-pubsub.js`](src/v2/ch02-nearby-friends/grid-pubsub.js) | $O(1)$ |
| **第03章** | 谷歌地图 | **路径规划与地图瓦片算法**：<br>1. A* 启发式路网寻路算法 (欧几里得启发函数与优先队列)<br>2. Web 墨卡托投影瓦片金字塔坐标换算 (经纬度转瓦片) | [`astar-pathfinding.js`](src/v2/ch03-google-maps/astar-pathfinding.js)<br>[`slippy-map-tile.js`](src/v2/ch03-google-maps/slippy-map-tile.js) | A*: $O(E + V \log V)$<br>瓦片: $O(1)$ |
| **第04章** | 分布式消息队列 | **存储与消费分配算法**：<br>1. 追加日志与稀疏索引二分查找 (Segmented Commit Log & Sparse Index)<br>2. 消费组再均衡分配策略 (Range & Round-Robin Assignor) | [`commit-log.js`](src/v2/ch04-message-queue/commit-log.js)<br>[`partition-assignor.js`](src/v2/ch04-message-queue/partition-assignor.js) | 读取: $O(\log S + I)$<br>分配: $O(P + C)$ |
| **第05章** | 指标监控与告警 | **时序数据流算法**：<br>1. 时序数据时桶降采样 (Bucket Downsampling & Aggregation)<br>2. 滑动窗口告警规则评估器 (连续 N 次阈值超标状态机) | [`time-series-downsampler.js`](src/v2/ch05-metrics/time-series-downsampler.js)<br>[`alert-window-evaluator.js`](src/v2/ch05-metrics/alert-window-evaluator.js) | 降采样: $O(N)$<br>评估: $O(1)$ |
| **第06章** | 广告点击事件聚合 | **流处理窗口与水位线**：<br>1. 基于事件时间的水位线推进 (Watermark)<br>2. 翻滚窗口聚合与迟到孤儿事件旁路输出 (Side Output) | [`watermark-stream-window.js`](src/v2/ch06-ad-aggregation/watermark-stream-window.js) | $O(1)$ 每事件 |
| **第07章** | 酒店预订系统 | **跨日期库存防超卖算法**：<br>1. 跨多晚预订原子锁定与版本号乐观锁 (Optimistic Lock)<br>2. 租期锁定与超时自动释放机制 (Hold with TTL) | [`inventory-reservation.js`](src/v2/ch07-hotel-reserve/inventory-reservation.js) | $O(\text{Dates})$ |
| **第08章** | 分布式邮件服务 | **邮件全文检索算法**：<br>1. 倒排索引构建器 (Inverted Index)<br>2. 布尔检索与倒排列表求交并集 (AND, OR, NOT) | [`inverted-index.js`](src/v2/ch08-email-search/inverted-index.js) | 检索: $O(L_1 + L_2)$ |
| **第09章** | 类 S3 对象存储 | **纠删码容灾算法 (Erasure Coding)**：<br>1. $N$ 数据块 + $M$ 校验块编码生成<br>2. 任意坏 $M$ 块无损数学重建与数据恢复 | [`erasure-coding.js`](src/v2/ch09-s3-storage/erasure-coding.js) | 编解码: $O(N \cdot M)$ |
| **第10章** | 实时游戏排行榜 | **跳表完整实现 (Skip List - Redis ZSET 核心底层)**：<br>1. 多层随机前向指针与跨度 (Span)<br>2. $O(\log N)$ 插入、删除与精确名次 Rank 计算<br>3. 范围获取 Top-K 玩家列表 | [`skip-list.js`](src/v2/ch10-leaderboard/skip-list.js) | Insert: $O(\log N)$<br>Rank: $O(\log N)$<br>Top-K: $O(K)$ |
| **第11章** | 支付系统 | **金融支付正确性保障**：<br>1. 复式记账法账本 (借贷平衡与不可变审计流水)<br>2. 双向对账算法 (内部账本与外部渠道清算单差异分类) | [`double-entry-ledger.js`](src/v2/ch11-payment/double-entry-ledger.js)<br>[`payment-reconciliation.js`](src/v2/ch11-payment/payment-reconciliation.js) | 记账: $O(1)$<br>对账: $O(N + M)$ |
| **第12章** | 数字钱包 | **分布式事务模式**：<br>1. Saga 编排器与逆向补偿回滚 (Saga Pattern Orchestrator)<br>2. 两阶段提交状态机仿真 (Two-Phase Commit - 2PC) | [`saga-orchestrator.js`](src/v2/ch12-wallet/saga-orchestrator.js)<br>[`two-phase-commit.js`](src/v2/ch12-wallet/two-phase-commit.js) | $O(\text{Steps})$ |
| **第13章** | 股票交易所 | **撮合引擎与限价订单簿 (Limit Order Book)**：<br>1. 价格优先、时间优先 (Price-Time Priority FIFO)<br>2. 买卖双向撮合成交 (支持部分成交与挂单撤单) | [`matching-engine.js`](src/v2/ch13-exchange/matching-engine.js) | 撮合: $O(\text{Matches})$ |

---

## 快速上手与运行 (Quick Start)

本项目采用 **Node.js 原生 ES Modules**，无需安装任何第三方 npm 依赖！

### 1. 运行全量单元测试 (58 项覆盖测试, 30 个套件)
```bash
npm test
```

### 2. 启动算法可视化与交互式 Web 网页
本项目配备了精美的离线/本地 Web 门户，包含所有 28 章的**核心原理图解、矢量 SVG 架构图、Mermaid 状态时序图、算法在线互动实验室与完整源码阅读器**：
```bash
npm run web
# 浏览器打开: http://localhost:3000
```
- **SVG 架构图**：LRU 链表指针、一致性哈希环虚拟节点、Snowflake 64 位比特布局、Skip List 跨度指针、订单簿盘口深度梯级等；
- **Mermaid 交互图**：推拉扩散模型、Quorum 判定、Saga 补偿时序、水位线推进等；
- **在线互动实验室 (Playground)**：在页面上实时体验令牌桶限流打满、雪花算法发号与反向二进制解析、Base62 短链编解码、Geohash 九宫格测距、订单簿限价单撮合等！

### 3. 运行所有算法的终端高亮演示展示
```bash
npm run demo
```

### 4. 单独运行某一个算法的自测 Demo
每个算法文件均自包含可执行的演示脚本，直接用 node 运行即可：
```bash
# 查看跳表排行榜演示
node src/v2/ch10-leaderboard/skip-list.js

# 查看股票撮合引擎演示
node src/v2/ch13-exchange/matching-engine.js

# 查看一致性哈希演示
node src/v1/ch05-consistent-hash/consistent-hash-ring.js

# 查看令牌桶限流器演示
node src/v1/ch04-rate-limiter/token-bucket.js
```

---

## 代码设计规范与特色

1. **教学注释详尽**：每个文件包含系统设计原书中**为什么需要此算法**的背景阐述、数学模型、ASCII 图示和复杂度分析。
2. **纯粹原生实现**：不借助庞大的外部库，帮助读者看清底层每一步指针移动、位运算或状态流转的真实机理。
3. **确定性与边界处理**：对时钟回拨、浮点数精度、哈希环回绕、同分平局打破等业界高频踩坑点均做了防御性编码。
