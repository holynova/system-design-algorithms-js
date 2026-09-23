/**
 * @file presence-manager.js
 * @description 第一卷 第12章：设计一个聊天系统 (Design A Chat System)
 * 经典机制/算法：心跳与在线状态管理器 (Heartbeat-Based Presence Manager)
 *
 * 【系统设计背景】：
 * 在即时通讯系统中，用户的在线状态（Online/Offline）如果仅依赖 WebSocket 连接断开事件，
 * 会因为移动端弱网、进出电梯、Wi-Fi 切换而发生高频抖动（Flapping），引发天量的状态变更广播。
 * 业界通行做法：
 * 1. 客户端每隔一定周期（如 5 秒）向存在服务器 (Presence Server) 发送一次轻量心跳 (Heartbeat)。
 * 2. 存在服务器将该用户在线状态设置一个带有 TTL 的有效期（如 15 秒）。
 * 3. 只要在有效期内收到心跳，顺延在线时间；
 * 4. 连续 3 次心跳丢失（超时未续期）才确认离线，平滑网络波动。
 */

export class PresenceManager {
  /**
   * @param {number} [heartbeatTimeoutMs=15000] - 判定离线的超时时长 (默认 15 秒)
   */
  constructor(heartbeatTimeoutMs = 15000) {
    this.heartbeatTimeoutMs = heartbeatTimeoutMs;
    // userId -> lastHeartbeatTimestamp
    this.userHeartbeats = new Map();
  }

  /**
   * 客户端发送一次心跳
   * @param {string} userId
   * @param {number} [now=Date.now()]
   * @returns {{ userId: string, previousStatus: 'ONLINE'|'OFFLINE', currentStatus: 'ONLINE' }}
   */
  heartbeat(userId, now = Date.now()) {
    const prevTime = this.userHeartbeats.get(userId);
    const wasOnline = prevTime !== undefined && (now - prevTime <= this.heartbeatTimeoutMs);

    this.userHeartbeats.set(userId, now);

    return {
      userId,
      previousStatus: wasOnline ? 'ONLINE' : 'OFFLINE',
      currentStatus: 'ONLINE',
    };
  }

  /**
   * 主动注销下线
   * @param {string} userId
   */
  logout(userId) {
    this.userHeartbeats.delete(userId);
  }

  /**
   * 检查指定用户当前是否在线
   * @param {string} userId
   * @param {number} [now=Date.now()]
   * @returns {boolean}
   */
  isOnline(userId, now = Date.now()) {
    const lastTime = this.userHeartbeats.get(userId);
    if (lastTime === undefined) return false;
    return (now - lastTime) <= this.heartbeatTimeoutMs;
  }

  /**
   * 扫描所有离线用户并执行清理（返回发生状态跃迁为离线的用户列表）
   * @param {number} [now=Date.now()]
   * @returns {string[]} 新转为离线的用户 ID
   */
  sweepOfflineUsers(now = Date.now()) {
    const newlyOffline = [];
    for (const [userId, lastTime] of this.userHeartbeats.entries()) {
      if (now - lastTime > this.heartbeatTimeoutMs) {
        newlyOffline.push(userId);
        this.userHeartbeats.delete(userId);
      }
    }
    return newlyOffline;
  }
}

// --- 演示与自测代码 ---
if (process.argv[1] && process.argv[1].endsWith('presence-manager.js')) {
  console.log('=== 在线状态心跳管理器演示 ===');
  const presence = new PresenceManager(5000); // 5000ms 超时

  let t = 1000;
  console.log('1. Alice 上线并发送心跳:');
  console.log(presence.heartbeat('Alice', t));
  console.log('Alice 在线状态:', presence.isOnline('Alice', t));

  console.log('\n2. 经过 3 秒后 (t=4000ms) Alice 续期心跳:');
  presence.heartbeat('Alice', 4000);
  console.log('Alice 在线状态:', presence.isOnline('Alice', 4000));

  console.log('\n3. 模拟 Alice 掉线或关机，时间推进 6 秒 (t=10000ms):');
  const offlineUsers = presence.sweepOfflineUsers(10000);
  console.log('扫描离线用户:', offlineUsers);
  console.log('Alice 在线状态:', presence.isOnline('Alice', 10000));
}
