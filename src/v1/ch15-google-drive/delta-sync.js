/**
 * @file delta-sync.js
 * @description 第一卷 第15章：设计 Google Drive (Design Google Drive)
 * 经典算法：基于分块内容哈希的差量同步与全局去重算法 (Chunk-Based Delta Sync & Deduplication)
 *
 * 【系统设计背景】：
 * 在网盘系统（如 Google Drive、Dropbox）中，文件体积往往极大（几十 MB 到数 GB）。
 * 如果用户每次微调文档或代码，都全量重新上传整个大文件，会消耗天量带宽，导致同步缓慢。
 *
 * 【分块与增量同步核心流程】：
 * 1. 文件切块 (Chunking): 将大文件按照固定大小（如 4MB）切分为若干独立数据块。
 * 2. 内容寻址哈希 (Content-Addressable Hash): 为每个块计算加密哈希（如 SHA-256）。
 * 3. 差量对比 (Delta Comparison):
 *    - 客户端本地对比修改前后各块的哈希列表。
 *    - 只有哈希发生变化的块（Dirty Chunks）才会被上传到远端块存储 (S3)；未变块直接复用。
 * 4. 全局块级去重 (Deduplication):
 *    - 如果远端全局块存储池中已经存在相同哈希的块（例如其他用户上传过相同的公开文件），
 *      直接实现秒传，无需重复存储物理数据。
 */

import crypto from 'node:crypto';

export class ChunkServerStorage {
  constructor() {
    // chunkHash -> chunkData
    this.globalChunkPool = new Map();
    // fileId -> Array<chunkHash> (文件元数据版本清单)
    this.fileManifests = new Map();
  }

  hasChunk(hash) {
    return this.globalChunkPool.has(hash);
  }

  storeChunk(hash, data) {
    this.globalChunkPool.set(hash, data);
  }

  saveManifest(fileId, chunkHashes) {
    this.fileManifests.set(fileId, chunkHashes);
  }

  getManifest(fileId) {
    return this.fileManifests.get(fileId) || [];
  }
}

export class DeltaSyncClient {
  /**
   * @param {ChunkServerStorage} serverStorage
   * @param {number} [chunkSize=4] - 演示用分块大小（如 4 字符/字节）
   */
  constructor(serverStorage, chunkSize = 4) {
    this.server = serverStorage;
    this.chunkSize = chunkSize;
  }

  /**
   * 将大字符串/文件内容划分为固定大小的块，并计算其内容哈希
   * @param {string} content
   * @returns {Array<{ chunkIndex: number, hash: string, data: string }>}
   */
  chunkFile(content) {
    const chunks = [];
    let index = 0;
    for (let i = 0; i < content.length; i += this.chunkSize) {
      const slice = content.slice(i, i + this.chunkSize);
      const hash = crypto.createHash('sha256').update(slice).digest('hex').slice(0, 8);
      chunks.push({
        chunkIndex: index++,
        hash,
        data: slice,
      });
    }
    return chunks;
  }

  /**
   * 执行差量同步上传 (仅上传新增或修改的块)
   * @param {string} fileId
   * @param {string} newContent
   * @returns {{ totalChunks: number, uploadedChunks: number, reusedChunks: number, manifest: string[] }}
   */
  syncFile(fileId, newContent) {
    const chunks = this.chunkFile(newContent);
    const serverManifest = this.server.getManifest(fileId);
    const serverExistingHashes = new Set(serverManifest);

    let uploadedCount = 0;
    let reusedCount = 0;
    const finalHashes = [];

    for (const chunk of chunks) {
      finalHashes.push(chunk.hash);

      // 检查远端全局块存储是否已经存在该块
      if (this.server.hasChunk(chunk.hash)) {
        // 远端已有此块，直接复用（秒传）
        reusedCount++;
      } else {
        // 远端不存在，真实上传该数据块
        this.server.storeChunk(chunk.hash, chunk.data);
        uploadedCount++;
      }
    }

    // 提交新的文件版本清单
    this.server.saveManifest(fileId, finalHashes);

    return {
      totalChunks: chunks.length,
      uploadedChunks: uploadedCount,
      reusedChunks: reusedCount,
      manifest: finalHashes,
    };
  }
}

// --- 演示与自测代码 ---
if (process.argv[1] && process.argv[1].endsWith('delta-sync.js')) {
  console.log('=== Google Drive 块级差量同步演示 ===');
  const server = new ChunkServerStorage();
  const client = new DeltaSyncClient(server, 4); // 每 4 字符一块

  const fileId = 'system_design_doc.txt';

  // 初始文件：16 字符，切为 4 块: "AAAA" + "BBBB" + "CCCC" + "DDDD"
  const v1Content = 'AAAABBBBCCCCDDDD';
  console.log('1. 首次上传完整文件 (16 字符，4 块):');
  const res1 = client.syncFile(fileId, v1Content);
  console.log('同步结果:', res1);

  // 用户修改第二块为 "XXXX"，其余三块保持不变: "AAAA" + "XXXX" + "CCCC" + "DDDD"
  const v2Content = 'AAAAXXXXCCCCDDDD';
  console.log('\n2. 修改第 2 块后执行增量同步:');
  const res2 = client.syncFile(fileId, v2Content);
  console.log('增量同步结果:', res2);
  console.log(`💡 成果：4 块中仅上传了 ${res2.uploadedChunks} 块，复用了 ${res2.reusedChunks} 块，节约了 75% 的网络流量！`);
}
