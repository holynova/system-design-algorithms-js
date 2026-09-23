/**
 * @file snowflake.js
 * @description 第一卷 第07章：分布式系统中设计唯一 ID 生成器 (Design A Unique ID Generator In Distributed Systems)
 * 经典算法：Twitter Snowflake 雪花算法 (64位分布式自增有序 ID)
 *
 * 【系统设计背景】：
 * 在分布式架构中，单数据库自增主键无法满足高并发吞吐要求，且容易暴露业务数据量；
 * UUID 字符串长（128位）、无序、不易建索引且占用空间大。
 * Twitter Snowflake 算法在不依赖中心化协调器（如 ZooKeeper/Redis）的前提下，
 * 纯本地生成趋势递增、全局唯一的 64 位整型 ID。
 *
 * 【64 位比特布局】：
 * +-------------------------------------------------------------------------+
 * | 1 bit 符号位 | 41 bits 毫秒时间戳 | 5 bits 数据中心 | 5 bits 机器ID | 12 bits 序列号 |
 * | (固定为 0)   | (支持使用 ~69 年)  | (支持 32 机房)  | (支持 32 节点)| (每毫秒 4096 个) |
 * +-------------------------------------------------------------------------+
 *
 * 【时钟回拨处理】：
 * 若系统时钟被 NTP 向后回拨，可能导致产生重复 ID。
 * 当检测到 `currentTimestamp < lastTimestamp` 时，进行防御性等待或抛出异常。
 */

export class SnowflakeIdGenerator {
  /**
   * @param {number} datacenterId - 数据中心 ID (0 ~ 31)
   * @param {number} workerId - 机器节点 ID (0 ~ 31)
   * @param {number} [epoch=1577836800000] - 自定义纪元时间戳 (默认 2020-01-01 00:00:00 UTC)
   */
  constructor(datacenterId, workerId, epoch = 1577836800000) {
    // 位数常量
    this.WORKER_ID_BITS = 5n;
    this.DATACENTER_ID_BITS = 5n;
    this.SEQUENCE_BITS = 12n;

    // 最大值限制
    this.MAX_WORKER_ID = -1n ^ (-1n << this.WORKER_ID_BITS); // 31
    this.MAX_DATACENTER_ID = -1n ^ (-1n << this.DATACENTER_ID_BITS); // 31
    this.SEQUENCE_MASK = -1n ^ (-1n << this.SEQUENCE_BITS); // 4095

    // 左移偏移量
    this.WORKER_ID_SHIFT = this.SEQUENCE_BITS; // 12
    this.DATACENTER_ID_SHIFT = this.SEQUENCE_BITS + this.WORKER_ID_BITS; // 17
    this.TIMESTAMP_LEFT_SHIFT = this.SEQUENCE_BITS + this.WORKER_ID_BITS + this.DATACENTER_ID_BITS; // 22

    if (datacenterId < 0 || BigInt(datacenterId) > this.MAX_DATACENTER_ID) {
      throw new Error(`datacenterId must be between 0 and ${this.MAX_DATACENTER_ID}`);
    }
    if (workerId < 0 || BigInt(workerId) > this.MAX_WORKER_ID) {
      throw new Error(`workerId must be between 0 and ${this.MAX_WORKER_ID}`);
    }

    this.datacenterId = BigInt(datacenterId);
    this.workerId = BigInt(workerId);
    this.epoch = BigInt(epoch);

    this.sequence = 0n;
    this.lastTimestamp = -1n;
  }

  /**
   * 生成全局唯一 64 位 BigInt ID
   * @returns {bigint}
   */
  nextId() {
    let timestamp = this._currentTimestamp();

    // 检查时钟回拨
    if (timestamp < this.lastTimestamp) {
      const offset = this.lastTimestamp - timestamp;
      if (offset <= 5n) {
        // 短暂回拨：等待直到追平
        while (timestamp <= this.lastTimestamp) {
          timestamp = this._currentTimestamp();
        }
      } else {
        throw new Error(`Clock moved backwards! Refusing to generate id for ${offset} ms`);
      }
    }

    if (timestamp === this.lastTimestamp) {
      // 同一毫秒内，自增序列号
      this.sequence = (this.sequence + 1n) & this.SEQUENCE_MASK;
      if (this.sequence === 0n) {
        // 4096 序列耗尽，等待下一毫秒
        timestamp = this._waitNextMillis(this.lastTimestamp);
      }
    } else {
      // 进入新毫秒，序列号归零
      this.sequence = 0n;
    }

    this.lastTimestamp = timestamp;

    // 拼装 64 位 ID
    const id =
      ((timestamp - this.epoch) << this.TIMESTAMP_LEFT_SHIFT) |
      (this.datacenterId << this.DATACENTER_ID_SHIFT) |
      (this.workerId << this.WORKER_ID_SHIFT) |
      this.sequence;

    return id;
  }

  /**
   * 解析 Snowflake ID 回原始各组成字段
   * @param {bigint|string} id
   * @returns {{ timestamp: number, date: Date, datacenterId: number, workerId: number, sequence: number }}
   */
  parse(id) {
    const bigId = BigInt(id);
    const sequence = Number(bigId & this.SEQUENCE_MASK);
    const workerId = Number((bigId >> this.WORKER_ID_SHIFT) & this.MAX_WORKER_ID);
    const datacenterId = Number((bigId >> this.DATACENTER_ID_SHIFT) & this.MAX_DATACENTER_ID);
    const timeDelta = bigId >> this.TIMESTAMP_LEFT_SHIFT;
    const timestamp = Number(timeDelta + this.epoch);

    return {
      timestamp,
      date: new Date(timestamp),
      datacenterId,
      workerId,
      sequence,
    };
  }

  _currentTimestamp() {
    return BigInt(Date.now());
  }

  _waitNextMillis(lastTimestamp) {
    let timestamp = this._currentTimestamp();
    while (timestamp <= lastTimestamp) {
      timestamp = this._currentTimestamp();
    }
    return timestamp;
  }
}

// --- 演示与自测代码 ---
if (process.argv[1] && process.argv[1].endsWith('snowflake.js')) {
  console.log('=== Twitter Snowflake 雪花算法演示 ===');
  const generator = new SnowflakeIdGenerator(1, 1);

  console.log('1. 生成 5 个趋势递增的 64 位唯一 ID:');
  const ids = [];
  for (let i = 0; i < 5; i++) {
    const id = generator.nextId();
    ids.push(id);
    console.log(`- ID: ${id.toString()} (二进制: ${id.toString(2)})`);
  }

  console.log('\n2. 反向解码第一个 ID:');
  const parsed = generator.parse(ids[0]);
  console.log('解码详情:', parsed);
  console.log(`生成时间: ${parsed.date.toISOString()}, 机房: ${parsed.datacenterId}, 节点: ${parsed.workerId}, 序号: ${parsed.sequence}`);
}
