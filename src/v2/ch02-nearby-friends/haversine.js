/**
 * @file haversine.js
 * @description 第二卷 第02章：附近的好友 (Nearby Friends)
 * 经典算法：球面大圆距离 Haversine 公式 (Haversine Distance Formula)
 *
 * 【系统设计背景】：
 * 在“附近的好友”、“附近的人”或打车系统中，通过 GeoHash 或四叉树初步筛选出候选好友列表后，
 * 必须计算两个人之间的**真实地表物理距离**，判断是否在设定的搜索半径内（例如 5 公里内）。
 * 由于地球是一个近似球体，不能简单使用平面的欧几里得距离勾股定理 `sqrt(dx^2 + dy^2)`，
 * 必须采用大圆距离 (Great-Circle Distance) 的 Haversine 公式。
 *
 * 【数学公式】：
 * a = sin²(Δlat/2) + cos(lat1) * cos(lat2) * sin²(Δlon/2)
 * c = 2 * atan2(√a, √(1-a))
 * d = R * c （R 为地球平均半径 6371 km）
 */

export class Haversine {
  static EARTH_RADIUS_METERS = 6371000; // 地球半径（米）

  /**
   * 将角度转换为弧度
   */
  static toRadians(degrees) {
    return (degrees * Math.PI) / 180;
  }

  /**
   * 计算地球表面两个经纬度坐标点之间的精准物理距离（米）
   * @param {number} lat1 - 点 1 纬度
   * @param {number} lon1 - 点 1 经度
   * @param {number} lat2 - 点 2 纬度
   * @param {number} lon2 - 点 2 经度
   * @returns {number} 距离（米）
   */
  static distanceInMeters(lat1, lon1, lat2, lon2) {
    const phi1 = this.toRadians(lat1);
    const phi2 = this.toRadians(lat2);
    const deltaPhi = this.toRadians(lat2 - lat1);
    const deltaLambda = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Number((this.EARTH_RADIUS_METERS * c).toFixed(1));
  }

  /**
   * 计算距离（千米）
   */
  static distanceInKm(lat1, lon1, lat2, lon2) {
    return Number((this.distanceInMeters(lat1, lon1, lat2, lon2) / 1000).toFixed(2));
  }

  /**
   * 判断点 2 是否在点 1 的指定半径范围（米）内
   * @param {number} lat1
   * @param {number} lon1
   * @param {number} lat2
   * @param {number} lon2
   * @param {number} radiusMeters
   * @returns {boolean}
   */
  static isWithinRadius(lat1, lon1, lat2, lon2, radiusMeters) {
    return this.distanceInMeters(lat1, lon1, lat2, lon2) <= radiusMeters;
  }
}

// --- 演示与自测代码 ---
if (process.argv[1] && process.argv[1].endsWith('haversine.js')) {
  console.log('=== Haversine 球面大圆距离公式演示 ===');
  // 北京天安门广场: 39.905489, 116.397632
  // 北京奥林匹克公园鸟巢: 39.992900, 116.396500
  const lat1 = 39.905489, lon1 = 116.397632;
  const lat2 = 39.992900, lon2 = 116.396500;

  const distM = Haversine.distanceInMeters(lat1, lon1, lat2, lon2);
  const distKm = Haversine.distanceInKm(lat1, lon1, lat2, lon2);

  console.log(`天安门 -> 鸟巢 距离: ${distM} 米 (${distKm} 公里)`);
  console.log(`是否在 10 公里半径内:`, Haversine.isWithinRadius(lat1, lon1, lat2, lon2, 10000));
  console.log(`是否在 5 公里半径内:`, Haversine.isWithinRadius(lat1, lon1, lat2, lon2, 5000));
}
