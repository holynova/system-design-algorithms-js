/**
 * @file astar-pathfinding.js
 * @description 第二卷 第03章：谷歌地图 (Google Maps)
 * 经典算法：路网最短路径 A* 启发式寻路算法 (A* Search & Dijkstra for Road Networks)
 *
 * 【系统设计背景】：
 * 在地图导航与路线规划中，城市路网包含数百万个交叉路口（节点 Node）和路段（有向边 Edge）。
 * 边的权重为实际通行时间（考虑拥堵、限速与红绿灯）。
 * - 传统的 Dijkstra 算法以起点为圆心盲目向所有方向地毯式搜索，搜索空间巨大；
 * - A* 寻路算法引入了启发函数 h(n)（如当前节点到目的地的直线欧几里得距离），
 *   使综合代价评估为 `f(n) = g(n) + h(n)`（g 为起点到当前节点的实际通行代价，h 为当前到终点的预估代价）。
 * - A* 能够像磁石一样引导搜索路径朝目标方向前进，搜索节点数量大幅减少数十倍。
 */

export class RoadGraph {
  constructor() {
    // nodeId -> { id: string, x: number, y: number }
    this.nodes = new Map();
    // nodeId -> Array<{ to: string, weight: number }>
    this.edges = new Map();
  }

  addNode(id, x, y) {
    this.nodes.set(id, { id, x, y });
    if (!this.edges.has(id)) this.edges.set(id, []);
  }

  addDirectedEdge(from, to, weight) {
    if (!this.edges.has(from)) this.edges.set(from, []);
    this.edges.get(from).push({ to, weight });
  }

  addUndirectedEdge(u, v, weight) {
    this.addDirectedEdge(u, v, weight);
    this.addDirectedEdge(v, u, weight);
  }
}

export class AStarPathfinder {
  /**
   * 计算两点间的启发式欧几里得距离 h(n)
   */
  static heuristic(nodeA, nodeB) {
    const dx = nodeA.x - nodeB.x;
    const dy = nodeA.y - nodeB.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * 使用 A* 算法搜索从 start 到 target 的最短通行路径
   * @param {RoadGraph} graph
   * @param {string} startId
   * @param {string} targetId
   * @returns {{ path: string[], totalWeight: number, visitedCount: number } | null}
   */
  static findPath(graph, startId, targetId) {
    const startNode = graph.nodes.get(startId);
    const targetNode = graph.nodes.get(targetId);

    if (!startNode || !targetNode) return null;

    // openSet: 优先队列待探索节点集合
    const openSet = new Set([startId]);

    // cameFrom: 记录最优路径的前驱节点用于回溯
    const cameFrom = new Map();

    // gScore[n]: 从起点到 n 的实际已知最短代价
    const gScore = new Map();
    gScore.set(startId, 0);

    // fScore[n] = gScore[n] + h(n): 综合预估总代价
    const fScore = new Map();
    fScore.set(startId, this.heuristic(startNode, targetNode));

    let visitedCount = 0;

    while (openSet.size > 0) {
      // 从 openSet 中找出 fScore 最小的节点
      let currentId = null;
      let minF = Infinity;
      for (const id of openSet) {
        const f = fScore.get(id) ?? Infinity;
        if (f < minF) {
          minF = f;
          currentId = id;
        }
      }

      visitedCount++;

      // 成功抵达终点！回溯重构路径
      if (currentId === targetId) {
        const path = [];
        let curr = currentId;
        while (curr) {
          path.unshift(curr);
          curr = cameFrom.get(curr);
        }
        return {
          path,
          totalWeight: gScore.get(targetId),
          visitedCount,
        };
      }

      openSet.delete(currentId);
      const currentG = gScore.get(currentId);

      const neighbors = graph.edges.get(currentId) || [];
      for (const edge of neighbors) {
        const tentativeG = currentG + edge.weight;
        const neighborG = gScore.get(edge.to) ?? Infinity;

        if (tentativeG < neighborG) {
          // 找到了通往 neighbor 的更优路径
          cameFrom.set(edge.to, currentId);
          gScore.set(edge.to, tentativeG);

          const neighborNode = graph.nodes.get(edge.to);
          const f = tentativeG + this.heuristic(neighborNode, targetNode);
          fScore.set(edge.to, f);

          openSet.add(edge.to);
        }
      }
    }

    return null; // 无法连通
  }
}

// --- 演示与自测代码 ---
if (process.argv[1] && process.argv[1].endsWith('astar-pathfinding.js')) {
  console.log('=== 谷歌地图路网 A* 最短路径规划演示 ===');
  const graph = new RoadGraph();

  // 构建一个包含绕路和拥堵分支的微型城市路网
  graph.addNode('Start', 0, 0);
  graph.addNode('Intersection_A', 2, 2);
  graph.addNode('Intersection_B', 2, -2);
  graph.addNode('Goal', 6, 0);

  // 路线 1 经过 A: 权重 5 + 5 = 10
  graph.addDirectedEdge('Start', 'Intersection_A', 5);
  graph.addDirectedEdge('Intersection_A', 'Goal', 5);

  // 路线 2 经过 B (高速顺畅): 权重 2 + 3 = 5
  graph.addDirectedEdge('Start', 'Intersection_B', 2);
  graph.addDirectedEdge('Intersection_B', 'Goal', 3);

  const result = AStarPathfinder.findPath(graph, 'Start', 'Goal');
  console.log('推荐导航路径:', result.path.join(' -> '));
  console.log('预估总耗时/代价:', result.totalWeight);
  console.log('搜索访问路口数:', result.visitedCount);
}
