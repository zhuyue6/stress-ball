/**
 * 《目标打卡》小程序入口
 * 核心能力本地可用；订阅消息 / 公众号推送须按平台规则配置模板与服务端
 */
const repository = require('./utils/repository');
const { tryShowOneInAppReminder } = require('./utils/inAppReminder');

App({
  onLaunch() {
    repository.initIfNeeded();
    const prefs = repository.getPrefs();
    if (!prefs.sawWelcome) {
      this._pendingWelcome = true;
    }
  },
  onShow() {
    const goals = repository.getGoals();
    goals.forEach((g) => repository.refreshMainGoalStatus(g.id));
    tryShowOneInAppReminder();
  },
  globalData: {
    /** 是否在首页展示首次合规说明弹层 */
    pendingWelcome: false,
  },
});
