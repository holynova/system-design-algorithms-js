/**
 * @file saga-orchestrator.js
 * @description 第二卷 第12章：数字钱包 (Digital Wallet)
 * 经典分布式事务模式：Saga 编排器与补偿回滚机制 (Saga Pattern Orchestrator & Compensating Actions)
 *
 * 【系统设计背景】：
 * 在数字钱包中，用户账户数据通常按用户 ID 分片存储在不同的数据库分片甚至不同微服务中。
 * 跨账户转账（例如用户 A 转账 100 元给跨分片的用户 B）无法依赖单机数据库本地 ACID 事务。
 * 传统的 2PC (两阶段提交) 协议在跨网络时性能极差，且协调者单点阻塞严重。
 * Saga 模式是现代微服务分布式事务的黄金标准：
 * 1. 将一个全局分布式大事务拆分为一系列有序的本地子事务 (T1, T2, ..., Tn)；
 * 2. 为每个正向子事务配对一个幂等的反向补偿事务 (C1, C2, ..., Cn)；
 * 3. 编排器 (Orchestrator) 顺序执行各子事务：
 *    - 若全部成功，全局事务提交完成；
 *    - 若某个子事务 Ti 失败，编排器以相反顺序逆向触发补偿事务 (Ci-1, ..., C1)，将系统干净恢复到初始一致状态。
 */

export class SagaStep {
  /**
   * @param {string} name - 步骤名称
   * @param {() => Promise<*>|*} execute - 正向执行操作
   * @param {() => Promise<*>|*} compensate - 逆向补偿回滚操作 (必须幂等且确保成功)
   */
  constructor(name, execute, compensate) {
    this.name = name;
    this.execute = execute;
    this.compensate = compensate;
  }
}

export class SagaOrchestrator {
  constructor() {
    this.steps = [];
    this.executionHistory = [];
  }

  addStep(step) {
    this.steps.push(step);
    return this;
  }

  /**
   * 执行 Saga 分布式事务工作流
   * @returns {Promise<{ status: 'SUCCESS'|'FAILED_COMPENSATED', executedSteps: string[], compensatedSteps: string[], error?: Error }>}
   */
  async execute() {
    const executedSteps = [];
    const compensatedSteps = [];

    for (let i = 0; i < this.steps.length; i++) {
      const step = this.steps[i];
      try {
        await step.execute();
        executedSteps.push(step.name);
      } catch (err) {
        // 当前步骤执行失败，立即启动逆向补偿机制
        for (let j = executedSteps.length - 1; j >= 0; j--) {
          const compStep = this.steps[j];
          try {
            await compStep.compensate();
            compensatedSteps.push(compStep.name);
          } catch (compErr) {
            // 工业级建议记录死信队列告警人工介入
            console.error(`CRITICAL: Compensation failed on step "${compStep.name}":`, compErr);
          }
        }

        return {
          status: 'FAILED_COMPENSATED',
          executedSteps,
          compensatedSteps,
          error: err,
        };
      }
    }

    return {
      status: 'SUCCESS',
      executedSteps,
      compensatedSteps: [],
    };
  }
}

// --- 演示与自测代码 ---
if (process.argv[1] && process.argv[1].endsWith('saga-orchestrator.js')) {
  console.log('=== Saga 分布式事务编排与补偿演示 ===');

  // 模拟两个账户在不同数据库分片
  const shardA = { accountId: 'User_A', balance: 100 };
  const shardB = { accountId: 'User_B', balance: 50 };

  console.log('转账前状态: A余额=', shardA.balance, ', B余额=', shardB.balance);

  // 场景：A 向 B 转账 30 元，但在第 2 步给 B 加钱时模拟网络崩溃
  const saga = new SagaOrchestrator();

  saga.addStep(
    new SagaStep(
      '扣减 A 账户余额',
      async () => {
        if (shardA.balance < 30) throw new Error('余额不足');
        shardA.balance -= 30;
        console.log('  -> [Step 1 成功] 扣减 A 账户 30 元，A 现余额:', shardA.balance);
      },
      async () => {
        shardA.balance += 30;
        console.log('  <- [补偿 1] 补偿回滚：退还 A 账户 30 元，A 现余额:', shardA.balance);
      }
    )
  );

  saga.addStep(
    new SagaStep(
      '增加 B 账户余额',
      async () => {
        // 模拟 B 所在分片数据库连接超时宕机
        throw new Error('分片 B 数据库连接超时 (Connection Timeout)');
      },
      async () => {
        shardB.balance -= 30;
      }
    )
  );

  const result = await saga.execute();
  console.log('\nSaga 最终执行报告:', {
    status: result.status,
    executedSteps: result.executedSteps,
    compensatedSteps: result.compensatedSteps,
    failureReason: result.error?.message,
  });

  console.log('\n事务回滚后最终状态: A余额=', shardA.balance, ', B余额=', shardB.balance, '(资金安全未受损失！)');
}
