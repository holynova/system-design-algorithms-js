/**
 * @file inverted-index.js
 * @description 第二卷 第08章：分布式邮件服务 (Distributed Email Service)
 * 经典数据结构/算法：邮件全文检索倒排索引 (Inverted Index with Boolean Search)
 *
 * 【系统设计背景】：
 * 在现代邮件系统（如 Gmail、Outlook）中，单个用户可能积攒数万封包含长正文的邮件。
 * 如果使用关系型数据库的 `LIKE '%keyword%'` 进行模糊查询，必须全表逐行文本扫描，查询慢且极耗 CPU。
 * 倒排索引 (Inverted Index) 是搜索引擎的核心基础：
 * - 正向索引: 邮件 ID -> 邮件正文内容
 * - 倒排索引: 关键词 Token -> 包含该词的邮件 ID 倒排列表 (Posting List)
 * 查询多个词组合时，通过两个有序倒排列表的双指针求交集 (Intersection)、并集 (Union) 或差集 (Difference)，
 * 即可在毫秒级内完成复杂的布尔检索。
 */

export class EmailInvertedIndex {
  constructor() {
    // term -> Set<emailId>
    this.index = new Map();
    // emailId -> EmailObject
    this.emails = new Map();
  }

  /**
   * 简单的中英文与符号分词器
   * @param {string} text
   * @returns {string[]}
   */
  static tokenize(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fa5]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 0);
  }

  /**
   * 建立一封邮件的倒排索引
   * @param {string} emailId
   * @param {string} subject
   * @param {string} body
   */
  addEmail(emailId, subject, body) {
    this.emails.set(emailId, { emailId, subject, body });

    const fullText = `${subject} ${body}`;
    const tokens = new Set(EmailInvertedIndex.tokenize(fullText));

    for (const term of tokens) {
      if (!this.index.has(term)) {
        this.index.set(term, new Set());
      }
      this.index.get(term).add(emailId);
    }
  }

  /**
   * 单词检索
   * @param {string} term
   * @returns {Set<string>}
   */
  searchSingle(term) {
    const normalized = term.toLowerCase().trim();
    return this.index.get(normalized) || new Set();
  }

  /**
   * 布尔 AND 检索：所有关键词必须全部命中 (倒排列表求交集)
   * @param {string[]} terms
   * @returns {Array<{ emailId: string, subject: string }>}
   */
  searchAND(terms) {
    if (terms.length === 0) return [];

    let resultSet = null;

    for (const t of terms) {
      const currentSet = this.searchSingle(t);
      if (!resultSet) {
        resultSet = new Set(currentSet);
      } else {
        // 双列表求交集
        resultSet = new Set([...resultSet].filter(id => currentSet.has(id)));
      }
      if (resultSet.size === 0) break; // 提前剪枝
    }

    return [...(resultSet || [])].map(id => this.emails.get(id));
  }

  /**
   * 布尔 OR 检索：命中任一关键词即可 (倒排列表求并集)
   * @param {string[]} terms
   * @returns {Array<{ emailId: string, subject: string }>}
   */
  searchOR(terms) {
    const unionSet = new Set();
    for (const t of terms) {
      const currentSet = this.searchSingle(t);
      for (const id of currentSet) {
        unionSet.add(id);
      }
    }
    return [...unionSet].map(id => this.emails.get(id));
  }
}

// --- 演示与自测代码 ---
if (process.argv[1] && process.argv[1].endsWith('inverted-index.js')) {
  console.log('=== 邮件全文检索倒排索引 (Inverted Index) 演示 ===');
  const emailService = new EmailInvertedIndex();

  emailService.addEmail('m1', '面试通知', '恭喜您通过第一轮技术面试，请准时参加二面');
  emailService.addEmail('m2', '机票预订确认', '您的北京到上海航班已成功出票，请核对行程');
  emailService.addEmail('m3', '系统设计面试题库', '精选 50 道高频分布式架构与系统设计面试真题');

  console.log('1. 搜索单词 "面试":');
  const res1 = emailService.searchAND(['面试']);
  console.log(res1.map(m => `[${m.emailId}] ${m.subject}`));

  console.log('\n2. 布尔与检索 (AND) "系统设计" AND "面试":');
  const res2 = emailService.searchAND(['系统设计', '面试']);
  console.log(res2.map(m => `[${m.emailId}] ${m.subject}`));

  console.log('\n3. 布尔或检索 (OR) "航班" OR "面试":');
  const res3 = emailService.searchOR(['航班', '面试']);
  console.log(res3.map(m => `[${m.emailId}] ${m.subject}`));
}
