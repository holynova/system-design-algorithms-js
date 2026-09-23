/**
 * @file timeline-merger.js
 * @description 第一卷 第11章：设计一个新闻提要系统 (Design A News Feed System)
 * 经典算法：多路时间线归并排序 (K-Way Timeline Merge with Priority Queue)
 *
 * 【系统设计背景】：
 * 在信息流拉取模式或多数据源聚合时，用户关注了 K 个好友。
 * 每个好友各自拥有一条按时间递减排列的发帖时间线。
 * 如果将所有好友的历史推文（假设共 K * M 条）全部取出来进行一次整体排序，
 * 无论是网络带宽还是 CPU 排序计算开销都是无法承受的。
 *
 * 【算法思想】：
 * 经典 K 路归并算法 (K-Way Merge)：
 * 借助容量为 K 的大顶堆 (Max-Heap)，初始时只取每个好友列表的“首篇推文”。
 * 每次从堆顶弹出时间戳最大的推文输出，并将该推文所在好友时间线的“下一篇推文”补充入堆。
 * 获取前 N 条聚合时间线推文只需 O(N log K) 时间，内存只需 O(K)。
 */

class PriorityQueue {
  constructor(compareFn) {
    this.heap = [];
    this.compare = compareFn;
  }

  push(val) {
    this.heap.push(val);
    this._bubbleUp(this.heap.length - 1);
  }

  pop() {
    if (this.heap.length === 0) return null;
    const top = this.heap[0];
    const bottom = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = bottom;
      this._sinkDown(0);
    }
    return top;
  }

  get size() {
    return this.heap.length;
  }

  _bubbleUp(idx) {
    while (idx > 0) {
      const parentIdx = Math.floor((idx - 1) / 2);
      if (this.compare(this.heap[idx], this.heap[parentIdx]) > 0) {
        [this.heap[idx], this.heap[parentIdx]] = [this.heap[parentIdx], this.heap[idx]];
        idx = parentIdx;
      } else {
        break;
      }
    }
  }

  _sinkDown(idx) {
    const len = this.heap.length;
    while (true) {
      let largest = idx;
      const left = 2 * idx + 1;
      const right = 2 * idx + 2;

      if (left < len && this.compare(this.heap[left], this.heap[largest]) > 0) {
        largest = left;
      }
      if (right < len && this.compare(this.heap[right], this.heap[largest]) > 0) {
        largest = right;
      }
      if (largest !== idx) {
        [this.heap[idx], this.heap[largest]] = [this.heap[largest], this.heap[idx]];
        idx = largest;
      } else {
        break;
      }
    }
  }
}

export class TimelineMerger {
  /**
   * 将 K 条已按时间降序排好的推文流，高效归并出全局前 limit 条
   * @param {Array<Array<{id: string, timestamp: number, content: string}>>} timelines
   * @param {number} limit
   * @returns {Array<{id: string, timestamp: number, content: string}>}
   */
  static merge(timelines, limit = 10) {
    // 堆元素: { post, streamIdx, itemIdx }，按 post.timestamp 降序排序
    const pq = new PriorityQueue((a, b) => a.post.timestamp - b.post.timestamp);

    // 1. 初始化：将每条流的第一篇推文入堆
    for (let streamIdx = 0; streamIdx < timelines.length; streamIdx++) {
      const stream = timelines[streamIdx];
      if (stream && stream.length > 0) {
        pq.push({
          post: stream[0],
          streamIdx,
          itemIdx: 0,
        });
      }
    }

    const merged = [];

    // 2. 依次取出当前时间最新的推文，并将该流的下一篇补充进堆
    while (pq.size > 0 && merged.length < limit) {
      const { post, streamIdx, itemIdx } = pq.pop();
      merged.push(post);

      const nextItemIdx = itemIdx + 1;
      const currentStream = timelines[streamIdx];
      if (nextItemIdx < currentStream.length) {
        pq.push({
          post: currentStream[nextItemIdx],
          streamIdx,
          itemIdx: nextItemIdx,
        });
      }
    }

    return merged;
  }
}

// --- 演示与自测代码 ---
if (process.argv[1] && process.argv[1].endsWith('timeline-merger.js')) {
  console.log('=== K路时间线多路归并算法演示 ===');

  // 3 位好友各自的时间线（已按时间倒序排好）
  const friendA = [
    { id: 'A1', timestamp: 1050, content: 'A 的最新消息' },
    { id: 'A2', timestamp: 900, content: 'A 的前一条消息' },
  ];
  const friendB = [
    { id: 'B1', timestamp: 1200, content: 'B 刚刚发布' },
    { id: 'B2', timestamp: 1100, content: 'B 1小时前发布' },
    { id: 'B3', timestamp: 800, content: 'B 昨天发布' },
  ];
  const friendC = [
    { id: 'C1', timestamp: 950, content: 'C 的消息' },
  ];

  const top3 = TimelineMerger.merge([friendA, friendB, friendC], 3);
  console.log('全局最新的前 3 条动态:');
  top3.forEach((p, idx) => {
    console.log(`- #${idx + 1} [t=${p.timestamp}] ${p.id}: "${p.content}"`);
  });
}
