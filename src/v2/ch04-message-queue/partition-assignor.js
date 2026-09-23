/**
 * @file partition-assignor.js
 * @description 第二卷 第04章：分布式消息队列 (Distributed Message Queue)
 * 经典算法：消费组再均衡与分区分配策略 (Consumer Group Rebalance & Partition Assignor)
 *
 * 【系统设计背景】：
 * 在 Kafka / RocketMQ 等分布式消息队列中，消费组 (Consumer Group) 允许多个消费者协同并行消费一个主题。
 * 原则：**同一个分区在同一个消费组内，同一时刻只能被分配给一个消费者**（保证分区内消息严格有序）。
 * 当有新消费者加入、崩溃或者分区扩容时，集群触发“再均衡 (Rebalance)”，重新计算分区分配映射。
 *
 * 【两种经典分配策略】：
 * 1. 范围分配策略 (Range Assignor - Kafka 默认之一):
 *    - 将分区总数按顺序平分给消费者；多出的余数依序优先分给前几个消费者。
 * 2. 轮询分配策略 (Round-Robin Assignor):
 *    - 将所有分区按环形交替逐一分配给消费者，追求最大化数量均匀。
 */

export class PartitionAssignor {
  /**
   * 范围分配算法 (Range Assignor)
   * @param {string[]} partitions - 分区 ID 列表 (例如: ['P0', 'P1', 'P2', 'P3'])
   * @param {string[]} consumers - 消费者 ID 列表 (例如: ['C1', 'C2'])
   * @returns {Map<string, string[]>} consumerId -> partitions
   */
  static assignRange(partitions, consumers) {
    const sortedPartitions = [...partitions].sort();
    const sortedConsumers = [...consumers].sort();

    const assignment = new Map();
    for (const c of sortedConsumers) {
      assignment.set(c, []);
    }

    if (sortedConsumers.length === 0 || sortedPartitions.length === 0) {
      return assignment;
    }

    const numPartitions = sortedPartitions.length;
    const numConsumers = sortedConsumers.length;

    const baseCount = Math.floor(numPartitions / numConsumers);
    const remainder = numPartitions % numConsumers;

    let partitionIdx = 0;
    for (let i = 0; i < numConsumers; i++) {
      const consumer = sortedConsumers[i];
      // 前 remainder 个消费者额外多分 1 个分区
      const count = baseCount + (i < remainder ? 1 : 0);
      const allocated = sortedPartitions.slice(partitionIdx, partitionIdx + count);
      assignment.set(consumer, allocated);
      partitionIdx += count;
    }

    return assignment;
  }

  /**
   * 轮询分配算法 (Round-Robin Assignor)
   * @param {string[]} partitions
   * @param {string[]} consumers
   * @returns {Map<string, string[]>}
   */
  static assignRoundRobin(partitions, consumers) {
    const sortedPartitions = [...partitions].sort();
    const sortedConsumers = [...consumers].sort();

    const assignment = new Map();
    for (const c of sortedConsumers) {
      assignment.set(c, []);
    }

    if (sortedConsumers.length === 0 || sortedPartitions.length === 0) {
      return assignment;
    }

    for (let i = 0; i < sortedPartitions.length; i++) {
      const consumer = sortedConsumers[i % sortedConsumers.length];
      assignment.get(consumer).push(sortedPartitions[i]);
    }

    return assignment;
  }
}

// --- 演示与自测代码 ---
if (process.argv[1] && process.argv[1].endsWith('partition-assignor.js')) {
  console.log('=== 消费组分区分配策略与再均衡演示 ===');
  const partitions = ['P0', 'P1', 'P2', 'P3', 'P4']; // 5 个分区
  const consumers = ['Consumer-A', 'Consumer-B']; // 2 个消费者

  console.log('1. 范围分配策略 (Range):');
  const rangeRes = PartitionAssignor.assignRange(partitions, consumers);
  for (const [c, p] of rangeRes.entries()) {
    console.log(`- ${c}: [${p.join(', ')}]`);
  }

  console.log('\n2. 轮询分配策略 (Round-Robin):');
  const rrRes = PartitionAssignor.assignRoundRobin(partitions, consumers);
  for (const [c, p] of rrRes.entries()) {
    console.log(`- ${c}: [${p.join(', ')}]`);
  }

  console.log('\n3. 模拟消费者超过分区数 (5 分区, 6 消费者 -> 第 6 个消费者闲置):');
  const sixConsumers = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6'];
  const idleRes = PartitionAssignor.assignRoundRobin(partitions, sixConsumers);
  for (const [c, p] of idleRes.entries()) {
    console.log(`- ${c}: [${p.join(', ')}] ${p.length === 0 ? '💤 闲置' : ''}`);
  }
}
