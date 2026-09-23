/**
 * @file sim-hash.js
 * @description 第一卷 第09章：网络爬虫设计 (Design A Web Crawler)
 * 经典算法：SimHash 局部敏感哈希算法 (SimHash & Hamming Distance for Content Deduplication)
 *
 * 【系统设计背景】：
 * 网页爬虫在抓取互联网海量内容时，约有 30% 是镜像、抄袭或仅有细微修改的相似网页。
 * 传统的 MD5/SHA-256 具有雪崩效应：即使改动一个标点符号，哈希值也会完全改变，无法检测相似性。
 * Google 提出的 SimHash 属于局部敏感哈希 (Locality-Sensitive Hashing - LSH)：
 * 两个文本内容越接近，其 SimHash 值的差异位数（海明距离 Hamming Distance）越小。
 * 业界通常约定：64 位 SimHash 的海明距离 <= 3 即判定为“近似重复网页”。
 *
 * 【计算步骤】：
 * 1. 分词与加权: 将文本拆为单词，统计词频作为权重 weight。
 * 2. 单词哈希: 计算每个词的 64 位哈希值。
 * 3. 向量累加: 遍历 64 个位，若该词对应位为 1 则 +weight，为 0 则 -weight。
 * 4. 降维降成 64 位特征指纹: 若该位累加总和 > 0 则置为 1，否则置为 0。
 */

import crypto from 'node:crypto';

export class SimHash {
  static BITS = 64;

  /**
   * 计算一段文本的 64 位 SimHash 指纹 (BigInt)
   * @param {string} text
   * @returns {bigint}
   */
  static hash(text) {
    const tokens = this._tokenize(text);
    if (tokens.length === 0) return 0n;

    // 统计词频作为特征权重
    const freqMap = new Map();
    for (const t of tokens) {
      freqMap.set(t, (freqMap.get(t) || 0) + 1);
    }

    // 64 维累加器向量
    const v = new Array(this.BITS).fill(0);

    for (const [token, weight] of freqMap.entries()) {
      const tokenHash = this._hash64(token);

      for (let i = 0; i < this.BITS; i++) {
        const bit = (tokenHash >> BigInt(i)) & 1n;
        if (bit === 1n) {
          v[i] += weight;
        } else {
          v[i] -= weight;
        }
      }
    }

    // 根据累加正负生成最终 64 位二进制指纹
    let fingerprint = 0n;
    for (let i = 0; i < this.BITS; i++) {
      if (v[i] > 0) {
        fingerprint |= (1n << BigInt(i));
      }
    }

    return fingerprint;
  }

  /**
   * 计算两个 SimHash 之间的海明距离 (不同 bit 的个数)
   * @param {bigint} h1
   * @param {bigint} h2
   * @returns {number}
   */
  static hammingDistance(h1, h2) {
    let diff = h1 ^ h2;
    let dist = 0;
    while (diff > 0n) {
      diff &= diff - 1n; // 快速消除最低位的 1 (Brian Kernighan 算法)
      dist++;
    }
    return dist;
  }

  /**
   * 判断两段文本是否近似重复 (海明距离 <= 阈值，默认 3)
   * @param {string} text1
   * @param {string} text2
   * @param {number} [threshold=3]
   * @returns {boolean}
   */
  static isDuplicate(text1, text2, threshold = 3) {
    const h1 = this.hash(text1);
    const h2 = this.hash(text2);
    return this.hammingDistance(h1, h2) <= threshold;
  }

  /** 简单的英语/通用单词分词 */
  static _tokenize(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 1);
  }

  /** 计算单个词的 64 位哈希 */
  static _hash64(str) {
    const buf = crypto.createHash('md5').update(str).digest();
    return buf.readBigUInt64BE(0);
  }
}

// --- 演示与自测代码 ---
if (process.argv[1] && process.argv[1].endsWith('sim-hash.js')) {
  console.log('=== SimHash 网页正文查重演示 ===');

  const doc1 = 'System design interview is very helpful for learning large scale distributed architecture and cloud systems.';
  // doc2 仅微调了几个词汇和语气词
  const doc2 = 'System design interview is very useful for studying large scale distributed architecture and cloud computing systems.';
  // doc3 是完全无关的文本
  const doc3 = 'Italian pasta recipe requires fresh tomatoes, garlic, extra virgin olive oil, and high quality parmesan cheese.';

  const h1 = SimHash.hash(doc1);
  const h2 = SimHash.hash(doc2);
  const h3 = SimHash.hash(doc3);

  const dist12 = SimHash.hammingDistance(h1, h2);
  const dist13 = SimHash.hammingDistance(h1, h3);

  console.log(`Doc1 指纹: ${h1.toString(16)}`);
  console.log(`Doc2 指纹: ${h2.toString(16)}`);
  console.log(`Doc3 指纹: ${h3.toString(16)}`);

  console.log(`\nDoc1 与 Doc2 的海明距离: ${dist12} (判定: ${dist12 <= 3 ? '✅ 近似重复网页' : '❌ 不同内容'})`);
  console.log(`Doc1 与 Doc3 的海明距离: ${dist13} (判定: ${dist13 <= 3 ? '✅ 近似重复' : '❌ 完全不同内容'})`);
}
