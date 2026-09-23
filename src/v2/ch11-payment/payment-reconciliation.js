/**
 * @file payment-reconciliation.js
 * @description 第二卷 第11章：支付系统 (Payment System)
 * 经典算法/对账模型：双向对账与差异分类算法 (Two-Way Payment Reconciliation)
 *
 * 【系统设计背景】：
 * 在真实的分布式支付链路中，网络丢包、PSP 异步回调丢失、系统瞬时宕机在所难免。
 * 哪怕系统设计得再完美，每天仍然会有少许“悬空交易”产生数据不一致。
 * 对账系统 (Reconciliation) 是金融系统的最后一道防线：
 * 每日深夜拉取外部渠道对账单（如 Visa、Stripe、银联清算文件），与内部支付账本进行双向比对：
 * 1. MATCHED: 双向完全吻合（金额、状态一致）。
 * 2. MISSING_IN_INTERNAL: 外部已扣款成功，内部仍为 PENDING 或无记录（典型回调丢失，需补单入账）。
 * 3. MISSING_IN_PSP: 内部记为成功，但外部渠道无此交易（严重虚增，需冲正排查）。
 * 4. AMOUNT_MISMATCH: 双方均有记录，但扣款金额不一致（汇率或篡改异常）。
 */

export class PaymentReconciliation {
  /**
   * 执行双向对账比对
   * @param {Array<{ txId: string, amount: number, status: string }>} internalRecords - 内部系统账单
   * @param {Array<{ txId: string, amount: number, status: string }>} pspRecords - 外部渠道清算账单
   * @returns {{
   *   matched: Array<{ txId: string, amount: number }>,
   *   missingInInternal: Array<*>,
   *   missingInPSP: Array<*>,
   *   amountMismatch: Array<{ txId: string, internalAmount: number, pspAmount: number }>,
   *   isAllReconciled: boolean
   * }}
   */
  static reconcile(internalRecords, pspRecords) {
    const internalMap = new Map(internalRecords.map(r => [r.txId, r]));
    const pspMap = new Map(pspRecords.map(r => [r.txId, r]));

    const matched = [];
    const missingInInternal = [];
    const missingInPSP = [];
    const amountMismatch = [];

    // 1. 扫描内部账单，检查外部是否存在
    for (const [txId, internalTx] of internalMap.entries()) {
      const pspTx = pspMap.get(txId);
      if (!pspTx) {
        missingInPSP.push(internalTx);
      } else {
        if (internalTx.amount !== pspTx.amount) {
          amountMismatch.push({
            txId,
            internalAmount: internalTx.amount,
            pspAmount: pspTx.amount,
          });
        } else if (internalTx.status === pspTx.status) {
          matched.push({ txId, amount: internalTx.amount });
        }
      }
    }

    // 2. 扫描外部渠道账单，检查内部是否有遗漏 (回调丢失情况)
    for (const [txId, pspTx] of pspMap.entries()) {
      if (!internalMap.has(txId)) {
        missingInInternal.push(pspTx);
      }
    }

    const isAllReconciled =
      missingInInternal.length === 0 &&
      missingInPSP.length === 0 &&
      amountMismatch.length === 0;

    return {
      matched,
      missingInInternal,
      missingInPSP,
      amountMismatch,
      isAllReconciled,
    };
  }
}

// --- 演示与自测代码 ---
if (process.argv[1] && process.argv[1].endsWith('payment-reconciliation.js')) {
  console.log('=== 支付系统双向对账差异分类演示 ===');

  const internalTransactions = [
    { txId: 'TX_1001', amount: 5000, status: 'SUCCESS' },
    { txId: 'TX_1002', amount: 3000, status: 'SUCCESS' }, // 正常匹配
    { txId: 'TX_1003', amount: 9900, status: 'SUCCESS' }, // 外部渠道无此记录 (MISSING_IN_PSP)
    { txId: 'TX_1004', amount: 1000, status: 'SUCCESS' }, // 金额不一致
  ];

  const pspTransactions = [
    { txId: 'TX_1001', amount: 5000, status: 'SUCCESS' },
    { txId: 'TX_1002', amount: 3000, status: 'SUCCESS' },
    { txId: 'TX_1004', amount: 1200, status: 'SUCCESS' }, // 外部记为 1200
    { txId: 'TX_1005', amount: 8800, status: 'SUCCESS' }, // 内部丢失了回调 (MISSING_IN_INTERNAL)
  ];

  const report = PaymentReconciliation.reconcile(internalTransactions, pspTransactions);
  console.log(`完全对齐一致的交易: ${report.matched.length} 笔`);
  console.log(`内部单边账 (外部渠道缺失):`, report.missingInPSP);
  console.log(`外部单边账 (内部回调漏单):`, report.missingInInternal);
  console.log(`金额不一致异常账单:`, report.amountMismatch);
  console.log(`对账最终状态: ${report.isAllReconciled ? '✅ 完全平账' : '⚠️ 存在差异，生成工单排查'}`);
}
