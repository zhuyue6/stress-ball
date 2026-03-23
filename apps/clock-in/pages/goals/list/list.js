/**
 * 主目标列表
 */
const repository = require('../../../utils/repository');

Page({
  data: {
    goals: [],
    showWelcome: false,
  },

  onLoad() {
    const app = getApp();
    if (app._pendingWelcome) {
      this.setData({ showWelcome: true });
    }
  },

  onShow() {
    this.loadGoals();
  },

  onPullDownRefresh() {
    this.loadGoals();
    wx.stopPullDownRefresh();
  },

  loadGoals() {
    repository.getGoals().forEach((g) => repository.refreshMainGoalStatus(g.id));
    const goals = repository.getGoals().sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    this.setData({ goals });
  },

  closeWelcome() {
    repository.setPrefs({ sawWelcome: true });
    const app = getApp();
    app._pendingWelcome = false;
    this.setData({ showWelcome: false });
  },

  onAddTap() {
    wx.navigateTo({ url: '/pages/goals/edit/edit' });
  },

  onGoalTap(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/goals/detail/detail?id=${id}` });
  },

  noop() {},
});
