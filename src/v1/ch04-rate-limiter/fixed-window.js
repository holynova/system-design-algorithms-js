/**
 * @file fixed-window.js
 * @description 第一卷 第04章：设计一个限流器 (Design A Rate Limiter)
 * 经典算法：固定窗口计数器算法 (Fixed Window Counter Algorithm)
 *
 * 【系统设计背景】：
 * 最简单直观的限流方式。将时间轴切分为固定的时间片段（如每分钟、每秒）。
 * 每个窗口维护一个独立计数器，计数器达到阈值即拦截后续请求。
 *
 * 【主要缺陷：窗口临界突发双倍流量 (Boundary Burst Problem)】：
 * 设窗口为 1 分钟，配额为 5 次。
 * 若在 00:59 秒涌入 5 次请求全部放行，随后在 01:01 秒新窗口开始又涌入 5 次请求全部放行。
 * 在这短短 2 秒的滑动跨度内，实际放行了 10 次请求，达到了额定上限的 2 倍！
 *
 * 【复杂度】：
 * - 时间复杂度: O(1)
 * - 空间复杂度: O(1)
 */

export class FixedWindowRateLimiter {
  /**
   * @param {number} maxRequests - 窗口内允许的最大请求数
   * @param {number} windowSizeMs - 窗口时长（毫秒）
   */
  constructor(maxRequests, windowSizeMs) {
    if (maxRequests <= 0 || windowSizeMs <= 0) {
      throw new Error('maxRequests and windowSizeMs must be positive');
    }
    this.maxRequests = maxRequests;
    this.windowSizeMs = windowSizeMs;
    this.currentWindowKey = 0;
    this.counter = 0;
  }

  /**
   * 尝试放行请求
   * @param {number} [now=Date.now()]
   * @returns {boolean}
   */
  allowRequest(now = Date.now()) {
    const windowKey = Math.floor(now / this.windowSizeMs);

    // 进入新窗口，计数器重置为 0
    if (windowKey !== this.currentWindowKey) {
      this.currentWindowKey = windowKey;
      this.counter = 0;
    }

    if (this.counter < this.maxRequests) {
      this.counter++;
      return true;
    }

    return false;
  }

  /**
   * 获取当前窗口已用配额
   */
  get currentCount() {
    return this.counter;
  }
}

// --- 演示与自测代码 ---
if (process.argv[1] && process.argv[1].endsWith('fixed-window.js')) {
  console.log('=== 固定窗口计数器算法演示 ===');
  // 每 1000ms 最多 3 次
  const limiter = new FixedWindowRateLimiter(3, 1000);
  const t0 = 1000; // 窗口 [1000, 2000)

  console.log('1. 在当前窗口发起 4 次请求 (配额 3):');
  for (let i = 1; i <= 4; i++) {
    console.log(`- 请求 #${i}: ${limiter.allowRequest(t0 + i * 10) ? '✅ 放行' : '❌ 拦截'}`);
  }

  console.log('\n2. 跨入下一个时间窗口 (t=2000ms): 计数器自动清零，重新恢复配额:');
  const t1 = 2000;
  console.log(`- 请求 #5: ${limiter.allowRequest(t1) ? '✅ 放行' : '❌ 拦截'}`);
}
