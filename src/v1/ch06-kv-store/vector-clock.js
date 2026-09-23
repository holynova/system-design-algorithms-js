/**
 * @file vector-clock.js
 * @description 第一卷 第06章：key-value 存储设计 (Design A Key-Value Store)
 * 经典算法：向量时钟 (Vector Clock)
 *
 * 【系统设计背景】：
 * 在分布式 KV 存储（如 Dynamo、Cassandra）中，网络分区或并发写会导致不同节点上产生不同版本的数据副本。
 * 传统的物理时钟（如 NTP）存在时钟漂移，无法精准决定事件发生的因果关系 (Causality)。
 * 向量时钟用一组 `[Server_i, Version_i]` 元组记录版本演进：
 * - 如果版本 X 的所有节点分量均 <= 版本 Y，且至少一个分量 < Y，则 X 发生在 Y 之前 (X 是 Y 的祖先，无冲突)。
 * - 如果 X 和 Y 互有大小，则说明二者并发产生冲突 (Conflict/Divergence)，需要业务层合并（如购物车合并）。
 *
 * 【复杂度】：
 * - 比较因果关系: O(N) (N 为参与节点数)
 * - 空间复杂度: O(N)
 */

export class VectorClock {
  /**
   * @param {Record<string, number>} [initialClocks={}]
   */
  constructor(initialClocks = {}) {
    this.clocks = new Map(Object.entries(initialClocks));
  }

  /**
   * 克隆当前向量时钟
   * @returns {VectorClock}
   */
  clone() {
    const copy = new VectorClock();
    for (const [node, ver] of this.clocks.entries()) {
      copy.clocks.set(node, ver);
    }
    return copy;
  }

  /**
   * 节点执行本地写操作，自身逻辑版本号 +1
   * @param {string} nodeId
   * @returns {VectorClock} 返回自身便于链式调用
   */
  increment(nodeId) {
    const currentVer = this.clocks.get(nodeId) || 0;
    this.clocks.set(nodeId, currentVer + 1);
    return this;
  }

  /**
   * 与另一个向量时钟合并（取各节点的最大版本号，用于解决冲突后的收敛）
   * @param {VectorClock} other
   */
  merge(other) {
    for (const [node, ver] of other.clocks.entries()) {
      const currentVer = this.clocks.get(node) || 0;
      this.clocks.set(node, Math.max(currentVer, ver));
    }
  }

  /**
   * 比较两个向量时钟的因果关系
   * @param {VectorClock} other
   * @returns {'EQUAL'|'ANCESTOR'|'DESCENDANT'|'CONFLICT'}
   * - EQUAL: 两者完全相等
   * - ANCESTOR: this 是 other 的祖先（发生在 other 之前）
   * - DESCENDANT: this 是 other 的后代（发生在 other 之后）
   * - CONFLICT: 并发冲突，存在分支
   */
  compare(other) {
    const allNodes = new Set([...this.clocks.keys(), ...other.clocks.keys()]);
    let hasLess = false;
    let hasGreater = false;

    for (const node of allNodes) {
      const v1 = this.clocks.get(node) || 0;
      const v2 = other.clocks.get(node) || 0;

      if (v1 < v2) hasLess = true;
      if (v1 > v2) hasGreater = true;
    }

    if (!hasLess && !hasGreater) return 'EQUAL';
    if (hasLess && !hasGreater) return 'ANCESTOR'; // this < other
    if (!hasLess && hasGreater) return 'DESCENDANT'; // this > other
    return 'CONFLICT'; // 互有大小，并发冲突
  }

  /**
   * 格式化展示 (如 "S1:1, S2:2")
   */
  toString() {
    const parts = [];
    for (const [node, ver] of this.clocks.entries()) {
      parts.push(`${node}:${ver}`);
    }
    return `[${parts.sort().join(', ')}]`;
  }
}

// --- 演示与自测代码 ---
if (process.argv[1] && process.argv[1].endsWith('vector-clock.js')) {
  console.log('=== 向量时钟 (Vector Clock) 冲突检测演示 ===');

  // 1. 基线版本 D1 由 Server-1 写入
  const d1 = new VectorClock();
  d1.increment('Sx');
  console.log('1. 基线版本 D1 (Sx 写入):', d1.toString());

  // 2. 节点 Sy 读取 D1 后写入得到 D2
  const d2 = d1.clone().increment('Sy');
  console.log('2. D2 (基于 D1，由 Sy 写入):', d2.toString());
  console.log('D1 对比 D2:', d1.compare(d2), '(D1 是 D2 的祖先，可直接用 D2 覆盖 D1)');

  // 3. 网络分区发生：客户端 A 向 Sx 写入，客户端 B 向 Sz 写入 (基于同一个 D2 并发更新)
  const d3 = d2.clone().increment('Sx'); // 客户端 A
  const d4 = d2.clone().increment('Sz'); // 客户端 B
  console.log('\n3. 分区并发写:');
  console.log('版本 D3 (Sx 推进):', d3.toString());
  console.log('版本 D4 (Sz 推进):', d4.toString());
  console.log('D3 对比 D4:', d3.compare(d4), '⚡️ 并发版本冲突！需要合并');

  // 4. 解决冲突：合并两个分支形成新版本 D5
  const d5 = d3.clone();
  d5.merge(d4);
  d5.increment('Sx'); // 协调者处理完冲突，写下新版本
  console.log('\n4. 合并冲突后的版本 D5:', d5.toString());
  console.log('D3 对比 D5:', d3.compare(d5));
  console.log('D4 对比 D5:', d4.compare(d5));
}
