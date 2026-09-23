/**
 * @file slippy-map-tile.js
 * @description 第二卷 第03章：谷歌地图 (Google Maps)
 * 经典算法：Web 墨卡托投影与瓦片金字塔坐标转换 (Web Mercator & Slippy Map Tiles)
 *
 * 【系统设计背景】：
 * 在数字地图（如 Google Maps、OpenStreetMap）中，客户端如果把全球地图当作一张巨幅图片下载，
 * 将消耗无限的带宽和内存。
 * 瓦片金字塔 (Tile Pyramid) 体系：
 * 1. 采用 Web 墨卡托投影 (EPSG:3857) 将球体经纬度映射到正方形平面。
 * 2. 缩放层级 (Zoom Level: 0 ~ 21)：
 *    - Zoom 0: 全球被渲染为 1 张 256×256 像素的瓦片。
 *    - Zoom z: 全球被切分为 2^z × 2^z 张瓦片。
 * 3. 客户端视窗只请求当前视野内可见的若干张特定 `(x, y, zoom)` 瓦片，并借助 CDN 缓存。
 */

export class SlippyMapTile {
  /**
   * 将经纬度坐标转换为指定缩放层级下的瓦片索引 (x, y)
   * @param {number} lat - 纬度 (-85.0511 ~ 85.0511)
   * @param {number} lon - 经度 (-180 ~ 180)
   * @param {number} zoom - 缩放级别 (0 ~ 21)
   * @returns {{ tileX: number, tileY: number, zoom: number }}
   */
  static latLonToTile(lat, lon, zoom) {
    const latRad = (lat * Math.PI) / 180;
    const n = Math.pow(2, zoom);

    const x = Math.floor(((lon + 180) / 360) * n);
    const y = Math.floor(
      ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n
    );

    return {
      tileX: Math.max(0, Math.min(n - 1, x)),
      tileY: Math.max(0, Math.min(n - 1, y)),
      zoom,
    };
  }

  /**
   * 将瓦片索引 (tileX, tileY, zoom) 转换回该瓦片西北角 (North-West) 的经纬度
   * @param {number} tileX
   * @param {number} tileY
   * @param {number} zoom
   * @returns {{ latitude: number, longitude: number }}
   */
  static tileToLatLon(tileX, tileY, zoom) {
    const n = Math.pow(2, zoom);
    const lon = (tileX / n) * 360 - 180;
    const latRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * tileY) / n)));
    const lat = (latRad * 180) / Math.PI;

    return {
      latitude: Number(lat.toFixed(6)),
      longitude: Number(lon.toFixed(6)),
    };
  }

  /**
   * 根据当前屏幕可见视窗包围盒，计算出客户端需要向 CDN 请求的所有瓦片坐标列表
   * @param {number} minLat
   * @param {number} maxLat
   * @param {number} minLon
   * @param {number} maxLon
   * @param {number} zoom
   * @returns {Array<{ x: number, y: number, z: number, urlPath: string }>}
   */
  static getTilesForBoundingBox(minLat, maxLat, minLon, maxLon, zoom) {
    const nw = this.latLonToTile(maxLat, minLon, zoom);
    const se = this.latLonToTile(minLat, maxLon, zoom);

    const tiles = [];
    const minX = Math.min(nw.tileX, se.tileX);
    const maxX = Math.max(nw.tileX, se.tileX);
    const minY = Math.min(nw.tileY, se.tileY);
    const maxY = Math.max(nw.tileY, se.tileY);

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        tiles.push({
          x,
          y,
          z: zoom,
          urlPath: `/tiles/${zoom}/${x}/${y}.png`,
        });
      }
    }

    return tiles;
  }
}

// --- 演示与自测代码 ---
if (process.argv[1] && process.argv[1].endsWith('slippy-map-tile.js')) {
  console.log('=== Web 墨卡托地图瓦片金字塔计算演示 ===');
  // 伦敦大本钟坐标: 51.5007, -0.1246
  const lat = 51.5007, lon = -0.1246;

  console.log('1. 计算不同 Zoom 级别下的瓦片索引与 URL 路径:');
  for (const zoom of [1, 5, 10, 15]) {
    const tile = SlippyMapTile.latLonToTile(lat, lon, zoom);
    console.log(`- Zoom ${zoom}: 瓦片 (${tile.tileX}, ${tile.tileY}) -> /tiles/${zoom}/${tile.tileX}/${tile.tileY}.png`);
  }

  console.log('\n2. 模拟手机当前屏幕视窗在 Zoom 12 时需要下载的瓦片网格:');
  const visibleTiles = SlippyMapTile.getTilesForBoundingBox(51.48, 51.52, -0.15, -0.10, 12);
  console.log(`需请求瓦片数: ${visibleTiles.length}`);
  console.log('瓦片清单样例:', visibleTiles.slice(0, 3));
}
