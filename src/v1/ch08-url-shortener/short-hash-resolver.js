/**
 * @file short-hash-resolver.js
 * @description 第一卷 第08章：短网址设计 (Design A URL Shortener)
 * 经典算法：截断哈希与碰撞探测算法 (Hash Truncation with Collision Resolution)
 *
 * 【系统设计背景】：
 * 在短网址设计中，另一种常见思路是直接对长 URL 进行哈希（如 MD5 / SHA-256），
 * 并截取前 7 位作为短码。但由于截断后信息压缩，极易发生“哈希碰撞 (Hash Collision)”：
 * 即两个不同的长网址计算出了完全相同的 7 位短码。
 *
 * 【碰撞探测机制】：
 * 当生成短码并在数据库/映射表中发现已存在时：
 * 1. 若对应长网址与当前相同，直接复用该短码；
 * 2. 若对应不同的长网址，说明发生碰撞！
 * 3. 采用加盐循环探测 (Salt / Suffix Probing)：在长网址后追加预定义盐或自增计数器（如 `url + #salt1`），
 *    重新计算哈希并截断，直到找到尚未被占用的短码。
 */

import crypto from 'node:crypto';
import { Base62 } from './base62.js';

export class ShortHashResolver {
  /**
   * @param {number} [shortCodeLength=7] - 短码长度
   */
  constructor(shortCodeLength = 7) {
    this.shortCodeLength = shortCodeLength;
    this.shortToLongMap = new Map(); // shortCode -> longUrl
    this.longToShortMap = new Map(); // longUrl -> shortCode
  }

  /**
   * 为长链接生成短码（若碰撞则自动探测解决）
   * @param {string} longUrl
   * @returns {{ shortCode: string, attempts: number }}
   */
  shorten(longUrl) {
    if (this.longToShortMap.has(longUrl)) {
      return { shortCode: this.longToShortMap.get(longUrl), attempts: 0 };
    }

    let attempts = 0;
    let candidateUrl = longUrl;

    while (true) {
      attempts++;
      // 计算 SHA-256 并转成 Base62 截取前 N 位
      const hashDigest = crypto.createHash('sha256').update(candidateUrl).digest();
      // 使用前 6 字节转为整型再转 Base62
      const num = hashDigest.readBigUInt64BE(0);
      const shortCode = Base62.encode(num, this.shortCodeLength).slice(0, this.shortCodeLength);

      const existingLong = this.shortToLongMap.get(shortCode);

      if (!existingLong) {
        // 成功找到未被占用的短码
        this.shortToLongMap.set(shortCode, longUrl);
        this.longToShortMap.set(longUrl, shortCode);
        return { shortCode, attempts };
      }

      if (existingLong === longUrl) {
        return { shortCode, attempts };
      }

      // 发生碰撞：加盐重试
      candidateUrl = `${longUrl}#SALT_${attempts}`;
    }
  }

  /**
   * 根据短码还原长网址
   * @param {string} shortCode
   * @returns {string|undefined}
   */
  resolve(shortCode) {
    return this.shortToLongMap.get(shortCode);
  }
}

// --- 演示与自测代码 ---
if (process.argv[1] && process.argv[1].endsWith('short-hash-resolver.js')) {
  console.log('=== 哈希截断与碰撞重试演示 ===');
  const resolver = new ShortHashResolver(7);

  const url1 = 'https://example.com/system-design/interview-guide-v1';
  const url2 = 'https://example.com/system-design/interview-guide-v2';

  const res1 = resolver.shorten(url1);
  console.log(`URL 1 -> 短码: "${res1.shortCode}" (尝试次数: ${res1.attempts})`);

  const res2 = resolver.shorten(url2);
  console.log(`URL 2 -> 短码: "${res2.shortCode}" (尝试次数: ${res2.attempts})`);

  console.log('查询短码解析:', resolver.resolve(res1.shortCode));
}
