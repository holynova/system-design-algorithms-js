/**
 * @file two-phase-commit.js
 * @description 第二卷 第12章：数字钱包 (Digital Wallet)
 * 经典分布式共识协议：两阶段提交协议状态机仿真 (Two-Phase Commit - 2PC)
 *
 * 【系统设计背景】：
 * 两阶段提交 (2PC) 是保证强一致性分布式事务的最经典协议。
 * 包含两类角色：
 * 1. 协调者 (Coordinator): 统筹整个事务生命周期的指挥官。
 * 2. 参与者 (Cohort / Participant): 各个具体的数据库分片节点。
 *
 * 【协议流程】：
 * - 准备阶段 (Prepare Phase):
 *   协调者向所有参与者广播 `PREPARE` 消息。
 *   参与者执行本地事务、锁定资源并写入 Undo/Redo 日志；若准备就绪回复 `VOTE_COMMIT`，否则回复 `VOTE_ABORT`。
 * - 提交/回滚阶段 (Commit/Abort Phase):
 *   若所有参与者全部投出 `VOTE_COMMIT`，协调者向大家发送 `GLOBAL_COMMIT`；
 *   若有任何一个参与者投了 `VOTE_ABORT` 或网络超时，协调者广播 `GLOBAL_ABORT`，全员回滚。
 */

export class TwoPhaseParticipant {
  constructor(nodeId) {
    this.nodeId = nodeId;
    this.status = 'INITIAL'; // 'INITIAL' | 'PREPARED' | 'COMMITTED' | 'ABORTED'
    this.failOnPrepare = false; // 用于模拟故障注入
  }

  prepare() {
    if (this.failOnPrepare) {
      this.status = 'ABORTED';
      return false; // 投反对比
    }
    this.status = 'PREPARED';
    return true; // 投赞成票 (锁定资源)
  }

  commit() {
    this.status = 'COMMITTED';
    return true;
  }

  abort() {
    this.status = 'ABORTED';
    return true;
  }
}

export class TwoPhaseCommitCoordinator {
  /**
   * @param {TwoPhaseParticipant[]} participants
   */
  constructor(participants) {
    this.participants = participants;
    this.state = 'IDLE'; // 'IDLE' | 'PREPARING' | 'COMMITTED' | 'ABORTED'
  }

  /**
   * 执行完整的两阶段提交
   * @returns {{ status: 'GLOBAL_COMMIT'|'GLOBAL_ABORT', votes: Record<string, boolean> }}
   */
  executeTransaction() {
    this.state = 'PREPARING';
    const votes = {};
    let allVotedYes = true;

    // --- 阶段一：准备阶段 (Prepare Phase) ---
    for (const p of this.participants) {
      const vote = p.prepare();
      votes[p.nodeId] = vote;
      if (!vote) {
        allVotedYes = false;
      }
    }

    // --- 阶段二：决议执行 (Commit / Abort Phase) ---
    if (allVotedYes) {
      this.state = 'COMMITTED';
      for (const p of this.participants) {
        p.commit();
      }
      return { status: 'GLOBAL_COMMIT', votes };
    } else {
      this.state = 'ABORTED';
      for (const p of this.participants) {
        p.abort();
      }
      return { status: 'GLOBAL_ABORT', votes };
    }
  }
}

// --- 演示与自测代码 ---
if (process.argv[1] && process.argv[1].endsWith('two-phase-commit.js')) {
  console.log('=== 两阶段提交 (2PC) 分布式事务演示 ===');

  console.log('1. 正常场景：所有节点均准备就绪:');
  const p1 = new TwoPhaseParticipant('Shard_1');
  const p2 = new TwoPhaseParticipant('Shard_2');
  const coord1 = new TwoPhaseCommitCoordinator([p1, p2]);
  console.log('执行结果:', coord1.executeTransaction());
  console.log('参与者状态:', p1.status, p2.status);

  console.log('\n2. 故障回滚场景：模拟 Shard_2 发生资源竞争锁定失败:');
  const p3 = new TwoPhaseParticipant('Shard_1');
  const p4 = new TwoPhaseParticipant('Shard_2');
  p4.failOnPrepare = true; // 模拟故障

  const coord2 = new TwoPhaseCommitCoordinator([p3, p4]);
  console.log('执行结果:', coord2.executeTransaction());
  console.log('全员回滚后参与者状态:', p3.status, p4.status);
}
