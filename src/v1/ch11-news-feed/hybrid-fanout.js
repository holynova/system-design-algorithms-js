/**
 * @file hybrid-fanout.js
 * @description 第一卷 第11章：设计一个新闻提要系统 (Design A News Feed System)
 * 经典算法/架构模式：推拉结合混合扇出模型 (Hybrid Fan-Out on Write/Read)
 *
 * 【系统设计背景】：
 * 社交网络（如 Twitter、微博、Instagram）的信息流面临著名的“写扩散 vs 读扩散”难题：
 * 1. 写扩散 (Push 模型 / Fan-out on write): 发推时将帖子推送到所有粉丝的时间线收件箱中。
 *    - 优势: 用户刷新 feed 极快，读取 O(1)。
 *    - 致命缺陷: 名人问题 (Celebrity Problem)。拥有上千万粉丝的大 V 发一条推文，会瞬间触发上千万次写，造成服务雪崩。
 * 2. 读扩散 (Pull 模型 / Fan-out on read): 发推时仅存入自身发信箱；粉丝读取时现场聚合所有关注者。
 *    - 优势: 写操作极快。
 *    - 缺陷: 读取慢，聚合计算重。
 * 3. 混合模型 (Hybrid Fan-out):
 *    - 普通用户采用“写扩散 (Push)”，保障绝大多数用户流畅阅读；
 *    - 粉丝数超过阈值的名人用户采用“读扩散 (Pull)”，在用户主动拉取时再动态归并。
 */

export class HybridFanoutFeedSystem {
  /**
   * @param {number} [celebrityThreshold=100] - 粉丝数判定为名人的阈值
   */
  constructor(celebrityThreshold = 100) {
    this.celebrityThreshold = celebrityThreshold;

    // 用户关注关系: userId -> Set<followeeId>
    this.following = new Map();
    // 用户的粉丝关系: userId -> Set<followerId>
    this.followers = new Map();

    // 预计算的收件箱时间线缓存 (Push 目标): userId -> Array<Post>
    this.timelineCache = new Map();

    // 用户自身发布过的所有原贴 (发件箱): userId -> Array<Post>
    this.userPosts = new Map();
  }

  follow(followerId, followeeId) {
    if (!this.following.has(followerId)) this.following.set(followerId, new Set());
    if (!this.followers.has(followeeId)) this.followers.set(followeeId, new Set());

    this.following.get(followerId).add(followeeId);
    this.followers.get(followeeId).add(followerId);
  }

  isCelebrity(userId) {
    const followerCount = (this.followers.get(userId) || new Set()).size;
    return followerCount >= this.celebrityThreshold;
  }

  /**
   * 用户发布新帖子 (触发混合扇出)
   * @param {string} authorId
   * @param {string} content
   * @param {number} [timestamp=Date.now()]
   * @returns {{ postId: string, fanoutType: 'PUSH'|'PULL', pushedCount: number }}
   */
  postFeed(authorId, content, timestamp = Date.now()) {
    const post = {
      postId: `post_${authorId}_${timestamp}`,
      authorId,
      content,
      timestamp,
    };

    // 1. 存入作者自己的发件箱
    if (!this.userPosts.has(authorId)) this.userPosts.set(authorId, []);
    this.userPosts.get(authorId).unshift(post);

    // 2. 判断是否为大 V
    if (this.isCelebrity(authorId)) {
      // 名人：不写扩散，标记为 Pull 模式，避免写爆炸
      return { postId: post.postId, fanoutType: 'PULL', pushedCount: 0 };
    }

    // 普通用户：执行写扩散 (Push)，写入所有粉丝的 timelineCache
    const myFollowers = this.followers.get(authorId) || new Set();
    for (const followerId of myFollowers) {
      if (!this.timelineCache.has(followerId)) {
        this.timelineCache.set(followerId, []);
      }
      this.timelineCache.get(followerId).unshift(post);
    }

    return { postId: post.postId, fanoutType: 'PUSH', pushedCount: myFollowers.size };
  }

  /**
   * 用户获取时间线信息流 (混合聚合已推送内容与关注的名人内容)
   * @param {string} userId
   * @param {number} [limit=10]
   * @returns {Array<Post>}
   */
  getNewsFeed(userId, limit = 10) {
    // 1. 从本地时间线缓存读取 (由普通关注者推过来的帖子)
    const cachedPosts = this.timelineCache.get(userId) || [];

    // 2. 动态拉取所关注的大 V (名人) 的最新帖子
    const myFollowees = this.following.get(userId) || new Set();
    const celebrityPosts = [];

    for (const followeeId of myFollowees) {
      if (this.isCelebrity(followeeId)) {
        const posts = this.userPosts.get(followeeId) || [];
        celebrityPosts.push(...posts.slice(0, limit));
      }
    }

    // 3. 归并排序并截取 Top-K
    const merged = [...cachedPosts, ...celebrityPosts].sort((a, b) => b.timestamp - a.timestamp);
    return merged.slice(0, limit);
  }
}

// --- 演示与自测代码 ---
if (process.argv[1] && process.argv[1].endsWith('hybrid-fanout.js')) {
  console.log('=== 推拉结合混合信息流 (Hybrid Fan-out) 演示 ===');
  // 设置 3 个粉丝即为大 V（教学缩小比例）
  const system = new HybridFanoutFeedSystem(3);

  // 用户关注关系
  const celebrity = 'elon_musk';
  const normalUser = 'alice';
  const reader = 'bob';

  // 让 3 个人关注 elon_musk，使之成为大 V
  system.follow('fan1', celebrity);
  system.follow('fan2', celebrity);
  system.follow(reader, celebrity);

  // reader 也关注了普通好友 alice
  system.follow(reader, normalUser);

  console.log(`elon_musk 是否为大 V:`, system.isCelebrity(celebrity));
  console.log(`alice 是否为大 V:`, system.isCelebrity(normalUser));

  console.log('\n1. alice 发布动态:');
  const res1 = system.postFeed(normalUser, 'Alice: 今天天气真好！', 1000);
  console.log('扇出策略:', res1); // PUSH 模式，直接推送到 bob 缓存

  console.log('\n2. elon_musk 发布推文:');
  const res2 = system.postFeed(celebrity, 'Elon: To the Mars! 🚀', 2000);
  console.log('扇出策略:', res2); // PULL 模式，不执行千万级粉丝写扩散

  console.log('\n3. bob 刷新信息流:');
  const feed = system.getNewsFeed(reader);
  console.log('bob 看到的归并时间线:', feed.map(p => `${p.authorId}: "${p.content}"`));
}
