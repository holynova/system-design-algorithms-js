/**
 * @file base62.js
 * @description 第一卷 第08章：短网址设计 (Design A URL Shortener)
 * 经典算法：Base62 双向双射编解码算法 (Base62 Bijective Encoding)
 *
 * 【系统设计背景】：
 * 短网址服务（如 tinyurl.com, bit.ly）需要将长 URL 转换为极短且 URL 安全的字符串（如 `https://tiny.url/7bX9`）。
 * Base62 字符集由 `[0-9, a-z, A-Z]` 共 62 个字符组成（避免 URL 中的特殊符号如 `+`, `/`, `=`）。
 * - 长度为 7 的 Base62 字符串可容纳：62^7 ≈ 3.5 万亿条短网址记录，足以满足海量规模需求。
 *
 * 【核心思想】：
 * 将数据库或分布式 ID 生成器产生的十进制唯一整型 ID，转换为 62 进制字符串表示；
 * 查找时可将 Base62 字符串瞬间解码还原为整数主键 ID，通过主键直查数据库，查询效率 O(1)。
 *
 * 【复杂度】：
 * - 编码 / 解码: O(log_62(ID)) ≈ 常数级（通常至多 7 次循环）
 * - 空间复杂度: O(1)
 */

export class Base62 {
  static CHARS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  static BASE = 62n;

  /**
   * 将数字 ID 编码为 Base62 字符串
   * @param {number|bigint} num
   * @param {number} [minLength=1] - 最小输出长度（不足则左侧补 '0'）
   * @returns {string}
   */
  static encode(num, minLength = 1) {
    let n = BigInt(num);
    if (n === 0n) {
      return '0'.padStart(minLength, '0');
    }

    let encoded = '';
    while (n > 0n) {
      const remainder = Number(n % this.BASE);
      encoded = this.CHARS[remainder] + encoded;
      n = n / this.BASE;
    }

    return encoded.padStart(minLength, '0');
  }

  /**
   * 将 Base62 字符串解码回原始十进制数字 (BigInt)
   * @param {string} str
   * @returns {bigint}
   */
  static decode(str) {
    let result = 0n;
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      const val = this.CHARS.indexOf(char);
      if (val === -1) {
        throw new Error(`Invalid Base62 character: "${char}"`);
      }
      result = result * this.BASE + BigInt(val);
    }
    return result;
  }
}

// --- 演示与自测代码 ---
if (process.argv[1] && process.argv[1].endsWith('base62.js')) {
  console.log('=== Base62 短网址编解码演示 ===');
  const sampleId = 11157n; // 教学样例
  const shortCode = Base62.encode(sampleId);
  const decodedId = Base62.decode(shortCode);

  console.log(`原始 ID: ${sampleId} -> Base62 短码: "${shortCode}" -> 解码还原: ${decodedId}`);

  console.log('\n典型短网址长度容量演示 (62^L):');
  for (let len = 6; len <= 8; len++) {
    const capacity = 62n ** BigInt(len);
    console.log(`- 长度 ${len} 位: 可容纳 ${capacity.toLocaleString()} 个独立短网址`);
  }
}
