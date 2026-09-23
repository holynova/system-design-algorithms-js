/**
 * @file sliding-window-counter.js
 * @description 第一卷 第04章：设计一个限流器 (Design A Rate Limiter)
 * 经典算法：滑动窗口计数器算法 (Sliding Window Counter / Weighted Approximation)
 *
 * 【系统设计背景】：
 * 结合了“固定窗口的低内存开销”与“滑动日志的平滑防突发优势”。
 * 业界著名 CDN 和反向代理服务商 Cloudflare 广泛使用此算法。
 *
 * 【计算公式】：
 * 假设窗口时长为 1 分钟，当前时间处于当前窗口的 30% 位置（即已过 18 秒）：
 * 滑动窗口内估算的请求数 = 当前窗口请求数 + 前一窗口请求数 × (1 - 30%)
 * 如果 `估算请求数 + 1 <= 阈值`，则放行并增加当前窗口计数；否则拒绝。
 *
 * 【复杂度】：
 * - 时间复杂度: O(1)
 * - 空间复杂度: O(1)
 */

export class SlidingWindowCounterRateLimiter {
  /**
   * @param {number} maxRequests - 窗口内最大请求数
   * @param {number} windowSizeMs - 窗口时长（毫秒）
   */
  constructor(maxRequests, windowSizeMs) {
    if (maxRequests <= 0 || windowSizeMs <= 0) {
      throw new Error('maxRequests and windowSizeMs must be positive');
    }
    this.maxRequests = maxRequests;
    this.windowSizeMs = windowSizeMs;

    this.currentWindowKey = 0;
    this.currentCount = 0;
    this.previousCount = 0;
  }

  /**
   * 尝试放行请求
   * @param {number} [now=Date.now()]
   * @returns {boolean}
   */
  allowRequest(now = Date.now()) {
    const windowKey = Math.floor(now / this.windowSizeMs);

    // 跨窗口推进状态
    if (windowKey !== this.currentWindowKey) {
      if (windowKey === this.currentWindowKey + 1) {
        // 紧邻下一个窗口：原当前窗口变为前一窗口
        this.previousCount = this.currentCount;
      } else {
        // 跨越了多个窗口：前一窗口已无参考意义，清零
        this.previousCount = 0;
      }
      this.currentWindowKey = windowKey;
      this.currentCount = 0;
    }

    // 计算当前处于窗口内部的时间百分比 (0.0 ~ 1.0)
    const windowStart = windowKey * this.windowSizeMs;
    const progressInCurrentWindow = (now - windowStart) / this.windowSizeMs;

    // 加权估算请求数: 当前窗口已计入量 + 前一窗口重叠部分加权量
    const weightedOverlap = this.previousCount * (1 - progressInCurrentWindow);
    const estimatedRequests = this.currentCount + weightedOverlap;

    if (estimatedRequests + 1 <= this.maxRequests) {
      this.currentCount++;
      return true;
    }

    return false;
  }

  /**
   * 获得当前滑动窗口加权估算值
   * @param {number} [now=Date.now()]
   * @returns {number}
   */
  getEstimatedCount(now = Date.now()) {
    const windowKey = Math.floor(now / this.windowSizeMs);
    if (windowKey !== this.currentWindowKey) {
      return 0;
    }
    const windowStart = windowKey * this.windowSizeMs;
    const progress = (now - windowStart) / this.windowSizeMs;
    return Number((this.currentCount + this.previousCount * (1 - progress)).toFixed(2));
  }
}

// --- 演示与自测代码 ---
if (process.argv[1] && process.argv[1].endsWith('sliding-window-counter.js')) {
  console.log('=== 滑动窗口计数器 (加权平滑) 演示 ===');
  // 窗口 1000ms，配额 5 次
  const limiter = new SlidingWindowCounterRateLimiter(5, 1000);

  console.log('1. 在第 1 个窗口 [0, 1000ms) 的末尾写入 4 次:');
  for (let i = 0; i < 4; i++) {
    limiter.allowRequest(900 + i * 20);
  }

  console.log('2. 进入第 2 个窗口 [1000, 2000ms) 的 100ms 处 (即进度的 10%):');
  // 此时前一窗口权重占 90%，前一窗口有 4 次，估算贡献为 4 * 0.9 = 3.6 次
  // 3.6 + 1 = 4.6 <= 5 放行
  console.log('- 请求 1 (t=1100ms):', limiter.allowRequest(1100) ? '✅ 放行' : '❌ 拦截');
  // 此时当前已有 1 次，加权估算 1 + 3.6 = 4.6 次，再来 1 次就是 5.6 > 5 被拦截
  console.log('- 请求 2 (t=1100ms):', limiter.allowRequest(1100) ? '✅ 放行' : '❌ 拦截 (防止了临界突发)');
}
