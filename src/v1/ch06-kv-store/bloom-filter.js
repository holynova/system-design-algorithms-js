/**
 * @file bloom-filter.js
 * @description 第一卷 第06章：key-value 存储设计 (Design A Key-Value Store)
 * 经典数据结构/算法：布隆过滤器 (Bloom Filter)
 *
 * 【系统设计背景】：
 * 在基于 LSM-Tree (Log-Structured Merge-Tree) 架构的存储系统（如 Bigtable、Cassandra、RocksDB）中，
 * 数据分散存储在多个磁盘 SSTable 文件中。如果直接在磁盘文件中逐一查找不存在的 key，会引发大量昂贵的磁盘 I/O。
 * 布隆过滤器常驻内存：
 * - 如果布隆过滤器判断“不存在”，则该 key **100% 绝对不存在**，直接跳过该 SSTable，省去磁盘读取！
 * - 如果布隆过滤器判断“存在”，则可能存在（有较低的假阳性率 False Positive Rate），再去读取磁盘。
 *
 * 【数学模型】：
 * - 位数组长度 m 与预期元素数 n
 * - 最优哈希函数数量 k = (m / n) * ln(2)
 * - 使用双重哈希优化 (Kirsch-Mitzenmacher 技巧)：只需计算 2 个独立哈希值 h1, h2，
 *   即可通过公式 `g_i(x) = (h1 + i * h2) % m` 模拟出 k 个无偏哈希函数！
 *
 * 【复杂度】：
 * - 插入 (add): O(k)
 * - 查询 (mightContain): O(k)
 * - 空间复杂度: O(m) 比特
 */

import crypto from 'node:crypto';

export class BloomFilter {
  /**
   * @param {number} [expectedElements=1000] - 预期插入的元素数量 n
   * @param {number} [falsePositiveRate=0.01] - 目标误判率 p (默认 1%)
   */
  constructor(expectedElements = 1000, falsePositiveRate = 0.01) {
    this.n = expectedElements;
    this.p = falsePositiveRate;

    // 计算最佳位数组大小 m = - (n * ln(p)) / (ln(2)^2)
    this.size = Math.ceil(- (this.n * Math.log(this.p)) / (Math.LN2 * Math.LN2));

    // 计算最佳哈希函数个数 k = (m / n) * ln(2)
    this.numHashes = Math.max(1, Math.round((this.size / this.n) * Math.LN2));

    // 使用 Uint8Array 模拟紧凑位图 (BitSet)
    this.bitArray = new Uint8Array(Math.ceil(this.size / 8));
  }

  /**
   * 插入一个键
   * @param {string} item
   */
  add(item) {
    const indexes = this._getHashes(item);
    for (const bitIndex of indexes) {
      this._setBit(bitIndex);
    }
  }

  /**
   * 判断一个键是否存在
   * @param {string} item
   * @returns {boolean} false: 绝对不存在; true: 可能存在
   */
  mightContain(item) {
    const indexes = this._getHashes(item);
    for (const bitIndex of indexes) {
      if (!this._getBit(bitIndex)) {
        return false; // 只要有一个 bit 为 0，绝对不存在！
      }
    }
    return true; // 所有对应 bit 均为 1，可能存在
  }

  /**
   * 双哈希算法生成 k 个 bit 索引
   * @private
   */
  _getHashes(item) {
    const hashHex = crypto.createHash('sha256').update(String(item)).digest('hex');
    // 取前 8 字节分成两个 32 位整数 h1 和 h2
    const h1 = parseInt(hashHex.slice(0, 8), 16);
    const h2 = parseInt(hashHex.slice(8, 16), 16);

    const indexes = [];
    for (let i = 0; i < this.numHashes; i++) {
      // Kirsch-Mitzenmacher 模拟 k 个独立哈希函数
      const combined = Math.abs((h1 + i * h2) % this.size);
      indexes.push(combined);
    }
    return indexes;
  }

  /** 置位第 index 个 bit 为 1 */
  _setBit(index) {
    const byteIndex = Math.floor(index / 8);
    const bitOffset = index % 8;
    this.bitArray[byteIndex] |= (1 << bitOffset);
  }

  /** 读取第 index 个 bit */
  _getBit(index) {
    const byteIndex = Math.floor(index / 8);
    const bitOffset = index % 8;
    return (this.bitArray[byteIndex] & (1 << bitOffset)) !== 0;
  }
}

// --- 演示与自测代码 ---
if (process.argv[1] && process.argv[1].endsWith('bloom-filter.js')) {
  console.log('=== 布隆过滤器 (Bloom Filter) 演示 ===');
  const bf = new BloomFilter(100, 0.01);
  console.log(`位数组大小: ${bf.size} bits (${Math.ceil(bf.size / 8)} 字节), 哈希函数个数: ${bf.numHashes}`);

  const members = ['apple', 'banana', 'orange', 'watermelon'];
  members.forEach(item => bf.add(item));

  console.log('\n1. 检查已插入元素:');
  members.forEach(item => {
    console.log(`- "${item}": ${bf.mightContain(item) ? '✅ 可能存在 (True Positive)' : '❌ 错误'}`);
  });

  console.log('\n2. 检查未插入元素:');
  const nonMembers = ['car', 'computer', 'banana_fake', 'airplane'];
  nonMembers.forEach(item => {
    const res = bf.mightContain(item);
    console.log(`- "${item}": ${res ? '⚠️ 假阳性 (False Positive)' : '✅ 确定不存在 (True Negative)'}`);
  });
}
