/**
 * @file commit-log.js
 * @description 第二卷 第04章：分布式消息队列 (Distributed Message Queue)
 * 经典数据结构/算法：分段追加提交日志与稀疏索引二分查找 (Segmented Commit Log & Sparse Index)
 *
 * 【系统设计背景】：
 * 在现代分布式消息队列（如 Apache Kafka、Pulsar）中，极高吞吐的核心秘密在于：
 * 1. 顺序磁盘追加写 (Sequential Append-Only Log): 磁盘顺序写性能接近甚至超过随机内存写。
 * 2. 分段存储 (Log Segments): 单个分区随着数据积累会极其庞大，通过拆分成固定大小的分段段文件（Segment），便于过期清理。
 * 3. 稀疏索引 (Sparse Index): 不需要为每条消息都建立索引项，而是每隔 N 条消息（或每隔几 KB）记录一个索引项：
 *    `[LogicalOffset -> PhysicalPosition]`。
 *    检索任意偏移量 offset 时，通过**二分查找**稀疏索引定位最近的物理起始点，再顺序扫描极少数据即可命中，大幅节省内存！
 */

export class LogSegment {
  /**
   * @param {number} baseOffset - 本分段的首个逻辑偏移量
   * @param {number} [indexInterval=4] - 稀疏索引记录间隔（每 N 条记录一条索引）
   */
  constructor(baseOffset, indexInterval = 4) {
    this.baseOffset = baseOffset;
    this.indexInterval = indexInterval;

    this.messages = []; // 模拟顺序存储的消息体
    // 稀疏索引数组: Array<{ offset: number, physicalPosition: number }>
    this.sparseIndex = [];
  }

  /**
   * 追加写入一条消息
   * @param {*} payload
   * @returns {number} 写入后的全局逻辑偏移量 offset
   */
  append(payload) {
    const currentOffset = this.baseOffset + this.messages.length;
    const physicalPos = this.messages.length;

    // 稀疏索引：每隔 indexInterval 条消息记录一次索引
    if (this.messages.length % this.indexInterval === 0) {
      this.sparseIndex.push({
        offset: currentOffset,
        physicalPosition: physicalPos,
      });
    }

    this.messages.push({
      offset: currentOffset,
      payload,
      timestamp: Date.now(),
    });

    return currentOffset;
  }

  /**
   * 根据逻辑 offset 查找消息 (结合稀疏索引二分查找与小范围顺序扫描)
   * @param {number} targetOffset
   * @returns {*} 消息体
   */
  read(targetOffset) {
    if (targetOffset < this.baseOffset || targetOffset >= this.baseOffset + this.messages.length) {
      return null;
    }

    // 1. 二分查找稀疏索引：找出 <= targetOffset 的最大索引项
    let low = 0;
    let high = this.sparseIndex.length - 1;
    let startPos = 0;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (this.sparseIndex[mid].offset <= targetOffset) {
        startPos = this.sparseIndex[mid].physicalPosition;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    // 2. 从 startPos 开始局部顺序扫描 (最多扫描 indexInterval 条)
    for (let pos = startPos; pos < this.messages.length; pos++) {
      if (this.messages[pos].offset === targetOffset) {
        return this.messages[pos];
      }
    }

    return null;
  }

  get size() {
    return this.messages.length;
  }
}

export class PartitionCommitLog {
  /**
   * @param {number} [segmentMaxMessages=10] - 单分段最大容量，超额自动切新 Segment
   */
  constructor(segmentMaxMessages = 10) {
    this.segmentMaxMessages = segmentMaxMessages;
    this.segments = [new LogSegment(0)];
  }

  append(payload) {
    let activeSegment = this.segments[this.segments.length - 1];

    if (activeSegment.size >= this.segmentMaxMessages) {
      // 达到容量，滚动生成新分段
      const nextBaseOffset = activeSegment.baseOffset + activeSegment.size;
      activeSegment = new LogSegment(nextBaseOffset);
      this.segments.push(activeSegment);
    }

    return activeSegment.append(payload);
  }

  read(offset) {
    // 找出包含该 offset 的分段
    for (let i = this.segments.length - 1; i >= 0; i--) {
      const seg = this.segments[i];
      if (offset >= seg.baseOffset) {
        return seg.read(offset);
      }
    }
    return null;
  }
}

// --- 演示与自测代码 ---
if (process.argv[1] && process.argv[1].endsWith('commit-log.js')) {
  console.log('=== 分段追加日志与稀疏索引二分查找演示 ===');
  const commitLog = new PartitionCommitLog(5); // 每 5 条切一个分段

  console.log('1. 连续追加写入 12 条消息:');
  for (let i = 0; i < 12; i++) {
    const offset = commitLog.append(`OrderEvent_${i}`);
    process.stdout.write(`[msg_${i}->off:${offset}] `);
  }

  console.log(`\n分段总数: ${commitLog.segments.length}`);
  commitLog.segments.forEach((seg, idx) => {
    console.log(`- Segment #${idx}: baseOffset=${seg.baseOffset}, 稀疏索引项数=${seg.sparseIndex.length}, 消息数=${seg.size}`);
  });

  console.log('\n2. 随机读取 offset=7 的消息:');
  const msg7 = commitLog.read(7);
  console.log('读取命中:', msg7);
}
