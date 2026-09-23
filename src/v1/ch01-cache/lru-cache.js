/**
 * @file lru-cache.js
 * @description 第一卷 第01章：从零到百万用户 (Scale From Zero To Millions Of Users)
 * 经典算法：LRU 缓存淘汰算法 (Least Recently Used Cache)
 *
 * 【系统设计背景】：
 * 在高并发架构中，缓存（如 Redis/Memcached/应用内本地缓存）是缓解数据库压力、提升读性能的核心组件。
 * 当缓存容量达到上限时，必须根据策略剔除旧数据。LRU 认为：最近被访问过的数据在未来被访问的概率更高，
 * 因此优先淘汰“最长时间未被访问”的数据。
 *
 * 【核心设计与复杂度】：
 * - 哈希表 (Map): 存储 key -> 双向链表节点引用，提供 O(1) 的查找能力。
 * - 双向链表 (Doubly Linked List): 维护数据的访问时间顺序，提供 O(1) 的节点移动和删除能力。
 * - 时间复杂度: get: O(1), put: O(1)
 * - 空间复杂度: O(capacity)
 *
 * 【双向链表结构示意】：
 *  head (虚拟头节点: 最近使用 Most Recently Used)
 *   ↓↑
 *  [Node: key=A] ⇄ [Node: key=B] ⇄ [Node: key=C]
 *                                     ↓↑
 *                           tail (虚拟尾节点: 最久未使用 Least Recently Used)
 */

class DNode {
  constructor(key = null, value = null) {
    this.key = key;
    this.value = value;
    this.prev = null;
    this.next = null;
  }
}

export class LRUCache {
  /**
   * @param {number} capacity - 缓存最大容量（必须大于0）
   */
  constructor(capacity) {
    if (capacity <= 0) {
      throw new Error('Capacity must be a positive integer');
    }
    this.capacity = capacity;
    this.cache = new Map(); // key -> DNode

    // 哨兵节点：简化链表头尾插入与删除边界条件
    this.head = new DNode();
    this.tail = new DNode();
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  /**
   * 获取缓存值，并将该节点移动到链表头部（标记为最新访问）
   * @param {*} key
   * @returns {*} 存在则返回值，不存在返回 undefined
   */
  get(key) {
    const node = this.cache.get(key);
    if (!node) {
      return undefined;
    }
    // 命中缓存：移到最前面
    this._moveToHead(node);
    return node.value;
  }

  /**
   * 写入键值对。若已存在则更新值并移到头部；若不存在则插入头部。
   * 当超出容量限制时，淘汰链表尾部（最久未使用）的节点。
   * @param {*} key
   * @param {*} value
   */
  put(key, value) {
    const existingNode = this.cache.get(key);
    if (existingNode) {
      // 键已存在：更新值并移至表头
      existingNode.value = value;
      this._moveToHead(existingNode);
      return;
    }

    // 键不存在：新插入节点
    const newNode = new DNode(key, value);
    this.cache.set(key, newNode);
    this._addNode(newNode);

    // 检查是否超出容量
    if (this.cache.size > this.capacity) {
      // 淘汰最久未使用的节点（尾部真实节点）
      const evicted = this._popTail();
      this.cache.delete(evicted.key);
    }
  }

  /**
   * 主动删除某个 key
   * @param {*} key
   * @returns {boolean} 是否删除成功
   */
  delete(key) {
    const node = this.cache.get(key);
    if (!node) return false;
    this._removeNode(node);
    this.cache.delete(key);
    return true;
  }

  /**
   * 当前缓存大小
   * @returns {number}
   */
  get size() {
    return this.cache.size;
  }

  /**
   * 按从最近访问到最久未访问的顺序，导出所有键值对列表（教学观察用）
   * @returns {Array<{key: *, value: *}>}
   */
  dump() {
    const result = [];
    let curr = this.head.next;
    while (curr !== this.tail) {
      result.push({ key: curr.key, value: curr.value });
      curr = curr.next;
    }
    return result;
  }

  // --- 内部双向链表操作辅助方法 ---

  /** 在虚拟头节点后插入新节点（即成为最新访问节点） */
  _addNode(node) {
    node.prev = this.head;
    node.next = this.head.next;
    this.head.next.prev = node;
    this.head.next = node;
  }

  /** 从链表中移除指定节点 */
  _removeNode(node) {
    node.prev.next = node.next;
    node.next.prev = node.prev;
  }

  /** 将已有节点移到表头 */
  _moveToHead(node) {
    this._removeNode(node);
    this._addNode(node);
  }

  /** 弹出虚拟尾节点前方的那个节点（即最久未访问节点） */
  _popTail() {
    const lastNode = this.tail.prev;
    this._removeNode(lastNode);
    return lastNode;
  }
}

// --- 演示与自测代码 ---
if (process.argv[1] && process.argv[1].endsWith('lru-cache.js')) {
  console.log('=== LRU Cache 经典算法演示 ===');
  const lru = new LRUCache(3);

  console.log('1. 写入 A, B, C:');
  lru.put('A', 'Alpha');
  lru.put('B', 'Beta');
  lru.put('C', 'Gamma');
  console.log('当前缓存顺序 (最新->最旧):', lru.dump());

  console.log('\n2. 访问 A (A 被提到最前面):');
  lru.get('A');
  console.log('当前缓存顺序 (最新->最旧):', lru.dump());

  console.log('\n3. 写入 D (容量超限，最旧的 B 应当被淘汰):');
  lru.put('D', 'Delta');
  console.log('当前缓存顺序 (最新->最旧):', lru.dump());
  console.log('查询 B (应为 undefined):', lru.get('B'));
}
