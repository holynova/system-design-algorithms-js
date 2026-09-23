/**
 * @file geohash.js
 * @description 第二卷 第01章：邻近服务 (Proximity Service)
 * 经典算法：GeoHash 空间索引与相邻网格搜索 (GeoHash Encoding & 8-Neighbor Search)
 *
 * 【系统设计背景】：
 * 在搜索附近地点（如 Yelp、美团、滴滴找车）中，传统关系型数据库对 `(lat, lon)` 两个浮点字段建立单独索引，
 * 无法在二维平面上快速过滤。
 * GeoHash 算法将二维经纬度坐标通过二分交替编码为一维的 Base32 字符串：
 * - 共享相同前缀的地点在地理空间上彼此接近。
 * - 前缀长度越长，网格越精细（例如 5 位约 4.9km × 4.8km，6 位约 1.2km × 0.6km）。
 *
 * 【边界边缘问题与相邻 8 邻域 (Boundary Problem & 8 Neighbors)】：
 * 两个距离极近的地点可能刚好落在两个不同网格的分界线两侧，导致 GeoHash 编码完全不同！
 * 解决方案：查询时不仅检索目标所在的中心网格，还要同时检索它周围的 8 个相邻网格（九宫格），
 * 最后再用真实球面距离精确过滤。
 */

export class GeoHash {
  static BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';

  /**
   * 将经纬度转换为指定精度的 GeoHash 字符串
   * @param {number} latitude - 纬度 (-90 ~ 90)
   * @param {number} longitude - 经度 (-180 ~ 180)
   * @param {number} [precision=6] - 字符长度 (1 ~ 12)
   * @returns {string}
   */
  static encode(latitude, longitude, precision = 6) {
    let latMin = -90.0, latMax = 90.0;
    let lonMin = -180.0, lonMax = 180.0;

    let hash = '';
    let isEven = true; // 经度在偶数位，纬度在奇数位
    let bit = 0;
    let ch = 0;

    while (hash.length < precision) {
      if (isEven) {
        // 二分经度
        const mid = (lonMin + lonMax) / 2;
        if (longitude >= mid) {
          ch |= (1 << (4 - bit));
          lonMin = mid;
        } else {
          lonMax = mid;
        }
      } else {
        // 二分纬度
        const mid = (latMin + latMax) / 2;
        if (latitude >= mid) {
          ch |= (1 << (4 - bit));
          latMin = mid;
        } else {
          latMax = mid;
        }
      }

      isEven = !isEven;
      bit++;

      if (bit === 5) {
        // 收集满 5 bits，生成一个 Base32 字符
        hash += this.BASE32[ch];
        bit = 0;
        ch = 0;
      }
    }

    return hash;
  }

  /**
   * 将 GeoHash 解码为经纬度中心点及其边界框 (Bounding Box)
   * @param {string} geohash
   * @returns {{ latitude: number, longitude: number, error: { lat: number, lon: number } }}
   */
  static decode(geohash) {
    let latMin = -90.0, latMax = 90.0;
    let lonMin = -180.0, lonMax = 180.0;
    let isEven = true;

    for (let i = 0; i < geohash.length; i++) {
      const c = geohash[i];
      const cd = this.BASE32.indexOf(c);
      if (cd === -1) throw new Error(`Invalid GeoHash character: "${c}"`);

      for (let mask = 16; mask > 0; mask >>= 1) {
        if (isEven) {
          const mid = (lonMin + lonMax) / 2;
          if (cd & mask) lonMin = mid;
          else lonMax = mid;
        } else {
          const mid = (latMin + latMax) / 2;
          if (cd & mask) latMin = mid;
          else latMax = mid;
        }
        isEven = !isEven;
      }
    }

    const lat = (latMin + latMax) / 2;
    const lon = (lonMin + lonMax) / 2;
    return {
      latitude: Number(lat.toFixed(6)),
      longitude: Number(lon.toFixed(6)),
      error: {
        lat: (latMax - latMin) / 2,
        lon: (lonMax - lonMin) / 2,
      },
    };
  }

  /**
   * 获取目标网格周围的 8 个相邻网格编码 (解决边界截断漏检问题)
   * @param {string} geohash
   * @returns {string[]} 包括自身在内的 9 个九宫格 GeoHash
   */
  static getNeighbors(geohash) {
    const center = this.decode(geohash);
    const dLat = center.error.lat * 2;
    const dLon = center.error.lon * 2;
    const len = geohash.length;

    const neighbors = [];
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const neighborLat = center.latitude + dy * dLat;
        const neighborLon = center.longitude + dx * dLon;
        neighbors.push(this.encode(neighborLat, neighborLon, len));
      }
    }

    return [...new Set(neighbors)];
  }
}

// --- 演示与自测代码 ---
if (process.argv[1] && process.argv[1].endsWith('geohash.js')) {
  console.log('=== GeoHash 空间网格编码演示 ===');
  // 故宫博物院坐标: 39.916345, 116.397155
  const lat = 39.916345;
  const lon = 116.397155;

  const code6 = GeoHash.encode(lat, lon, 6);
  console.log(`故宫坐标 (${lat}, ${lon}) -> 6位 GeoHash: "${code6}"`);

  const decoded = GeoHash.decode(code6);
  console.log('解码还原中心点:', decoded);

  console.log('\n计算周围 8 邻域（九宫格）防漏检范围:');
  const neighbors = GeoHash.getNeighbors(code6);
  console.log(neighbors);
}
