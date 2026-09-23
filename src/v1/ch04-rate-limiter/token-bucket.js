/**
 * @file token-bucket.js
 * @description 第一卷 第04章：设计一个限流器 (Design A Rate Limiter)
 * 经典算法：令牌桶算法 (Token Bucket Algorithm)
 *
 * 【系统设计背景】：
 * 限流器用于保护下游服务免受突发流量冲击，防止 DoS 攻击与资源耗尽。
 * 令牌桶是业界最常用、最灵活的算法（如 Amazon AWS、Guava RateLimiter、Spring Cloud Gateway 均采用）。
 * 它允许一定程度的突发流量（只要桶内有令牌，即可一次性全部取出消费）。
 *
 * 【工作原理与数学模型】：
 * 1. 桶容量 (capacity)：桶内最多容纳的令牌数量。
 * 2. 补充速率 (refillRatePerSec)：每秒向桶中补充的令牌数量。
 * 3. 惰性补充机制 (Lazy Refill)：不需要常驻后台定时器消耗 CPU，而是在每次请求到达时，
 *    根据 `(now - lastRefillTime) * refillRatePerSec` 动态计算补回的令牌数。
 *
 * 【复杂度】：
 * - 时间复杂度: O(1)
 * - 空间复杂度: O(1) (单限流器实例)
 */

export class TokenBucketRateLimiter {
  /**
   * @param {number} capacity - 桶容量（最大突发请求数）
   * @param {number} refillRatePerSec - 令牌每秒补充速率
   */
  constructor(capacity, refillRatePerSec) {
    if (capacity <= 0 || refillRatePerSec <= 0) {
      throw new Error('Capacity and refill rate must be positive numbers');
    }
    this.capacity = capacity;
    this.refillRatePerSec = refillRatePerSec;
    this.tokens = capacity; // 初始状态令牌满桶
    this.lastRefillTime = Date.now();
  }

  /**
   * 尝试消费指定数量的令牌
   * @param {number} [tokensToConsume=1]
   * @param {number} [now=Date.now()] - 可传入模拟时间，方便教学与单元测试
   * @returns {boolean} true 表示放行，false 表示被限流拦截
   */
  tryConsume(tokensToConsume = 1, now = Date.now()) {
    this._refill(now);

    if (this.tokens >= tokensToConsume) {
      this.tokens -= tokensToConsume;
      return true;
    }

    return false;
  }

  /**
   * 惰性计算并补充令牌
   * @private
   */
  _refill(now) {
    const elapsedSeconds = Math.max(0, (now - this.lastRefillTime) / 1000);
    const tokensToAdd = elapsedSeconds * this.refillRatePerSec;

    // 补充令牌但不超过最大容量
    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefillTime = now;
  }

  /**
   * 获取当前桶中剩余令牌数
   */
  get availableTokens() {
    this._refill(Date.now());
    return this.tokens;
  }
}

// --- 演示与自测代码 ---
if (process.argv[1] && process.argv[1].endsWith('token-bucket.js')) {
  console.log('=== 令牌桶算法 (Token Bucket) 演示 ===');
  // 桶容量为 3，每秒补充 1 个令牌
  const limiter = new TokenBucketRateLimiter(3, 1);
  const startTime = Date.now();

  console.log('1. 瞬时并发 4 次请求 (容量为 3):');
  for (let i = 1; i <= 4; i++) {
    const allowed = limiter.tryConsume(1, startTime);
    console.log(`- 请求 #${i}: ${allowed ? '✅ 放行' : '❌ 被拦截 (令牌不足)'}`);
  }

  console.log('\n2. 经过 2 秒后补充 2 个令牌:');
  const after2s = startTime + 2000;
  console.log(`- 请求 #5 (2秒后): ${limiter.tryConsume(1, after2s) ? '✅ 放行' : '❌ 拦截'}`);
  console.log(`- 请求 #6 (2秒后): ${limiter.tryConsume(1, after2s) ? '✅ 放行' : '❌ 拦截'}`);
  console.log(`- 请求 #7 (2秒后): ${limiter.tryConsume(1, after2s) ? '✅ 放行' : '❌ 拦截 (再次耗尽)'}`);
}
