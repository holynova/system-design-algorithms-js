/**
 * @file merkle-tree.js
 * @description 第一卷 第06章：key-value 存储设计 (Design A Key-Value Store)
 * 经典算法：默克尔树 (Merkle Tree / 反熵同步 Anti-Entropy)
 *
 * 【系统设计背景】：
 * 在无中心架构的分布式存储（如 Dynamo、Cassandra）中，副本节点由于断网或崩溃可能导致数据不一致。
 * 反熵（Anti-entropy）机制用于在后台主动比对副本数据并修复不一致。
 * 如果全量传输所有键值对进行比对，网络带宽消耗不可承受。
 * 默克尔树是一种哈希二叉树：
 * - 叶子节点存储数据桶 (Bucket) 或具体数据的哈希值。
 * - 父节点是其左右子节点哈希拼接后的哈希值。
 *
 * 【比对原理与复杂度】：
 * 1. 首先比对两个节点的根哈希：如果相同，说明所有数据完全一致，比对立即结束 (仅传输一个哈希值！)。
 * 2. 如果根哈希不同，向下递归比对左右子树，只需沿着哈希不匹配的路径深入，
 *    即可在 O(log N) 的开销下精确定位出到底是哪几个数据块不一致，并仅传输差异数据。
 */

import crypto from 'node:crypto';

export class MerkleNode {
  constructor(hash, left = null, right = null, bucketKey = null) {
    this.hash = hash;
    this.left = left;
    this.right = right;
    this.bucketKey = bucketKey; // 仅叶子节点保留对应的桶键名
  }
}

export class MerkleTree {
  /**
   * 根据一组键值对构建默克尔树
   * @param {Array<{key: string, value: string}>} items
   */
  constructor(items = []) {
    this.items = [...items].sort((a, b) => a.key.localeCompare(b.key));
    this.root = this._buildTree(this.items);
  }

  /**
   * 静态哈希方法 (SHA-256 前 16 字符简化演示)
   */
  static sha256(data) {
    return crypto.createHash('sha256').update(String(data)).digest('hex').slice(0, 16);
  }

  /**
   * 递归自底向上构建树
   * @private
   */
  _buildTree(items) {
    if (items.length === 0) {
      return new MerkleNode(MerkleTree.sha256('EMPTY'));
    }

    // 1. 构建叶子节点
    let currentLevel = items.map(item => {
      const leafHash = MerkleTree.sha256(`${item.key}:${item.value}`);
      return new MerkleNode(leafHash, null, null, item.key);
    });

    // 2. 逐层向上配对合并生成父节点，直到只剩根节点
    while (currentLevel.length > 1) {
      const nextLevel = [];
      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i];
        const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : left; // 奇数个时复制最后一个
        const parentHash = MerkleTree.sha256(`${left.hash}+${right.hash}`);
        nextLevel.push(new MerkleNode(parentHash, left, right));
      }
      currentLevel = nextLevel;
    }

    return currentLevel[0];
  }

  /**
   * 获取根哈希
   */
  get rootHash() {
    return this.root ? this.root.hash : null;
  }

  /**
   * 对比另一棵默克尔树，找出所有存在差异的叶子键 (Anti-entropy 差异查找)
   * @param {MerkleTree} otherTree
   * @returns {string[]} 差异的键列表
   */
  findDifferences(otherTree) {
    const diffKeys = [];

    const compareNodes = (nodeA, nodeB) => {
      if (!nodeA || !nodeB) return;

      // 如果当前两个节点的哈希相同，说明整棵子树下的所有数据一致，直接剪枝跳过！
      if (nodeA.hash === nodeB.hash) {
        return;
      }

      // 如果到达叶子节点且哈希不同，记录该差异键
      if (!nodeA.left && !nodeA.right && !nodeB.left && !nodeB.right) {
        if (nodeA.bucketKey) diffKeys.push(nodeA.bucketKey);
        return;
      }

      // 递归向下比对不匹配的分支
      compareNodes(nodeA.left, nodeB.left);
      compareNodes(nodeA.right, nodeB.right);
    };

    compareNodes(this.root, otherTree.root);
    return [...new Set(diffKeys)];
  }
}

// --- 演示与自测代码 ---
if (process.argv[1] && process.argv[1].endsWith('merkle-tree.js')) {
  console.log('=== 默克尔树 (Merkle Tree) 反熵同步演示 ===');

  // 副本节点 A 的数据
  const replicaA = [
    { key: 'user:1', value: 'Alice' },
    { key: 'user:2', value: 'Bob' },
    { key: 'user:3', value: 'Charlie' },
    { key: 'user:4', value: 'David' },
  ];

  // 副本节点 B 的数据 (其中 user:3 的数据在网络故障期间不一致)
  const replicaB = [
    { key: 'user:1', value: 'Alice' },
    { key: 'user:2', value: 'Bob' },
    { key: 'user:3', value: 'Charlie_MODIFIED' }, // 仅修改此处
    { key: 'user:4', value: 'David' },
  ];

  const treeA = new MerkleTree(replicaA);
  const treeB = new MerkleTree(replicaB);

  console.log('副本 A 根哈希:', treeA.rootHash);
  console.log('副本 B 根哈希:', treeB.rootHash);
  console.log('根哈希是否相同:', treeA.rootHash === treeB.rootHash);

  const diffs = treeA.findDifferences(treeB);
  console.log('\n通过树分支快速定位到的不一致数据键:', diffs);
  console.log('只需网络同步这 1 条数据，而不是全量传输 4 条数据！');
}
