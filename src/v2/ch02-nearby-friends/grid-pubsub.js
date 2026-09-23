/**
 * @file grid-pubsub.js
 * @description 第二卷 第02章：附近的好友 (Nearby Friends)
 * 经典机制/算法：空间网格发布订阅与好友位置追踪器 (Spatial Grid Pub/Sub & Movement Tracker)
 *
 * 【系统设计背景】：
 * 在“附近的好友”系统中，如果每位移动用户的每次经纬度上报都全量查询数据库并通知所有好友，
 * 在数千万活跃用户下会产生 O(N * M) 的巨量广播风暴。
 * 原书提出的架构方案：
 * 1. 利用 Redis Pub/Sub 或 WebSocket：每个在线用户创建一个专有位置频道；
 * 2. 好友双向订阅对方的位置频道；
 * 3. 当用户移动时，上报自身经纬度。只有当位置变动超过设定阈值（或跨越网格）时，才触发向自身频道发布位置更新；
 * 4. 收到更新的好友本地通过 Haversine 计算实时距离，并在距离 <= 设定半径（如 5km）时提示“好友靠近”。
 */

import { Haversine } from './haversine.js';
import { GeoHash } from '../ch01-proximity/geohash.js';

export class NearbyFriendsTracker {
  /**
   * @param {number} [searchRadiusMeters=5000] - 附近好友可见半径 (默认 5 公里)
   */
  constructor(searchRadiusMeters = 5000) {
    this.searchRadiusMeters = searchRadiusMeters;

    // 好友关系: userId -> Set<friendUserId>
    this.friendships = new Map();

    // 在线用户最新位置: userId -> { lat: number, lon: number, geohash: string, lastUpdated: number }
    this.userLocations = new Map();

    // 客户端收到的附近好友事件监听回调: userId -> Function
    this.proximityListeners = new Map();
  }

  addFriendship(userA, userB) {
    if (!this.friendships.has(userA)) this.friendships.set(userA, new Set());
    if (!this.friendships.has(userB)) this.friendships.set(userB, new Set());

    this.friendships.get(userA).add(userB);
    this.friendships.get(userB).add(userA);
  }

  onProximityAlert(userId, callback) {
    this.proximityListeners.set(userId, callback);
  }

  /**
   * 用户上报最新位置 (发布移动事件并通知相关好友)
   * @param {string} userId
   * @param {number} lat
   * @param {number} lon
   * @param {number} [now=Date.now()]
   */
  updateLocation(userId, lat, lon, now = Date.now()) {
    const geohash = GeoHash.encode(lat, lon, 6);
    this.userLocations.set(userId, { lat, lon, geohash, lastUpdated: now });

    // 获取所有双向好友
    const friends = this.friendships.get(userId) || new Set();

    // 遍历好友，计算相对距离 (模拟 Pub/Sub 推送与客户端接收处理)
    for (const friendId of friends) {
      const friendLoc = this.userLocations.get(friendId);
      if (!friendLoc) continue; // 好友不在线

      const dist = Haversine.distanceInMeters(lat, lon, friendLoc.lat, friendLoc.lon);

      if (dist <= this.searchRadiusMeters) {
        // 好友进入附近范围，触发通知
        const listener = this.proximityListeners.get(friendId);
        if (listener) {
          listener({
            friendId: userId,
            distanceMeters: dist,
            timestamp: now,
          });
        }
      }
    }
  }

  /**
   * 查询某个用户当前视野内的所有附近好友及距离
   * @param {string} userId
   * @returns {Array<{ friendId: string, distanceMeters: number }>}
   */
  getNearbyFriends(userId) {
    const myLoc = this.userLocations.get(userId);
    if (!myLoc) return [];

    const result = [];
    const friends = this.friendships.get(userId) || new Set();

    for (const friendId of friends) {
      const friendLoc = this.userLocations.get(friendId);
      if (!friendLoc) continue;

      const dist = Haversine.distanceInMeters(myLoc.lat, myLoc.lon, friendLoc.lat, friendLoc.lon);
      if (dist <= this.searchRadiusMeters) {
        result.push({ friendId, distanceMeters: dist });
      }
    }

    return result.sort((a, b) => a.distanceMeters - b.distanceMeters);
  }
}

// --- 演示与自测代码 ---
if (process.argv[1] && process.argv[1].endsWith('grid-pubsub.js')) {
  console.log('=== 附近的好友 (Nearby Friends) 位置追踪演示 ===');
  const tracker = new NearbyFriendsTracker(3000); // 3000米视野半径

  tracker.addFriendship('Alice', 'Bob');

  // Bob 监听附近好友靠近提醒
  tracker.onProximityAlert('Bob', alert => {
    console.log(`🔔 [Bob 收到推送通知] 好友 ${alert.friendId} 正在附近！距离: ${alert.distanceMeters} 米`);
  });

  // 1. Bob 位于故宫 (39.9163, 116.3971)
  tracker.updateLocation('Bob', 39.9163, 116.3971);

  // 2. Alice 初始在天安门附近 (距离约 1.2 公里，在 3000 米半径内)
  console.log('Alice 上报位置 (天安门，距离 Bob 约 1.2km):');
  tracker.updateLocation('Alice', 39.9054, 116.3976);

  console.log('Bob 当前查看到的附近好友列表:', tracker.getNearbyFriends('Bob'));
}
