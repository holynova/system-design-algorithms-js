/**
 * @file double-entry-ledger.js
 * @description 第二卷 第11章：支付系统 (Payment System)
 * 经典算法/会计准则：复式记账法账本 (Double-Entry Bookkeeping Ledger)
 *
 * 【系统设计背景】：
 * 在金融级支付系统（如 Stripe、PayPal、支付宝）中，资金正确性是不可妥协的底线。
 * 单式记账（直接对账户余额执行 `balance = balance - amount`）极易因为网络崩溃、中间异常而凭空产生或凭空蒸发资金。
 * 拥有数百年历史的“复式记账法 (Double-Entry Bookkeeping)”是全球金融业的基石：
 * 1. 恒等式：**借方总额必须严格等于贷方总额 (Total Debits == Total Credits)**。
 * 2. 资金平衡会计等式：`资产 (Assets) = 负债 (Liabilities) + 所有者权益 (Equity)`。
 * 3. 不可变流水账 (Immutable Journal):
 *    - 账本记录绝对不可修改 (UPDATE) 或物理删除 (DELETE)。
 *    - 若发生错误交易或退款，必须通过新增一笔“冲正分录 (Reversal Entry)”来平衡。
 */

export const ACCOUNT_TYPE = Object.freeze({
  ASSET: 'ASSET', // 资产类 (如: 银行准备金存款、现金) - 借增贷减
  LIABILITY: 'LIABILITY', // 负债类 (如: 用户钱包余额、应付款项) - 贷增借减
  EQUITY: 'EQUITY', // 权益类 (如: 平台净资产、交易手续费收入) - 贷增借减
});

export class LedgerEntry {
  /**
   * @param {string} accountId - 账户 ID
   * @param {'DEBIT'|'CREDIT'} type - 借方或贷方
   * @param {bigint|number} amount - 交易金额（最小货币单位，如分，杜绝浮点数精度丢失）
   */
  constructor(accountId, type, amount) {
    if (amount <= 0) throw new Error('Transaction amount must be positive');
    this.accountId = accountId;
    this.type = type;
    this.amount = BigInt(amount);
  }
}

export class DoubleEntryLedger {
  constructor() {
    // accountId -> { id: string, type: ACCOUNT_TYPE, balance: bigint }
    this.accounts = new Map();
    // 交易凭证日志列表 (不可变历史审计链)
    this.transactions = [];
  }

  createAccount(accountId, type) {
    if (this.accounts.has(accountId)) {
      throw new Error(`Account "${accountId}" already exists`);
    }
    this.accounts.set(accountId, {
      id: accountId,
      type,
      balance: 0n,
    });
  }

  /**
   * 记录一笔复式记账事务（包含多条借贷分录）
   * @param {string} transactionId - 事务唯一流水号
   * @param {LedgerEntry[]} entries - 分录数组
   * @param {string} description - 交易备注
   * @param {number} [timestamp=Date.now()]
   */
  recordTransaction(transactionId, entries, description, timestamp = Date.now()) {
    let totalDebit = 0n;
    let totalCredit = 0n;

    for (const entry of entries) {
      if (!this.accounts.has(entry.accountId)) {
        throw new Error(`Unknown account: ${entry.accountId}`);
      }
      if (entry.type === 'DEBIT') {
        totalDebit += entry.amount;
      } else if (entry.type === 'CREDIT') {
        totalCredit += entry.amount;
      }
    }

    // 核心审计校验：借贷必须绝对平衡！
    if (totalDebit !== totalCredit) {
      throw new Error(`Double-entry balance check failed! Total Debits (${totalDebit}) !== Total Credits (${totalCredit})`);
    }

    // 应用记账，更新账户余额
    for (const entry of entries) {
      const acc = this.accounts.get(entry.accountId);

      // 资产类账户：借方增加，贷方减少
      if (acc.type === ACCOUNT_TYPE.ASSET) {
        if (entry.type === 'DEBIT') acc.balance += entry.amount;
        else acc.balance -= entry.amount;
      } else {
        // 负债与权益类账户：贷方增加，借方减少
        if (entry.type === 'CREDIT') acc.balance += entry.amount;
        else acc.balance -= entry.amount;
      }
    }

    // 写入不可变账本
    this.transactions.push({
      transactionId,
      entries,
      description,
      timestamp,
      totalAmount: totalDebit,
    });
  }

  getAccountBalance(accountId) {
    const acc = this.accounts.get(accountId);
    return acc ? acc.balance : 0n;
  }

  /**
   * 验证全行资产负债恒等式: Assets == Liabilities + Equity
   * @returns {boolean}
   */
  verifySystemBalance() {
    let assets = 0n;
    let liabilities = 0n;
    let equity = 0n;

    for (const acc of this.accounts.values()) {
      if (acc.type === ACCOUNT_TYPE.ASSET) assets += acc.balance;
      else if (acc.type === ACCOUNT_TYPE.LIABILITY) liabilities += acc.balance;
      else if (acc.type === ACCOUNT_TYPE.EQUITY) equity += acc.balance;
    }

    return assets === (liabilities + equity);
  }
}

// --- 演示与自测代码 ---
if (process.argv[1] && process.argv[1].endsWith('double-entry-ledger.js')) {
  console.log('=== 复式记账法账本 (Double-Entry Ledger) 演示 ===');
  const ledger = new DoubleEntryLedger();

  // 创建账户
  ledger.createAccount('BANK_CASH', ACCOUNT_TYPE.ASSET); // 资产：银行备付金
  ledger.createAccount('USER_ALICE_WALLET', ACCOUNT_TYPE.LIABILITY); // 负债：Alice 钱包余额
  ledger.createAccount('PLATFORM_FEE_INCOME', ACCOUNT_TYPE.EQUITY); // 权益：平台手续费收入

  console.log('1. Alice 充值 100 元 (10000分):');
  // 银行资产增加 100元 (借)，Alice 钱包负债增加 100元 (贷)
  ledger.recordTransaction('tx_001', [
    new LedgerEntry('BANK_CASH', 'DEBIT', 10000n),
    new LedgerEntry('USER_ALICE_WALLET', 'CREDIT', 10000n),
  ], 'Alice 银行卡充值');

  console.log('Alice 钱包余额:', ledger.getAccountBalance('USER_ALICE_WALLET').toString(), '分');
  console.log('银行备付金余额:', ledger.getAccountBalance('BANK_CASH').toString(), '分');
  console.log('资产负债会计等式恒成立校验:', ledger.verifySystemBalance() ? '✅ 平衡' : '❌ 失衡');

  console.log('\n2. 扣除 2 元手续费:');
  // Alice 负债减少 2元 (借)，平台手续费权益增加 2元 (贷)
  ledger.recordTransaction('tx_002', [
    new LedgerEntry('USER_ALICE_WALLET', 'DEBIT', 200n),
    new LedgerEntry('PLATFORM_FEE_INCOME', 'CREDIT', 200n),
  ], '服务费扣除');

  console.log('Alice 最终余额:', ledger.getAccountBalance('USER_ALICE_WALLET').toString(), '分');
  console.log('平台手续费收入:', ledger.getAccountBalance('PLATFORM_FEE_INCOME').toString(), '分');
  console.log('会计等式检查:', ledger.verifySystemBalance() ? '✅ 平衡' : '❌ 失衡');
}
