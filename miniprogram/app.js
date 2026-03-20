/**
 * 《捏捏乐》小程序入口
 * 无失败、无惩罚、无强制任务，仅做本地解压与轻量收集展示
 */
App({
  onLaunch() {
    const { initUserDataIfNeeded, grantDailyLoginCoins } = require('./utils/storage');
    initUserDataIfNeeded();
    grantDailyLoginCoins();
  },
  globalData: {
    /** 当前选中的捏捏乐 id，各页可同步读取 */
    currentToyId: 'octopus',
    /** 当前场景 id */
    currentSceneId: 'bedroom',
  },
});
