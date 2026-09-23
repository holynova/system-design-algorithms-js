/**
 * System Design Interview Algorithms & Architecture Dataset
 * Contains 28 Chapters across Volume 1 & Volume 2 with deep theoretical explanations,
 * Mermaid flowcharts, SVG references, and source code implementations.
 */

export const CHAPTERS_DATA = [
  // ==========================================
  // VOLUME 1
  // ==========================================
  {
    id: "v1-ch01",
    vol: 1,
    chapter: 1,
    title: "Scale From Zero To Millions of Users / Cache",
    titleZh: "从零扩展到几百万用户：LRU 与 LFU 缓存策略",
    subtitle: "O(1) 双向链表 + 哈希表 & 频次桶",
    complexity: "Time: O(1) Get/Put | Space: O(Capacity)",
    tags: ["Cache", "Linked List", "O(1) Access", "Eviction"],
    svgKey: "lruCache",
    context: `在单体架构向高并发架构演进的过程中，数据库永远是最早遇到性能瓶颈的瓶颈点。
为了减轻磁盘 I/O 压力并降低读取延迟（从磁盘的数毫秒降低到内存的数十纳秒），必须在计算层与存储层之间引入缓存层（Cache Tier）。
当内存容量有限时，如何淘汰最不可能再次使用的数据成为缓存设计的核心命题。`,
    principles: `
<h4>1. LRU (Least Recently Used - 最近最少使用)</h4>
<ul>
  <li><b>核心思想：</b> 如果数据最近被访问过，那么将来被访问的概率也很高。当容量达到上限时，优先淘汰最久未被访问的节点。</li>
  <li><b>O(1) 架构设计：</b> 单独使用哈希表可以实现 O(1) 查找，但无法维护访问时间顺序；单独使用数组或单向链表维护顺序，移动节点耗时 O(n)。因此采用 <b>哈希表 + 双向链表 (Doubly Linked List)</b>：
    <ul>
      <li>哈希表 <code>map.get(key)</code> 直接获取双向链表中的节点指针，达到 O(1) 寻址；</li>
      <li>双向链表节点包含 <code>prev</code> 与 <code>next</code>，可以在 O(1) 时间内从链表中剥离并插入到表头（Most Recently Used）；</li>
      <li>表尾（Least Recently Used）节点即为淘汰候选，淘汰时 O(1) 移除并从哈希表中删除 key。</li>
      <li>使用伪头（Head Sentinel）和伪尾（Tail Sentinel）消除各种边界空指针判断。</li>
    </ul>
  </li>
</ul>

<h4>2. LFU (Least Frequently Used - 最不经常使用)</h4>
<ul>
  <li><b>核心思想：</b> 记录每个 Key 的访问频次，淘汰访问次数最少的数据；若频次相同，则淘汰其中最早访问的（LFU + LRU 结合）。</li>
  <li><b>O(1) 架构设计：</b> 使用 <code>minFreq</code> 游标 + <code>freqMap (频次 -> 双向链表)</code> + <code>keyNodeMap</code>。每次访问节点，频次 +1，将节点从原频次链表移到新频次链表；若原频次链表为空且等于 <code>minFreq</code>，则递增 <code>minFreq</code>。</li>
</ul>
`,
    mermaid: `graph LR
    subgraph HashMap ["Hash Map O(1) 快速定位"]
      K1["Key A"] --> NA["Node A"]
      K2["Key B"] --> NB["Node B"]
      K3["Key C"] --> NC["Node C"]
    end

    subgraph DoublyLinkedList ["双向链表 维护热度顺序"]
      Head["Head (Sentinel)"] <--> NA
      NA <--> NB
      NB <--> NC
      NC <--> Tail["Tail (Sentinel)"]
    end

    classDef headStyle fill:#047857,stroke:#10b981,color:#fff
    classDef tailStyle fill:#b91c1c,stroke:#ef4444,color:#fff
    classDef nodeStyle fill:#1e293b,stroke:#3b82f6,color:#fff
    class Head headStyle
    class Tail tailStyle
    class NA,NB,NC nodeStyle`,
    files: [
      {
        name: "lru-cache.js",
        path: "src/v1/ch01-cache/lru-cache.js",
        code: `class DListNode {
  constructor(key = null, value = null) {
    this.key = key;
    this.value = value;
    this.prev = null;
    this.next = null;
  }
}

export class LRUCache {
  constructor(capacity) {
    if (capacity <= 0) throw new Error("Capacity must be positive");
    this.capacity = capacity;
    this.map = new Map();
    this.head = new DListNode();
    this.tail = new DListNode();
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  get(key) {
    const node = this.map.get(key);
    if (!node) return undefined;
    this._moveToHead(node);
    return node.value;
  }

  put(key, value) {
    let node = this.map.get(key);
    if (node) {
      node.value = value;
      this._moveToHead(node);
      return;
    }
    if (this.map.size >= this.capacity) {
      const lru = this.tail.prev;
      this._removeNode(lru);
      this.map.delete(lru.key);
    }
    const newNode = new DListNode(key, value);
    this.map.set(key, newNode);
    this._addToHead(newNode);
  }

  _removeNode(node) {
    node.prev.next = node.next;
    node.next.prev = node.prev;
  }

  _addToHead(node) {
    node.next = this.head.next;
    node.prev = this.head;
    this.head.next.prev = node;
    this.head.next = node;
  }

  _moveToHead(node) {
    this._removeNode(node);
    this._addToHead(node);
  }
}`
      }
    ]
  },

  {
    id: "v1-ch02",
    vol: 1,
    chapter: 2,
    title: "Back-of-the-envelope Estimation",
    titleZh: "封底估算与容量规划",
    subtitle: "QPS、峰值冗余、帕累托 80/20 内存规划与网络延迟表",
    complexity: "Mathematical Model | O(1) Calculator",
    tags: ["Estimation", "QPS", "Storage", "Bandwidth", "Pareto 80/20"],
    svgKey: null,
    context: `在系统设计面试的开头，面试官通常给出如“设计推特”或“设计 YouTube”等宏观题目。
封底估算（Back-of-the-envelope calculation）的目的是根据 DAU、读写比例、多媒体大小等基础参数，量化系统需要承载的 QPS、峰值 QPS、日增存储空间、5年存储以及根据 80/20 原则需要的缓存内存容量。`,
    principles: `
<h4>核心计算法则</h4>
<ul>
  <li><b>时间换算常数：</b> 1 天 = 86,400 秒 ≈ 100,000 秒（用于心算时快速估计数量级）。</li>
  <li><b>QPS 计算：</b> <code>QPS = (DAU × 每人每日请求数) / 86,400</code>；<b>峰值 QPS：</b> 通常假设为平均 QPS 的 2 ~ 3 倍。</li>
  <li><b>存储容量：</b> <code>日增存储 = DAU × 每日写入操作数 × 平均对象大小</code>；5 年存储需乘以 365 × 5 并考虑 3 副本容灾（× 3）。</li>
  <li><b>帕累托 80/20 缓存定律：</b> 20% 的热门数据贡献了 80% 的请求流量。为了保持高命中率，内存缓存池应能容纳这 20% 的热门每日数据：<code>Cache RAM = 每日请求读取总数据量 × 20%</code>。</li>
  <li><b>典型延迟数量级速记：</b>
    <ul>
      <li>L1/L2 Cache: ~0.5 - 7 ns</li>
      <li>RAM 内存读取: ~100 ns</li>
      <li>SSD 固态读取: ~100 μs (比内存慢 1,000 倍)</li>
      <li>同机房内网往返 (Round Trip): ~500 μs</li>
      <li>跨国网络往返 (如加州到荷兰): ~150 ms (比内存慢 1,500,000 倍)</li>
    </ul>
  </li>
</ul>
`,
    mermaid: `graph TD
    DAU["日活用户数 DAU<br/>(例如 300 Million)"] --> Actions["每日人均请求数<br/>(例如 5 次 Tweet, 50 次 读Feed)"]
    Actions --> QPS["计算平均 QPS<br/>QPS = Total / 86400"]
    QPS --> Peak["峰值 QPS 冗余 (2x ~ 3x)<br/>评估需要多少台无状态 Web 实例"]
    Actions --> WriteVol["每日写入总量<br/>评估磁盘增量与 Sharding 分片数"]
    WriteVol --> Retention["5年存储预估 × 3副本容灾"]
    Actions --> ReadVol["每日读取总量"]
    ReadVol --> Pareto["80/20 帕累托定律<br/>20% 热门数据入缓存 RAM"]`,
    files: [
      {
        name: "capacity-calculator.js",
        path: "src/v1/ch02-estimation/capacity-calculator.js",
        code: `export class CapacityCalculator {
  static SECONDS_PER_DAY = 86400;

  static calculateQps({ dailyActiveUsers, requestsPerUserPerDay, peakFactor = 2 }) {
    const totalDailyRequests = dailyActiveUsers * requestsPerUserPerDay;
    const avgQps = Math.ceil(totalDailyRequests / this.SECONDS_PER_DAY);
    const peakQps = Math.ceil(avgQps * peakFactor);
    return { totalDailyRequests, avgQps, peakQps };
  }

  static calculateStorage({ dailyWrites, avgRecordSizeBytes, retentionYears = 5, replicationFactor = 3 }) {
    const dailyStorageBytes = dailyWrites * avgRecordSizeBytes;
    const yearlyStorageBytes = dailyStorageBytes * 365;
    const totalRetentionBytes = yearlyStorageBytes * retentionYears;
    const totalWithReplication = totalRetentionBytes * replicationFactor;
    return { dailyStorageBytes, totalRetentionBytes, totalWithReplication };
  }

  static calculateCacheMemory({ dailyReads, avgReadSizeBytes, cacheRatio = 0.2 }) {
    const totalDailyReadBytes = dailyReads * avgReadSizeBytes;
    const requiredMemoryBytes = Math.ceil(totalDailyReadBytes * cacheRatio);
    return { totalDailyReadBytes, requiredMemoryBytes };
  }
}`
      }
    ]
  },

  {
    id: "v1-ch03",
    vol: 1,
    chapter: 3,
    title: "A Framework For System Design Interviews",
    titleZh: "系统设计面试的 4 步通用框架与评估准则",
    subtitle: "从需求澄清到深入优化的可落地方案与状态机",
    complexity: "Process Engineering | Rubric Evaluator",
    tags: ["Framework", "Interview Process", "Evaluation"],
    svgKey: null,
    context: `系统设计面试不是简单的“背八股文”，而是在不确定性和模糊需求中，展现工程权衡、架构沟通、迭代演进和排障能力的完整协作过程。
缺乏系统性框架的候选人往往会在未明确需求时急于画微服务图，或者陷入局部细节无法自拔。`,
    principles: `
<h4>系统设计 4 步黄金法则</h4>
<ol>
  <li><b>步骤 1：明确需求与确定设计范围 (3-5 分钟)</b>
    <ul>
      <li>功能性需求 (Functional Requirements)：用户到底能做什么？核心用例有哪些？</li>
      <li>非功能性需求 (Non-functional Requirements)：高可用 (99.99%)？强一致性还是最终一致性？延迟敏感度 (<100ms)？系统吞吐规模？</li>
    </ul>
  </li>
  <li><b>步骤 2：提出宏观高层设计并达成共识 (10-15 分钟)</b>
    <ul>
      <li>API 契约草案：RESTful / gRPC 接口入参与出参。</li>
      <li>高层架构图：DNS -> CDN -> 负载均衡 -> API Gateway -> 无状态服务 -> 数据库/缓存。</li>
    </ul>
  </li>
  <li><b>步骤 3：设计深度下潜 (15-20 分钟)</b>
    <ul>
      <li>选择 1-2 个最具挑战性的瓶颈或核心算法（如一致性哈希、消息去重、实时推送）。</li>
      <li>深入数据模型设计与数据库分片方案。</li>
    </ul>
  </li>
  <li><b>步骤 4：总结与延伸权衡 (3-5 分钟)</b>
    <ul>
      <li>指出系统的单点故障 (SPOF)、监控度量 (Metrics)、日志链路追踪及灾备扩展方案。</li>
    </ul>
  </li>
</ol>
`,
    mermaid: `flowchart TD
    S1["步骤 1: 需求澄清 (Understand the Problem)<br/>• 功能性 / 非功能性需求<br/>• 规模与吞吐量估算"] --> S2["步骤 2: 高层设计 (High-level Design)<br/>• API 契约定义<br/>• 核心架构框图与数据流"]
    S2 --> S3["步骤 3: 深度下潜 (Design Deep Dive)<br/>• 核心算法 (例如 Snowflake / 缓存一致性)<br/>• 数据库分片 & 读写拆分"]
    S3 --> S4["步骤 4: 总结与排障 (Wrap Up)<br/>• 瓶颈分析 & 单点故障 (SPOF)<br/>• 监控告警 & 灾备扩展"]`,
    files: [
      {
        name: "interview-evaluator.js",
        path: "src/v1/ch03-framework/interview-evaluator.js",
        code: `export class InterviewEvaluationEngine {
  constructor() {
    this.checklist = {
      step1Clarification: false,
      step2HighLevel: false,
      step3DeepDive: false,
      step4WrapUp: false
    };
  }

  completeStep(stepName) {
    if (this.checklist[stepName] !== undefined) {
      this.checklist[stepName] = true;
    }
  }

  evaluateReadiness() {
    const completed = Object.values(this.checklist).filter(Boolean).length;
    const score = (completed / 4) * 100;
    return {
      score,
      isPass: score >= 75,
      recommendation: score >= 75 ? "Strong Hire" : "Needs Practice on Framework"
    };
  }
}`
      }
    ]
  },

  {
    id: "v1-ch04",
    vol: 1,
    chapter: 4,
    title: "Design A Rate Limiter",
    titleZh: "设计限流器：五大经典限流算法全面对比",
    subtitle: "令牌桶、漏桶、固定窗口、滑动窗口日志与滑动窗口计数器",
    complexity: "Time: O(1) 或 O(Window) | Space: O(Keys)",
    tags: ["Rate Limiter", "Token Bucket", "Sliding Window", "Distributed Protection"],
    svgKey: "tokenBucket",
    context: `在分布式微服务架构中，限流器（Rate Limiter）是保护后端服务免遭 DoS 攻击、爬虫恶意刷量、突发洪峰流量冲垮的基石防御组件。
HTTP 状态码 <code>429 Too Many Requests</code> 是其标准响应。本章实现了业界所有 5 种最主流的限流算法。`,
    principles: `
<h4>五大限流算法核心机制与选型对比</h4>
<table style="width:100%; border-collapse:collapse; font-size:12px;">
  <thead>
    <tr style="background:var(--bg-tertiary);">
      <th style="padding:6px; border:1px solid var(--border-color);">算法</th>
      <th style="padding:6px; border:1px solid var(--border-color);">工作原理</th>
      <th style="padding:6px; border:1px solid var(--border-color);">优点</th>
      <th style="padding:6px; border:1px solid var(--border-color);">缺点</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="padding:6px; border:1px solid var(--border-color);"><b>令牌桶 (Token Bucket)</b></td>
      <td style="padding:6px; border:1px solid var(--border-color);">以固定速率 <code>r</code> 往容量为 <code>b</code> 的桶中发放令牌；请求到达时消耗 1 个令牌，无令牌则拒绝。</td>
      <td style="padding:6px; border:1px solid var(--border-color);">允许一定程度的突发流量（Burst），内存占用极小 O(1)。</td>
      <td style="padding:6px; border:1px solid var(--border-color);">需要调优容量与速率两个参数。</td>
    </tr>
    <tr>
      <td style="padding:6px; border:1px solid var(--border-color);"><b>漏桶 (Leaky Bucket)</b></td>
      <td style="padding:6px; border:1px solid var(--border-color);">请求先进入 FIFO 队列，以绝对恒定的流速 <code>outflowRate</code> 流出被处理。</td>
      <td style="padding:6px; border:1px solid var(--border-color);">输出绝对平滑，极适合调用下游脆弱三方 API。</td>
      <td style="padding:6px; border:1px solid var(--border-color);">突发流量会在队列中堆积造成较大延迟。</td>
    </tr>
    <tr>
      <td style="padding:6px; border:1px solid var(--border-color);"><b>固定窗口 (Fixed Window)</b></td>
      <td style="padding:6px; border:1px solid var(--border-color);">时间划分为整秒/整分窗口，每个窗口维护一个计数器。</td>
      <td style="padding:6px; border:1px solid var(--border-color);">实现极其简单，Redis INCR + EXPIRE。</td>
      <td style="padding:6px; border:1px solid var(--border-color);"><b>窗口临界点突变缺陷：</b> 临界前后半秒可能瞬时涌入 2 倍限流配额。</td>
    </tr>
    <tr>
      <td style="padding:6px; border:1px solid var(--border-color);"><b>滑动窗口日志 (Sliding Log)</b></td>
      <td style="padding:6px; border:1px solid var(--border-color);">记录每个请求的精确时间戳，清理 <code>[now - window, now]</code> 之外的日志，计算剩余数量。</td>
      <td style="padding:6px; border:1px solid var(--border-color);">100% 精确，绝对不存在临界突增。</td>
      <td style="padding:6px; border:1px solid var(--border-color);">内存消耗极大（需保存所有请求时间戳）。</td>
    </tr>
    <tr>
      <td style="padding:6px; border:1px solid var(--border-color);"><b>滑动窗口计数器 (Sliding Counter)</b></td>
      <td style="padding:6px; border:1px solid var(--border-color);">前一个窗口计数器 × 权重百分比 + 当前窗口计数器。</td>
      <td style="padding:6px; border:1px solid var(--border-color);">兼具精确性与极低内存开销（Cloudflare 官方推荐）。</td>
      <td style="padding:6px; border:1px solid var(--border-color);">假定前一窗口请求均匀分布（在绝大多数场景误差 <0.05%）。</td>
    </tr>
  </tbody>
</table>
`,
    mermaid: `graph TD
    Req["客户端请求到达"] --> Dec{"限流算法检查"}
    Dec -- "令牌充足 / 未超额" --> Allow["放行请求 (HTTP 200 OK)<br/>扣减令牌 / 增加计数"]
    Dec -- "无令牌 / 已超限" --> Deny["拒绝请求 (HTTP 429 Too Many Requests)<br/>返回 Retry-After 标头"]`,
    files: [
      {
        name: "token-bucket.js",
        path: "src/v1/ch04-rate-limiter/token-bucket.js",
        code: `export class TokenBucketRateLimiter {
  constructor({ capacity, refillRatePerSecond }) {
    this.capacity = capacity;
    this.refillRate = refillRatePerSecond;
    this.tokens = capacity;
    this.lastRefillTime = Date.now();
  }

  allowRequest(tokensRequired = 1, now = Date.now()) {
    this._refill(now);
    if (this.tokens >= tokensRequired) {
      this.tokens -= tokensRequired;
      return true;
    }
    return false;
  }

  _refill(now) {
    const elapsedSeconds = Math.max(0, (now - this.lastRefillTime) / 1000);
    const addedTokens = elapsedSeconds * this.refillRate;
    this.tokens = Math.min(this.capacity, this.tokens + addedTokens);
    this.lastRefillTime = now;
  }
}`
      },
      {
        name: "sliding-window-counter.js",
        path: "src/v1/ch04-rate-limiter/sliding-window-counter.js",
        code: `export class SlidingWindowCounterRateLimiter {
  constructor({ windowSizeMs = 1000, maxRequests = 10 }) {
    this.windowSizeMs = windowSizeMs;
    this.maxRequests = maxRequests;
    this.currentWindowKey = 0;
    this.currentCount = 0;
    this.previousCount = 0;
  }

  allowRequest(now = Date.now()) {
    const windowKey = Math.floor(now / this.windowSizeMs);
    if (windowKey !== this.currentWindowKey) {
      if (windowKey === this.currentWindowKey + 1) {
        this.previousCount = this.currentCount;
      } else {
        this.previousCount = 0;
      }
      this.currentCount = 0;
      this.currentWindowKey = windowKey;
    }
    const progressInCurrentWindow = (now % this.windowSizeMs) / this.windowSizeMs;
    const estimatedRequests = this.previousCount * (1 - progressInCurrentWindow) + this.currentCount;
    if (estimatedRequests < this.maxRequests) {
      this.currentCount++;
      return true;
    }
    return false;
  }
}`
      }
    ]
  },

  {
    id: "v1-ch05",
    vol: 1,
    chapter: 5,
    title: "Design Consistent Hashing",
    titleZh: "设计一致性哈希：虚拟节点与最小化数据迁移",
    subtitle: "2³² 环形哈希空间、虚拟节点解决数据倾斜、二分顺时针查找",
    complexity: "Time: O(log(V × N)) 查找 | Space: O(V × N)",
    tags: ["Consistent Hashing", "Virtual Nodes", "Distributed Sharding", "Binary Search"],
    svgKey: "consistentHashRing",
    context: `在传统分布式缓存集群中，如果使用简单模运算 <code>serverIndex = hash(key) % N</code>，一旦某台节点宕机或新扩容一台节点（N 发生变化），几乎所有的缓存 Key 都会重新映射到新节点上，导致全局<b>缓存雪崩 (Cache Avalanche)</b>。
一致性哈希（Consistent Hashing）解决了这一根本痛点。`,
    principles: `
<h4>核心设计原理</h4>
<ul>
  <li><b>环形哈希空间：</b> 假定哈希函数将值映射到 <code>[0, 2³² - 1]</code>，首尾相接形成一个闭合的环（Hash Ring）。</li>
  <li><b>服务器与 Key 的映射：</b> 将服务器的主机名或 IP 哈希到环上；当需要定位一个 Key 时，计算 <code>hash(key)</code> 并顺时针寻找在环上紧邻的第一台服务器。</li>
  <li><b>虚拟节点 (Virtual Nodes)：</b>
    <ul>
      <li>如果物理节点太少，环上的服务器分布极易不均匀，导致部分服务器承担海量流量（热点与数据倾斜）。</li>
      <li>通过为每个物理节点分配 <code>V</code> 个虚拟节点（如 <code>ServerA#0, ServerA#1...</code>），虚拟节点均匀交错散列在环上，极大提高了负载均衡度。</li>
    </ul>
  </li>
  <li><b>最小化数据迁移：</b> 当新增或下线一个节点时，仅有相邻两个节点之间的 <code>1 / N</code> 比例数据需要迁移，其余全部 Key 路由完全保持不变！</li>
</ul>
`,
    mermaid: `graph LR
    subgraph HashRing ["一致性哈希环 [0, 2^32 - 1]"]
      K["Data Key: 'user:99'"] -->|"顺时针查找第1个节点"| VN["Virtual Node: NodeB#12"]
      VN -->|"物理路由"| PNode["物理机: Node B"]
    end`,
    files: [
      {
        name: "consistent-hash-ring.js",
        path: "src/v1/ch05-consistent-hash/consistent-hash-ring.js",
        code: `export class ConsistentHashRing {
  constructor({ virtualNodesCount = 100 } = {}) {
    this.virtualNodesCount = virtualNodesCount;
    this.ring = []; // sorted array of { hash, node }
    this.physicalNodes = new Set();
  }

  addNode(node) {
    if (this.physicalNodes.has(node)) return;
    this.physicalNodes.add(node);
    for (let i = 0; i < this.virtualNodesCount; i++) {
      const vKey = \`\${node}#VN-\${i}\`;
      const hash = this._hash(vKey);
      this.ring.push({ hash, node });
    }
    this.ring.sort((a, b) => a.hash - b.hash);
  }

  removeNode(node) {
    if (!this.physicalNodes.has(node)) return;
    this.physicalNodes.delete(node);
    this.ring = this.ring.filter(entry => entry.node !== node);
  }

  getNode(key) {
    if (this.ring.length === 0) return null;
    const hash = this._hash(key);
    // 二分查找第一个 hash(VN) >= hash(key)
    let left = 0, right = this.ring.length - 1;
    let targetIdx = 0;
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      if (this.ring[mid].hash >= hash) {
        targetIdx = mid;
        right = mid - 1;
      } else {
        left = mid + 1;
      }
    }
    return this.ring[targetIdx].node;
  }

  _hash(str) {
    let hash = 2166136261;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0; // 保证无符号 32 位整数
  }
}`
      }
    ]
  },

  {
    id: "v1-ch06",
    vol: 1,
    chapter: 6,
    title: "Design A Key-Value Store",
    titleZh: "设计键值存储：分布式系统五大约束原语",
    subtitle: "向量时钟、默克尔树数据比对、布隆过滤器、Gossip 谣言协议、Quorum 法定人数",
    complexity: "Quorum: R + W > N | Bloom: O(k) | Merkle: O(log N)",
    tags: ["KV Store", "Vector Clock", "Merkle Tree", "Bloom Filter", "Gossip", "Quorum"],
    svgKey: "merkleTree",
    context: `设计一个媲美 Amazon DynamoDB 或 Apache Cassandra 的分布式键值存储系统，必须在分布式环境下面对网络分区、节点故障、并发写入冲突与数据同步等严峻挑战。
本章将 CAP 定理下的工程实现拆解为 5 大基础算法积木。`,
    principles: `
<h4>五大分布式基石机制</h4>
<ol>
  <li><b>向量时钟 (Vector Clock)：</b> 解决无全局授时时钟下的并发写冲突。每个节点维护自身的逻辑计数。当出现分叉并发写时，可检测出并发版本并交由客户端应用层协同解决（如 Dynamo 购物车合并）。</li>
  <li><b>默克尔树 (Merkle Tree)：</b> 二叉哈希树。两台副本节点比对差异时，只需比对根节点哈希；如果不同，逐层下探寻找不一致的子分支，能在 <code>O(log N)</code> 数据通信量内精确定位损毁或遗失的数据块（Anti-Entropy 反熵修复）。</li>
  <li><b>布隆过滤器 (Bloom Filter)：</b> 空间效率极高的概率型数据结构。利用 <code>k</code> 个哈希函数映射 bit 数组。判断结果：“绝对不存在” 或 “可能存在”，能在读取 SSTable 磁盘前避免 99% 的无效磁盘 I/O。</li>
  <li><b>Gossip 协议 (谣言协议)：</b> 节点无中心化状态同步。每个节点周期性随机挑选 <code>k</code> 个邻居交换心跳与状态列表，信息以指数级速度在全集群扩散，具备极强的容灾自愈能力。</li>
  <li><b>法定人数共识 (Quorum Consensus)：</b> 强一致性公式 <code>R + W > N</code>（其中 N 为副本总数，W 为写入成功确认数，R 为读取节点数）。保证读集合与写集合必然重叠至少一个最新副本。</li>
</ol>
`,
    mermaid: `graph TD
    Client["Client Write Request"] --> Coord["Coordinator Node (协调者)"]
    Coord --> N1["Replica 1 (OK)"]
    Coord --> N2["Replica 2 (OK)"]
    Coord --> N3["Replica 3 (Offline)"]
    subgraph Quorum ["Quorum 判定 (W=2, N=3)"]
      N1 & N2 --> Success["2 ≥ W: 写入成功确认"]
    end`,
    files: [
      {
        name: "vector-clock.js",
        path: "src/v1/ch06-kv-store/vector-clock.js",
        code: `export class VectorClock {
  constructor(nodeId, clock = {}) {
    this.nodeId = nodeId;
    this.clock = { ...clock };
    if (!this.clock[nodeId]) this.clock[nodeId] = 0;
  }

  increment() {
    this.clock[this.nodeId] = (this.clock[this.nodeId] || 0) + 1;
    return this;
  }

  static compare(v1, v2) {
    let v1Greater = false;
    let v2Greater = false;
    const allKeys = new Set([...Object.keys(v1.clock), ...Object.keys(v2.clock)]);
    for (const key of allKeys) {
      const c1 = v1.clock[key] || 0;
      const c2 = v2.clock[key] || 0;
      if (c1 > c2) v1Greater = true;
      if (c2 > c1) v2Greater = true;
    }
    if (v1Greater && !v2Greater) return "AFTER";
    if (!v1Greater && v2Greater) return "BEFORE";
    if (!v1Greater && !v2Greater) return "EQUAL";
    return "CONCURRENT"; // 并发冲突，需要应用层合并
  }
}`
      }
    ]
  },

  {
    id: "v1-ch07",
    vol: 1,
    chapter: 7,
    title: "Design A Unique ID Generator In Distributed Systems",
    titleZh: "设计分布式唯一 ID 生成器：Twitter Snowflake 雪花算法",
    subtitle: "64 位 BigInt 二进制位拼接、每毫秒 4096 序列号、时钟回拨保护与反向解码",
    complexity: "Time: O(1) | Throughput: 4,096,000 IDs / sec / node",
    tags: ["Snowflake", "Distributed ID", "BigInt", "Clock Drift Protection"],
    svgKey: "snowflake",
    context: `在单机关系型数据库中，我们常用 <code>AUTO_INCREMENT</code> 生成主键；但在多数据中心、超大规模微服务分布式分库分表中：
1) 单点自增存在数据库单点瓶颈；
2) UUID 字符串占用 128 位、无法递增排序且会导致 B+ 树索引频繁页分裂。
Twitter Snowflake 巧妙利用 64 位无符号整数实现了分布式无锁自增 ID。`,
    principles: `
<h4>Twitter Snowflake 64 位结构定义</h4>
<ul>
  <li><b>第 1 位 (1 bit)：</b> 符号位，固定为 0，保证生成的 ID 全为正数。</li>
  <li><b>第 2-42 位 (41 bits)：</b> 毫秒级时间戳差值 <code>(当前时间 - 自定义纪元时间)</code>。41 位可容纳约 69 年 <code>(2⁴¹ ms ≈ 69.7 年)</code>，天然保证时间递增排序。</li>
  <li><b>第 43-47 位 (5 bits)：</b> 数据中心 ID (Datacenter ID)，支持 0-31 共 32 个数据中心。</li>
  <li><b>第 48-52 位 (5 bits)：</b> 机器节点 ID (Worker ID)，支持 0-31 共 32 台机器。总共支持 1024 个发号节点。</li>
  <li><b>第 53-64 位 (12 bits)：</b> 循环自增序列号 (Sequence)，每毫秒从 0 到 4095。即单机单节点每毫秒可生成 4096 个完全无冲突的 ID！</li>
  <li><b>时钟回拨防御 (Clock Rollback)：</b> 如果检测到当前时间戳小于 <code>lastTimestamp</code>，说明发生 NTP 时钟漂移，立即抛出异常或睡眠等待追平，防止生成重复 ID。</li>
</ul>
`,
    mermaid: `graph LR
    Sign["1 bit<br/>固定为 0"] --- TS["41 bits<br/>毫秒级相对时间戳 (69年)"]
    TS --- DC["5 bits<br/>数据中心 ID (0-31)"]
    DC --- Worker["5 bits<br/>工作节点 ID (0-31)"]
    Worker --- Seq["12 bits<br/>自增序列号 (0-4095)"]`,
    files: [
      {
        name: "snowflake.js",
        path: "src/v1/ch07-unique-id/snowflake.js",
        code: `export class SnowflakeIdGenerator {
  static EPOCH = 1609459200000n; // 2021-01-01 00:00:00 UTC
  static WORKER_ID_BITS = 5n;
  static DATACENTER_ID_BITS = 5n;
  static SEQUENCE_BITS = 12n;

  static MAX_WORKER_ID = -1n ^ (-1n << SnowflakeIdGenerator.WORKER_ID_BITS);
  static MAX_DATACENTER_ID = -1n ^ (-1n << SnowflakeIdGenerator.DATACENTER_ID_BITS);
  static SEQUENCE_MASK = -1n ^ (-1n << SnowflakeIdGenerator.SEQUENCE_BITS);

  constructor({ workerId = 1, datacenterId = 1 } = {}) {
    this.workerId = BigInt(workerId);
    this.datacenterId = BigInt(datacenterId);
    this.sequence = 0n;
    this.lastTimestamp = -1n;
  }

  nextId() {
    let timestamp = BigInt(Date.now());
    if (timestamp < this.lastTimestamp) {
      throw new Error(\`Clock moved backwards! Refusing to generate ID for \${this.lastTimestamp - timestamp}ms\`);
    }
    if (this.lastTimestamp === timestamp) {
      this.sequence = (this.sequence + 1n) & SnowflakeIdGenerator.SEQUENCE_MASK;
      if (this.sequence === 0n) {
        // 同一毫秒内序列号溢出，自旋等待下一毫秒
        while (timestamp <= this.lastTimestamp) {
          timestamp = BigInt(Date.now());
        }
      }
    } else {
      this.sequence = 0n;
    }
    this.lastTimestamp = timestamp;

    const id =
      ((timestamp - SnowflakeIdGenerator.EPOCH) << 22n) |
      (this.datacenterId << 17n) |
      (this.workerId << 12n) |
      this.sequence;
    return id.toString();
  }
}`
      }
    ]
  },

  {
    id: "v1-ch08",
    vol: 1,
    chapter: 8,
    title: "Design A URL Shortener",
    titleZh: "设计短网址系统：双向 Base62 编码与碰撞探测",
    subtitle: "62 进制双向转换、自增 ID 映射与 MurmurHash + Salt 探测探针",
    complexity: "Time: O(1) Encode/Decode | Capacity: 62⁷ ≈ 3.5 万亿条短链",
    tags: ["Base62", "URL Shortener", "Hash Collision", "Bijective Mapping"],
    svgKey: null,
    context: `短网址服务（如 TinyURL、bit.ly）将动辄数百字符的长链接转换成如 <code>https://tinyurl.com/a8b9xY</code> 的 7 字符短链，极大地节省了短信 SMS 字数并在社交网络中更易传播。
核心在于如何实现超高吞吐、全局唯一、不可逆猜的短链映射算法。`,
    principles: `
<h4>两大主流实现路径对比</h4>
<ol>
  <li><b>方案 A：自增 ID + 双向 Base62 编码 (推荐工业界方案)</b>
    <ul>
      <li>利用分布式发号器（如 Snowflake 或 Redis / DB ID）获得一个无冲突的自增 64 位整数 <code>ID</code>。</li>
      <li>采用字符集 <code>[0-9a-zA-Z]</code>（共 62 个字符），进行 62 进制除基取余编码。长度为 7 的 Base62 字符串最多可表达 <code>62⁷ ≈ 3.52 万亿</code> 个独立短链。</li>
      <li>具有确定性双向映射特性：解码 <code>Base62.decode(str)</code> 即可还原出原整数 ID，直接命中主键索引。</li>
    </ul>
  </li>
  <li><b>方案 B：哈希摘要截断 + 盐值探测 (Hash + Salt Probing)</b>
    <ul>
      <li>对长 URL 计算 MurmurHash32，截取前 7 位。</li>
      <li>如果遇到哈希冲突（数据库中已存在且长 URL 不同），追加 Salt 盐值重新哈希（探测重试），直到无冲突为止。</li>
    </ul>
  </li>
</ol>
`,
    mermaid: `graph LR
    LongURL["Long URL<br/>https://example.com/very/long/path"] --> IDGen["分布式发号器 Snowflake / Sequence"]
    IDGen --> Base62["Base62 进制编码<br/>ID: 2009215674938 → 'zn91Kx'"]
    Base62 --> ShortURL["短网址<br/>https://tiny.url/zn91Kx"]`,
    files: [
      {
        name: "base62.js",
        path: "src/v1/ch08-url-shortener/base62.js",
        code: `export class Base62 {
  static CHARSET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  static BASE = 62n;

  static encode(numericId) {
    let num = BigInt(numericId);
    if (num === 0n) return this.CHARSET[0];
    let result = "";
    while (num > 0n) {
      const remainder = Number(num % this.BASE);
      result = this.CHARSET[remainder] + result;
      num = num / this.BASE;
    }
    return result;
  }

  static decode(str) {
    let result = 0n;
    for (let i = 0; i < str.length; i++) {
      const charIndex = this.CHARSET.indexOf(str[i]);
      if (charIndex === -1) throw new Error(\`Invalid base62 char: \${str[i]}\`);
      result = result * this.BASE + BigInt(charIndex);
    }
    return result;
  }
}`
      }
    ]
  },

  {
    id: "v1-ch09",
    vol: 1,
    chapter: 9,
    title: "Design A Web Crawler",
    titleZh: "设计网络爬虫：礼貌优先队列与 SimHash 海明距离排重",
    subtitle: "Host 级延时避退队列、64位 SimHash 局部敏感哈希与网页相似度去重",
    complexity: "SimHash: O(L) | Hamming: O(1) PopCount",
    tags: ["Web Crawler", "Politeness Frontier", "SimHash", "Hamming Distance", "Deduplication"],
    svgKey: null,
    context: `网络爬虫（如 Googlebot）遍历全网海量网页，核心挑战包括：
1) 爬虫礼貌性（Politeness）：不能短时间并发轰炸同一个目标站点造成目标崩溃；
2) 优先队列调度：高权重域名优先抓取；
3) 近似内容去重：网络上存在大量仅有少量广告或版权信息不同的镜像网页，传统 MD5 完全失效。`,
    principles: `
<h4>1. 礼貌 URL 前沿 (Polite URL Frontier)</h4>
<ul>
  <li><b>前置优先级队列：</b> 根据 PageRank / 站长更新频率打分分流；</li>
  <li><b>后置 Host 队列与延迟调度器：</b> 每个抓取线程根据目标域名 <code>hostname</code> 路由到独立 FIFO 队列，并记录该 Host 上次请求时间戳 <code>lastAccessTime</code>。严格限制同一 Host 的两次抓取间隔不小于 <code>crawlDelayMs</code>，避免轰炸目标服务器。</li>
</ul>

<h4>2. SimHash 局部敏感哈希 (Locality-Sensitive Hashing)</h4>
<ul>
  <li>传统哈希（MD5/SHA256）具有雪崩效应（输入变动 1 位，输出面目全非）；而 SimHash 具备“内容相似度越高，哈希海明距离越小”的特性：
    <ol>
      <li>分词并赋予词频权重 <code>w</code>；</li>
      <li>每个词哈希为 64 位指纹，若第 <code>i</code> 位为 1 则累加 <code>+w</code>，为 0 则累加 <code>-w</code>；</li>
      <li>降维二值化：全词向量累加后，若值 > 0 则该位为 1，否则为 0，得到 64 位最终指纹；</li>
      <li><b>海明距离 (Hamming Distance)：</b> 两个网页指纹异或后的 1 的个数（PopCount）。海明距离 ≤ 3 通常判定为高度相似镜像网页，直接滤除。</li>
    </ol>
  </li>
</ul>
`,
    mermaid: `graph TD
    Text["网页 HTML 文本提取"] --> Tokenize["分词与词频权重分析"]
    Tokenize --> SimHashCalc["64位加权累加与二值化"]
    SimHashCalc --> Fingerprint["生成 64-bit SimHash 指纹"]
    Fingerprint --> Hamming["计算与现有库的海明距离 (XOR PopCount)"]
    Hamming -- "距离 ≤ 3" --> Duplicate["判定为近似镜像网页，丢弃去重"]
    Hamming -- "距离 > 3" --> NewPage["录入索引库"]`,
    files: [
      {
        name: "sim-hash.js",
        path: "src/v1/ch09-crawler/sim-hash.js",
        code: `export class SimHash {
  static hash64(str) {
    let h1 = 0xdeadbeef, h2 = 0x41c64e6d;
    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    const part1 = (h1 >>> 0).toString(2).padStart(32, "0");
    const part2 = (h2 >>> 0).toString(2).padStart(32, "0");
    return part1 + part2;
  }

  static generate(tokens) {
    const v = new Array(64).fill(0);
    for (const token of tokens) {
      const h = this.hash64(token);
      for (let i = 0; i < 64; i++) {
        v[i] += h[i] === "1" ? 1 : -1;
      }
    }
    let fingerprint = 0n;
    for (let i = 0; i < 64; i++) {
      if (v[i] > 0) {
        fingerprint |= 1n << BigInt(63 - i);
      }
    }
    return fingerprint;
  }

  static hammingDistance(fp1, fp2) {
    let xor = fp1 ^ fp2;
    let count = 0;
    while (xor > 0n) {
      if (xor & 1n) count++;
      xor >>= 1n;
    }
    return count;
  }
}`
      }
    ]
  },

  {
    id: "v1-ch10",
    vol: 1,
    chapter: 10,
    title: "Design A Notification System",
    titleZh: "设计百万级通知推送系统：指数退避抖动重试与幂等去重",
    subtitle: "全抖动/均等抖动重试算法、幂等性 Token 键与滑动窗口去重",
    complexity: "Retry: Exponential Backoff + Jitter | Dedup: O(1)",
    tags: ["Notification", "Exponential Backoff", "Jitter", "Idempotency", "Retry Pattern"],
    svgKey: null,
    context: `通知推送系统（推送 APNS/FCM、短信 SMS、邮件）需要发送数十亿条通知。
在面对下游第三方网关故障时，如果简单固定间隔重试，千百万个失败请求会在同一个瞬间同时重试，形成<b>惊群效应 (Thundering Herd)</b>。同时必须保证通知绝不被重复发送给用户。`,
    principles: `
<h4>1. 指数退避与抖动重试 (Exponential Backoff with Full Jitter)</h4>
<ul>
  <li>基础公式：<code>backoff = min(maxInterval, baseInterval × 2^attempt)</code></li>
  <li><b>加抖动 (Jitter) 的必要性：</b> AWS 架构师经典论证，纯指数退避依然会在时间线上形成重试脉冲。
    <ul>
      <li><b>Full Jitter (全抖动)：</b> <code>sleep = random(0, backoff)</code>，打散效果最好，完全抹平瞬时流量峰值。</li>
      <li><b>Equal Jitter (均等抖动)：</b> <code>sleep = (backoff / 2) + random(0, backoff / 2)</code>，保留基础等待下限。</li>
    </ul>
  </li>
</ul>

<h4>2. 幂等性去重器 (Idempotency Deduplicator)</h4>
<ul>
  <li>基于 <code>idempotencyKey</code>（通常为 <code>userId:eventType:bizId</code>），在 Redis 中通过带 TTL 的原子 <code>SETNX</code> 判定。在 TTL 生效期内若遇到相同 Key，直接判定为重复提交，安全返回成功而不重复发信。</li>
</ul>
`,
    mermaid: `sequenceDiagram
    participant App as 业务服务端
    participant Notif as 通知推送中心
    participant Gateway as 第三方短信网关

    App->>Notif: 发送通知 (含 Idempotency-Key)
    Notif->>Notif: 幂等性检查 (TTL 窗口防重)
    Notif->>Gateway: 调用发送接口
    Gateway-->>Notif: 503 Service Unavailable
    Note over Notif: 计算 Full Jitter 指数退避抖动等待
    Notif->>Gateway: 尝试第 2 次重试
    Gateway-->>Notif: 200 OK 发送成功`,
    files: [
      {
        name: "exponential-backoff.js",
        path: "src/v1/ch10-notification/exponential-backoff.js",
        code: `export class ExponentialBackoffRetrier {
  constructor({ baseIntervalMs = 100, maxIntervalMs = 5000, maxAttempts = 5, jitter = "full" } = {}) {
    this.baseInterval = baseIntervalMs;
    this.maxInterval = maxIntervalMs;
    this.maxAttempts = maxAttempts;
    this.jitter = jitter;
  }

  getDelay(attempt) {
    const rawBackoff = Math.min(this.maxInterval, this.baseInterval * Math.pow(2, attempt));
    if (this.jitter === "full") {
      return Math.floor(Math.random() * rawBackoff);
    } else if (this.jitter === "equal") {
      const half = Math.floor(rawBackoff / 2);
      return half + Math.floor(Math.random() * half);
    }
    return rawBackoff;
  }

  async executeWithRetry(fn) {
    let attempt = 0;
    while (true) {
      try {
        return await fn(attempt);
      } catch (err) {
        if (attempt >= this.maxAttempts) throw err;
        const delay = this.getDelay(attempt);
        await new Promise(r => setTimeout(r, delay));
        attempt++;
      }
    }
  }
}`
      }
    ]
  },

  {
    id: "v1-ch11",
    vol: 1,
    chapter: 11,
    title: "Design A News Feed System",
    titleZh: "设计信息流系统：推拉混合扩散与多路时间线归并",
    subtitle: "名人拉模型、普通用户推模型与基于优先队列的 K 路时间戳归并",
    complexity: "Fanout: O(Followers) or O(Following) | Merge: O(N log K)",
    tags: ["News Feed", "Fanout on Write", "Fanout on Read", "K-Way Merge", "Timeline"],
    svgKey: null,
    context: `类似 Twitter、Facebook、微博的信息流系统，核心矛盾在于“大 V / 明星用户（Celebrity）”拥有几千万甚至上亿粉丝。
如果全部采用<b>写扩散 (Push / Fanout-on-write)</b>，单个发帖就会导致后台数据库瞬时写入上亿次，造成消息队列严重堵塞；而全部采用<b>读扩散 (Pull / Fanout-on-read)</b>，普通用户刷 Feed 时的多表聚合查询延迟极高。`,
    principles: `
<h4>推拉结合混合扩散模型 (Hybrid Fanout)</h4>
<ul>
  <li><b>普通用户发帖 (粉丝数 < 阈值，如 10,000)：</b>
    采用<b>写扩散 (Push)</b>。发帖后异步将帖子 ID 写入其全部关注者的收件箱（Timeline 缓存列表）。粉丝刷新时仅需 <code>LRANGE 0 10</code>，读延迟极低。
  </li>
  <li><b>大 V 明星发帖 (粉丝数 ≥ 阈值)：</b>
    采用<b>读扩散 (Pull)</b>。大 V 发帖不向海量粉丝收件箱写入，仅存入自己的发件箱（User Post Timeline）。
  </li>
  <li><b>用户拉取 Feed 时的多路归并 (Timeline Merger)：</b>
    客户端打开 Feed 时，拉取自身收件箱缓存，并拉取所关注的大 V 最新发件箱列表，利用<b>最小/最大堆优先队列 (Min/Max Priority Queue) 进行 K 路归并 (K-Way Merge)</b>，按发帖时间戳倒序输出，复杂度仅为 <code>O(N log K)</code>。
  </li>
</ul>
`,
    mermaid: `graph TD
    Post["用户发布动态"] --> Check{"检查发帖者粉丝数"}
    Check -- "普通用户 (粉丝 < 10k)" --> Push["写扩散 (Push 模型)<br/>写入每个关注者的个人 Feed 缓存队列"]
    Check -- "大 V 明星 (粉丝 ≥ 10k)" --> Pull["读扩散 (Pull 模型)<br/>仅写入大 V 自身发件箱"]

    UserRead["用户刷新信息流 (Timeline)"] --> Merge["K 路时间线优先队列归并<br/>自身 Feed 队列 + 关注的大 V 发件箱"]
    Merge --> FeedRes["按时间戳降序呈现给用户"]`,
    files: [
      {
        name: "timeline-merger.js",
        path: "src/v1/ch11-news-feed/timeline-merger.js",
        code: `export class TimelineMerger {
  /**
   * K-Way Merge of sorted timelines (newest first)
   * @param {Array<Array<{id: string, timestamp: number}>>} timelines
   * @param {number} limit
   */
  static merge(timelines, limit = 20) {
    const indices = new Array(timelines.length).fill(0);
    const result = [];

    while (result.length < limit) {
      let maxTime = -1;
      let chosenStream = -1;

      for (let i = 0; i < timelines.length; i++) {
        const stream = timelines[i];
        const idx = indices[i];
        if (idx < stream.length) {
          if (stream[idx].timestamp > maxTime) {
            maxTime = stream[idx].timestamp;
            chosenStream = i;
          }
        }
      }

      if (chosenStream === -1) break; // 所有流耗尽
      result.push(timelines[chosenStream][indices[chosenStream]]);
      indices[chosenStream]++;
    }

    return result;
  }
}`
      }
    ]
  },

  {
    id: "v1-ch12",
    vol: 1,
    chapter: 12,
    title: "Design A Chat System",
    titleZh: "设计即时通讯聊天系统：会话单调递增序列与心跳在线状态",
    subtitle: "消息绝对因果序编号、断网重连空洞检测与基于心跳租约的在线管理器",
    complexity: "Sequencer: O(1) | Gap Detection: O(N) | Heartbeat: O(1)",
    tags: ["Chat", "Message Ordering", "Sequencer", "Heartbeat", "Presence Manager"],
    svgKey: null,
    context: `微信、WhatsApp 等即时聊天系统，核心难题包括：
1) 多端并发收发消息时，不同客户端物理时钟偏差导致的消息时间错乱；
2) 客户端弱网断线重连后的消息丢失与顺序错乱检测；
3) 百万级用户实时在线状态（Online/Away/Offline）的高效维护。`,
    principles: `
<h4>1. 会话级单调递增序列号 (Conversation Message Sequencer)</h4>
<ul>
  <li>由于全局唯一自增 ID 在跨分片存储时开销极大，最佳实践是<b>会话级独立序列器 (Per-Conversation Sequencer)</b>：
    每一个单聊或群聊会话单独维护一个自增计数器 <code>seqId: 1, 2, 3...</code>。</li>
  <li>客户端本地缓存已接收到的最大 <code>seqId</code>。断网重连后，向服务器上报 <code>lastSeq = 5</code>；若服务端最新是 8，直接补发 <code>[6, 7, 8]</code> 历史消息。若客户端发现收到 8 却未收到 6，立即触发空洞回溯拉取，彻底解决乱序与丢消息问题。</li>
</ul>

<h4>2. 心跳租约在线管理器 (Presence Manager)</h4>
<ul>
  <li>客户端建立 WebSocket 长连接后，每隔 5 秒发送一次 ping 心跳包。</li>
  <li>服务端维护用户上次心跳时间戳与租约超时阈值（如 15 秒）。超过阈值未收到心跳，自动将状态流转为 Offline 并广播变更通知。</li>
</ul>
`,
    mermaid: `sequenceDiagram
    participant UserA as 发送方 User A
    participant ChatServer as 聊天服务 Sequencer
    participant UserB as 接收方 User B (弱网)

    UserA->>ChatServer: 发送消息 "Hello"
    ChatServer->>ChatServer: 分配 seqId = 101
    ChatServer-->>UserB: 推送 (seqId=101)
    Note over UserB: 收到 seqId=101，但本地 lastSeq=99
    UserB->>ChatServer: 检测到空洞！主动请求拉取 [100, 101]
    ChatServer-->>UserB: 补发 seqId=100`,
    files: [
      {
        name: "message-sequencer.js",
        path: "src/v1/ch12-chat/message-sequencer.js",
        code: `export class MessageSequencer {
  constructor() {
    this.conversationSequences = new Map(); // conversationId -> lastSeqId
  }

  nextSequence(conversationId) {
    const current = this.conversationSequences.get(conversationId) || 0;
    const next = current + 1;
    this.conversationSequences.set(conversationId, next);
    return next;
  }

  static detectGaps(receivedSeqList, expectedStartSeq = 1) {
    const gaps = [];
    const set = new Set(receivedSeqList);
    const max = Math.max(...receivedSeqList, expectedStartSeq);
    for (let i = expectedStartSeq; i <= max; i++) {
      if (!set.has(i)) {
        gaps.push(i);
      }
    }
    return gaps;
  }
}`
      }
    ]
  },

  {
    id: "v1-ch13",
    vol: 1,
    chapter: 13,
    title: "Design A Search Autocomplete System",
    titleZh: "设计搜索自动补全系统：Top-K 缓存前缀树",
    subtitle: "Trie 前缀树节点内聚 Top-K 热门热词缓存，查询复杂度降至 O(p)",
    complexity: "Query: O(p) 即前缀长度，与词库总量 N 完全无关",
    tags: ["Autocomplete", "Trie", "Top-K", "Prefix Tree", "O(p) Search"],
    svgKey: null,
    context: `Google 搜索框每天承载上百亿次搜索输入。用户每敲击一个字符（如输入 "sys"），系统必须在 100ms 毫秒内返回最热门的 5 条联想词（如 "system design", "system preferences"）。
在海量词库中如果实时做全量前缀扫描与频次排序，CPU 将彻底过载。`,
    principles: `
<h4>核心架构优化：Top-K 节点前缀树 (Prefix Trie with Cached Top-K)</h4>
<ul>
  <li><b>原生前缀树的缺陷：</b> 传统 Trie 查询前缀需要遍历到前缀终点节点，再递归 DFS 遍历整棵子树收集所有词并排序，耗时高达 <code>O(Nodes in Subtree + N log K)</code>。</li>
  <li><b>空间换时间核心优化：</b>
    在 Trie 的<b>每一个前缀节点中，直接冗余缓存该前缀下的 Top-K 热门词列表</b>！
    <ul>
      <li>例如在节点 <code>'s' -> 'y' -> 's'</code> 上，直接存储已预排好序的 <code>['system design', 'system requirements']</code>。</li>
      <li>查询时，沿字符路径前进 <code>p</code> 步到达目标前缀节点，<b>直接以 O(1) 返回预先缓存好的 Top-K 数组</b>！</li>
      <li>单次用户查询整体时间复杂度为严格的 <b>O(p)</b>（其中 p 为输入字符长度，通常 ≤ 10），与系统中拥有几十亿词汇量完全无关！</li>
      <li>后台通过离线批处理作业（MapReduce / Flink）每周或每天更新词频与节点 Top-K 缓存。</li>
    </ul>
  </li>
</ul>
`,
    mermaid: `graph TD
    Root["Root Trie Node"] --> S["'s' (Top5 cached)"]
    S --> Y["'sy' (Top5 cached)"]
    Y --> SYS["'sys' (Top-K: ['system design', 'system update'])"]
    SYS --> TEM["'system' (Top-K: ['system design', 'system engineering'])"]`,
    files: [
      {
        name: "topk-trie.js",
        path: "src/v1/ch13-autocomplete/topk-trie.js",
        code: `class TrieNode {
  constructor() {
    this.children = new Map();
    this.topK = []; // 缓存当前前缀下的 Top-K 词条 [{word, frequency}]
  }
}

export class TopKTrie {
  constructor(k = 5) {
    this.k = k;
    this.root = new TrieNode();
  }

  insert(word, frequency) {
    let curr = this.root;
    for (const char of word.toLowerCase()) {
      if (!curr.children.has(char)) {
        curr.children.set(char, new TrieNode());
      }
      curr = curr.children.get(char);
      this._updateTopK(curr, word, frequency);
    }
  }

  search(prefix) {
    let curr = this.root;
    for (const char of prefix.toLowerCase()) {
      if (!curr.children.has(char)) return [];
      curr = curr.children.get(char);
    }
    return curr.topK.map(item => item.word); // O(p) 直接返回
  }

  _updateTopK(node, word, frequency) {
    const existingIdx = node.topK.findIndex(item => item.word === word);
    if (existingIdx !== -1) {
      node.topK[existingIdx].frequency = frequency;
    } else {
      node.topK.push({ word, frequency });
    }
    node.topK.sort((a, b) => b.frequency - a.frequency);
    if (node.topK.length > this.k) {
      node.topK.pop();
    }
  }
}`
      }
    ]
  },

  {
    id: "v1-ch14",
    vol: 1,
    chapter: 14,
    title: "Design YouTube",
    titleZh: "设计 YouTube 视频转码系统：DAG 任务拓扑调度器",
    subtitle: "有向无环图并行流水线调度、拓扑排序依赖解析与死锁环检测",
    complexity: "Topological Sort: O(V + E) | Parallel Execution",
    tags: ["YouTube", "DAG Scheduler", "Topological Sort", "Cycle Detection", "Video Pipeline"],
    svgKey: null,
    context: `用户上传一条高清 4K 原视频后，系统需要对其进行一系列极其复杂的异步转码流水线处理：
提取音频轨、生成缩略图、抽帧审查色情暴恐、分别转码为 1080p/720p/480p MP4/HLS 分段、生成水印等。
任务之间存在复杂的依赖网（如转码必须在视频下载分片完成后执行），必须用<b>有向无环图 (DAG)</b> 进行调度。`,
    principles: `
<h4>DAG 任务流水线调度机制</h4>
<ul>
  <li><b>依赖有向图：</b> 节点代表执行任务单元（Task），边代表依赖关系（A -> B 表示 B 依赖 A 执行完毕）。</li>
  <li><b>拓扑排序与环检测 (Kahn 算法 / DFS)：</b>
    在调度前必须先进行拓扑排序并计算入度（In-degree）。如果图中存在环（Cycle），说明产生死锁依赖，调度器应拒绝执行并抛错。</li>
  <li><b>并行就绪队列调度：</b>
    当入度为 0 的任务完成后，通知其所有后继子任务，将其入度 -1。一旦某子任务入度降为 0，立即投入 Worker 线程池并发执行，最大化榨取多核 GPU/CPU 转码算力。</li>
</ul>
`,
    mermaid: `graph LR
    Upload["上传原视频"] --> Split["分片 Splitter"]
    Split --> Audio["提取音频"]
    Split --> Thumb["生成缩略图"]
    Split --> Encode1080["转码 1080p HLS"]
    Split --> Encode720["转码 720p HLS"]
    Encode1080 & Encode720 & Audio --> Mux["打包合成 MPD/M3U8"]
    Mux --> CDN["推送到 CDN 边缘分发"]`,
    files: [
      {
        name: "dag-task-scheduler.js",
        path: "src/v1/ch14-youtube/dag-task-scheduler.js",
        code: `export class DagTaskScheduler {
  constructor() {
    this.tasks = new Map(); // id -> { id, fn, dependencies: Set, dependents: Set }
  }

  addTask(id, fn, dependencies = []) {
    this.tasks.set(id, {
      id,
      fn,
      dependencies: new Set(dependencies),
      dependents: new Set()
    });
  }

  buildGraph() {
    for (const [taskId, task] of this.tasks) {
      for (const depId of task.dependencies) {
        if (!this.tasks.has(depId)) throw new Error(\`Missing dependency: \${depId}\`);
        this.tasks.get(depId).dependents.add(taskId);
      }
    }
  }

  getTopologicalOrder() {
    this.buildGraph();
    const inDegree = new Map();
    for (const [id, task] of this.tasks) {
      inDegree.set(id, task.dependencies.size);
    }
    const queue = [];
    for (const [id, deg] of inDegree) {
      if (deg === 0) queue.push(id);
    }
    const order = [];
    while (queue.length > 0) {
      const curr = queue.shift();
      order.push(curr);
      for (const depId of this.tasks.get(curr).dependents) {
        const nextDeg = inDegree.get(depId) - 1;
        inDegree.set(depId, nextDeg);
        if (nextDeg === 0) queue.push(depId);
      }
    }
    if (order.length !== this.tasks.size) {
      throw new Error("Cycle detected in DAG task pipeline!");
    }
    return order;
  }
}`
      }
    ]
  },

  {
    id: "v1-ch15",
    vol: 1,
    chapter: 15,
    title: "Design Google Drive",
    titleZh: "设计 Google Drive 网盘：分块增量同步与全网内容去重",
    subtitle: "定长/CDC 内容指纹分块、客户端增量上传与 SHA-256 全局哈希秒传",
    complexity: "Chunking: O(File Size) | Dedup: O(1) per block",
    tags: ["Google Drive", "Delta Sync", "Content Hashing", "Deduplication", "Cloud Storage"],
    svgKey: null,
    context: `Google Drive、Dropbox 用户经常在本地频繁修改数百兆甚至几吉字节的大文件。
如果每次修改（例如只改动了文档中几个单词）都将整个 500MB 文件重新上传到云端，不仅带宽极度浪费，上传耗时也将长达数分钟。增量同步与去重是云盘的核心杀手级技术。`,
    principles: `
<h4>云存储分块增量同步两大王牌技术</h4>
<ul>
  <li><b>增量分块同步 (Delta Sync)：</b>
    客户端将大文件切分为若干 Chunk（例如 4MB 为一个块），计算每个 Chunk 的 SHA-256 内容哈希值。
    当用户编辑文件后，只有哈希变动的极个别脏数据块（Dirty Chunks）会被打包压缩并上传到云端，云端根据元数据块清单（Block Metadata）重新组装文件。带宽节约率达 95% 以上。</li>
  <li><b>全局内容哈希秒传 (Global Hash Deduplication)：</b>
    不同用户上传同一份热播电影或通用软件包时，云端检测到相同的哈希块已存在于分布式存储中，只需在用户文件元数据树上新增一个指向该物理块的指针，瞬间完成“秒传”，无需实际消耗带宽传输。</li>
</ul>
`,
    mermaid: `graph TD
    File["本地修改大文件 (500 MB)"] --> Chunking["切分为若干 4MB 数据块"]
    Chunking --> HashCalc["计算每个块的 SHA-256 哈希值"]
    HashCalc --> Diff{"与云端块哈希清单比对"}
    Diff -- "未变动的块" --> Skip["跳过上传 (复用已有块)"]
    Diff -- "发生变动的块 (例如仅第3块)" --> Upload["增量压缩并上传该单独 Chunk"]
    Upload --> CloudMetadata["更新云端版本文件元数据块指针列表"]`,
    files: [
      {
        name: "delta-sync.js",
        path: "src/v1/ch15-google-drive/delta-sync.js",
        code: `export class DeltaSyncEngine {
  constructor({ chunkSize = 4 } = {}) {
    this.chunkSize = chunkSize;
    this.globalStorage = new Map(); // hash -> chunkContent (全局去重池)
  }

  chunkContent(content) {
    const chunks = [];
    for (let i = 0; i < content.length; i += this.chunkSize) {
      const slice = content.slice(i, i + this.chunkSize);
      chunks.push({
        index: chunks.length,
        hash: this._simpleHash(slice),
        data: slice
      });
    }
    return chunks;
  }

  computeDelta(oldManifest, newChunks) {
    const oldHashMap = new Set(oldManifest.map(c => c.hash));
    const toUpload = [];
    for (const chunk of newChunks) {
      if (!oldHashMap.has(chunk.hash) && !this.globalStorage.has(chunk.hash)) {
        toUpload.push(chunk);
      }
    }
    return toUpload; // 仅返回发生变化的增量块
  }

  _simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
    }
    return "h_" + (hash >>> 0).toString(16);
  }
}`
      }
    ]
  },

  // ==========================================
  // VOLUME 2
  // ==========================================
  {
    id: "v2-ch01",
    vol: 2,
    chapter: 1,
    title: "Proximity Service",
    titleZh: "附近地点搜索系统：Geohash 网格与 QuadTree 四叉树",
    subtitle: "Base32 网格编码、8 个相邻网格边缘补偿与自适应空间四叉树",
    complexity: "Geohash: O(Length) | QuadTree Query: O(log₄ N + K)",
    tags: ["Proximity", "Geohash", "QuadTree", "Spatial Index", "GIS"],
    svgKey: "quadTree",
    context: `Yelp、大众点评、Uber 司机查找等应用，核心功能是根据用户经纬度 <code>(lat, lon)</code> 快速查询周围半径 2km 内的餐馆或车辆。
关系型数据库如 <code>WHERE lat BETWEEN x1 AND x2 AND lon BETWEEN y1 AND y2</code> 无法利用单列 B 树同时高效过滤两个维度。`,
    principles: `
<h4>空间索引两大支柱方案对比</h4>
<ol>
  <li><b>Geohash (Base32 网格降维)：</b>
    <ul>
      <li>将二维经度 <code>[-180, 180]</code> 和纬度 <code>[-90, 90]</code> 进行二分区间划分（小于中点标 0，大于中点标 1），将经纬度二进制位交叉穿插（Interleave），转为 Base32 编码（如 <code>wtw3sj</code>）。</li>
      <li><b>前缀匹配特性：</b> 字符串共享越长的前缀，地理距离越近。</li>
      <li><b>边缘效应与 8 邻域补偿：</b> 用户可能刚好站在网格边界上，此时查询必须同时连带搜索当前网格周边的<b>上下左右及对角共 8 个相邻网格 (8 Neighbors)</b>，彻底消除边界遗漏。</li>
    </ul>
  </li>
  <li><b>QuadTree (四叉树动态空间自适应剖分)：</b>
    <ul>
      <li>将 2D 矩形空间递归划分为 NW、NE、SW、SE 四个象限。</li>
      <li>当某个象限内的 POI 数量超过容量阈值 <code>K</code> 时触发自动分裂（繁华商业区切分极深极密，而沙漠/海洋象限保持不切分），内存驻留查询速度极快。</li>
    </ul>
  </li>
</ol>
`,
    mermaid: `graph TD
    Coord["输入经纬度 (Lat, Lon)"] --> Interleave["二分划分经纬度位并交叉穿插"]
    Interleave --> Base32["Base32 编码 (例如 'wtw3sj')"]
    Base32 --> Neighbors["计算周边 8 个相邻网格，避免边界漏查"]
    Neighbors --> InQuery["Redis / 数据库 IN ('wtw3sj', 'wtw3sh', ...) 批量索引点查"]`,
    files: [
      {
        name: "geohash.js",
        path: "src/v2/ch01-proximity/geohash.js",
        code: `export class Geohash {
  static BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";

  static encode(lat, lon, precision = 6) {
    let latMin = -90.0, latMax = 90.0;
    let lonMin = -180.0, lonMax = 180.0;
    let hash = "";
    let isEven = true;
    let bit = 0;
    let ch = 0;

    while (hash.length < precision) {
      if (isEven) {
        const mid = (lonMin + lonMax) / 2;
        if (lon > mid) {
          ch |= (1 << (4 - bit));
          lonMin = mid;
        } else {
          lonMax = mid;
        }
      } else {
        const mid = (latMin + latMax) / 2;
        if (lat > mid) {
          ch |= (1 << (4 - bit));
          latMin = mid;
        } else {
          latMax = mid;
        }
      }
      isEven = !isEven;
      if (bit < 4) {
        bit++;
      } else {
        hash += this.BASE32[ch];
        bit = 0;
        ch = 0;
      }
    }
    return hash;
  }
}`
      }
    ]
  },

  {
    id: "v2-ch02",
    vol: 2,
    chapter: 2,
    title: "Nearby Friends",
    titleZh: "附近好友实时定位：Haversine 球面大圆距离与网格 Pub/Sub",
    subtitle: "地球大圆半正矢球面测距与基于 Geohash 网格频道的轻量级发布订阅",
    complexity: "Haversine: O(1) | Pub/Sub: O(Subscribers per cell)",
    tags: ["Nearby Friends", "Haversine", "Spherical Geometry", "PubSub", "Realtime"],
    svgKey: null,
    context: `微信“附近的人”或 Tinder 查找附近在线好友，不仅地点是动态移动的，而且需要毫秒级推送。
如果每位用户每次位置变动都遍历数据库计算与所有人的距离，计算量为 <code>O(N²)</code>，系统将在几秒内崩溃。`,
    principles: `
<h4>1. Haversine 球面距离公式 (大圆距离)</h4>
<ul>
  <li>由于地球是椭球体，简单的平面欧几里得距离 <code>√(Δx² + Δy²)</code> 在大跨度纬度下误差极大。</li>
  <li>Haversine 公式基于球面三角学半正矢函数：
    <code>a = sin²(Δlat / 2) + cos(lat1) × cos(lat2) × sin²(Δlon / 2)</code>
    <code>d = 2 × R × atan2(√a, √(1 - a))</code>
    能在地球曲率下精准计算米级距离。</li>
</ul>

<h4>2. 基于网格频道的分布式发布订阅 (Grid Pub/Sub)</h4>
<ul>
  <li>将地理空间划分成固定精度的 Geohash 网格。用户移动进入某网格时，订阅该网格的 Redis 消息频道 <code>geo:cell:wtw3sj</code>。</li>
  <li>当好友位置变动时，仅向当前网格及其相邻网格的频道发布心跳事件，极大削减消息广播范围。</li>
</ul>
`,
    mermaid: `sequenceDiagram
    participant UserA as 移动用户 A
    participant Hub as 网格 Pub/Sub 中心
    participant Friend as 附近好友 B

    UserA->>Hub: 上报坐标变化 (lat, lon)
    Hub->>Hub: 计算所属网格 'wtw3sj'
    Hub->>Friend: 向网格频道发布位置更新广播
    Friend->>Friend: Haversine 计算精确距离 (< 500m)
    Friend-->>Friend: UI 上更新 User A 的距离与头像`,
    files: [
      {
        name: "haversine.js",
        path: "src/v2/ch02-nearby-friends/haversine.js",
        code: `export class Haversine {
  static EARTH_RADIUS_METERS = 6371000;

  static distance(lat1, lon1, lat2, lon2) {
    const toRad = deg => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return this.EARTH_RADIUS_METERS * c;
  }
}`
      }
    ]
  },

  {
    id: "v2-ch03",
    vol: 2,
    chapter: 3,
    title: "Google Maps",
    titleZh: "设计 Google 地图：A* 启发式路径规划与瓦片金字塔坐标系",
    subtitle: "A* 欧氏距离曼哈顿启发函数道路寻路与 Web Mercator 墨卡托切片计算",
    complexity: "A*: O(E log V) 最优路况剪枝 | Slippy Tile: O(1)",
    tags: ["Google Maps", "A* Algorithm", "Pathfinding", "Web Mercator", "Tile Pyramid"],
    svgKey: null,
    context: `Google 地图需要实时为数十亿用户规划从起点到终点的行车路线，并流畅渲染高精矢量瓦片。
全世界道路网是一个包含数亿个交叉路口与路段的巨型图（Graph）。传统 Dijkstra 算法以同心圆方式无方向扩散全图搜索，计算极其昂贵。`,
    principles: `
<h4>1. A* 启发式寻路算法 (A* Heuristic Pathfinding)</h4>
<ul>
  <li>评估函数：<code>f(n) = g(n) + h(n)</code>
    <ul>
      <li><code>g(n)</code>：从起点到当前节点的实际已知通行代价（时间或距离）；</li>
      <li><code>h(n)</code>：当前节点到终点的启发式预估代价（例如直线欧几里得距离）。</li>
    </ul>
  </li>
  <li><b>定向剪枝效应：</b> 优先探索最接近目标方向的节点，避开与终点反向的大量死路路段，速度比 Dijkstra 快上百倍。</li>
</ul>

<h4>2. 滑动瓦片金字塔坐标系 (Slippy Map Tile System)</h4>
<ul>
  <li>采用 Web Mercator 投影将地球展开为方形。</li>
  <li>在缩放级别 <code>zoom = z</code> 下，世界被划分成 <code>2ᶻ × 2ᶻ</code> 块 256×256 像素的正方形瓦片。通过数学公式可以 O(1) 将 <code>(lat, lon, zoom)</code> 换算成瓦片 X, Y 坐标并直接向 CDN 请求切片。</li>
</ul>
`,
    mermaid: `graph LR
    Origin["导航起点 A"] --> AStar{"A* 启发式优先队列 (f = g + h)"}
    AStar --> Guide["启发函数引导：沿终点方向优先探索"]
    Guide --> Target["导航终点 B (耗时比 Dijkstra 减少 90%)"]`,
    files: [
      {
        name: "astar-pathfinding.js",
        path: "src/v2/ch03-google-maps/astar-pathfinding.js",
        code: `export class AStarPathfinding {
  static findPath(graph, startNode, targetNode, heuristicFn) {
    const openSet = new Set([startNode]);
    const cameFrom = new Map();
    const gScore = new Map([[startNode, 0]]);
    const fScore = new Map([[startNode, heuristicFn(startNode, targetNode)]]);

    while (openSet.size > 0) {
      let current = null;
      let lowestF = Infinity;
      for (const node of openSet) {
        const f = fScore.get(node) ?? Infinity;
        if (f < lowestF) {
          lowestF = f;
          current = node;
        }
      }

      if (current === targetNode) {
        return this._reconstructPath(cameFrom, current);
      }

      openSet.delete(current);
      const currentG = gScore.get(current) ?? Infinity;

      for (const edge of graph[current] || []) {
        const tentativeG = currentG + edge.cost;
        if (tentativeG < (gScore.get(edge.to) ?? Infinity)) {
          cameFrom.set(edge.to, current);
          gScore.set(edge.to, tentativeG);
          fScore.set(edge.to, tentativeG + heuristicFn(edge.to, targetNode));
          openSet.add(edge.to);
        }
      }
    }
    return null; // 无路径连通
  }

  static _reconstructPath(cameFrom, current) {
    const path = [current];
    while (cameFrom.has(current)) {
      current = cameFrom.get(current);
      path.unshift(current);
    }
    return path;
  }
}`
      }
    ]
  },

  {
    id: "v2-ch04",
    vol: 2,
    chapter: 4,
    title: "Distributed Message Queue",
    titleZh: "设计分布式消息队列：Kafka 顺序分段日志与稀疏索引",
    subtitle: "Append-only 顺序日志段、稀疏索引二分查找与消费组重平衡分区分配",
    complexity: "Append: O(1) 磁盘顺序写 | Read: O(log Index) 二分",
    tags: ["Message Queue", "Kafka", "Commit Log", "Sparse Index", "Partition Assignor"],
    svgKey: null,
    context: `类似 Apache Kafka 的消息引擎日吞吐量达数十万亿条消息。
传统数据库随机磁盘 I/O（~100 IOPS）在海量并发面前瞬间瘫痪。Kafka 凭借顺序写磁盘（速度堪比内存）与分段日志（Segmented Log）创造了吞吐神话。`,
    principles: `
<h4>1. 分段追加日志与稀疏索引 (Segmented Log & Sparse Index)</h4>
<ul>
  <li><b>磁盘顺序写 (Append-Only Log)：</b> 操作系统对顺序写磁盘进行了大量预读和页缓存优化，性能极高。</li>
  <li><b>分段文件 (Segments)：</b> 单个日志文件达到阈值（如 1GB）时关闭并滚动创建新 Segment，方便旧日志的清理与归档。</li>
  <li><b>稀疏索引 (Sparse Index)：</b> 不为每一条消息建索引，而是每隔固定字节（如 4KB）记录一次 <code>(offset, physicalPosition)</code>。查找消息时，先在内存中对稀疏索引做二分查找定位最近物理偏移，再顺序扫描少量字节，大幅节约内存。</li>
</ul>

<h4>2. 消费组分区分配器 (Partition Assignors)</h4>
<ul>
  <li><b>Range 分配策略：</b> 按 Topic 分区排序分段分配给消费者；</li>
  <li><b>Round-Robin 轮询分配策略：</b> 将所有 Topic 分区交错平铺，负载更加均匀。</li>
</ul>
`,
    mermaid: `graph LR
    Producer["生产者写入 Offset 102"] --> Log["Commit Log 顺序追加 (O(1))"]
    subgraph Storage ["Kafka 底层分段存储 Segment"]
      Idx["Sparse Index (.index)<br/>[Offset 100 -> Pos 0]<br/>[Offset 104 -> Pos 4096]"]
      Data["Data Log (.log)<br/>物理二进制顺序消息"]
    end
    Consumer["消费者指定 Offset 102"] --> Search["二分检索 Index 定位 Pos 0 顺序向后读"]`,
    files: [
      {
        name: "commit-log.js",
        path: "src/v2/ch04-message-queue/commit-log.js",
        code: `export class CommitLogSegment {
  constructor({ maxSegmentSize = 1000, indexInterval = 2 } = {}) {
    this.maxSegmentSize = maxSegmentSize;
    this.indexInterval = indexInterval;
    this.entries = []; // 顺序数据
    this.sparseIndex = []; // { offset, position }
  }

  append(message) {
    const offset = this.entries.length;
    const position = this.entries.length;
    if (offset % this.indexInterval === 0) {
      this.sparseIndex.push({ offset, position });
    }
    this.entries.push({ offset, message, timestamp: Date.now() });
    return offset;
  }

  read(offset) {
    if (this.sparseIndex.length === 0) return null;
    // 稀疏索引二分查找找到 <= offset 的最大条目
    let left = 0, right = this.sparseIndex.length - 1;
    let startPos = 0;
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      if (this.sparseIndex[mid].offset <= offset) {
        startPos = this.sparseIndex[mid].position;
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }
    for (let i = startPos; i < this.entries.length; i++) {
      if (this.entries[i].offset === offset) return this.entries[i];
    }
    return null;
  }
}`
      }
    ]
  },

  {
    id: "v2-ch05",
    vol: 2,
    chapter: 5,
    title: "Metrics Monitoring & Alerting System",
    titleZh: "指标监控与告警系统：时序降采样与滑动窗口告警状态机",
    subtitle: "分钟/小时级多分辨率桶聚合与基于滑动窗口阈值违规的迟滞状态转移",
    complexity: "Downsample: O(N) | Alert: O(Window Size)",
    tags: ["Metrics", "Time Series", "Downsampling", "Alerting", "State Machine"],
    svgKey: null,
    context: `类似 Prometheus、Datadog 的指标系统，每秒采集数千万条服务器 CPU、内存、网络指标。
历史数据随时间线性暴增，查询一年内的趋势如果载入每秒原始数据将撑爆内存；同时告警引擎必须防止因单个网络瞬时尖刺而产生大量误报报警。`,
    principles: `
<h4>1. 时序数据分级降采样 (Time Series Downsampling)</h4>
<ul>
  <li><b>多分辨率存储池 (Resolution Rollups)：</b>
    <ul>
      <li>原始数据保留 7 天（每 10 秒 1 个数据点）；</li>
      <li>1 分钟级降采样桶（保留 30 天，计算 <code>min, max, avg, sum, count</code>）；</li>
      <li>1 小时级降采样桶（保留 1 年）。查询长周期宏观曲线时直接读取聚合桶，速度提升几千倍。</li>
    </ul>
  </li>
</ul>

<h4>2. 滑动窗口告警状态机 (Alert Evaluator & Hysteresis)</h4>
<ul>
  <li>告警定义：“在过去 5 分钟内，CPU 使用率超过 90% 的样本数 ≥ 3 次”。</li>
  <li>状态机流转：<code>OK -> PENDING -> FIRING -> RESOLVED</code>。通过引入窗口确认期与迟滞（Hysteresis），过滤短暂抖动，确保告警真实可靠。</li>
</ul>
`,
    mermaid: `stateDiagram-v2
    [*] --> OK: 指标正常
    OK --> PENDING: 单次超过告警阈值 (> 90%)
    PENDING --> OK: 窗口内恢复正常
    PENDING --> FIRING: 滑动窗口内超限次数达到预设值 (连续 3 次)
    FIRING --> OK: 持续低于恢复阈值并持续超过静默期`,
    files: [
      {
        name: "alert-window-evaluator.js",
        path: "src/v2/ch05-metrics/alert-window-evaluator.js",
        code: `export class AlertWindowEvaluator {
  constructor({ threshold = 90, consecutiveViolationsRequired = 3 }) {
    this.threshold = threshold;
    this.requiredViolations = consecutiveViolationsRequired;
    this.history = []; // { value, timestamp }
    this.state = "OK"; // OK, PENDING, FIRING
  }

  evaluate(val, timestamp = Date.now()) {
    this.history.push({ value: val, timestamp });
    const isViolated = val >= this.threshold;

    if (this.state === "OK") {
      if (isViolated) this.state = "PENDING";
    } else if (this.state === "PENDING") {
      if (!isViolated) {
        this.state = "OK";
      } else {
        const recentViolations = this.history.slice(-this.requiredViolations);
        if (recentViolations.length >= this.requiredViolations && recentViolations.every(v => v.value >= this.threshold)) {
          this.state = "FIRING"; // 满足连续违规，正式触发告警通知！
        }
      }
    } else if (this.state === "FIRING") {
      if (!isViolated) this.state = "OK"; // 恢复
    }
    return { state: this.state, value: val };
  }
}`
      }
    ]
  },

  {
    id: "v2-ch06",
    vol: 2,
    chapter: 6,
    title: "Ad Click Event Aggregation",
    titleZh: "广告点击流实时聚合：事件时间水位线与滚动窗口",
    subtitle: "Event-Time 乱序事件迟到补偿、Watermark 推进与侧输出迟到数据",
    complexity: "Stream Window: O(1) per event",
    tags: ["Ad Aggregation", "Watermark", "Tumbling Window", "Event Time", "Flink / Spark"],
    svgKey: null,
    context: `广告系统（Google/Meta Ads）向广告主按 CPC（按点击付费）结算资金。
用户点击可能在离线/弱网设备上发生，导致事件在上报时发生严重乱序或延迟到达（网络恢复后几十秒甚至几分钟才上报）。
如果按“服务器处理时间 (Processing Time)”进行统计，会导致计费账单错乱与广告主索赔。`,
    principles: `
<h4>流计算核心机制：Event-Time 与 Watermark</h4>
<ul>
  <li><b>事件时间 (Event Time)：</b> 客户端点击行为发生的绝对时间戳；</li>
  <li><b>水位线 (Watermark)：</b> 假定最大允许延迟为 <code>t</code>，当前水位线 <code>Watermark = maxEventTimeSeen - t</code>。它代表：“系统相信，早于该水位线的所有事件都已经到达”；</li>
  <li><b>滚动窗口触发 (Tumbling Window Trigger)：</b> 当 Watermark 推进超过窗口截止时间 <code>windowEnd</code> 时，窗口闭合并对外输出结算数据；</li>
  <li><b>极晚迟到数据侧输出 (Late Event Side Output)：</b> 水位线闭合后仍有极个别极端迟到事件到达，不丢弃，将其导入侧输出流（Side Output）进行补录与账单调整。</li>
</ul>
`,
    mermaid: `graph LR
    Events["乱序广告点击流 (EventTime: t=5, t=2, t=8)"] --> WM["Watermark 计算器 (Watermark = MaxSeen - 3)"]
    WM --> Window["10 秒滚动窗口 [0, 10s)"]
    Window -- "Watermark ≥ 10s" --> Emit["闭合窗口，精确结算输出 CPC 费用"]
    Window -- "已闭合后迟到事件" --> SideOutput["侧输出流 (人工核算 / 差异调整)"]`,
    files: [
      {
        name: "watermark-stream-window.js",
        path: "src/v2/ch06-ad-aggregation/watermark-stream-window.js",
        code: `export class WatermarkStreamWindow {
  constructor({ windowSizeMs = 10000, maxOutOfOrderMs = 2000 }) {
    this.windowSizeMs = windowSizeMs;
    this.maxOutOfOrderMs = maxOutOfOrderMs;
    this.maxEventTime = 0;
    this.windows = new Map(); // windowStart -> { count, revenue, end }
    this.lateEvents = [];
  }

  processEvent({ eventTime, adId, bidPrice }) {
    this.maxEventTime = Math.max(this.maxEventTime, eventTime);
    const watermark = this.maxEventTime - this.maxOutOfOrderMs;

    const windowStart = Math.floor(eventTime / this.windowSizeMs) * this.windowSizeMs;
    const windowEnd = windowStart + this.windowSizeMs;

    // 检查该窗口是否已经因水位线越过而关闭
    if (windowEnd <= watermark) {
      this.lateEvents.push({ eventTime, adId, bidPrice, reason: "LATE_EVENT_AFTER_WATERMARK" });
      return;
    }

    if (!this.windows.has(windowStart)) {
      this.windows.set(windowStart, { count: 0, revenue: 0, end: windowEnd });
    }
    const win = this.windows.get(windowStart);
    win.count++;
    win.revenue += bidPrice;
  }
}`
      }
    ]
  },

  {
    id: "v2-ch07",
    vol: 2,
    chapter: 7,
    title: "Hotel Reservation System",
    titleZh: "酒店客房预订系统：多日期原子锁与乐观锁超时防超卖",
    subtitle: "跨连续日期库存原子扣减、乐观版本号并发控制与未支付超时释放",
    complexity: "Reservation: O(Days) | Invariant: Remaining Inventory ≥ 0",
    tags: ["Hotel Reservation", "Inventory", "Optimistic Locking", "TTL Hold", "Overbooking Prevention"],
    svgKey: null,
    context: `Airbnb、Booking 酒店预订必须支持“用户预订 5 月 1 日至 5 月 5 日（跨连续多天）”。
高并发下多个用户同时抢订同一间房时，必须确保绝对不发生“超卖 (Overbooking)”，同时如果用户下单后超过 15 分钟未支付，锁定的库存必须自动精确回滚释放。`,
    principles: `
<h4>核心设计原理</h4>
<ul>
  <li><b>按日期粒度的库存表 (Inventory by Date)：</b>
    每个房型在每个独立日历日期拥有各自的 <code>totalInventory</code> 和 <code>reservedCount</code>。连续住 3 天必须原子扣减全部 3 天的库存。</li>
  <li><b>乐观锁并发控制 (Optimistic Locking with Version)：</b>
    在更新时利用 SQL 谓词原子保证：<code>UPDATE inventory SET reserved = reserved + 1, version = version + 1 WHERE date = ? AND (total - reserved) >= 1 AND version = ?</code>。若版本冲突则回滚重试。</li>
  <li><b>带 TTL 的临时占座队列 (Hold with Lease)：</b>
    订单创建时置为 <code>HOLD</code> 状态，启动 15 分钟倒计时。若在超时前支付完成，转为 <code>CONFIRMED</code>；超时未支付，自动将库存还回库存池。</li>
</ul>
`,
    mermaid: `sequenceDiagram
    participant User as 抢房用户
    participant Service as 预订核心服务
    participant DB as 关系型库存数据库 (带版本号)

    User->>Service: 预订 [2026-05-01 ~ 2026-05-03]
    Service->>DB: 检查连续 3 天库存并原子锁定 (HOLD, Version+1)
    alt 库存充足
      DB-->>Service: 锁定成功，生成 15 分钟支付倒计时 Lease
      Service-->>User: 返回待支付订单
    else 某天满房
      DB-->>Service: 锁定失败 (库存不足或版本冲突)
      Service-->>User: 提示无房，绝不超卖
    end`,
    files: [
      {
        name: "inventory-reservation.js",
        path: "src/v2/ch07-hotel-reserve/inventory-reservation.js",
        code: `export class InventoryReservationManager {
  constructor() {
    this.inventory = new Map(); // dateStr -> { total, reserved, version }
    this.holds = new Map(); // reservationId -> { dates, expiresAt, status }
  }

  setInventory(dateStr, total) {
    this.inventory.set(dateStr, { total, reserved: 0, version: 1 });
  }

  reserveHold(reservationId, dates, ttlMs = 15 * 60 * 1000) {
    // 1. 验证全部日期是否可用
    for (const d of dates) {
      const inv = this.inventory.get(d);
      if (!inv || (inv.total - inv.reserved) <= 0) {
        return { success: false, reason: \`Date \${d} is fully booked!\` };
      }
    }
    // 2. 原子扣减
    for (const d of dates) {
      const inv = this.inventory.get(d);
      inv.reserved++;
      inv.version++;
    }
    this.holds.set(reservationId, {
      dates,
      expiresAt: Date.now() + ttlMs,
      status: "HOLD"
    });
    return { success: true, reservationId };
  }

  releaseExpiredHold(reservationId) {
    const hold = this.holds.get(reservationId);
    if (!hold || hold.status !== "HOLD") return;
    for (const d of hold.dates) {
      const inv = this.inventory.get(d);
      if (inv) inv.reserved = Math.max(0, inv.reserved - 1);
    }
    hold.status = "EXPIRED";
  }
}`
      }
    ]
  },

  {
    id: "v2-ch08",
    vol: 2,
    chapter: 8,
    title: "Distributed Email Search",
    titleZh: "分布式全文邮件检索：倒排索引与布尔求交并",
    subtitle: "分词清洗、倒排表 Posting List 升序压缩与双指针 O(M + N) 布尔检索",
    complexity: "Boolean AND: O(M + N) 双指针 | Term Lookup: O(1)",
    tags: ["Email Search", "Inverted Index", "Posting List", "Boolean Search", "Lucene / Elastic"],
    svgKey: null,
    context: `Gmail、Outlook 用户拥有数万封电子邮件，需要通过关键词如 <code>"contract AND urgent NOT spam"</code> 瞬间定位相关邮件。
线性扫描每封邮件正文耗时巨大。类似 Elasticsearch、Lucene 的核心秘密就是<b>倒排索引 (Inverted Index)</b>。`,
    principles: `
<h4>倒排索引构建与查询加速原语</h4>
<ul>
  <li><b>正排索引 vs 倒排索引：</b>
    <ul>
      <li>正排索引：<code>Document ID -> [Word1, Word2, Word3]</code>；</li>
      <li>倒排索引：<code>Term (分词) -> Posting List (包含该词的升序 DocID 数组)</code>。</li>
    </ul>
  </li>
  <li><b>双指针求交集算法 (Boolean AND)：</b>
    查询 <code>"system" AND "design"</code> 时，分别获取其倒排表 <code>L1 = [1, 5, 8, 12]</code>，<code>L2 = [2, 5, 12, 14]</code>。
    利用双指针由小到大同步推进：相等则记录结果；较小者指针向右移。时间复杂度从 O(M × N) 骤降至严格的 <b>O(M + N)</b>！</li>
</ul>
`,
    mermaid: `graph LR
    subgraph Docs ["文档入库分词"]
      D1["Doc 1: 'system design'"]
      D2["Doc 2: 'distributed system'"]
    end
    Docs --> Indexer["倒排索引解析器"]
    subgraph InvertedIndex ["倒排表 (Posting Lists)"]
      T1["'system' -> [1, 2]"]
      T2["'design' -> [1]"]
      T3["'distributed' -> [2]"]
    end
    Query["搜索: 'system' AND 'design'"] --> Intersection["双指针求交集 -> 返回 Doc 1"]`,
    files: [
      {
        name: "inverted-index.js",
        path: "src/v2/ch08-email-search/inverted-index.js",
        code: `export class InvertedIndex {
  constructor() {
    this.index = new Map(); // term -> sorted array of docIds
    this.documents = new Map(); // docId -> content
  }

  addDocument(docId, text) {
    this.documents.set(docId, text);
    const tokens = this._tokenize(text);
    for (const token of tokens) {
      if (!this.index.has(token)) {
        this.index.set(token, []);
      }
      const list = this.index.get(token);
      if (list[list.length - 1] !== docId) {
        list.push(docId); // 保证有序
      }
    }
  }

  searchAnd(term1, term2) {
    const list1 = this.index.get(term1.toLowerCase()) || [];
    const list2 = this.index.get(term2.toLowerCase()) || [];
    // 双指针求交 O(M + N)
    const result = [];
    let p1 = 0, p2 = 0;
    while (p1 < list1.length && p2 < list2.length) {
      if (list1[p1] === list2[p2]) {
        result.push(list1[p1]);
        p1++;
        p2++;
      } else if (list1[p1] < list2[p2]) {
        p1++;
      } else {
        p2++;
      }
    }
    return result;
  }

  _tokenize(text) {
    return text.toLowerCase().match(/\\b[a-z0-9]+\\b/g) || [];
  }
}`
      }
    ]
  },

  {
    id: "v2-ch09",
    vol: 2,
    chapter: 9,
    title: "S3-like Object Storage",
    titleZh: "设计类 S3 对象存储：纠删码 (Erasure Coding) 与数据自愈",
    subtitle: "Reed-Solomon RS(N, M) 校验矩阵编码与损毁数据块逆矩阵代数重建",
    complexity: "Reconstruction: Matrix Inversion | Storage Overhead: (N + M) / N",
    tags: ["S3", "Object Storage", "Erasure Coding", "Reed-Solomon", "Data Durability"],
    svgKey: null,
    context: `AWS S3、Google Cloud Storage 承诺高达 99.999999999%（11个9）的数据持久性。
如果全部采用传统三副本（3x Replication），存储开销为 200%（每 1PB 数据需消耗 3PB 磁盘）。
使用纠删码（Erasure Coding）技术，存储开销降至 50% 甚至更低，且能抵御同时宕机多台机器的极端灾难。`,
    principles: `
<h4>Reed-Solomon (RS) 纠删码代数原理</h4>
<ul>
  <li><b>RS(N, M) 编码：</b> 将原始数据切分为 <code>N</code> 个数据块（Data Chunks），通过线性代数矩阵运算生成 <code>M</code> 个奇偶校验块（Parity Chunks），总共分布存储在 <code>N + M</code> 台独立物理节点上。</li>
  <li><b>极高容错性：</b> 只要任意 <code>N</code> 个块存活（即最多允许丢失 <code>M</code> 个块），就可以通过高斯消元求逆矩阵完整恢复原始数据！</li>
  <li><b>存储成本对比：</b>
    <ul>
      <li>3 副本容错 2 节点故障：存储开销 <b>300%</b>；</li>
      <li>RS(4, 2) 容错 2 节点故障：存储开销仅为 <code>(4 + 2) / 4 = </code> <b>150%</b>！为数据中心省下数亿美元硬件成本。</li>
    </ul>
  </li>
</ul>
`,
    mermaid: `graph TD
    Data["用户大文件 (例如 400 MB)"] --> Chunks["切分为 4 个数据块 (D1, D2, D3, D4)"]
    Chunks --> RSMatrix["Reed-Solomon 编码矩阵乘法"]
    RSMatrix --> Parity["生成 2 个奇偶校验块 (P1, P2)"]
    Parity --> Nodes["分布式存放于 6 台独立机器"]
    Nodes -- "发生火灾！D1 与 D3 机器损毁" --> Recover["只要剩余 4 块存活 (D2, D4, P1, P2)，即可通过逆矩阵精确还原 D1 与 D3!"]`,
    files: [
      {
        name: "erasure-coding.js",
        path: "src/v2/ch09-s3-storage/erasure-coding.js",
        code: `export class ErasureCodingSimulator {
  constructor({ dataBlocks = 4, parityBlocks = 2 }) {
    this.n = dataBlocks;
    this.m = parityBlocks;
  }

  encode(dataArray) {
    if (dataArray.length !== this.n) throw new Error(\`Need exactly \${this.n} data blocks\`);
    const encoded = [...dataArray];
    // 仿真简单的异或与线性校验块生成
    let p1 = 0, p2 = 0;
    for (let i = 0; i < this.n; i++) {
      p1 ^= dataArray[i];
      p2 ^= (dataArray[i] * (i + 1));
    }
    encoded.push(p1, p2);
    return encoded; // 长度为 n + m
  }

  canReconstruct(availableBlocksCount) {
    // 核心定理：只要存活块数量 >= N，即可 100% 重建
    return availableBlocksCount >= this.n;
  }
}`
      }
    ]
  },

  {
    id: "v2-ch10",
    vol: 2,
    chapter: 10,
    title: "Real-time Gaming Leaderboard",
    titleZh: "实时百万级游戏排行榜：跳表 (Skip List) 与 Redis ZSET",
    subtitle: "前向指针跨度 (Span) 计算、对数级 O(log N) 排名查询与 Top-K 获取",
    complexity: "Rank / Insert / Delete: O(log N) | Space: O(N)",
    tags: ["Leaderboard", "Skip List", "Redis ZSET", "Span", "O(log N) Rank"],
    svgKey: "skipList",
    context: `千万玩家在线的竞技游戏（如王者荣耀、原神），要求在玩家得分变动后，立刻在排行榜上展示其实时排名（如“第 4,219 名”），并流畅展示全服前 100 名。
如果用数据库 <code>COUNT(*) WHERE score > my_score</code>，高并发下全表扫描会瞬间导致数据库瘫痪。`,
    principles: `
<h4>跳表 (Skip List) 核心数据结构原理</h4>
<ul>
  <li><b>为什么 Redis ZSET 选择跳表而不是红黑树？</b>
    跳表实现简单、内存开销小、无复杂的旋转再平衡（Rebalance）逻辑，更关键的是<b>极易进行范围查询（Range Scan）与分片</b>。</li>
  <li><b>多层索引加速：</b>
    底层的 Level 0 是完整的单向链表；每向上升一层（Level 1, Level 2...），节点以概率 <code>p = 0.25</code> 晋升。上层索引充当“快进通道”，使查找复杂度收敛至 <code>O(log N)</code>。</li>
  <li><b>跨度计数器 (Span) 实现 O(log N) 排名：</b>
    在跳表的每个前向指针上记录 <code>span</code>（表示该指针跨越了底层多少个实际节点）。从 Head 查找目标分数时，将沿途所有经过的高层跨度 <code>span</code> 累加，无需遍历底层链表，直接以 <b>O(log N)</b> 精确算出全服排名！</li>
</ul>
`,
    mermaid: `graph LR
    subgraph Level2 ["Level 2 高速跳跃"]
      H2["Head (L2)"] -->|span=3| N4_2["Score: 90 (L2)"]
    end
    subgraph Level1 ["Level 1 中速索引"]
      H1["Head (L1)"] -->|span=1| N2_1["Score: 50 (L1)"]
      N2_1 -->|span=2| N4_1["Score: 90 (L1)"]
    end
    subgraph Level0 ["Level 0 基础全量链表 (Span 累加得出 Rank)"]
      H0["Head (L0)"] --> N1["Score: 20"]
      N1 --> N2["Score: 50"]
      N2 --> N3["Score: 75"]
      N3 --> N4["Score: 90"]
    end`,
    files: [
      {
        name: "skip-list.js",
        path: "src/v2/ch10-leaderboard/skip-list.js",
        code: `class SkipNode {
  constructor(member, score, level) {
    this.member = member;
    this.score = score;
    this.forward = new Array(level).fill(null);
    this.span = new Array(level).fill(0);
  }
}

export class SkipListLeaderboard {
  constructor(maxLevel = 16) {
    this.maxLevel = maxLevel;
    this.level = 1;
    this.head = new SkipNode(null, -Infinity, maxLevel);
    this.dict = new Map(); // member -> score
  }

  insert(member, score) {
    const update = new Array(this.maxLevel);
    const rank = new Array(this.maxLevel).fill(0);
    let curr = this.head;

    for (let i = this.level - 1; i >= 0; i--) {
      rank[i] = i === this.level - 1 ? 0 : rank[i + 1];
      while (curr.forward[i] && (curr.forward[i].score < score || (curr.forward[i].score === score && curr.forward[i].member < member))) {
        rank[i] += curr.span[i];
        curr = curr.forward[i];
      }
      update[i] = curr;
    }

    const newLevel = this._randomLevel();
    if (newLevel > this.level) {
      for (let i = this.level; i < newLevel; i++) {
        rank[i] = 0;
        update[i] = this.head;
        update[i].span[i] = this.dict.size;
      }
      this.level = newLevel;
    }

    const newNode = new SkipNode(member, score, newLevel);
    for (let i = 0; i < newLevel; i++) {
      newNode.forward[i] = update[i].forward[i];
      update[i].forward[i] = newNode;
      newNode.span[i] = update[i].span[i] - (rank[0] - rank[i]);
      update[i].span[i] = (rank[0] - rank[i]) + 1;
    }
    this.dict.set(member, score);
  }

  getRank(member) {
    const targetScore = this.dict.get(member);
    if (targetScore === undefined) return null;
    let rank = 0;
    let curr = this.head;
    for (let i = this.level - 1; i >= 0; i--) {
      while (curr.forward[i] && (curr.forward[i].score < targetScore || (curr.forward[i].score === targetScore && curr.forward[i].member <= member))) {
        rank += curr.span[i];
        curr = curr.forward[i];
      }
      if (curr.member === member) return rank;
    }
    return rank;
  }

  _randomLevel() {
    let lvl = 1;
    while (Math.random() < 0.25 && lvl < this.maxLevel) lvl++;
    return lvl;
  }
}`
      }
    ]
  },

  {
    id: "v2-ch11",
    vol: 2,
    chapter: 11,
    title: "Payment System",
    titleZh: "高可靠支付系统：复式记账恒等式与两方/三方资金对账",
    subtitle: "借贷平衡 资产 = 负债 + 所有者权益，与结算差错平账扫描",
    complexity: "Ledger Transaction: O(Entries) | Invariant: Sum(Debit) == Sum(Credit)",
    tags: ["Payment", "Double-Entry Ledger", "Reconciliation", "Financial Accounting", "Balance Sheet"],
    svgKey: "doubleEntry",
    context: `Stripe、PayPal 或电商支付核心系统，直接涉及真实资金。
单式记账（只存一个 balance 字段执行 balance = balance - 100）在数据库死锁、部分写入失败时极易凭空产生或丢失资金。工业级支付系统必须严格遵循有着 500 年历史的<b>复式记账法 (Double-Entry Bookkeeping)</b>。`,
    principles: `
<h4>1. 复式记账法三大黄金法则 (Double-Entry Bookkeeping)</h4>
<ul>
  <li><b>恒等式永不破缺：</b> <code>资产 (Assets) = 负债 (Liabilities) + 所有者权益 (Equity)</code></li>
  <li><b>有借必有贷，借贷必相等：</b> 任何一笔资金流转必须至少记录两条明细分录（一条 Debit，一条 Credit）。
    <ul>
      <li>例如用户向平台充值 100 元：
        <code>平台银行存款 (资产) [Debit: +100]</code>，
        <code>用户电子钱包 (平台负债) [Credit: +100]</code>。</li>
    </ul>
  </li>
  <li>每个事务提交前，数据库层断言检查 <code>SUM(Debits) === SUM(Credits)</code>，否则立即强制回滚并报警。</li>
</ul>

<h4>2. 资金核对与对账系统 (Reconciliation)</h4>
<ul>
  <li>每天深夜获取银行对账单（Bank Statement）与内部支付流水明细进行逐笔匹配。</li>
  <li>若出现内部已扣款但银行无流水、或银行扣款成功内部超时的差异单，归类进入差错池，驱动自动冲正或人工排查。</li>
</ul>
`,
    mermaid: `graph LR
    subgraph Transaction ["一笔 100 元支付原子事务"]
      E1["分录 1: 用户钱包 (负债减少) Debit: $100"]
      E2["分录 2: 商家结算应付款 (负债增加) Credit: $100"]
    end
    Transaction --> Verify{"借贷平衡断言: Sum(Debits) == Sum(Credits)?"}
    Verify -- "相等" --> Commit["持久化 Ledger 账本，不可篡改"]
    Verify -- "不相等" --> Abort["拒绝写入，防范资金凭空增减"]`,
    files: [
      {
        name: "double-entry-ledger.js",
        path: "src/v2/ch11-payment/double-entry-ledger.js",
        code: `export class DoubleEntryLedger {
  constructor() {
    this.accounts = new Map(); // id -> { name, type, balance }
    this.journalEntries = [];
  }

  recordTransaction({ id, entries, timestamp = Date.now() }) {
    let totalDebit = 0;
    let totalCredit = 0;

    for (const e of entries) {
      if (e.direction === "DEBIT") totalDebit += e.amount;
      else if (e.direction === "CREDIT") totalCredit += e.amount;
      else throw new Error("Invalid direction");
    }

    // 核心不变量：借贷绝对平衡
    if (Math.abs(totalDebit - totalCredit) > 0.0001) {
      throw new Error(\`Double-entry imbalance! Debit: \${totalDebit}, Credit: \${totalCredit}\`);
    }

    for (const e of entries) {
      const acc = this.accounts.get(e.accountId);
      if (!acc) throw new Error(\`Account not found: \${e.accountId}\`);
      // 资产/费用类科目借增贷减；负债/权益/收入类科目贷增借减
      if (acc.type === "ASSET") {
        acc.balance += (e.direction === "DEBIT" ? e.amount : -e.amount);
      } else if (acc.type === "LIABILITY") {
        acc.balance += (e.direction === "CREDIT" ? e.amount : -e.amount);
      }
    }

    this.journalEntries.push({ id, entries, timestamp });
  }
}`
      }
    ]
  },

  {
    id: "v2-ch12",
    vol: 2,
    chapter: 12,
    title: "Digital Wallet",
    titleZh: "分布式数字钱包：Saga 编排器补偿与两阶段提交 2PC",
    subtitle: "长事务正向执行与逆向补偿、强一致性 Prepare / Commit 协调机制",
    complexity: "Saga: Eventual Consistency | 2PC: Strong Consistency Locking",
    tags: ["Digital Wallet", "Distributed Transaction", "Saga Pattern", "2PC", "Compensating Action"],
    svgKey: null,
    context: `钱包转账（用户 A 转账 500 元至用户 B）通常涉及跨微服务甚至跨数据库（A 的账户在分库 1，B 在分库 2）。
分布式环境下无法使用单机本地事务保证 ACID，如何确保资金绝不处于悬挂半转状态是系统设计的核心考验。`,
    principles: `
<h4>分布式事务两大解决方案对比</h4>
<ol>
  <li><b>Saga 模式 (长事务与最终一致性 - 互联网微服务首选)：</b>
    <ul>
      <li>将大事务拆分成一系列有序的本地小事务 <code>T1, T2, T3...</code>。</li>
      <li>每个小事务定义对应的<b>逆向补偿操作 (Compensating Transaction)</b> <code>C1, C2, C3...</code>。</li>
      <li>如果执行到 <code>T3</code> 失败（如收款方账户冻结），Saga 编排器按逆序执行 <code>C2, C1</code>（如将扣减的资金重新退回付款方），最终恢复系统一致性，避免全局死锁。</li>
    </ul>
  </li>
  <li><b>两阶段提交 (2PC - 强一致性锁定)：</b>
    <ul>
      <li><b>阶段 1 (Prepare)：</b> 协调者询问所有参与者“是否准备好？”，参与者锁定资源并返回 YES；</li>
      <li><b>阶段 2 (Commit)：</b> 若全部 YES 则执行提交；若有任一 NO 则通知全体 Abort 回滚。缺点是阻塞性强，吞吐量较低。</li>
    </ul>
  </li>
</ol>
`,
    mermaid: `sequenceDiagram
    participant Orchestrator as Saga 编排器
    participant ServiceA as 付款服务 A
    participant ServiceB as 收款服务 B

    Orchestrator->>ServiceA: 执行 T1: 扣减 A 500元
    ServiceA-->>Orchestrator: T1 成功
    Orchestrator->>ServiceB: 执行 T2: 增加 B 500元
    ServiceB-->>Orchestrator: T2 失败 (账户冻结)
    Note over Orchestrator: 触发 Saga 逆向补偿流程!
    Orchestrator->>ServiceA: 执行 C1: 补还 A 500元
    ServiceA-->>Orchestrator: 补偿成功，资金安全还原`,
    files: [
      {
        name: "saga-orchestrator.js",
        path: "src/v2/ch12-wallet/saga-orchestrator.js",
        code: `export class SagaOrchestrator {
  constructor() {
    this.steps = []; // { name, executeFn, compensateFn }
  }

  addStep(name, executeFn, compensateFn) {
    this.steps.push({ name, executeFn, compensateFn });
    return this;
  }

  async execute() {
    const executedSteps = [];
    for (const step of this.steps) {
      try {
        await step.executeFn();
        executedSteps.push(step);
      } catch (err) {
        // 某一步失败，逆向触发所有已成功步骤的补偿操作
        for (let i = executedSteps.length - 1; i >= 0; i--) {
          try {
            await executedSteps[i].compensateFn();
          } catch (compensateErr) {
            console.error(\`Fatal compensation failure at \${executedSteps[i].name}\`, compensateErr);
          }
        }
        return { success: false, failedAt: step.name, error: err.message };
      }
    }
    return { success: true };
  }
}`
      }
    ]
  },

  {
    id: "v2-ch13",
    vol: 2,
    chapter: 13,
    title: "Stock Exchange",
    titleZh: "证券股票交易所：订单簿 (LOB) 撮合引擎",
    subtitle: "买卖双向深度阶梯、价格优先与时间优先 (Price-Time Priority FIFO)",
    complexity: "Match: O(1) Top of Book | Insert: O(log P) 价格槽定位",
    tags: ["Stock Exchange", "Matching Engine", "Limit Order Book", "FIFO", "Price-Time Priority"],
    svgKey: "orderBook",
    context: `纳斯达克、纽交所、加密货币交易平台，核心是撮合买卖双方意愿。
市场每秒涌入数十万笔限价单（Limit Order）与市价单（Market Order）。撮合引擎必须遵循绝对的公平、确定性与微秒级低延迟。`,
    principles: `
<h4>限价订单簿 (Limit Order Book) 撮合核心机制</h4>
<ul>
  <li><b>双向订单簿结构：</b>
    <ul>
      <li><b>买单列表 (Bids)：</b> 按价格由高到低（降序）排序；</li>
      <li><b>卖单列表 (Asks)：</b> 按价格由低到高（升序）排序；</li>
      <li><b>买卖价差 (Bid-Ask Spread)：</b> 最低卖价与最高买价之差。当最高买价 ≥ 最低卖价时，立即触发成交！</li>
    </ul>
  </li>
  <li><b>价格优先，时间优先 (Price-Time Priority FIFO)：</b>
    <ul>
      <li>价格更优的订单永远排在前面优先撮合；</li>
      <li>相同价格档位上的订单，形成一条严格的先进先出 (FIFO) 双向链表，先提交的订单享有优先成交权。</li>
    </ul>
  </li>
</ul>
`,
    mermaid: `graph TD
    Order["新订单到达: 买入 100 股 @ $100.25"] --> MatchCheck{"检查对侧最佳卖价 Best Ask"}
    MatchCheck -- "Best Ask ≤ $100.25 (如 $100.20)" --> Trade["立即撮合匹配！生成成交单 (Trades)"]
    Trade --> Remaining{"订单是否还有未成交剩余股数?"}
    Remaining -- "有剩余" --> Enqueue["挂入 Bids 买单对应价格队列尾部 (FIFO)"]
    Remaining -- "完全成交" --> Done["结束"]
    MatchCheck -- "Best Ask > $100.25" --> Enqueue`,
    files: [
      {
        name: "matching-engine.js",
        path: "src/v2/ch13-exchange/matching-engine.js",
        code: `export class MatchingEngine {
  constructor() {
    this.bids = []; // 买单：价格降序 [{ price, orders: [] }]
    this.asks = []; // 卖单：价格升序 [{ price, orders: [] }]
  }

  submitLimitOrder(order) {
    const trades = [];
    if (order.side === "BUY") {
      this._matchBuy(order, trades);
    } else {
      this._matchSell(order, trades);
    }
    return trades;
  }

  _matchBuy(order, trades) {
    while (this.asks.length > 0 && order.quantity > 0) {
      const bestAskLevel = this.asks[0];
      if (order.price < bestAskLevel.price) break; // 无法跨越价差

      const restingOrder = bestAskLevel.orders[0];
      const matchQty = Math.min(order.quantity, restingOrder.quantity);

      trades.push({
        makerOrderId: restingOrder.id,
        takerOrderId: order.id,
        price: restingOrder.price, // 被挂单方价格优先成交
        quantity: matchQty
      });

      order.quantity -= matchQty;
      restingOrder.quantity -= matchQty;

      if (restingOrder.quantity === 0) {
        bestAskLevel.orders.shift();
        if (bestAskLevel.orders.length === 0) this.asks.shift();
      }
    }
    // 未完全成交部分挂单
    if (order.quantity > 0) {
      this._addRestingOrder(this.bids, order, (a, b) => b - a); // 降序
    }
  }

  _matchSell(order, trades) {
    while (this.bids.length > 0 && order.quantity > 0) {
      const bestBidLevel = this.bids[0];
      if (order.price > bestBidLevel.price) break;

      const restingOrder = bestBidLevel.orders[0];
      const matchQty = Math.min(order.quantity, restingOrder.quantity);

      trades.push({
        makerOrderId: restingOrder.id,
        takerOrderId: order.id,
        price: restingOrder.price,
        quantity: matchQty
      });

      order.quantity -= matchQty;
      restingOrder.quantity -= matchQty;

      if (restingOrder.quantity === 0) {
        bestBidLevel.orders.shift();
        if (bestBidLevel.orders.length === 0) this.bids.shift();
      }
    }
    if (order.quantity > 0) {
      this._addRestingOrder(this.asks, order, (a, b) => a - b); // 升序
    }
  }

  _addRestingOrder(book, order, compareFn) {
    let level = book.find(l => l.price === order.price);
    if (!level) {
      level = { price: order.price, orders: [] };
      book.push(level);
      book.sort((a, b) => compareFn(a.price, b.price));
    }
    level.orders.push(order);
  }
}`
      }
    ]
  }
];
