/**
 * @file message-sequencer.js
 * @description 第一卷 第12章：设计一个聊天系统 (Design A Chat System)
 * 经典机制/算法：会话级单调递增消息序列生成器与空洞检测 (Chat Message Sequencer & Gap Detection)
 *
 * 【系统设计背景】：
 * 在即时通讯系统（如 WhatsApp、微信、Slack）中，消息顺序至关重要。
 * 如果消息顺序颠倒，会导致“先回答、后提问”的逻辑混乱。
 * 全局严格递增序列在跨机房分布式环境下开销极大，但原书指出：
 * **在同一个群聊或单聊会话 (Channel/Conversation) 内部，维护单调递增的 Sequence ID 即可完全满足业务排序**。
 *
 * 【客户端空洞检测 (Gap Detection)】：
 * 接收端收到消息时比对 Sequence ID：
 * - 若收到当前 seq 恰好为 lastSeq + 1：顺序连续，正常展示；
 * - 若收到当前 seq > lastSeq + 1：说明中间有消息丢包或乱序（发生空洞 Gap），
 *   客户端触发后台静默重拉拉取缺损的消息区间 `[lastSeq + 1, seq - 1]`。
 */

export class ConversationMessageSequencer {
  constructor() {
    // conversationId -> currentSequenceNumber (BigInt)
    this.conversationSequences = new Map();
  }

  /**
   * 为指定会话中的新消息分配下一个严格递增的 Sequence ID
   * @param {string} conversationId
   * @returns {bigint}
   */
  nextSequence(conversationId) {
    const current = this.conversationSequences.get(conversationId) || 0n;
    const next = current + 1n;
    this.conversationSequences.set(conversationId, next);
    return next;
  }

  /**
   * 当前会话最新分配的序列号
   * @param {string} conversationId
   * @returns {bigint}
   */
  getCurrentSequence(conversationId) {
    return this.conversationSequences.get(conversationId) || 0n;
  }
}

export class ChatClientReceiver {
  constructor(userId) {
    this.userId = userId;
    // conversationId -> lastReceivedSequence
    this.lastReceivedSeq = new Map();
  }

  /**
   * 接收消息并进行空洞检测
   * @param {string} conversationId
   * @param {bigint} seq
   * @param {string} content
   * @returns {{ status: 'OK'|'DUPLICATE'|'GAP_DETECTED', missingRange?: [bigint, bigint] }}
   */
  receiveMessage(conversationId, seq, content) {
    const last = this.lastReceivedSeq.get(conversationId) || 0n;

    if (seq <= last) {
      return { status: 'DUPLICATE' }; // 重复消息或旧消息
    }

    if (seq === last + 1n) {
      this.lastReceivedSeq.set(conversationId, seq);
      return { status: 'OK' }; // 严格有序
    }

    // 发现空洞！例如上次是 2，这次收到了 5，缺损了 [3, 4]
    const missingStart = last + 1n;
    const missingEnd = seq - 1n;
    this.lastReceivedSeq.set(conversationId, seq);

    return {
      status: 'GAP_DETECTED',
      missingRange: [missingStart, missingEnd],
    };
  }
}

// --- 演示与自测代码 ---
if (process.argv[1] && process.argv[1].endsWith('message-sequencer.js')) {
  console.log('=== 聊天消息定序器与空洞检测演示 ===');
  const sequencer = new ConversationMessageSequencer();
  const receiver = new ChatClientReceiver('User_Bob');

  const convId = 'group_dev_team';

  const m1Seq = sequencer.nextSequence(convId);
  const m2Seq = sequencer.nextSequence(convId);
  const m3Seq = sequencer.nextSequence(convId);

  console.log(`生成顺序消息: m1=${m1Seq}, m2=${m2Seq}, m3=${m3Seq}`);

  console.log('\nBob 接收消息测试:');
  console.log('收到 m1:', receiver.receiveMessage(convId, m1Seq, 'Hello'));

  // 模拟网络乱序/丢包：m2 丢失，直接收到 m3
  console.log('网络丢包，直接收到 m3:');
  const gapCheck = receiver.receiveMessage(convId, m3Seq, 'Are you there?');
  console.log('接收结果:', gapCheck);
  console.log(`⚠️ 触发自动补偿：向服务端补拉序列号 [${gapCheck.missingRange[0]}, ${gapCheck.missingRange[1]}] 的消息！`);
}
