/**
 * @file polite-url-frontier.js
 * @description 第一卷 第09章：网络爬虫设计 (Design A Web Crawler)
 * 经典算法与数据结构：礼貌性与优先级 URL Frontier 调度器 (Polite & Priority URL Frontier)
 *
 * 【系统设计背景】：
 * 爬虫系统的核心在于抓取调度器（URL Frontier）。它必须同时满足两个约束：
 * 1. 优先级 (Priority): 优先抓取网页质量高、更新频繁的优质站点（如 PageRank 高的页面）。
 * 2. 礼貌性 (Politeness): 绝对不能对同一个域名发送高频突发请求，防止将对方服务器打垮被封禁 IP。
 *
 * 【双层队列设计】：
 * - 前向队列 (Front Queues - 优先级调度): 接收新发现的 URL，根据 PageRank / 权重放入不同优先级的队列。
 * - 后向队列 (Back Queues - 礼貌性调度): 每个 Host (域名) 映射到一个专属的 FIFO 队列；
 *   每个队列绑定一个延迟计时器，确保同一 Host 两次请求之间至少间隔 `minHostDelayMs` 毫秒。
 */

export class PoliteUrlFrontier {
  /**
   * @param {number} [minHostDelayMs=1000] - 同一主机的最小礼貌等待间隔
   */
  constructor(minHostDelayMs = 1000) {
    this.minHostDelayMs = minHostDelayMs;

    // 优先级队列 (0: 高, 1: 中, 2: 低)
    this.priorityQueues = [[], [], []];

    // 后向主机队列: host -> Array<string> (URL 列表)
    this.hostQueues = new Map();
    // 记录主机上一次被抓取完成的时间戳: host -> timestamp
    this.hostLastAccessTime = new Map();

    // 已抓取/已加入去重集合
    this.seenUrls = new Set();
  }

  /**
   * 从 URL 中提取 Host 域名
   * @param {string} urlString
   * @returns {string}
   */
  extractHost(urlString) {
    try {
      const parsed = new URL(urlString);
      return parsed.hostname;
    } catch {
      return 'unknown_host';
    }
  }

  /**
   * 发现并加入新 URL
   * @param {string} url
   * @param {number} [priority=1] - 0: 高优先级, 1: 普通, 2: 低
   * @returns {boolean} 是否成功加入（重复则返回 false）
   */
  enqueue(url, priority = 1) {
    if (this.seenUrls.has(url)) {
      return false; // URL 去重拦截
    }
    this.seenUrls.add(url);

    const safePriority = Math.max(0, Math.min(2, priority));
    const host = this.extractHost(url);

    // 1. 加入后向主机队列
    if (!this.hostQueues.has(host)) {
      this.hostQueues.set(host, []);
    }
    this.hostQueues.get(host).push({ url, priority: safePriority });

    return true;
  }

  /**
   * 工作线程尝试拉取下一个就绪的 URL 进行抓取 (满足礼貌性间隔约束)
   * @param {number} [now=Date.now()]
   * @returns {{ url: string, host: string } | null}
   */
  dequeue(now = Date.now()) {
    // 遍历所有有待抓取任务的主机队列
    for (const [host, queue] of this.hostQueues.entries()) {
      if (queue.length === 0) continue;

      const hasAccessed = this.hostLastAccessTime.has(host);
      const lastAccess = this.hostLastAccessTime.get(host) || 0;
      // 检查礼貌性时间窗口是否已满足 (若该域名从未访问过，则立即可抓取)
      if (!hasAccessed || now - lastAccess >= this.minHostDelayMs) {
        // 按优先级从队列中挑选最高优先级的 URL
        queue.sort((a, b) => a.priority - b.priority);
        const item = queue.shift();

        // 刷新该域名的最后访问时间
        this.hostLastAccessTime.set(host, now);

        return { url: item.url, host };
      }
    }

    return null; // 当前所有队列都在礼貌冷却中
  }

  /**
   * 待抓取总数
   */
  get pendingCount() {
    let count = 0;
    for (const q of this.hostQueues.values()) {
      count += q.length;
    }
    return count;
  }
}

// --- 演示与自测代码 ---
if (process.argv[1] && process.argv[1].endsWith('polite-url-frontier.js')) {
  console.log('=== 礼貌性爬虫 URL Frontier 调度演示 ===');
  const frontier = new PoliteUrlFrontier(2000); // 同一主机间隔 2000ms

  // 同时注入 3 个 wikipedia 链接与 1 个 github 链接
  frontier.enqueue('https://en.wikipedia.org/wiki/Distributed_computing', 1);
  frontier.enqueue('https://en.wikipedia.org/wiki/Consistent_hashing', 0); // 高优先级
  frontier.enqueue('https://github.com/trending', 1);

  let t = 1000;
  console.log('1. t=1000ms 首次拉取:');
  const item1 = frontier.dequeue(t);
  console.log('抓取任务 1:', item1); // wikipedia (高优先级优先出队)

  console.log('\n2. 立即在同一毫秒 t=1000ms 再次拉取:');
  const item2 = frontier.dequeue(t);
  console.log('抓取任务 2:', item2); // wikipedia 正在 2000ms 冷却，调度器智能选择拉取 github！

  console.log('\n3. 推进时间到 t=3100ms (已过 2000ms 礼貌等待):');
  const item3 = frontier.dequeue(3100);
  console.log('抓取任务 3 (wikipedia 冷却结束):', item3);
}
