/**
 * @file watermark-stream-window.js
 * @description 第二卷 第06章：广告点击事件聚合 (Ad Click Event Aggregation)
 * 经典算法：基于事件时间与水位线推进的流处理窗口聚合 (Watermark-Based Stream Window Aggregator)
 *
 * 【系统设计背景】：
 * 在数字广告实时结算与计费系统（如 Google Ads、Facebook Ads）中，广告点击事件从移动端上报可能遭遇网络延迟或离线重发。
 * 如果使用“处理时间 (Processing Time)”聚合，同一批点击会被计入错误的分钟窗口中。
 * 因此流计算引擎（如 Apache Flink、Spark Streaming）采用“事件时间 (Event Time)”与“水位线 (Watermark)”：
 * 1. 事件时间: 点击在用户手机上实际发生的物理时间。
 * 2. 水位线 (Watermark = maxEventTime - allowedLateness): 系统对时间进度的客观度量，
 *    宣告“时间戳小于等于当前水位线的所有历史事件，系统假定已全部到达”。
 * 3. 窗口触发: 当水位线越过窗口结束边界 `[windowStart, windowEnd)` 时，触发窗口计算并输出账单。
 * 4. 迟到事件 (Late Events): 水位线已过、窗口已关闭后才迟迟到达的孤儿事件，重定向到旁路侧输出流 (Side Output) 进行后续对账补录。
 */

export class WatermarkStreamAggregator {
  /**
   * @param {number} windowSizeMs - 翻滚窗口大小（如 60,000ms = 1 分钟）
   * @param {number} [maxOutOfOrdernessMs=10000] - 允许的最大事件乱序/延迟时长
   */
  constructor(windowSizeMs, maxOutOfOrdernessMs = 10000) {
    this.windowSizeMs = windowSizeMs;
    this.maxOutOfOrderness = maxOutOfOrdernessMs;

    this.maxEventTimeSeen = 0;
    this.currentWatermark = 0;

    // windowStart -> Map<adId, count>
    this.activeWindows = new Map();
    // 已经触发输出并关闭的窗口边界
    this.closedWindows = new Set();
    // 迟到旁路事件记录
    this.lateEvents = [];
  }

  /**
   * 摄入一条点击流事件
   * @param {{ adId: string, eventTime: number, clickId: string }} event
   * @returns {{ emittedWindows: Array<{ windowStart: number, windowEnd: number, aggregates: Record<string, number> }>, isLate: boolean }}
   */
  processEvent(event) {
    const { adId, eventTime } = event;

    // 1. 刷新观察到的最大事件时间并推进水位线
    if (eventTime > this.maxEventTimeSeen) {
      this.maxEventTimeSeen = eventTime;
      this.currentWatermark = Math.max(0, this.maxEventTimeSeen - this.maxOutOfOrderness);
    }

    // 2. 计算该事件所属的窗口
    const windowStart = Math.floor(eventTime / this.windowSizeMs) * this.windowSizeMs;
    const windowEnd = windowStart + this.windowSizeMs;

    // 3. 检查该窗口是否早已关闭 (迟到事件)
    if (this.closedWindows.has(windowStart)) {
      this.lateEvents.push(event);
      return { emittedWindows: [], isLate: true };
    }

    // 4. 计入窗口聚合状态
    if (!this.activeWindows.has(windowStart)) {
      this.activeWindows.set(windowStart, new Map());
    }
    const windowCounts = this.activeWindows.get(windowStart);
    windowCounts.set(adId, (windowCounts.get(adId) || 0) + 1);

    // 5. 检查是否有窗口因当前水位线推进而触发关闭
    const emittedWindows = [];
    for (const [wStart, counts] of this.activeWindows.entries()) {
      const wEnd = wStart + this.windowSizeMs;
      // 水位线已经赶超窗口结束时间，触发窗口并关闭
      if (this.currentWatermark >= wEnd) {
        emittedWindows.push({
          windowStart: wStart,
          windowEnd: wEnd,
          aggregates: Object.fromEntries(counts),
        });
        this.closedWindows.add(wStart);
        this.activeWindows.delete(wStart);
      }
    }

    return { emittedWindows, isLate: false };
  }
}

// --- 演示与自测代码 ---
if (process.argv[1] && process.argv[1].endsWith('watermark-stream-window.js')) {
  console.log('=== 水位线与流聚合窗口 (Watermark & Streaming Windows) 演示 ===');
  // 窗口大小 10 秒 (10,000ms)，允许乱序延迟 3 秒 (3,000ms)
  const aggregator = new WatermarkStreamAggregator(10000, 3000);

  console.log('1. 顺序摄入在 [0, 10000ms) 窗口内的两次点击:');
  aggregator.processEvent({ adId: 'ad_nike', eventTime: 2000, clickId: 'c1' });
  aggregator.processEvent({ adId: 'ad_nike', eventTime: 5000, clickId: 'c2' });
  console.log('当前观察最大时间: 5000ms, 水位线:', aggregator.currentWatermark);

  console.log('\n2. 突然到来一个未来时间的事件 (t=14000ms)，推动水位线前进至 14000 - 3000 = 11000ms:');
  const res2 = aggregator.processEvent({ adId: 'ad_apple', eventTime: 14000, clickId: 'c3' });
  console.log('触发关闭并输出的窗口:', res2.emittedWindows);

  console.log('\n3. 此时迟到了一条在 00:08 发送但刚刚才到的事件 (t=8000ms):');
  const res3 = aggregator.processEvent({ adId: 'ad_nike', eventTime: 8000, clickId: 'c4' });
  console.log(`是否作为迟到孤儿事件进入旁路流:`, res3.isLate);
  console.log('旁路迟到对账队列:', aggregator.lateEvents);
}
