/**
 * @file inventory-reservation.js
 * @description 第二卷 第07章：酒店预订系统 (Hotel Reservation System)
 * 经典算法/并发控制：跨日期库存预留与超时释放 (Multi-Date Inventory Hold & Optimistic Locking)
 *
 * 【系统设计背景】：
 * 在酒店预订（如 Booking.com、Airbnb）或航空订票系统中，超卖 (Overbooking) 是严重事故。
 * 业务难点：
 * 1. 跨多晚预订: 客户预订 3 晚（7月1日 ~ 7月3日），必须这 3 天全部有房才能下单。
 *    要么全成功，要么全失败，不可只锁住其中某一天。
 * 2. 预订锁定与超时释放 (Hold with TTL):
 *    用户点击“去支付”后，系统锁定库存 10~15 分钟供其完成支付。
 *    若超时未支付，必须自动归还库存；若支付成功，正式扣减。
 * 3. 并发冲突控制:
 *    使用版本号乐观锁 (Optimistic Locking) 或原子条件扣减 `totalReserved + numRooms <= totalInventory`。
 */

export class HotelInventoryManager {
  /**
   * @param {Record<string, number>} initialInventoryByDate - 日期到初始总房间数的映射
   * @param {number} [holdDurationMs=600000] - 锁房保留时长（默认 10 分钟 = 600,000ms）
   */
  constructor(initialInventoryByDate, holdDurationMs = 600000) {
    this.holdDurationMs = holdDurationMs;

    // date -> { total: number, reserved: number, version: number }
    this.dailyInventory = new Map();
    for (const [date, total] of Object.entries(initialInventoryByDate)) {
      this.dailyInventory.set(date, { total, reserved: 0, version: 1 });
    }

    // reservationId -> { id: string, dates: string[], count: number, status: 'HOLD'|'CONFIRMED'|'CANCELLED'|'EXPIRED', expiresAt: number }
    this.reservations = new Map();
  }

  /**
   * 尝试跨日期预留房间 (Hold 预占)
   * @param {string} reservationId
   * @param {string[]} dates - 连续入住日期列表 (例如 ['2026-10-01', '2026-10-02'])
   * @param {number} numRooms - 需要预订的房间数
   * @param {number} [now=Date.now()]
   * @returns {{ success: boolean, reason?: string }}
   */
  holdReservation(reservationId, dates, numRooms, now = Date.now()) {
    this.cleanExpiredHolds(now);

    // 1. 预检查：确保所有日期均已录入且均有充足剩余库存
    for (const d of dates) {
      const inv = this.dailyInventory.get(d);
      if (!inv) {
        return { success: false, reason: `Date ${d} does not exist in inventory` };
      }
      const available = inv.total - inv.reserved;
      if (available < numRooms) {
        return { success: false, reason: `Sold out on date ${d} (available: ${available}, needed: ${numRooms})` };
      }
    }

    // 2. 原子锁定：所有日期同时扣减
    for (const d of dates) {
      const inv = this.dailyInventory.get(d);
      inv.reserved += numRooms;
      inv.version++;
    }

    // 3. 记录预留单
    this.reservations.set(reservationId, {
      id: reservationId,
      dates,
      numRooms,
      status: 'HOLD',
      expiresAt: now + this.holdDurationMs,
    });

    return { success: true };
  }

  /**
   * 用户完成支付，将预留状态转为正式确认 (CONFIRMED)
   * @param {string} reservationId
   * @param {number} [now=Date.now()]
   */
  confirmReservation(reservationId, now = Date.now()) {
    this.cleanExpiredHolds(now);

    const res = this.reservations.get(reservationId);
    if (!res) throw new Error('Reservation not found');
    if (res.status === 'EXPIRED') throw new Error('Reservation expired before confirmation');
    if (res.status !== 'HOLD') throw new Error(`Cannot confirm in state: ${res.status}`);

    res.status = 'CONFIRMED';
    return { success: true };
  }

  /**
   * 用户主动取消或支付失败，释放预留库存
   * @param {string} reservationId
   */
  cancelReservation(reservationId) {
    const res = this.reservations.get(reservationId);
    if (!res || res.status === 'CANCELLED' || res.status === 'EXPIRED') return;

    // 归还库存
    for (const d of res.dates) {
      const inv = this.dailyInventory.get(d);
      if (inv) {
        inv.reserved = Math.max(0, inv.reserved - res.numRooms);
        inv.version++;
      }
    }

    res.status = 'CANCELLED';
  }

  /**
   * 扫描并自动释放超时的预占库存
   */
  cleanExpiredHolds(now = Date.now()) {
    for (const [id, res] of this.reservations.entries()) {
      if (res.status === 'HOLD' && now > res.expiresAt) {
        // 超时释放库存
        for (const d of res.dates) {
          const inv = this.dailyInventory.get(d);
          if (inv) {
            inv.reserved = Math.max(0, inv.reserved - res.numRooms);
            inv.version++;
          }
        }
        res.status = 'EXPIRED';
      }
    }
  }

  /**
   * 获取指定日期的剩余可订库存
   */
  getAvailable(date) {
    const inv = this.dailyInventory.get(date);
    return inv ? inv.total - inv.reserved : 0;
  }
}

// --- 演示与自测代码 ---
if (process.argv[1] && process.argv[1].endsWith('inventory-reservation.js')) {
  console.log('=== 酒店多晚库存预留与超时释放演示 ===');
  // 10月1日有 2 间房，10月2日有 1 间房
  const hotel = new HotelInventoryManager(
    { '2026-10-01': 2, '2026-10-02': 1 },
    5000 // 5秒超时
  );

  let t = 1000;
  console.log('1. Alice 预订 10-01 与 10-02 各 1 间房:');
  const r1 = hotel.holdReservation('order_alice', ['2026-10-01', '2026-10-02'], 1, t);
  console.log('Alice 锁定结果:', r1);
  console.log('10-02 剩余可售房间数:', hotel.getAvailable('2026-10-02'));

  console.log('\n2. Bob 尝试预订同一两晚各 1 间房 (由于 10-02 已无房，应当整体被拒):');
  const r2 = hotel.holdReservation('order_bob', ['2026-10-01', '2026-10-02'], 1, t);
  console.log('Bob 预订结果:', r2);

  console.log('\n3. Alice 超过 5 秒未支付，系统自动超时回收库存:');
  t = 8000; // 时间推进到 8 秒
  hotel.cleanExpiredHolds(t);
  console.log('超时回收后 10-02 剩余可售房间数:', hotel.getAvailable('2026-10-02'));

  console.log('\n4. Bob 再次尝试预订 (库存已恢复，成功锁定):');
  const r3 = hotel.holdReservation('order_bob_retry', ['2026-10-01', '2026-10-02'], 1, t);
  console.log('Bob 重试锁定结果:', r3);
}
