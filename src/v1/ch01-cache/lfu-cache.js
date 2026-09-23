/**
 * @file lfu-cache.js
 * @description 第一卷 第01章：从零到百万用户 (Scale From Zero To Millions Of Users)
 * 经典算法：LFU 缓存淘汰算法 (Least Frequently Used Cache)
 *
 * 【系统设计背景】：
 * LRU 在遭遇周期性全量扫描或突发冷数据请求时，容易把真正的高频热点数据误淘汰（缓存污染）。
 * LFU 记录每个键被访问的“频次 (Frequency)”，优先淘汰访问频次最低的键。
 * 若存在多个相同最低频次的键，则按 LRU 顺序淘汰最早未被访问的那一个。
 *
 * 【核心设计与复杂度】：
 * - `keyTable`: Map<key, Node> 记录键到节点的映射。
 * - `freqTable`: Map<freq, DoublyLinkedList> 记录每个频次对应的双向链表。
 * - `minFreq`: 维护当前缓存中的全局最小频次。
 * - 时间复杂度: get: O(1), put: O(1)
 * - 空间复杂度: O(capacity)
 */

class LFUDNode {
  constructor(key = null, value = null) {
    this.key = key;
    this.value = value;
    this.freq = 1;
    this.prev = null;
    this.next = null;
  }
}

class DoublyLinkedList {
  constructor() {
    this.head = new LFUDNode();
    this.tail = new LFUDNode();
    this.head.next = this.tail;
    this.tail.prev = this.head;
    this.size = 0;
  }

  addNode(node) {
    node.prev = this.head;
    node.next = this.head.next;
    this.head.next.prev = node;
    this.head.next = node;
    this.size++;
  }

  removeNode(node) {
    node.prev.next = node.next;
    node.next.prev = node.prev;
    this.size--;
  }

  popTail() {
    if (this.size === 0) return null;
    const lastNode = this.tail.prev;
    this.removeNode(lastNode);
    return lastNode;
  }

  isEmpty() {
    return this.size === 0;
  }
}

export class LFUCache {
  /**
   * @param {number} capacity - 缓存最大容量
   */
  constructor(capacity) {
    if (capacity <= 0) {
      throw new Error('Capacity must be a positive integer');
    }
    this.capacity = capacity;
    this.minFreq = 0;
    this.keyTable = new Map(); // key -> LFUDNode
    this.freqTable = new Map(); // freq -> DoublyLinkedList
  }

  /**
   * 获取缓存值，若存在则频次 +1 并调整所在频次链表
   * @param {*} key
   * @returns {*}
   */
  get(key) {
    const node = this.keyTable.get(key);
    if (!node) return undefined;

    this._incrementFreq(node);
    return node.value;
  }

  /**
   * 写入键值对。若已存在则更新值并频次 +1；
   * 若超限则淘汰最小频次链表中尾部（最久未访问）的节点。
   * @param {*} key
   * @param {*} value
   */
  put(key, value) {
    const node = this.keyTable.get(key);
    if (node) {
      node.value = value;
      this._incrementFreq(node);
      return;
    }

    // 容量已满，执行淘汰
    if (this.keyTable.size >= this.capacity) {
      const minList = this.freqTable.get(this.minFreq);
      const evictedNode = minList.popTail();
      this.keyTable.delete(evictedNode.key);
      if (minList.isEmpty()) {
        this.freqTable.delete(this.minFreq);
      }
    }

    // 新增节点，初始频次为 1
    const newNode = new LFUDNode(key, value);
    this.keyTable.set(key, newNode);
    this._addFreqNode(1, newNode);
    this.minFreq = 1; // 新节点频次为 1，重置 minFreq 为 1
  }

  /**
   * 当前缓存大小
   */
  get size() {
    return this.keyTable.size;
  }

  /**
   * 内部方法：提升节点频次并从原频次链表迁移到新频次链表
   */
  _incrementFreq(node) {
    const oldFreq = node.freq;
    const oldList = this.freqTable.get(oldFreq);
    oldList.removeNode(node);

    if (oldList.isEmpty()) {
      this.freqTable.delete(oldFreq);
      // 若当前空掉的正是 minFreq 链表，则全局最小频次递增
      if (this.minFreq === oldFreq) {
        this.minFreq = oldFreq + 1;
      }
    }

    node.freq++;
    this._addFreqNode(node.freq, node);
  }

  /**
   * 内部方法：将节点添加到对应频次的双向链表头部
   */
  _addFreqNode(freq, node) {
    let list = this.freqTable.get(freq);
    if (!list) {
      list = new DoublyLinkedList();
      this.freqTable.set(freq, list);
    }
    list.addNode(node);
  }

  /**
   * 导出内部频次快照（教学检查用）
   */
  dump() {
    const result = [];
    for (const [key, node] of this.keyTable.entries()) {
      result.push({ key, value: node.value, freq: node.freq });
    }
    return result;
  }
}

// --- 演示与自测代码 ---
if (process.argv[1] && process.argv[1].endsWith('lfu-cache.js')) {
  console.log('=== LFU Cache 经典算法演示 ===');
  const lfu = new LFUCache(2);

  lfu.put('k1', 'v1');
  lfu.put('k2', 'v2');
  console.log('写入 k1, k2 后:');
  console.log(lfu.dump());

  console.log('\n访问 k1 两次:');
  lfu.get('k1');
  lfu.get('k1');
  console.log(lfu.dump());

  console.log('\n写入 k3 (容量超限，k2 频次为1，k1 频次为3，k2 应被淘汰):');
  lfu.put('k3', 'v3');
  console.log(lfu.dump());
  console.log('查询 k2 (应为 undefined):', lfu.get('k2'));
  console.log('查询 k1 (应为 v1):', lfu.get('k1'));
}
