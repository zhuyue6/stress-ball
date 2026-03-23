/**
 * 全局常量：标签、订阅消息模板占位（上线前在公众平台申请后替换）
 */

/** 主目标分类标签 */
const GOAL_TAGS = ['学习', '工作', '健康', '生活', '其他'];

/** 优先级展示 */
const PRIORITIES = [
  { value: 1, label: '低' },
  { value: 2, label: '中' },
  { value: 3, label: '高' },
];

/**
 * 订阅消息模板 ID（须与类目、场景一致；未配置时不调用 requestSubscribeMessage）
 * 文档：https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/subscribe-message.html
 */
const SUBSCRIBE_TMPL_IDS = [
  // 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
];

/** 非紧急提醒建议避免时段（与合规建议一致，仅用于端内提示） */
const QUIET_HOURS = { start: 22, end: 7 };

module.exports = {
  GOAL_TAGS,
  PRIORITIES,
  SUBSCRIBE_TMPL_IDS,
  QUIET_HOURS,
};
