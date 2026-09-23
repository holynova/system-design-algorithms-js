/**
 * @file quorum-consensus.js
 * @description 第一卷 第06章：key-value 存储设计 (Design A Key-Value Store)
 * 经典算法：法定人数共识协议 (Quorum Consensus: W + R > N)
 *
 * 【系统设计背景】：
 * 在无单主架构的分布式存储系统中，为了在延迟、一致性和可用性之间做权衡，
 * 采用可调一致性 (Tunable Consistency) 的 Quorum 机制：
 * - N: 数据的总副本数 (Replication Factor)
 * - W: 写操作必须成功确认的最少节点数 (Write Quorum)
 * - R: 读操作必须成功响应的最少节点数 (Read Quorum)
 *
 * 【定理】：
 * - 若 W + R > N：根据鸽巢原理，读集合与写集合必有交集，保证能够读取到最新写入的数据（强一致性保证前提）。
 * - 若 R = 1, W = N：系统针对极快读进行优化；
 * - 若 W = 1, R = N：系统针对极快写进行优化；
 * - 若 W + R <= N：弱一致性/最终一致性，写或读延迟最低，但可能读到旧版本数据。
 */

export class QuorumReplica {
  constructor(nodeId) {
    this.nodeId = nodeId;
    this.storage = new Map(); // key -> { value, version }
    this.isAlive = true;
  }

  write(key, value, version) {
    if (!this.isAlive) throw new Error(`Node ${this.nodeId} is unreachable`);
    this.storage.set(key, { value, version });
    return true;
  }

  read(key) {
    if (!this.isAlive) throw new Error(`Node ${this.nodeId} is unreachable`);
    return this.storage.get(key) || { value: undefined, version: 0 };
  }
}

export class QuorumCoordinator {
  /**
   * @param {QuorumReplica[]} replicas - 副本集群 (总数 N)
   * @param {number} W - 写法定人数
   * @param {number} R - 读法定人数
   */
  constructor(replicas, W, R) {
    this.replicas = replicas;
    this.N = replicas.length;
    this.W = W;
    this.R = R;
    this.currentVersion = 0;
  }

  /**
   * 写入键值对并满足 W 法定人数
   * @param {string} key
   * @param {*} value
   * @returns {{ success: boolean, ackCount: number, version: number }}
   */
  write(key, value) {
    this.currentVersion++;
    let ackCount = 0;

    for (const replica of this.replicas) {
      try {
        replica.write(key, value, this.currentVersion);
        ackCount++;
      } catch (err) {
        // 节点不可达
      }
    }

    const success = ackCount >= this.W;
    return { success, ackCount, version: this.currentVersion };
  }

  /**
   * 读取键值对并收集 R 个响应，选择最高版本号的数据（读修复可在此触发）
   * @param {string} key
   * @returns {{ success: boolean, value: *, version: number, responses: number }}
   */
  read(key) {
    let responses = 0;
    let latestData = { value: undefined, version: -1 };

    for (const replica of this.replicas) {
      try {
        const data = replica.read(key);
        responses++;
        if (data.version > latestData.version) {
          latestData = data;
        }
      } catch (err) {
        // 节点不可达
      }
    }

    if (responses >= this.R) {
      return {
        success: true,
        value: latestData.value,
        version: latestData.version,
        responses,
      };
    }

    return { success: false, value: undefined, version: 0, responses };
  }

  /** 判断当前配置是否满足强一致交集 (W + R > N) */
  isStrongConsistency() {
    return this.W + this.R > this.N;
  }
}

// --- 演示与自测代码 ---
if (process.argv[1] && process.argv[1].endsWith('quorum-consensus.js')) {
  console.log('=== 法定人数 (Quorum Consensus) 演示 ===');
  // 3 副本, W=2, R=2 (W + R = 4 > 3 强一致配置)
  const replicas = [new QuorumReplica('R1'), new QuorumReplica('R2'), new QuorumReplica('R3')];
  const coordinator = new QuorumCoordinator(replicas, 2, 2);

  console.log(`N=${coordinator.N}, W=${coordinator.W}, R=${coordinator.R}, 是否强一致:`, coordinator.isStrongConsistency());

  // 1. 模拟写入
  const writeRes = coordinator.write('title', 'System Design Book');
  console.log('1. 写入结果:', writeRes);

  // 2. 模拟 R3 节点宕机
  console.log('\n2. 模拟 R3 节点宕机，由于 W=2, R=2，即使 1 台机器宕机仍能满足法定人数:');
  replicas[2].isAlive = false;

  const readRes = coordinator.read('title');
  console.log('读取结果 (收到 2 票确认，读到最新值):', readRes);

  // 3. 再挂掉 R2 节点，只剩 1 台，无法凑齐 R=2
  replicas[1].isAlive = false;
  const readResFail = coordinator.read('title');
  console.log('\n3. 仅剩 1 台可用时读取结果 (未达到 R=2):', readResFail);
}
