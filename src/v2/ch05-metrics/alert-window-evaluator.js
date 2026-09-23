/**
 * @file alert-window-evaluator.js
 * @description 第二卷 第05章：指标监控与告警系统 (Metrics Monitoring And Alerting System)
 * 经典算法/状态机：滑动窗口告警规则评估器 (Alert Rule Sliding Window Evaluator)
 *
 * 【系统设计背景】：
 * 在告警系统中，如果单次 CPU 瞬间毛刺（Spike）达到 95% 就立即向值班工程师发送短信电话，
 * 会导致极严重的“告警疲劳 (Alert Fatigue)”。
 * 业界通行告警判定算法（如 Prometheus Alertmanager）：
 * 1. 持续窗口检查 (Duration / For clause): 指标必须在连续持续 N 个周期（如连续 3 次评估）
 *    或最近 N 次中有 M 次超过阈值，才真正触发告警。
 * 2. 状态机流转：
 *    - OK: 正常状态；
 *    - PENDING: 指标已超标，但处于持续时间观察期，暂不外发告警；
 *    - FIRING: 持续超标满足条件，正式触发外发告警（短信/邮件）；
 *    - RESOLVED: 指标回落到阈值以下，发送恢复通知。
 */

export class AlertRuleEvaluator {
  /**
   * @param {string} ruleName - 告警规则名称
   * @param {number} threshold - 触发阈值
   * @param {number} [consecutiveBreachesRequired=3] - 需要连续超标的评估次数
   */
  constructor(ruleName, threshold, consecutiveBreachesRequired = 3) {
    this.ruleName = ruleName;
    this.threshold = threshold;
    this.requiredBreaches = consecutiveBreachesRequired;

    this.consecutiveBreaches = 0;
    this.state = 'OK'; // 'OK' | 'PENDING' | 'FIRING'
  }

  /**
   * 输入最新评估周期的指标值并推进状态机
   * @param {number} currentValue
   * @returns {{ state: 'OK'|'PENDING'|'FIRING', event: 'NONE'|'FIRED'|'RESOLVED', consecutive: number }}
   */
  evaluate(currentValue) {
    let event = 'NONE';

    if (currentValue >= this.threshold) {
      this.consecutiveBreaches++;

      if (this.consecutiveBreaches >= this.requiredBreaches) {
        if (this.state !== 'FIRING') {
          this.state = 'FIRING';
          event = 'FIRED'; // 跃迁为触发状态
        }
      } else {
        this.state = 'PENDING'; // 观察中
      }
    } else {
      // 指标恢复正常
      if (this.state === 'FIRING') {
        event = 'RESOLVED'; // 触发恢复事件
      }
      this.state = 'OK';
      this.consecutiveBreaches = 0;
    }

    return {
      state: this.state,
      event,
      consecutive: this.consecutiveBreaches,
    };
  }
}

// --- 演示与自测代码 ---
if (process.argv[1] && process.argv[1].endsWith('alert-window-evaluator.js')) {
  console.log('=== 滑动窗口告警状态机 (Alert Rule Evaluator) 演示 ===');
  // 规则：CPU >= 90%，必须连续 3 次超标才报警
  const alert = new AlertRuleEvaluator('HighCPUUsage', 90, 3);

  const mockSamples = [
    { cpu: 80, desc: '正常波动' },
    { cpu: 95, desc: '突发毛刺第 1 次 (进入 PENDING)' },
    { cpu: 92, desc: '持续超标第 2 次 (保持 PENDING)' },
    { cpu: 98, desc: '持续超标第 3 次 (达到阈值，正式触发 FIRING 🚨)' },
    { cpu: 96, desc: '仍处于超标中 (保持 FIRING，不重复发首警)' },
    { cpu: 75, desc: '指标回落到 75% (触发恢复 RESOLVED 🟢)' },
  ];

  mockSamples.forEach((sample, i) => {
    const res = alert.evaluate(sample.cpu);
    console.log(`周期 #${i + 1} [CPU=${sample.cpu}%] -> 状态: ${res.state}, 事件: ${res.event} (${sample.desc})`);
  });
}
