/**
 * @file topk-trie.js
 * @description 第一卷 第13章：设计一个搜索自动完成系统 (Design A Search Autocomplete System)
 * 经典数据结构/算法：带节点 Top-K 缓存的前缀树 (Prefix Trie with Precomputed Top-K)
 *
 * 【系统设计背景】：
 * 在搜索自动补全（如 Google/Baidu 搜索建议）中，用户输入前缀 `c` 或 `ca` 时，
 * 系统必须在极低延迟（通常要求 < 50ms）内返回最热门的 5 条建议。
 *
 * 【传统 Trie 的瓶颈】：
 * 传统 Trie 查到前缀节点后，需要 DFS 遍历该节点下整棵子树中的全部叶子节点，
 * 并对海量候选词进行全局排序，时间复杂度与子树规模成正比，在千万级词表下会严重超时。
 *
 * 【优化设计：节点预计算缓存 Top-K (Precomputed Top-K Caching)】：
 * 在 Trie 的每个前缀节点上，直接冗余维护一个大小为 K 的有序数组 `topK`。
 * 查询时：
 * 1. 顺着前缀字符串遍历到对应节点：耗时 O(p)（p 为输入字符长度，通常 <= 20）。
 * 2. 直接读取该节点预计算好的 `topK` 列表返回：耗时 O(1)！
 * 完美将在线查询时间复杂度从 O(子树节点数) 降至 O(p)。
 */

class TrieNode {
  constructor() {
    this.children = new Map(); // char -> TrieNode
    this.isWord = false;
    this.frequency = 0; // 该词自身的搜索频率
    this.topK = []; // 预计算的 Top-K 词条缓存: Array<{ word: string, frequency: number }>
  }
}

export class TopKTrie {
  /**
   * @param {number} [k=5] - 每个节点缓存的 Top-K 建议数量
   */
  constructor(k = 5) {
    this.k = k;
    this.root = new TrieNode();
  }

  /**
   * 插入或累加搜索词频，并递归/回溯刷新沿途所有父节点的 Top-K 缓存
   * @param {string} word
   * @param {number} [count=1]
   */
  insert(word, count = 1) {
    if (!word) return;

    // 1. 查找并插入路径节点
    const pathNodes = [this.root];
    let curr = this.root;

    for (const char of word.toLowerCase()) {
      if (!curr.children.has(char)) {
        curr.children.set(char, new TrieNode());
      }
      curr = curr.children.get(char);
      pathNodes.push(curr);
    }

    // 2. 标记单词结尾并累加词频
    curr.isWord = true;
    curr.frequency += count;
    const finalFreq = curr.frequency;

    // 3. 从叶子节点沿着路径向上回溯，刷新每个父节点的 topK 缓存
    for (const node of pathNodes) {
      this._updateNodeTopK(node, word.toLowerCase(), finalFreq);
    }
  }

  /**
   * 输入前缀，瞬间返回 Top-K 补全建议 (O(p) 查询)
   * @param {string} prefix
   * @returns {Array<{ word: string, frequency: number }>}
   */
  autocomplete(prefix) {
    if (!prefix) return this.root.topK.slice(0, this.k);

    let curr = this.root;
    for (const char of prefix.toLowerCase()) {
      if (!curr.children.has(char)) {
        return []; // 无此前缀匹配
      }
      curr = curr.children.get(char);
    }

    return curr.topK.slice(0, this.k);
  }

  /**
   * 辅助方法：更新单个节点的 Top-K 缓存
   * @private
   */
  _updateNodeTopK(node, word, freq) {
    // 检查词是否已在当前节点的 topK 中
    const existingIdx = node.topK.findIndex(item => item.word === word);
    if (existingIdx !== -1) {
      node.topK[existingIdx].frequency = freq;
    } else {
      node.topK.push({ word, frequency: freq });
    }

    // 排序：词频降序，同词频按字典序升序（确定性打破平局）
    node.topK.sort((a, b) => {
      if (b.frequency !== a.frequency) {
        return b.frequency - a.frequency;
      }
      return a.word.localeCompare(b.word);
    });

    // 仅保留 Top-K 个
    if (node.topK.length > this.k) {
      node.topK.length = this.k;
    }
  }
}

// --- 演示与自测代码 ---
if (process.argv[1] && process.argv[1].endsWith('topk-trie.js')) {
  console.log('=== 前缀树与 Top-K 预计算搜索补全演示 ===');
  const trie = new TopKTrie(3); // 缓存 Top-3

  // 批量注入带搜索热度的词条 (原书样例: car=10, cat=8, cart=3, dog=7)
  trie.insert('car', 10);
  trie.insert('cat', 8);
  trie.insert('cart', 3);
  trie.insert('dog', 7);
  trie.insert('camera', 15);

  console.log('1. 输入前缀 "c" 的自动补全建议 (Top-3):');
  console.log(trie.autocomplete('c'));

  console.log('\n2. 输入前缀 "ca" 的自动补全建议:');
  console.log(trie.autocomplete('ca'));

  console.log('\n3. 突发事件：用户大量搜索 "cart" (+20 频次，总频次达到 23):');
  trie.insert('cart', 20);
  console.log('再次输入 "ca" (cart 成功逆袭跃升为第一位):');
  console.log(trie.autocomplete('ca'));
}
