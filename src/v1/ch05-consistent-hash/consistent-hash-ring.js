/**
 * @file consistent-hash-ring.js
 * @description 第一卷 第05章：一致性哈希设计 (Design Consistent Hashing)
 * 经典算法：一致性哈希环与虚拟节点 (Consistent Hashing with Virtual Nodes)
 *
 * 【系统设计背景】：
 * 在传统的取模哈希算法 `hash(key) % N` 中，当增加或减少一台服务器 N 时，
 * 绝大部分已有缓存数据的映射位置都会发生漂移，引发严重的“缓存雪崩 (Cache Avalanche)”。
 * 一致性哈希将哈希空间构成一个闭合的圆环（0 ~ 2^32-1）。
 * 当节点增删时，仅有相邻区间的少量数据需要迁移，迁移率稳定在 1/N 左右。
 *
 * 【虚拟节点 (Virtual Nodes)】：
 * 少量物理节点在环上的分布容易产生倾斜，导致各节点负载极不均衡。
 * 引入虚拟节点（例如每个物理节点对应 100~300 个虚拟副本）使散列点更加均匀，解决数据倾斜与热点问题。
 *
 * 【复杂度】：
 * - 查找节点: O(log(M * V)) (M 为物理节点数，V 为虚拟节点倍数，基于二分查找)
 * - 增加/移除节点: O(V * log(M * V))
 * - 空间复杂度: O(M * V)
 */

import crypto from 'node:crypto';

export class ConsistentHashRing {
  /**
   * @param {string[]} [nodes=[]] - 初始物理节点名称列表
   * @param {number} [replicas=100] - 每个物理节点的虚拟节点倍数
   */
  constructor(nodes = [], replicas = 100) {
    this.replicas = replicas;
    this.ring = []; // 升序存储虚拟节点的哈希值 [hash1, hash2, ...]
    this.virtualNodeMap = new Map(); // hash -> physicalNode
    this.physicalNodes = new Set();

    for (const node of nodes) {
      this.addNode(node);
    }
  }

  /**
   * 计算字符串的 32 位无符号整数哈希值 (使用 MD5 前 4 字节)
   * @param {string} input
   * @returns {number} 0 ~ 4294967295
   */
  hash(input) {
    const digest = crypto.createHash('md5').update(String(input)).digest();
    // 取前 4 字节构建 32 位无符号整数 (Big-Endian)
    return digest.readUInt32BE(0);
  }

  /**
   * 添加物理节点，同时向哈希环添加对应的虚拟节点
   * @param {string} node
   */
  addNode(node) {
    if (this.physicalNodes.has(node)) return;
    this.physicalNodes.add(node);

    for (let i = 0; i < this.replicas; i++) {
      const vnodeKey = `${node}#VN${i}`;
      const hashVal = this.hash(vnodeKey);
      this.virtualNodeMap.set(hashVal, node);
      this._insertSorted(hashVal);
    }
  }

  /**
   * 移除物理节点及其全部虚拟节点
   * @param {string} node
   */
  removeNode(node) {
    if (!this.physicalNodes.has(node)) return;
    this.physicalNodes.delete(node);

    for (let i = 0; i < this.replicas; i++) {
      const vnodeKey = `${node}#VN${i}`;
      const hashVal = this.hash(vnodeKey);
      this.virtualNodeMap.delete(hashVal);

      // 从升序数组中移除
      const index = this._binarySearch(hashVal);
      if (index !== -1 && this.ring[index] === hashVal) {
        this.ring.splice(index, 1);
      }
    }
  }

  /**
   * 根据数据的 key 在环上顺时针查找负责该 key 的物理节点
   * @param {string} key
   * @returns {string|null}
   */
  getNode(key) {
    if (this.ring.length === 0) return null;

    const hashVal = this.hash(key);
    let low = 0;
    let high = this.ring.length - 1;

    // 二分查找第一个 >= hashVal 的虚拟节点
    let targetIndex = 0;
    if (hashVal > this.ring[high]) {
      // 超出环尾，按圆环闭合规则回绕到环头 (首个节点)
      targetIndex = 0;
    } else {
      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        if (this.ring[mid] >= hashVal) {
          targetIndex = mid;
          high = mid - 1; // 尝试找更小的满足项
        } else {
          low = mid + 1;
        }
      }
    }

    const matchedHash = this.ring[targetIndex];
    return this.virtualNodeMap.get(matchedHash);
  }

  /**
   * 模拟数据迁移分析：传入一组键，计算增删某节点时受影响需要迁移的键数量
   * @param {string[]} keys
   * @param {string} newNode
   * @returns {{ migratedKeys: string[], migrationRatio: number }}
   */
  simulateAddNodeMigration(keys, newNode) {
    const beforeMapping = new Map(keys.map(k => [k, this.getNode(k)]));
    this.addNode(newNode);
    const afterMapping = new Map(keys.map(k => [k, this.getNode(k)]));

    const migratedKeys = [];
    for (const key of keys) {
      if (beforeMapping.get(key) !== afterMapping.get(key)) {
        migratedKeys.push(key);
      }
    }

    // 恢复状态
    this.removeNode(newNode);

    return {
      migratedKeys,
      migrationRatio: Number((migratedKeys.length / keys.length).toFixed(4)),
    };
  }

  // --- 内部辅助方法 ---

  /** 维护 ring 数组的有序性插入 */
  _insertSorted(val) {
    let low = 0;
    let high = this.ring.length;
    while (low < high) {
      const mid = Math.floor((low + high) / 2);
      if (this.ring[mid] < val) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }
    this.ring.splice(low, 0, val);
  }

  /** 二分查找精准值下标 */
  _binarySearch(val) {
    let low = 0;
    let high = this.ring.length - 1;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (this.ring[mid] === val) return mid;
      if (this.ring[mid] < val) low = mid + 1;
      else high = mid - 1;
    }
    return -1;
  }
}

// --- 演示与自测代码 ---
if (process.argv[1] && process.argv[1].endsWith('consistent-hash-ring.js')) {
  console.log('=== 一致性哈希环 (带虚拟节点) 演示 ===');
  const ch = new ConsistentHashRing(['Node-A', 'Node-B', 'Node-C'], 150);

  const sampleKeys = ['user_101', 'user_102', 'order_998', 'product_334', 'cart_888'];
  console.log('1. 样本键的初始归属物理节点:');
  sampleKeys.forEach(k => console.log(`- Key "${k}" -> 映射到: ${ch.getNode(k)}`));

  console.log('\n2. 模拟扩容加入 Node-D 时的迁移测试 (1000 个随机键):');
  const testKeys = Array.from({ length: 1000 }, (_, i) => `key_${i}`);
  const result = ch.simulateAddNodeMigration(testKeys, 'Node-D');
  console.log(`- 总测试键: ${testKeys.length}`);
  console.log(`- 发生迁移的键数量: ${result.migratedKeys.length}`);
  console.log(`- 实际迁移比例: ${(result.migrationRatio * 100).toFixed(2)}% (理论期望值约 1/4 = 25%)`);
}
