/**
 * @file idempotency-deduplicator.js
 * @description 第一卷 第10章：设计一个通知系统 (Design A Notification System)
 * 经典算法/设计模式：幂等性去重器 (Idempotency Key Deduplicator)
 *
 * 【系统设计背景】：
 * 在分布式消息和通知投递链路中，网络超时往往导致发送方发起重试。
 * “至少一次投递 (At-least-once Delivery)”会引发重复给用户发送多条相同短信或邮件的糟糕体验。
 * 业务层通过幂等键（Idempotency Key，通常为客户端生成并携带的 UUID 或业务唯一 hash）进行拦截去重，
 * 保证即使重试多次，系统也仅实际投递一次。
 *
 * 【状态机与并发防重】：
 * - PENDING: 请求正在执行中，拦截相同 key 的并发重入。
 * - COMPLETED: 请求已成功完成，直接返回历史结果快照。
 * - EXPIRED: 超过保留滑动窗口后自动清除状态释放内存。
 */

export class IdempotencyDeduplicator {
  /**
   * @param {number} [ttlMs=60000] - 幂等键有效窗口期（毫秒）
   */
  constructor(ttlMs = 60000) {
    this.ttlMs = ttlMs;
    // key -> { status: 'PENDING'|'COMPLETED', result: *, expiresAt: number }
    this.store = new Map();
  }

  /**
   * 执行带有幂等保护的业务操作
   * @template T
   * @param {string} idempotencyKey
   * @param {() => Promise<T>|T} operation - 业务逻辑
   * @param {number} [now=Date.now()]
   * @returns {Promise<{ executed: boolean, result: T }>}
   */
  async process(idempotencyKey, operation, now = Date.now()) {
    this._cleanExpired(now);

    const record = this.store.get(idempotencyKey);

    if (record) {
      if (record.status === 'PENDING') {
        throw new Error(`Concurrent duplicate request detected for key: "${idempotencyKey}"`);
      }
      if (record.status === 'COMPLETED') {
        // 重复调用：直接返回幂等保存的结果，不重复执行操作！
        return { executed: false, result: record.result };
      }
    }

    // 记录 PENDING 状态
    this.store.set(idempotencyKey, {
      status: 'PENDING',
      result: null,
      expiresAt: now + this.ttlMs,
    });

    try {
      const result = await operation();
      // 成功执行，更新为 COMPLETED
      this.store.set(idempotencyKey, {
        status: 'COMPLETED',
        result,
        expiresAt: now + this.ttlMs,
      });
      return { executed: true, result };
    } catch (err) {
      // 失败则删除该 key，允许后续合法重试
      this.store.delete(idempotencyKey);
      throw err;
    }
  }

  _cleanExpired(now) {
    for (const [key, record] of this.store.entries()) {
      if (now > record.expiresAt) {
        this.store.delete(key);
      }
    }
  }
}

// --- 演示与自测代码 ---
if (process.argv[1] && process.argv[1].endsWith('idempotency-deduplicator.js')) {
  console.log('=== 幂等性去重器 (Idempotency Deduplicator) 演示 ===');
  const deduplicator = new IdempotencyDeduplicator(10000);

  let sendCount = 0;
  const mockSendSms = async () => {
    sendCount++;
    return { smsId: `msg_${sendCount}`, status: 'SENT' };
  };

  const idempotencyKey = 'req_order_8888_notification';

  console.log('1. 首次投递通知:');
  const res1 = await deduplicator.process(idempotencyKey, mockSendSms);
  console.log('首次结果:', res1, `(实际调用发信服务次数: ${sendCount})`);

  console.log('\n2. 模拟网络丢包后客户端重试相同请求:');
  const res2 = await deduplicator.process(idempotencyKey, mockSendSms);
  console.log('重试结果:', res2, `(实际调用发信服务次数仍然为: ${sendCount}, 成功拦截重复发送！)`);
}
