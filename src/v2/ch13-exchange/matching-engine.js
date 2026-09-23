/**
 * @file matching-engine.js
 * @description 第二卷 第13章：股票交易所 (Stock Exchange)
 * 经典数据结构/算法：限价订单簿与价格优先-时间优先撮合引擎 (Limit Order Book & Matching Engine)
 *
 * 【系统设计背景】：
 * 在股票、期货与加密货币交易所（如 NASDAQ、NYSE、Binance）中，撮合引擎是系统中最关键的单写者 (Single Writer) 核心。
 * 每秒需要处理数万到数十万笔报单，纳秒/微秒级延迟至关重要。
 *
 * 【核心撮合规则：价格优先、时间优先 (Price-Time Priority / FIFO)】：
 * 1. 价格优先:
 *    - 买单簿 (Bids): 买价越高越优先排在最前 (降序)。
 *    - 卖单簿 (Asks): 卖价越低越优先排在最前 (升序)。
 * 2. 时间优先 (FIFO):
 *    - 若报价价格相同，先挂单者先成交。
 * 3. 撮合触发:
 *    - 当 `最高买价 (Best Bid) >= 最低卖价 (Best Ask)` 时，产生交叉触发成交。
 *    - 成交价格通常以先挂在订单簿中的对手单挂单价成交。
 *    - 支持完全成交 (Full Fill) 与部分成交 (Partial Fill)。
 */

export class Order {
  /**
   * @param {string} orderId - 订单号
   * @param {'BUY'|'SELL'} side - 买或卖
   * @param {number} price - 报价
   * @param {number} quantity - 数量
   * @param {number} [timestamp=Date.now()]
   */
  constructor(orderId, side, price, quantity, timestamp = Date.now()) {
    this.orderId = orderId;
    this.side = side;
    this.price = price;
    this.quantity = quantity;
    this.timestamp = timestamp;
  }
}

export class MatchingEngine {
  constructor(symbol = 'AAPL') {
    this.symbol = symbol;
    // 买单列表: 按价格降序；同价按时间升序
    this.bids = [];
    // 卖单列表: 按价格升序；同价按时间升序
    this.asks = [];
    // 历史成交记录
    this.trades = [];
  }

  /**
   * 提交限价单进行撮合与挂单
   * @param {Order} incomingOrder
   * @returns {Array<{ tradeId: string, buyOrderId: string, sellOrderId: string, price: number, quantity: number }>} 本次产生的成交记录列表
   */
  submitOrder(incomingOrder) {
    const executedTrades = [];

    if (incomingOrder.side === 'BUY') {
      // 买单：寻找卖单簿 (Asks) 中卖价 <= 本次买价的对手单
      while (this.asks.length > 0 && incomingOrder.quantity > 0) {
        const bestAsk = this.asks[0];
        if (incomingOrder.price >= bestAsk.price) {
          // 撮合成交
          const tradeQty = Math.min(incomingOrder.quantity, bestAsk.quantity);
          const tradePrice = bestAsk.price; // 以先挂簿的价格成交

          const trade = {
            tradeId: `T_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            buyOrderId: incomingOrder.orderId,
            sellOrderId: bestAsk.orderId,
            price: tradePrice,
            quantity: tradeQty,
          };

          this.trades.push(trade);
          executedTrades.push(trade);

          incomingOrder.quantity -= tradeQty;
          bestAsk.quantity -= tradeQty;

          if (bestAsk.quantity === 0) {
            this.asks.shift(); // 卖单完全成交出簿
          }
        } else {
          break; // 对手价高于买价，停止撮合
        }
      }

      // 若买单仍有剩余数量，加入买单簿挂单
      if (incomingOrder.quantity > 0) {
        this.bids.push(incomingOrder);
        this._sortBids();
      }
    } else if (incomingOrder.side === 'SELL') {
      // 卖单：寻找买单簿 (Bids) 中买价 >= 本次卖价的对手单
      while (this.bids.length > 0 && incomingOrder.quantity > 0) {
        const bestBid = this.bids[0];
        if (incomingOrder.price <= bestBid.price) {
          const tradeQty = Math.min(incomingOrder.quantity, bestBid.quantity);
          const tradePrice = bestBid.price;

          const trade = {
            tradeId: `T_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            buyOrderId: bestBid.orderId,
            sellOrderId: incomingOrder.orderId,
            price: tradePrice,
            quantity: tradeQty,
          };

          this.trades.push(trade);
          executedTrades.push(trade);

          incomingOrder.quantity -= tradeQty;
          bestBid.quantity -= tradeQty;

          if (bestBid.quantity === 0) {
            this.bids.shift(); // 买单完全成交出簿
          }
        } else {
          break;
        }
      }

      // 若卖单仍有剩余数量，加入卖单簿挂单
      if (incomingOrder.quantity > 0) {
        this.asks.push(incomingOrder);
        this._sortAsks();
      }
    }

    return executedTrades;
  }

  /**
   * 撤销未完全成交的挂单
   * @param {string} orderId
   * @returns {boolean} 是否成功撤单
   */
  cancelOrder(orderId) {
    const bidIdx = this.bids.findIndex(o => o.orderId === orderId);
    if (bidIdx !== -1) {
      this.bids.splice(bidIdx, 1);
      return true;
    }

    const askIdx = this.asks.findIndex(o => o.orderId === orderId);
    if (askIdx !== -1) {
      this.asks.splice(askIdx, 1);
      return true;
    }

    return false;
  }

  /**
   * 获取当前买卖盘口快照
   */
  getOrderBookSnapshot() {
    return {
      symbol: this.symbol,
      bids: this.bids.map(b => ({ price: b.price, quantity: b.quantity, id: b.orderId })),
      asks: this.asks.map(a => ({ price: a.price, quantity: a.quantity, id: a.orderId })),
    };
  }

  _sortBids() {
    // 价格降序；同价时间升序
    this.bids.sort((a, b) => b.price - a.price || a.timestamp - b.timestamp);
  }

  _sortAsks() {
    // 价格升序；同价时间升序
    this.asks.sort((a, b) => a.price - b.price || a.timestamp - b.timestamp);
  }
}

// --- 演示与自测代码 ---
if (process.argv[1] && process.argv[1].endsWith('matching-engine.js')) {
  console.log('=== 股票交易所撮合引擎 (Matching Engine) 演示 ===');
  const engine = new MatchingEngine('AAPL');

  console.log('1. 挂入初始卖单 S1 (价格 100, 数量 5) 与 S2 (价格 100, 数量 3，晚于 S1 到达):');
  engine.submitOrder(new Order('S1', 'SELL', 100, 5, 1000));
  engine.submitOrder(new Order('S2', 'SELL', 100, 3, 2000));
  console.log('当前盘口:', engine.getOrderBookSnapshot());

  console.log('\n2. 提交买单 B1 (价格 100, 数量 6):');
  // B1 先与 S1 完全成交 5 手，再与 S2 部分成交 1 手；S2 剩余 2 手挂簿
  const trades = engine.submitOrder(new Order('B1', 'BUY', 100, 6, 3000));

  console.log('撮合产生的成交流水:');
  console.table(trades);

  console.log('\n撮合后最新订单簿盘口:');
  console.log(engine.getOrderBookSnapshot());
}
