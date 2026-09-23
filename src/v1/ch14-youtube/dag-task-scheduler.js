/**
 * @file dag-task-scheduler.js
 * @description 第一卷 第14章：设计 YouTube (Design YouTube)
 * 经典算法：DAG 有向无环图任务编排调度器 (DAG Task Pipeline Scheduler)
 *
 * 【系统设计背景】：
 * 在海量视频处理系统（如 YouTube、TikTok）中，用户上传原始视频后，
 * 转码流水线并非单一线性顺序，而是由多个存在先后依赖关系的任务组成的 DAG (有向无环图)：
 * - 原始视频拆解音频与画面 (并行)
 * - 画面切片并转码为 4K / 1080p / 720p / 360p 多分辨率 (并行)
 * - 视频帧提取生成预览缩略图
 * - 音画合并、添加水印
 * - 合成 HLS / DASH 切片与清单文件
 *
 * 【核心算法】：
 * 1. 拓扑排序 (Topological Sorting) 与入度计算 (In-degree):
 *    - 入度为 0 的任务表示没有前置依赖（或依赖已全部完成），可立即投入并发线程池执行。
 * 2. 环检测 (Cycle Detection):
 *    - 避免循环依赖造成死锁。
 * 3. 动态事件驱动并发执行:
 *    - 某个前置任务一旦完成，触发唤醒下游任务入度减 1；当入度降为 0 时立即触发执行。
 */

export class DAGTaskScheduler {
  constructor() {
    // taskId -> { id: string, fn: Function, dependencies: Set<string> }
    this.tasks = new Map();
  }

  /**
   * 注册任务与其依赖的前置任务列表
   * @param {string} id - 任务唯一标识
   * @param {string[]} dependencies - 前置依赖的任务 ID 列表
   * @param {() => Promise<*>} fn - 实际执行的任务函数
   */
  addTask(id, dependencies = [], fn = async () => ({})) {
    this.tasks.set(id, {
      id,
      fn,
      dependencies: new Set(dependencies),
    });
  }

  /**
   * 检查图是否有环 (拓扑排序环检测)
   * @returns {boolean} true: 无环合法 DAG; false: 存在循环依赖
   */
  isValidDAG() {
    const inDegree = new Map();
    for (const [id, task] of this.tasks.entries()) {
      if (!inDegree.has(id)) inDegree.set(id, 0);
      for (const dep of task.dependencies) {
        if (!this.tasks.has(dep)) {
          throw new Error(`Missing dependency task: "${dep}" for task "${id}"`);
        }
      }
      inDegree.set(id, task.dependencies.size);
    }

    const queue = [];
    for (const [id, deg] of inDegree.entries()) {
      if (deg === 0) queue.push(id);
    }

    let processedCount = 0;
    while (queue.length > 0) {
      const curr = queue.shift();
      processedCount++;

      // 找到依赖 curr 的下游任务
      for (const [downstreamId, task] of this.tasks.entries()) {
        if (task.dependencies.has(curr)) {
          const newDeg = inDegree.get(downstreamId) - 1;
          inDegree.set(downstreamId, newDeg);
          if (newDeg === 0) queue.push(downstreamId);
        }
      }
    }

    return processedCount === this.tasks.size;
  }

  /**
   * 并发执行 DAG 流水线，保证前置任务完成后下游任务立即并行触发
   * @returns {Promise<Map<string, *>>} 所有任务的执行结果映射
   */
  async run() {
    if (!this.isValidDAG()) {
      throw new Error('Invalid DAG: Cycle detected in task graph!');
    }

    const results = new Map();
    const inDegree = new Map();
    for (const [id, task] of this.tasks.entries()) {
      inDegree.set(id, task.dependencies.size);
    }

    return new Promise((resolve, reject) => {
      let pendingTasks = this.tasks.size;

      const triggerReadyTasks = () => {
        if (pendingTasks === 0) {
          return resolve(results);
        }

        for (const [id, deg] of inDegree.entries()) {
          if (deg === 0) {
            inDegree.set(id, -1); // 标记已进入执行，防止重复触发
            const task = this.tasks.get(id);

            // 异步并发执行该任务
            task.fn(results)
              .then(res => {
                results.set(id, res);
                pendingTasks--;

                // 下游任务入度递减
                for (const [downstreamId, downTask] of this.tasks.entries()) {
                  if (downTask.dependencies.has(id)) {
                    const currentDeg = inDegree.get(downstreamId);
                    if (currentDeg > 0) {
                      inDegree.set(downstreamId, currentDeg - 1);
                    }
                  }
                }
                triggerReadyTasks();
              })
              .catch(reject);
          }
        }
      };

      triggerReadyTasks();
    });
  }
}

// --- 演示与自测代码 ---
if (process.argv[1] && process.argv[1].endsWith('dag-task-scheduler.js')) {
  console.log('=== YouTube 视频转码 DAG 任务调度器演示 ===');
  const scheduler = new DAGTaskScheduler();

  const executionLog = [];

  // 1. 视频上传与元数据解析
  scheduler.addTask('inspect_metadata', [], async () => {
    executionLog.push('1. 视频元数据解析完成');
    return { duration: 120, resolution: '4K' };
  });

  // 2. 依赖元数据：并行拆分音频与视频画面
  scheduler.addTask('extract_audio', ['inspect_metadata'], async () => {
    executionLog.push('2. 音频轨道提取完成 (并行)');
    return 'audio.aac';
  });

  scheduler.addTask('generate_thumbnail', ['inspect_metadata'], async () => {
    executionLog.push('2. 封面缩略图生成完成 (并行)');
    return 'thumb.jpg';
  });

  // 3. 并行多分辨率转码 (依赖 inspect_metadata)
  scheduler.addTask('transcode_1080p', ['inspect_metadata'], async () => {
    executionLog.push('3. 1080p 高清转码完成 (并行)');
    return 'video_1080p.mp4';
  });

  scheduler.addTask('transcode_720p', ['inspect_metadata'], async () => {
    executionLog.push('3. 720p 标清转码完成 (并行)');
    return 'video_720p.mp4';
  });

  // 4. 依赖全部转码与音频完成后的最终打包
  scheduler.addTask(
    'package_hls_stream',
    ['extract_audio', 'transcode_1080p', 'transcode_720p'],
    async () => {
      executionLog.push('4. HLS 清单合成与加密打包完成 (汇总终结)');
      return 'master.m3u8';
    }
  );

  console.log('DAG 是否合法无环:', scheduler.isValidDAG());
  const finalResults = await scheduler.run();

  console.log('\n流水线任务执行顺序轨迹:');
  executionLog.forEach(log => console.log(log));
  console.log('\n所有节点最终产物:', Object.fromEntries(finalResults));
}
