/**
 * @file quad-tree.js
 * @description 第二卷 第01章：邻近服务 (Proximity Service)
 * 经典数据结构/算法：空间四叉树与范围检索 (QuadTree for Adaptive Spatial Indexing)
 *
 * 【系统设计背景】：
 * GeoHash 使用固定大小的矩形网格，无法适应现实世界极其不均匀的人口分布密度：
 * 纽约曼哈顿中心 1 平方公里可能有 5000 家餐厅，而在撒哈拉沙漠 1000 平方公里可能只有 1 家。
 * 四叉树 (QuadTree) 是一种自适应空间划分树：
 * - 根节点代表整个世界地图边界。
 * - 每个节点存储一组地点数据。
 * - 当节点内的地点数量超出阈值容量（如 4 个或 100 个）时，节点自动**分裂 (Subdivide)** 为四个象限子区域：
 *   NW (西北)、NE (东北)、SW (西南)、SE (东南)。
 * - 密集区域深度深（格子极小），稀疏区域深度浅（格子巨大），实现自适应内存与查询优化。
 */

export class BoundingBox {
  /**
   * @param {number} x - 中心 x 坐标
   * @param {number} y - 中心 y 坐标
   * @param {number} halfWidth - 半宽
   * @param {number} halfHeight - 半高
   */
  constructor(x, y, halfWidth, halfHeight) {
    this.x = x;
    this.y = y;
    this.halfWidth = halfWidth;
    this.halfHeight = halfHeight;
  }

  contains(point) {
    return (
      point.x >= this.x - this.halfWidth &&
      point.x <= this.x + this.halfWidth &&
      point.y >= this.y - this.halfHeight &&
      point.y <= this.y + this.halfHeight
    );
  }

  intersects(other) {
    return !(
      other.x - other.halfWidth > this.x + this.halfWidth ||
      other.x + other.halfWidth < this.x - this.halfWidth ||
      other.y - other.halfHeight > this.y + this.halfHeight ||
      other.y + other.halfHeight < this.y - this.halfHeight
    );
  }
}

export class QuadTree {
  /**
   * @param {BoundingBox} boundary - 当前节点覆盖的空间包围盒
   * @param {number} [capacity=4] - 叶子节点最大容纳点数，超过则分裂
   * @param {number} [maxDepth=8] - 最大递归分裂深度
   * @param {number} [depth=0]
   */
  constructor(boundary, capacity = 4, maxDepth = 8, depth = 0) {
    this.boundary = boundary;
    this.capacity = capacity;
    this.maxDepth = maxDepth;
    this.depth = depth;

    this.points = []; // 存储的点: Array<{ x: number, y: number, data: * }>
    this.divided = false;

    // 四个子象限
    this.northwest = null;
    this.northeast = null;
    this.southwest = null;
    this.southeast = null;
  }

  /**
   * 插入一个带业务数据的空间坐标点
   * @param {{ x: number, y: number, data: * }} point
   * @returns {boolean} 是否插入成功
   */
  insert(point) {
    if (!this.boundary.contains(point)) {
      return false; // 不在当前节点管辖范围内
    }

    // 尚未达到容量上限，或者已达到最大深度，直接存入当前节点
    if (this.points.length < this.capacity || this.depth >= this.maxDepth) {
      this.points.push(point);
      return true;
    }

    // 容量超限且未分裂，执行象限四等分裂
    if (!this.divided) {
      this._subdivide();
    }

    // 尝试插入到四个子象限中
    return (
      this.northwest.insert(point) ||
      this.northeast.insert(point) ||
      this.southwest.insert(point) ||
      this.southeast.insert(point)
    );
  }

  /**
   * 范围检索：找出指定包围盒内的所有点
   * @param {BoundingBox} range
   * @param {Array<*>} [found=[]]
   * @returns {Array<*>}
   */
  queryRange(range, found = []) {
    if (!this.boundary.intersects(range)) {
      return found; // 两区域无交集，直接剪枝
    }

    for (const p of this.points) {
      if (range.contains(p)) {
        found.push(p);
      }
    }

    if (this.divided) {
      this.northwest.queryRange(range, found);
      this.northeast.queryRange(range, found);
      this.southwest.queryRange(range, found);
      this.southeast.queryRange(range, found);
    }

    return found;
  }

  /**
   * 四等分裂为 NW, NE, SW, SE 四个子树
   * @private
   */
  _subdivide() {
    const x = this.boundary.x;
    const y = this.boundary.y;
    const hw = this.boundary.halfWidth / 2;
    const hh = this.boundary.halfHeight / 2;

    this.northwest = new QuadTree(new BoundingBox(x - hw, y + hh, hw, hh), this.capacity, this.maxDepth, this.depth + 1);
    this.northeast = new QuadTree(new BoundingBox(x + hw, y + hh, hw, hh), this.capacity, this.maxDepth, this.depth + 1);
    this.southwest = new QuadTree(new BoundingBox(x - hw, y - hh, hw, hh), this.capacity, this.maxDepth, this.depth + 1);
    this.southeast = new QuadTree(new BoundingBox(x + hw, y - hh, hw, hh), this.capacity, this.maxDepth, this.depth + 1);

    this.divided = true;

    // 将已有数据点重新分发到子节点中
    const oldPoints = this.points;
    this.points = [];
    for (const p of oldPoints) {
      this.insert(p);
    }
  }
}

// --- 演示与自测代码 ---
if (process.argv[1] && process.argv[1].endsWith('quad-tree.js')) {
  console.log('=== 空间四叉树 (QuadTree) 演示 ===');
  // 以 (0, 0) 为中心，范围 [-100, 100]，叶子容量为 2
  const rootBox = new BoundingBox(0, 0, 100, 100);
  const qt = new QuadTree(rootBox, 2);

  // 插入密集分布在第一象限的点
  qt.insert({ x: 10, y: 10, data: 'Cafe A' });
  qt.insert({ x: 12, y: 15, data: 'Cafe B' });
  qt.insert({ x: 14, y: 18, data: 'Cafe C' }); // 触发分裂！
  qt.insert({ x: -50, y: -50, data: 'Remote Gas Station' });

  console.log('四叉树是否分裂:', qt.divided);

  console.log('\n范围检索 [0, 20] 区域内的商户:');
  const searchBox = new BoundingBox(10, 10, 10, 10);
  const results = qt.queryRange(searchBox);
  console.log('检索结果:', results.map(r => r.data));
}
