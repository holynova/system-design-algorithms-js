/**
 * @file skip-list.js
 * @description 第二卷 第10章：实时游戏排行榜 (Real-Time Gaming Leaderboard)
 * 经典数据结构/算法：跳表完整实现 (Skip List - Redis Sorted Set ZSET 核心底层数据结构)
 *
 * 【系统设计背景】：
 * 在实时游戏天梯榜（如王者荣耀、英雄联盟、Steam 榜单）中，系统需要支撑：
 * 1. 毫秒级写入更新数百万玩家的得分；
 * 2. 毫秒级查询任意玩家的全球精确名次 Rank (O(log N))；
 * 3. 毫秒级获取榜单前 10 名 Top-K 玩家列表。
 * - 关系型数据库在千万行级执行 `ORDER BY score LIMIT 10` 会全表排序超时崩溃；
 * - 红黑树 / 平衡二叉树实现复杂，且并发锁开销大；
 * - Redis Sorted Set 选用了跳表 (Skip List)：通过多层随机索引，
 *   在纯单向/双向链表上以空间换时间，实现媲美平衡树的 O(log N) 插入、删除与排名查询！
 *
 * 【带跨度 (Span) 的跳表节点结构】：
 * 每个前进指针带有 `span`（本层指针跨越了底层多少个节点）。
 * 沿高层查找时累加所有经过指针的 span，即可在 O(log N) 复杂度内瞬间算出该节点的精确绝对排名！
 */

export class SkipListLevel {
  constructor() {
    this.forward = null; // 指向下一个节点
    this.span = 0; // 跨度：当前层指针跳过了多少个底层节点
  }
}

export class SkipListNode {
  /**
   * @param {string} member - 玩家标识
   * @param {number} score - 游戏得分
   * @param {number} level - 节点拥有的层高
   */
  constructor(member, score, level) {
    this.member = member;
    this.score = score;
    this.backward = null; // 回退指针（底层双向链表）
    this.levels = Array.from({ length: level }, () => new SkipListLevel());
  }
}

export class SkipListLeaderboard {
  /**
   * @param {number} [maxLevel=16] - 最大层高
   * @param {number} [p=0.5] - 晋升上一层的概率
   */
  constructor(maxLevel = 16, p = 0.5) {
    this.maxLevel = maxLevel;
    this.p = p;
    this.level = 1;
    this.length = 0;

    // 头节点 (哨兵)
    this.header = new SkipListNode('HEADER', -Infinity, this.maxLevel);
    this.memberMap = new Map(); // member -> score (便于 O(1) 查找旧分)
  }

  /**
   * 随机层高生成器 (抛硬币法则)
   * @private
   */
  _randomLevel() {
    let lvl = 1;
    while (Math.random() < this.p && lvl < this.maxLevel) {
      lvl++;
    }
    return lvl;
  }

  /**
   * 比较两个节点的排序顺序：分数从高到低排序 (降序排行榜)；同分则按 member 字典序升序
   * @private
   */
  _compare(scoreA, memberA, scoreB, memberB) {
    if (scoreA !== scoreB) {
      return scoreB - scoreA; // 降序：高分在前
    }
    return memberA.localeCompare(memberB); // 同分按玩家 ID 字典序稳定打破平局
  }

  /**
   * 插入或更新玩家分数 (ZADD)
   * @param {string} member
   * @param {number} score
   */
  add(member, score) {
    if (this.memberMap.has(member)) {
      this.remove(member); // 若已存在，先移除旧位置再以新分数插入
    }

    const update = new Array(this.maxLevel);
    const rank = new Array(this.maxLevel).fill(0);
    let curr = this.header;

    // 从最高层向下寻找插入位置
    for (let i = this.level - 1; i >= 0; i--) {
      rank[i] = i === this.level - 1 ? 0 : rank[i + 1];
      while (
        curr.levels[i].forward &&
        this._compare(curr.levels[i].forward.score, curr.levels[i].forward.member, score, member) < 0
      ) {
        rank[i] += curr.levels[i].span;
        curr = curr.levels[i].forward;
      }
      update[i] = curr;
    }

    const newLevel = this._randomLevel();
    if (newLevel > this.level) {
      for (let i = this.level; i < newLevel; i++) {
        rank[i] = 0;
        update[i] = this.header;
        update[i].levels[i].span = this.length;
      }
      this.level = newLevel;
    }

    const newNode = new SkipListNode(member, score, newLevel);

    // 逐层插入并维护跨度 span
    for (let i = 0; i < newLevel; i++) {
      newNode.levels[i].forward = update[i].levels[i].forward;
      update[i].levels[i].forward = newNode;

      // 重新计算 span
      newNode.levels[i].span = update[i].levels[i].span - (rank[0] - rank[i]);
      update[i].levels[i].span = rank[0] - rank[i] + 1;
    }

    // 更新未触碰到的高层的 span
    for (let i = newLevel; i < this.level; i++) {
      update[i].levels[i].span++;
    }

    // 维护底层双向回退指针
    newNode.backward = update[0] === this.header ? null : update[0];
    if (newNode.levels[0].forward) {
      newNode.levels[0].forward.backward = newNode;
    }

    this.length++;
    this.memberMap.set(member, score);
  }

  /**
   * 移除玩家
   * @param {string} member
   * @returns {boolean}
   */
  remove(member) {
    if (!this.memberMap.has(member)) return false;
    const score = this.memberMap.get(member);

    const update = new Array(this.maxLevel);
    let curr = this.header;

    for (let i = this.level - 1; i >= 0; i--) {
      while (
        curr.levels[i].forward &&
        this._compare(curr.levels[i].forward.score, curr.levels[i].forward.member, score, member) < 0
      ) {
        curr = curr.levels[i].forward;
      }
      update[i] = curr;
    }

    const targetNode = curr.levels[0].forward;
    if (targetNode && targetNode.member === member && targetNode.score === score) {
      for (let i = 0; i < this.level; i++) {
        if (update[i].levels[i].forward === targetNode) {
          update[i].levels[i].span += targetNode.levels[i].span - 1;
          update[i].levels[i].forward = targetNode.levels[i].forward;
        } else {
          update[i].levels[i].span--;
        }
      }

      if (targetNode.levels[0].forward) {
        targetNode.levels[0].forward.backward = targetNode.backward;
      }

      while (this.level > 1 && !this.header.levels[this.level - 1].forward) {
        this.level--;
      }

      this.length--;
      this.memberMap.delete(member);
      return true;
    }

    return false;
  }

  /**
   * 获取玩家在全局排行榜中的名次 (1-based Rank, 第1名返回 1)
   * 复杂度: O(log N)
   * @param {string} member
   * @returns {number|null} 未上榜返回 null
   */
  getRank(member) {
    if (!this.memberMap.has(member)) return null;
    const score = this.memberMap.get(member);

    let rank = 0;
    let curr = this.header;

    for (let i = this.level - 1; i >= 0; i--) {
      while (
        curr.levels[i].forward &&
        this._compare(curr.levels[i].forward.score, curr.levels[i].forward.member, score, member) <= 0
      ) {
        rank += curr.levels[i].span;
        if (curr.levels[i].forward.member === member) {
          return rank;
        }
        curr = curr.levels[i].forward;
      }
    }

    return null;
  }

  /**
   * 获取排行榜 Top-K 玩家列表 (如前 10 名)
   * @param {number} k
   * @returns {Array<{ rank: number, member: string, score: number }>}
   */
  getTopK(k) {
    const result = [];
    let curr = this.header.levels[0].forward;
    let rank = 1;

    while (curr && rank <= k) {
      result.push({
        rank,
        member: curr.member,
        score: curr.score,
      });
      curr = curr.levels[0].forward;
      rank++;
    }

    return result;
  }
}

// --- 演示与自测代码 ---
if (process.argv[1] && process.argv[1].endsWith('skip-list.js')) {
  console.log('=== 跳表实时游戏排行榜 (Redis ZSET 核心实现) 演示 ===');
  const lb = new SkipListLeaderboard();

  // 录入选手分数
  lb.add('Player_Alice', 100);
  lb.add('Player_Bob', 90);
  lb.add('Player_Charlie', 90);
  lb.add('Player_David', 65);
  lb.add('Player_Eve', 80);

  console.log('1. 当前排行榜 Top-5:');
  console.table(lb.getTopK(5));

  console.log('2. 查询 Charlie 的当前全球排名:');
  console.log(`Charlie 名次: 第 ${lb.getRank('Player_Charlie')} 名`);

  console.log('\n3. Charlie 逆袭！完成比赛 +25 分 (从 90 跃升至 115 分):');
  lb.add('Player_Charlie', 115);

  console.log('更新后最新 Top-5:');
  console.table(lb.getTopK(5));
  console.log(`Charlie 最新名次: 第 ${lb.getRank('Player_Charlie')} 名 (登顶第一！)`);
}
