/**
 * @file interview-evaluator.js
 * @description 第一卷 第03章：系统设计面试框架 (A Framework For System Design Interviews)
 * 工具/模型：系统设计面试四步法评估器与设计自查清单
 *
 * 【系统设计背景】：
 * 系统设计面试是一场开放式的技术沟通与协作，而非做单一标准答案的考试。
 * 原书提出了著名的“四步法框架”：
 * 1. 明确问题并确立设计范围 (Understand the Problem and Establish Design Scope) - 3~10分钟
 * 2. 提出概要设计并达成共识 (Propose High-Level Design and Get Buy-In) - 10~15分钟
 * 3. 深入设计细节 (Design Deep Dive) - 10~25分钟
 * 4. 总结与延伸 (Wrap Up) - 3~5分钟
 */

export const INTERVIEW_STEPS = Object.freeze({
  STEP_1_SCOPE: 'Step 1: 确定需求与设计范围',
  STEP_2_HIGH_LEVEL: 'Step 2: 概要设计与达成共识',
  STEP_3_DEEP_DIVE: 'Step 3: 核心细节深入设计',
  STEP_4_WRAP_UP: 'Step 4: 容错总结与系统延伸',
});

export class SystemDesignInterviewEvaluator {
  constructor(topicName) {
    this.topicName = topicName;
    this.checklist = {
      step1: {
        functionalRequirementsDefined: false,
        nonFunctionalRequirementsDefined: false, // 延迟、可用性、一致性
        scaleAndEstimationsCalculated: false, // DAU, QPS, 存储
        outOfScopeClarified: false, // 排除无关需求
      },
      step2: {
        apiDesignCompleted: false, // RESTful / RPC endpoints
        databaseSchemaDrafted: false, // SQL vs NoSQL, 表关系
        highLevelDiagramDrawn: false, // 客户端、LB、网关、服务、存储
        interviewerBuyInObtained: false, // 获得面试官确认
      },
      step3: {
        bottlenecksIdentified: false, // 单点瓶颈排查
        dataStructuresAndAlgorithmsChosen: false, // 针对具体问题的算法选型
        replicationAndFaultToleranceAddressed: false, // 副本、分区、故障转移
        cachingAndCDNConsidered: false, // 缓存穿透/击穿/雪崩对策
      },
      step4: {
        tradeoffsSummarized: false, // CAP 定理取舍与设计局限
        monitoringAndAlertingDiscussed: false, // 指标监控、SLA 告警
        futureScalabilityExplored: false, // 跨机房扩展、分片迁移
      },
    };
  }

  /**
   * 记录完成项
   * @param {'step1'|'step2'|'step3'|'step4'} step
   * @param {string} itemKey
   * @param {boolean} status
   */
  check(step, itemKey, status = true) {
    if (!this.checklist[step] || !(itemKey in this.checklist[step])) {
      throw new Error(`Invalid step or itemKey: ${step}.${itemKey}`);
    }
    this.checklist[step][itemKey] = Boolean(status);
  }

  /**
   * 计算面试表现得分与覆盖率
   * @returns {{ score: number, maxScore: number, percentage: number, missingItems: string[] }}
   */
  evaluate() {
    let completed = 0;
    let total = 0;
    const missingItems = [];

    for (const [stepKey, items] of Object.entries(this.checklist)) {
      for (const [itemKey, isChecked] of Object.entries(items)) {
        total++;
        if (isChecked) {
          completed++;
        } else {
          missingItems.push(`${stepKey}.${itemKey}`);
        }
      }
    }

    const percentage = Math.round((completed / total) * 100);
    return {
      topic: this.topicName,
      score: completed,
      maxScore: total,
      percentage,
      missingItems,
      readyForInterview: percentage >= 80,
    };
  }
}

// --- 演示与自测代码 ---
if (process.argv[1] && process.argv[1].endsWith('interview-evaluator.js')) {
  console.log('=== 系统设计面试四步法评估器演示 ===');
  const session = new SystemDesignInterviewEvaluator('设计短网址系统 (TinyURL)');

  // 模拟面试推进过程
  session.check('step1', 'functionalRequirementsDefined', true);
  session.check('step1', 'nonFunctionalRequirementsDefined', true);
  session.check('step1', 'scaleAndEstimationsCalculated', true);
  session.check('step1', 'outOfScopeClarified', true);

  session.check('step2', 'apiDesignCompleted', true);
  session.check('step2', 'databaseSchemaDrafted', true);
  session.check('step2', 'highLevelDiagramDrawn', true);
  session.check('step2', 'interviewerBuyInObtained', true);

  session.check('step3', 'bottlenecksIdentified', true);
  session.check('step3', 'dataStructuresAndAlgorithmsChosen', true); // 选用了 Base62 算法

  const report = session.evaluate();
  console.log(`主题: ${report.topic}`);
  console.log(`得分: ${report.score}/${report.maxScore} (${report.percentage}%)`);
  console.log(`待补充环节: ${report.missingItems.join(', ')}`);
  console.log(`是否准备就绪: ${report.readyForInterview ? '✅ 是' : '❌ 否，需补充深入细节'}`);
}
