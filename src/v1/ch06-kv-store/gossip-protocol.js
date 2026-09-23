/**
 * @file gossip-protocol.js
 * @description 第一卷 第06章：key-value 存储设计 (Design A Key-Value Store)
 * 经典算法：流言协议与故障检测器 (Gossip Protocol & Failure Detection)
 *
 * 【系统设计背景】：
 * 在完全去中心化、无 master 节点的集群中（如 Cassandra、Consul），
 * 不能依赖单点健康检查。流言协议（Gossip / 流行病算法）通过点对点随机通信，
 * 让集群各节点在 O(log N) 周期内收敛获得全局节点状态，并以高容错性检测节点故障。
 *
 * 【工作机制】：
 * 1. 每个节点维护一张成员列表：`[NodeId, HeartbeatCounter, LocalTimestamp]`。
 * 2. 节点定期（例如每周期）自增本地心跳计数器。
 * 3. 随机选择 k 个邻居节点，发送自己的成员列表（Gossip 消息）。
 * 4. 接收方合并列表：取接收到的更高心跳计数器，并刷新该节点的本地最后更新时间戳。
 * 5. 若某节点的心跳计数器在预设阈值时间内未更新，则标记为“疑似宕机 (Suspected)”，持续超时则标记为“宕机 (Dead)”。
 */

export class GossipNode {
  /**
   * @param {string} id - 节点 ID
   * @param {number} [failureTimeoutMs=5000] - 超时判定故障时长
   */
  constructor(id, failureTimeoutMs = 5000) {
    this.id = id;
    this.failureTimeoutMs = failureTimeoutMs;
    this.heartbeatCounter = 0;
    // memberId -> { heartbeat: number, lastSeen: number, status: 'ALIVE'|'DEAD' }
    this.membershipTable = new Map();
    this.peers = []; // 外部已知集群对等节点实例引用

    // 记录自身
    this.membershipTable.set(this.id, {
      heartbeat: 0,
      lastSeen: Date.now(),
      status: 'ALIVE',
    });
  }

  setPeers(peers) {
    this.peers = peers.filter(p => p.id !== this.id);
  }

  /**
   * 节点本地推进一个周期：心跳自增、随机挑选对等节点 Gossip
   * @param {number} [now=Date.now()]
   */
  tick(now = Date.now()) {
    // 1. 自增自身心跳
    this.heartbeatCounter++;
    this.membershipTable.set(this.id, {
      heartbeat: this.heartbeatCounter,
      lastSeen: now,
      status: 'ALIVE',
    });

    // 2. 检测其它成员是否超时
    for (const [nodeId, info] of this.membershipTable.entries()) {
      if (nodeId === this.id) continue;
      if (now - info.lastSeen > this.failureTimeoutMs) {
        info.status = 'DEAD';
      }
    }

    // 3. 随机选择 1 个存活节点同步状态
    const alivePeers = this.peers.filter(p => {
      const info = this.membershipTable.get(p.id);
      return !info || info.status === 'ALIVE';
    });

    if (alivePeers.length > 0) {
      const target = alivePeers[Math.floor(Math.random() * alivePeers.length)];
      target.receiveGossip(this.id, this.exportMembership(), now);
    }
  }

  /**
   * 导出当前成员列表的轻量快照
   */
  exportMembership() {
    const list = {};
    for (const [nodeId, info] of this.membershipTable.entries()) {
      list[nodeId] = { heartbeat: info.heartbeat };
    }
    return list;
  }

  /**
   * 接收来自对等节点的 Gossip 消息并合并
   * @param {string} senderId
   * @param {Record<string, {heartbeat: number}>} incomingList
   * @param {number} [now=Date.now()]
   */
  receiveGossip(senderId, incomingList, now = Date.now()) {
    for (const [nodeId, incomingInfo] of Object.entries(incomingList)) {
      const localInfo = this.membershipTable.get(nodeId);

      if (!localInfo) {
        // 发现新加入节点
        this.membershipTable.set(nodeId, {
          heartbeat: incomingInfo.heartbeat,
          lastSeen: now,
          status: 'ALIVE',
        });
      } else if (incomingInfo.heartbeat > localInfo.heartbeat) {
        // 对端具有更新的心跳，刷新本地记录
        localInfo.heartbeat = incomingInfo.heartbeat;
        localInfo.lastSeen = now;
        localInfo.status = 'ALIVE';
      }
    }
  }

  /**
   * 获得当前视图中存活与死亡节点统计
   */
  getClusterStatus() {
    const alive = [];
    const dead = [];
    for (const [nodeId, info] of this.membershipTable.entries()) {
      if (info.status === 'ALIVE') alive.push(nodeId);
      else dead.push(nodeId);
    }
    return { alive: alive.sort(), dead: dead.sort() };
  }
}

// --- 演示与自测代码 ---
if (process.argv[1] && process.argv[1].endsWith('gossip-protocol.js')) {
  console.log('=== 流言协议 (Gossip Protocol) 故障检测演示 ===');
  const n1 = new GossipNode('Node-1', 3000);
  const n2 = new GossipNode('Node-2', 3000);
  const n3 = new GossipNode('Node-3', 3000);
  const cluster = [n1, n2, n3];

  n1.setPeers(cluster);
  n2.setPeers(cluster);
  n3.setPeers(cluster);

  let mockTime = 1000;
  console.log('1. 节点 1、2、3 正常心跳并 Gossip 扩散状态:');
  for (let i = 0; i < 5; i++) {
    mockTime += 500;
    cluster.forEach(n => n.tick(mockTime));
  }
  console.log('Node-1 视角集群状态:', n1.getClusterStatus());

  console.log('\n2. 模拟 Node-3 宕机（停止发送心跳，时间推进 4 秒超出 3 秒超时）:');
  for (let i = 0; i < 8; i++) {
    mockTime += 500;
    n1.tick(mockTime);
    n2.tick(mockTime);
    // n3 宕机不再 tick
  }

  console.log('Node-1 视角已成功检测出 Node-3 故障:', n1.getClusterStatus());
}
