/**
 * @file time-series-downsampler.js
 * @description 第二卷 第05章：指标监控与告警系统 (Metrics Monitoring And Alerting System)
 * 经典算法：时序数据时桶降采样与滚动聚合 (Time-Series Bucket Downsampling & Rollup)
 *
 * 【系统设计背景】：
 * 在监控系统（如 Prometheus、InfluxDB、Datadog）中，海量服务器每秒上报 CPU、内存、QPS 等指标。
 * 若将原始 1 秒级高频采样数据永久保存，存储成本将以 TB 级膨胀。
 * 时序数据库采用“保留策略 (Retention Policy) 与降采样 (Downsampling)”：
 * - 最近 7 天：保留 10 秒精度原始数据；
 * - 7 ~ 30 天：将原始数据按 1 分钟时桶 (Bucket) 降采样为单一数据点；
 * - 30 天以上：进一步聚合为 1 小时时桶。
 * 降采样保留统计特征值：Count (采样数), Sum (总和), Min (最小值), Max (最大值), Avg (平均值)。
 */

export class TimeSeriesDownsampler {
  /**
   * 将高频时序数据按照指定桶大小 (如 60,000ms = 1分钟) 进行聚合降采样
   * @param {Array<{ timestamp: number, value: number }>} rawData - 原始时序数据
   * @param {number} bucketSizeMs - 降采样桶时长（毫秒）
   * @returns {Array<{ bucketStart: number, count: number, min: number, max: number, avg: number, sum: number }>}
   */
  static downsample(rawData, bucketSizeMs) {
    if (!rawData || rawData.length === 0) return [];

    // bucketStartTimestamp -> Array<number>
    const buckets = new Map();

    for (const point of rawData) {
      const bucketStart = Math.floor(point.timestamp / bucketSizeMs) * bucketSizeMs;
      if (!buckets.has(bucketStart)) {
        buckets.set(bucketStart, []);
      }
      buckets.get(bucketStart).push(point.value);
    }

    const aggregated = [];
    const sortedBucketKeys = [...buckets.keys()].sort((a, b) => a - b);

    for (const bStart of sortedBucketKeys) {
      const values = buckets.get(bStart);
      const count = values.length;
      let min = Infinity;
      let max = -Infinity;
      let sum = 0;

      for (const v of values) {
        if (v < min) min = v;
        if (v > max) max = v;
        sum += v;
      }

      aggregated.push({
        bucketStart: bStart,
        count,
        min,
        max,
        sum: Number(sum.toFixed(2)),
        avg: Number((sum / count).toFixed(2)),
      });
    }

    return aggregated;
  }
}

// --- 演示与自测代码 ---
if (process.argv[1] && process.argv[1].endsWith('time-series-downsampler.js')) {
  console.log('=== 时序数据时桶降采样 (Downsampling) 演示 ===');
  // 模拟 12 个每隔 10 秒采样的原始 CPU 数据点 (跨越 2 分钟)
  const rawPoints = [];
  const baseTime = 1700000000000;

  for (let i = 0; i < 12; i++) {
    rawPoints.push({
      timestamp: baseTime + i * 10000,
      value: 50 + Math.floor(Math.random() * 30), // 50% ~ 80% CPU
    });
  }

  console.log(`原始高频采样点数: ${rawPoints.length} 个 (每 10 秒 1 点)`);

  // 按 60 秒 (1分钟) 聚合降采样
  const rollups = TimeSeriesDownsampler.downsample(rawPoints, 60000);
  console.log('\n降采样为 1 分钟时桶后的聚合结果:');
  rollups.forEach((b, idx) => {
    console.log(`- 时桶 #${idx + 1} [${new Date(b.bucketStart).toISOString()}]: 采样数=${b.count}, 均值=${b.avg}%, 峰值=${b.max}%, 谷值=${b.min}%`);
  });
}
