/**
 * @file leaky-bucket.js
 * @description 第一卷 第04章：设计一个限流器 (Design A Rate Limiter)
 * 经典算法：漏桶算法 (Leaky Bucket Algorithm)
 *
 * 【系统设计背景】：
 * 与令牌桶允许突发不同，漏桶的核心目的是“流量整形 (Traffic Shaping)”。
 * 它将不规则的突发流量平滑为恒定速率的流出请求，常用于对稳定性要求极高的支付、订单等后台系统。
 *
 * 【工作原理与数学模型】：
 * 1. 桶容量 (capacity): 底层有限 FIFO 队列的最大深度。若队列已满，新请求直接丢弃 (Drop)。
 * 2. 流出速率 (leakRatePerSec): 恒定以该速率处理并释放请求。
 * 3. 惰性漏水更新: 请求到达时计算 `(now - lastLeakTime) * leakRatePerSec`，移出已处理的水量。
 *
 * 【复杂度】：
 * - 时间复杂度: O(1)
 * - 空间复杂度: O(1) (计数模型)
 */

export class LeakyBucketRateLimiter {
  /**
   * @param {number} capacity - 队列容量（桶容量）
   * @param {number} leakRatePerSec - 恒定流出速率（每秒流出请求数）
   */
  constructor(capacity, leakRatePerSec) {
    if (capacity <= 0 || leakRatePerSec <= 0) {
      throw new Error('Capacity and leak rate must be positive numbers');
    }
    this.capacity = capacity;
    this.leakRatePerSec = leakRatePerSec;
    this.waterLevel = 0; // 当前桶内的排队请求量
    this.lastLeakTime = Date.now();
  }

  /**
   * 尝试将请求加入漏桶
   * @param {number} [amount=1]
   * @param {number} [now=Date.now()]
   * @returns {boolean} true 表示成功入桶排队，false 表示溢出拒绝
   */
  tryAcquire(amount = 1, now = Date.now()) {
    this._leak(now);

    // 检查是否有足够空间容纳新请求
    if (this.waterLevel + amount <= this.capacity) {
      this.waterLevel += amount;
      return true;
    }

    return false;
  }

  /**
   * 惰性计算随时间推移已流出的水量
   * @private
   */
  _leak(now) {
    const elapsedSeconds = Math.max(0, (now - this.lastLeakTime) / 1000);
    const leaked = elapsedSeconds * this.leakRatePerSec;

    // 漏水：水量减少，但不低于 0
    this.waterLevel = Math.max(0, this.waterLevel - leaked);
    this.lastLeakTime = now;
  }

  /**
   * 获取当前排队水量
   */
  get currentWaterLevel() {
    this._leak(Date.now());
    return this.waterLevel;
  }
}

// --- 演示与自测代码 ---
if (process.argv[1] && process.argv[1].endsWith('leaky-bucket.js')) {
  console.log('=== 漏桶算法 (Leaky Bucket) 演示 ===');
  // 桶容量为 3，每秒漏出 1 个
  const limiter = new LeakyBucketRateLimiter(3, 1);
  const t0 = Date.now();

  console.log('1. 连续注入 4 次请求 (容量 3):');
  for (let i = 1; i <= 4; i++) {
    const ok = limiter.tryAcquire(1, t0);
    console.log(`- 请求 #${i}: ${ok ? '💧 成功入桶排队' : '❌ 溢出丢弃'}`);
  }

  console.log('\n2. 经过 2 秒，平稳流出 2 个请求:');
  const t1 = t0 + 2000;
  console.log(`- 请求 #5: ${limiter.tryAcquire(1, t1) ? '💧 入桶' : '❌ 溢出'}`);
  console.log(`- 请求 #6: ${limiter.tryAcquire(1, t1) ? '💧 入桶' : '❌ 溢出'}`);
  console.log(`- 请求 #7: ${limiter.tryAcquire(1, t1) ? '💧 入桶' : '❌ 溢出 (再次满载)'}`);
}
