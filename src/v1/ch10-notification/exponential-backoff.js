/**
 * @file exponential-backoff.js
 * @description 第一卷 第10章：设计一个通知系统 (Design A Notification System)
 * 经典算法：带抖动的指数退避重试算法 (Exponential Backoff with Full/Decorrelated Jitter)
 *
 * 【系统设计背景】：
 * 在通知系统集成第三方推送供应商（如 Apple APNs、Google FCM、Twilio 短信网关）时，
 * 网络抖动或对端限流会导致临时失败。
 * 如果所有客户端在固定间隔或单纯指数退避后同时重试，会造成灾难性的“惊群效应 / 重试风暴 (Retry Storm)”，
 * 彻底击垮下游本就脆弱的服务。
 *
 * 【三种主流抖动策略 (AWS 官方推荐)】：
 * 1. 无抖动 (No Jitter): `sleep = min(cap, base * 2^attempt)`
 * 2. 全抖动 (Full Jitter): `sleep = random(0, min(cap, base * 2^attempt))`
 * 3. 对半抖动 (Equal Jitter): `temp = min(cap, base * 2^attempt); sleep = temp/2 + random(0, temp/2)`
 * 4. 去相关抖动 (Decorrelated Jitter): `sleep = min(cap, random(base, prevSleep * 3))`
 */

export class ExponentialBackoff {
  /**
   * @param {number} [baseDelayMs=100] - 基础重试间隔
   * @param {number} [maxDelayMs=10000] - 最大退避上限 (Cap)
   * @param {'FULL_JITTER'|'EQUAL_JITTER'|'NO_JITTER'} [jitterType='FULL_JITTER']
   */
  constructor(baseDelayMs = 100, maxDelayMs = 10000, jitterType = 'FULL_JITTER') {
    this.baseDelayMs = baseDelayMs;
    this.maxDelayMs = maxDelayMs;
    this.jitterType = jitterType;
  }

  /**
   * 计算指定重试次数下的等待毫秒数
   * @param {number} attempt - 第几次重试 (从 0 开始)
   * @returns {number} 等待时长（毫秒）
   */
  calculateDelay(attempt) {
    const rawExponential = this.baseDelayMs * Math.pow(2, attempt);
    const capped = Math.min(this.maxDelayMs, rawExponential);

    switch (this.jitterType) {
      case 'FULL_JITTER':
        // 在 [0, capped] 之间均匀随机，最大化平滑并发尖峰
        return Math.floor(Math.random() * (capped + 1));

      case 'EQUAL_JITTER': {
        // 保留一半保底时间，另一半随机波动
        const half = Math.floor(capped / 2);
        return half + Math.floor(Math.random() * (half + 1));
      }

      case 'NO_JITTER':
      default:
        return capped;
    }
  }

  /**
   * 自动重试包装执行器 (可直接包装异步操作)
   * @template T
   * @param {() => Promise<T>} fn - 需要执行的异步任务
   * @param {number} [maxAttempts=3] - 最大尝试次数
   * @returns {Promise<T>}
   */
  async executeWithRetry(fn, maxAttempts = 3) {
    let lastError;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err;
        if (attempt === maxAttempts - 1) break;

        const delay = this.calculateDelay(attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw lastError;
  }
}

// --- 演示与自测代码 ---
if (process.argv[1] && process.argv[1].endsWith('exponential-backoff.js')) {
  console.log('=== 指数退避与抖动 (Backoff & Jitter) 算法演示 ===');

  const backoffFull = new ExponentialBackoff(100, 2000, 'FULL_JITTER');
  const backoffNoJitter = new ExponentialBackoff(100, 2000, 'NO_JITTER');

  console.log('对比无抖动 vs 全抖动 在 0~4 次重试下的等待延迟分布:');
  for (let i = 0; i < 5; i++) {
    const dNo = backoffNoJitter.calculateDelay(i);
    const dFull1 = backoffFull.calculateDelay(i);
    const dFull2 = backoffFull.calculateDelay(i);
    console.log(`- 重试 #${i}: 无抖动固定=${dNo}ms | 全抖动随机样本=[${dFull1}ms, ${dFull2}ms]`);
  }
}
