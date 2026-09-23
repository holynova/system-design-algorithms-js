/**
 * @file capacity-calculator.js
 * @description 第一卷 第02章：粗略估算 (Back-of-the-envelope Estimation)
 * 工具/算法：系统设计容量估算器与经典延迟参考表
 *
 * 【系统设计背景】：
 * 在系统设计面试中，不能凭空给出技术选型。必须先通过“数量级估算”确定系统规模：
 * 到底是单机即可搞定，还是必须分布式分片？需要多少台缓存机器？带宽成本有多大？
 * 本模块实现了标准的容量估算公式、2的幂换算及 Jeff Dean 经典延迟数据表。
 */

/**
 * 经典计算机系统延迟对比表 (Latency Numbers Every Programmer Should Know - Jeff Dean)
 */
export const LATENCY_TABLE = Object.freeze({
  L1_CACHE_REFERENCE_NS: 0.5,
  BRANCH_MISPREDICT_NS: 5,
  L2_CACHE_REFERENCE_NS: 7,
  MUTEX_LOCK_UNLOCK_NS: 100,
  MAIN_MEMORY_REFERENCE_NS: 100,
  COMPRESS_1KB_WITH_ZLIB_NS: 10_000, // 10 us
  SEND_2KB_OVER_1GBPS_NETWORK_NS: 20_000, // 20 us
  SSD_RANDOM_READ_NS: 150_000, // 150 us
  READ_1MB_SEQUENTIALLY_FROM_MEMORY_NS: 250_000, // 250 us
  ROUND_TRIP_WITHIN_SAME_DATACENTER_NS: 500_000, // 0.5 ms
  DISK_SEEK_NS: 10_000_000, // 10 ms
  READ_1MB_SEQUENTIALLY_FROM_NETWORK_NS: 10_000_000, // 10 ms
  READ_1MB_SEQUENTIALLY_FROM_DISK_NS: 30_000_000, // 30 ms
  PACKET_ROUNDTRIP_CA_TO_NETHERLANDS_NS: 150_000_000, // 150 ms
});

/**
 * 2 的幂存储单位对照表
 */
export const POWER_OF_TWO = Object.freeze({
  BYTE: 1,
  KB: 1024,
  MB: 1024 * 1024,
  GB: 1024 * 1024 * 1024,
  TB: 1024 * 1024 * 1024 * 1024,
  PB: 1024 * 1024 * 1024 * 1024 * 1024,
});

export class CapacityCalculator {
  /**
   * 计算平均 QPS (Queries Per Second)
   * 公式: DAU * 每人每日请求数 / 86400 秒 (粗略估算按 100,000 或 86,400)
   * @param {number} dailyActiveUsers - 日活跃用户 (DAU)
   * @param {number} requestsPerUser - 每天每用户平均发出的请求数
   * @param {number} [secondsPerDay=86400]
   * @returns {number}
   */
  static estimateQPS(dailyActiveUsers, requestsPerUser, secondsPerDay = 86400) {
    const totalDailyRequests = dailyActiveUsers * requestsPerUser;
    return Math.round(totalDailyRequests / secondsPerDay);
  }

  /**
   * 计算峰值 QPS (Peak QPS 通常假设为平均 QPS 的 2~3 倍)
   * @param {number} avgQPS
   * @param {number} [peakMultiplier=2]
   * @returns {number}
   */
  static estimatePeakQPS(avgQPS, peakMultiplier = 2) {
    return Math.round(avgQPS * peakMultiplier);
  }

  /**
   * 估算存储需求
   * @param {number} dailyWrites - 每日写入量（请求数）
   * @param {number} bytesPerRecord - 单条记录字节大小
   * @param {number} years - 保留年限 (1年按 365 天算)
   * @returns {{ dailyBytes: number, totalBytes: number, readableDaily: string, readableTotal: string }}
   */
  static estimateStorage(dailyWrites, bytesPerRecord, years = 5) {
    const dailyBytes = dailyWrites * bytesPerRecord;
    const totalBytes = dailyBytes * 365 * years;
    return {
      dailyBytes,
      totalBytes,
      readableDaily: this.formatBytes(dailyBytes),
      readableTotal: this.formatBytes(totalBytes),
    };
  }

  /**
   * 根据二八定律 (Pareto Principle 80/20 规则) 估算缓存所需内存
   * 20% 的热点数据产生 80% 的请求，因此缓存 20% 的单日数据
   * @param {number} dailyStorageBytes - 每日总数据量（字节）
   * @param {number} [cacheRatio=0.2] - 缓存比例 (默认 20%)
   * @returns {{ cacheBytes: number, readable: string }}
   */
  static estimateCacheMemory(dailyStorageBytes, cacheRatio = 0.2) {
    const cacheBytes = dailyStorageBytes * cacheRatio;
    return {
      cacheBytes,
      readable: this.formatBytes(cacheBytes),
    };
  }

  /**
   * 估算网络带宽需求 (以 MB/s 与 Mbps 计算)
   * @param {number} qps - 每秒请求数
   * @param {number} bytesPerRequest - 每次请求数据量
   * @returns {{ bytesPerSec: number, mbPerSec: number, mbps: number }}
   */
  static estimateBandwidth(qps, bytesPerRequest) {
    const bytesPerSec = qps * bytesPerRequest;
    const mbPerSec = bytesPerSec / (1024 * 1024);
    const mbps = (bytesPerSec * 8) / 1_000_000; // 网络常用十进制比特率
    return {
      bytesPerSec,
      mbPerSec: Number(mbPerSec.toFixed(2)),
      mbps: Number(mbps.toFixed(2)),
    };
  }

  /**
   * 人性化格式化字节数
   * @param {number} bytes
   * @returns {string}
   */
  static formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const value = (bytes / Math.pow(1024, i)).toFixed(2);
    return `${value} ${units[i]}`;
  }
}

// --- 演示与自测代码 ---
if (process.argv[1] && process.argv[1].endsWith('capacity-calculator.js')) {
  console.log('=== 系统设计容量估算器演示 ===');
  const dau = 300_000_000; // 3亿 DAU (推特/微博级别)
  const tweetsPerUser = 2; // 每天发 2 条
  const tweetSize = 500; // 每条 500 字节

  const qps = CapacityCalculator.estimateQPS(dau, tweetsPerUser);
  const peakQps = CapacityCalculator.estimatePeakQPS(qps);
  console.log(`平均写入 QPS: ${qps.toLocaleString()}, 峰值 QPS: ${peakQps.toLocaleString()}`);

  const storage = CapacityCalculator.estimateStorage(dau * tweetsPerUser, tweetSize, 5);
  console.log(`每日新增存储: ${storage.readableDaily}, 5年总存储: ${storage.readableTotal}`);

  const cache = CapacityCalculator.estimateCacheMemory(storage.dailyBytes);
  console.log(`基于 80/20 法则单日缓存所需内存: ${cache.readable}`);

  const bandwidth = CapacityCalculator.estimateBandwidth(peakQps, tweetSize);
  console.log(`峰值写入带宽: ${bandwidth.mbPerSec} MB/s (${bandwidth.mbps} Mbps)`);
}
