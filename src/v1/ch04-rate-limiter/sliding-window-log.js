/**
 * @file sliding-window-log.js
 * @description 第一卷 第04章：设计一个限流器 (Design A Rate Limiter)
 * 经典算法：滑动窗口日志算法 (Sliding Window Log Algorithm)
 *
 * 【系统设计背景】：
 * 为解决固定窗口在边界处涌入 2 倍突发流量的严重缺陷，滑动窗口日志以时间戳为粒度精确记录每个请求。
 * 当新请求到达时，剔除窗口之外已过期的历史时间戳，再统计剩余有效时间戳的数量。
 *
 * 【优点与缺点】：
 * - 优点: 精度极高，在任意滑动区间内均严格受限，完全消除了窗口边界突发问题。
 * - 缺点: 内存占用大。即使被拒绝的请求也可能需要考虑或记录（通常只记录放行的时间戳），
 *   大量并发下内存线性增长。在 Redis 中通常采用 ZSET (有序集合) 实现。
 *
 * 【复杂度】：
 * - 时间复杂度: O(log N) 或 O(M)（M 为单次淘汰的过期请求数）
 * - 空间复杂度: O(maxRequests)
 */

export class SlidingWindowLogRateLimiter {
  /**
   * @param {number} maxRequests - 滑动窗口内的最大允许请求数
   * @param {number} windowSizeMs - 滑动窗口时长（毫秒）
   */
  constructor(maxRequests, windowSizeMs) {
    if (maxRequests <= 0 || windowSizeMs <= 0) {
      throw new Error('maxRequests and windowSizeMs must be positive');
    }
    this.maxRequests = maxRequests;
    this.windowSizeMs = windowSizeMs;
    this.logs = []; // 存储有效请求的时间戳（单调递增队列）
  }

  /**
   * 尝试放行请求
   * @param {number} [now=Date.now()]
   * @returns {boolean}
   */
  allowRequest(now = Date.now()) {
    const windowStart = now - this.windowSizeMs;

    // 1. 淘汰已滑出当前窗口的过期时间戳
    while (this.logs.length > 0 && this.logs[0] <= windowStart) {
      this.logs.shift();
    }

    // 2. 检查窗口内现存请求数量
    if (this.logs.length < this.maxRequests) {
      this.logs.push(now);
      return true;
    }

    // 超额拦截
    return false;
  }

  /**
   * 当前窗口内实际有效请求数
   */
  get currentLogCount() {
    return this.logs.length;
  }
}

// --- 演示与自测代码 ---
if (process.argv[1] && process.argv[1].endsWith('sliding-window-log.js')) {
  console.log('=== 滑动窗口日志算法演示 ===');
  // 窗口时长 1000ms，配额 3 次
  const limiter = new SlidingWindowLogRateLimiter(3, 1000);

  console.log('1. 在 100ms, 200ms, 300ms, 400ms 发起请求:');
  console.log('t=100ms:', limiter.allowRequest(100) ? '✅ 放行' : '❌ 拦截');
  console.log('t=200ms:', limiter.allowRequest(200) ? '✅ 放行' : '❌ 拦截');
  console.log('t=300ms:', limiter.allowRequest(300) ? '✅ 放行' : '❌ 拦截');
  console.log('t=400ms (配额已满3次):', limiter.allowRequest(400) ? '✅ 放行' : '❌ 拦截');

  console.log('\n2. 推进时间至 t=1150ms (此时 100ms 的记录已过期滑出窗口):');
  console.log('t=1150ms:', limiter.allowRequest(1150) ? '✅ 放行 (名额腾出)' : '❌ 拦截');
}
