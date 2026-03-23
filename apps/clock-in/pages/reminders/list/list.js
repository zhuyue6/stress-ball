/**
 * 提醒列表：启停、跳转编辑
 */
const repository = require('../../../utils/repository');

Page({
  data: {
    rows: [],
  },

  onShow() {
    this.load();
  },

  onPullDownRefresh() {
    this.load();
    wx.stopPullDownRefresh();
  },

  load() {
    const reminders = repository.getReminders().sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    const goals = repository.getGoals();
    const subGoals = repository.getSubGoals();
    const rows = reminders.map((r) => {
      const g = goals.find((x) => x.id === r.mainGoalId);
      const s = r.subGoalId ? subGoals.find((x) => x.id === r.subGoalId) : null;
      const channels = r.channels || { inApp: true, subscribe: false };
      const typeLabel = r.type === 'deadline' ? `截止前 ${r.beforeDays || 0} 天` : `每日 ${r.time || ''}`;
      return {
        ...r,
        channels,
        goalName: g ? g.name : '（目标已删）',
        subName: s ? s.name : '',
        typeLabel,
      };
    });
    this.setData({ rows });
  },

  onAddTap() {
    wx.navigateTo({ url: '/pages/reminders/edit/edit' });
  },

  onRowTap(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/reminders/edit/edit?id=${id}` });
  },

  onSwitchChange(e) {
    const { id } = e.currentTarget.dataset;
    const enabled = e.detail.value;
    const r = repository.getReminderById(id);
    if (!r) return;
    repository.saveReminder({ ...r, enabled });
    this.load();
  },
});
