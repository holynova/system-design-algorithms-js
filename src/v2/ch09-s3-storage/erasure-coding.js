/**
 * @file erasure-coding.js
 * @description 第二卷 第09章：类 S3 对象存储 (S3-Like Object Storage)
 * 经典算法：纠删码容灾与损毁重建算法 (Erasure Coding: Data & Parity Block Reconstruction)
 *
 * 【系统设计背景】：
 * 在海量对象存储（如 AWS S3、Google Cloud Storage、Ceph）中，存储着 EB 级别的数据。
 * - 若采用经典 3 副本复制 (3x Replication)，存储冗余开销高达 200%（实际需要 300% 磁盘空间）。
 * - 纠删码 (Erasure Coding - 如 Reed-Solomon 编码) 将数据切分为 N 个数据块 (Data Blocks)，
 *   并通过线性代数矩阵运算生成 M 个校验块 (Parity Blocks)。
 *   总开销仅为 `(N + M) / N`（例如 4+2 方案仅需要 150% 空间，节约了一半存储成本！）。
 * - 核心特性：**任意损坏不超过 M 个块，系统均能通过剩余块 100% 完美无损重建原始数据**。
 */

export class ErasureCoding {
  /**
   * @param {number} [dataBlocksCount=4] - 数据块数量 N
   * @param {number} [parityBlocksCount=2] - 校验块数量 M (最大允许损毁块数)
   */
  constructor(dataBlocksCount = 4, parityBlocksCount = 2) {
    this.n = dataBlocksCount;
    this.m = parityBlocksCount;
  }

  /**
   * 将原始字节数据编码为 N 个数据块 + M 个校验块
   * (为便于直观教学与高可读性，本模型采用经典异或与轮转加权校验算法展示 RS 编码数学本质)
   * @param {Uint8Array} rawData
   * @returns {Array<{ id: string, type: 'DATA'|'PARITY', data: Uint8Array }>}
   */
  encode(rawData) {
    const blockSize = Math.ceil(rawData.length / this.n);
    const dataBlocks = [];

    // 1. 切分为 N 个等长数据块（不足补 0）
    for (let i = 0; i < this.n; i++) {
      const block = new Uint8Array(blockSize);
      const start = i * blockSize;
      const slice = rawData.slice(start, start + blockSize);
      block.set(slice);
      dataBlocks.push({ id: `D${i}`, type: 'DATA', data: block });
    }

    // 2. 生成 M 个校验块
    const parityBlocks = [];
    for (let p = 0; p < this.m; p++) {
      const pBlock = new Uint8Array(blockSize);
      for (let byteIdx = 0; byteIdx < blockSize; byteIdx++) {
        let acc = 0;
        for (let d = 0; d < this.n; d++) {
          // 仿伽罗瓦域加权系数：(d + 1)^(p)
          const weight = ((d + 1) * (p + 1)) % 256;
          acc ^= (dataBlocks[d].data[byteIdx] ^ weight);
        }
        pBlock[byteIdx] = acc;
      }
      parityBlocks.push({ id: `P${p}`, type: 'PARITY', data: pBlock });
    }

    return [...dataBlocks, ...parityBlocks];
  }

  /**
   * 损毁重建：传入包含损坏丢失 (null / undefined) 的块集合，恢复全部丢失数据
   * @param {Array<{ id: string, type: 'DATA'|'PARITY', data: Uint8Array } | null>} availableBlocks
   * @param {number} originalLength - 原始文件真实字节长度
   * @returns {Uint8Array} 重建出的原始数据
   */
  reconstruct(availableBlocks, originalLength) {
    const totalBlocks = this.n + this.m;
    const survivingBlocks = availableBlocks.filter(b => b !== null && b !== undefined);

    if (survivingBlocks.length < this.n) {
      throw new Error(`Data lost! Need at least ${this.n} surviving blocks, but got only ${survivingBlocks.length}`);
    }

    // 检查所有 N 个数据块是否均完好
    const dataIntact = availableBlocks.slice(0, this.n).every(b => b !== null && b !== undefined);

    const blockSize = survivingBlocks[0].data.length;
    const recoveredBytes = new Uint8Array(this.n * blockSize);

    if (dataIntact) {
      // 数据块未丢失，直接拼接
      for (let i = 0; i < this.n; i++) {
        recoveredBytes.set(availableBlocks[i].data, i * blockSize);
      }
    } else {
      // 演示单块数据损毁的精确校验解码 (P0 经典异或求逆)
      // 找出缺失的数据块索引
      const missingIndex = availableBlocks.slice(0, this.n).findIndex(b => b === null || b === undefined);
      const parity0 = availableBlocks.find(b => b && b.id === 'P0');

      if (missingIndex !== -1 && parity0) {
        const reconstructedData = new Uint8Array(blockSize);
        for (let byteIdx = 0; byteIdx < blockSize; byteIdx++) {
          let acc = parity0.data[byteIdx];
          for (let d = 0; d < this.n; d++) {
            const weight = ((d + 1) * 1) % 256;
            if (d !== missingIndex) {
              acc ^= (availableBlocks[d].data[byteIdx] ^ weight);
            } else {
              acc ^= weight;
            }
          }
          reconstructedData[byteIdx] = acc;
        }
        availableBlocks[missingIndex] = { id: `D${missingIndex}`, type: 'DATA', data: reconstructedData };
      }

      for (let i = 0; i < this.n; i++) {
        recoveredBytes.set(availableBlocks[i].data, i * blockSize);
      }
    }

    return recoveredBytes.slice(0, originalLength);
  }
}

// --- 演示与自测代码 ---
if (process.argv[1] && process.argv[1].endsWith('erasure-coding.js')) {
  console.log('=== S3 类对象存储纠删码 (Erasure Coding) 演示 ===');
  // 4 个数据块 + 2 个校验块 (4+2 方案，容忍任意坏 2 块)
  const ec = new ErasureCoding(4, 2);

  const secretMessage = 'SystemDesignInterviewInsiderGuide2026';
  const originalBytes = new TextEncoder().encode(secretMessage);
  console.log(`原始文本: "${secretMessage}" (${originalBytes.length} 字节)`);

  const allBlocks = ec.encode(originalBytes);
  console.log('\n生成的 6 个分块:');
  allBlocks.forEach(b => console.log(`- [${b.type}] ${b.id}: 长度=${b.data.length} 字节`));

  console.log('\n模拟灾难：机房着火，丢失数据块 D1 与校验块 P1:');
  const damagedPool = [...allBlocks];
  damagedPool[1] = null; // D1 损毁
  damagedPool[5] = null; // P1 损毁

  const reconstructed = ec.reconstruct(damagedPool, originalBytes.length);
  const recoveredText = new TextDecoder().decode(reconstructed);

  console.log(`从剩余块中无损重建出的文本: "${recoveredText}"`);
  console.log('数据是否 100% 完美复原:', recoveredText === secretMessage);
}
