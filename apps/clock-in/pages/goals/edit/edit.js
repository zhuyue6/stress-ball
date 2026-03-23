/**
 * 新建 / 编辑主目标
 */
const { genId } = require('../../../utils/id');
const repository = require('../../../utils/repository');
const { GOAL_TAGS, PRIORITIES } = require('../../../utils/constants');

Page({
  data: {
    id: '',
    name: '',
    desc: '',
    endDate: '',
    tagIndex: 0,
    tags: GOAL_TAGS,
    priorityIndex: 1,
    priorities: PRIORITIES,
    status: 'active',
  },

  onLoad(query) {
    if (query.id) {
      const g = repository.getGoalById(query.id);
      if (g) {
        const tagIndex = Math.max(0, GOAL_TAGS.indexOf(g.tag));
        const pr = PRIORITIES.findIndex((p) => p.value === g.priority);
        this.setData({
          id: g.id,
          name: g.name,
          desc: g.desc || '',
          endDate: g.endDate || '',
          tagIndex: tagIndex >= 0 ? tagIndex : 0,
          priorityIndex: pr >= 0 ? pr : 1,
          status: g.status || 'active',
        });
        wx.setNavigationBarTitle({ title: '编辑目标' });
      }
    } else {
      wx.setNavigationBarTitle({ title: '新建目标' });
    }
  },

  onNameInput(e) {
    this.setData({ name: e.detail.value });
  },

  onDescInput(e) {
    this.setData({ desc: e.detail.value });
  },

  onEndDateChange(e) {
    this.setData({ endDate: e.detail.value });
  },

  onTagChange(e) {
    this.setData({ tagIndex: Number(e.detail.value) });
  },

  onPriorityChange(e) {
    this.setData({ priorityIndex: Number(e.detail.value) });
  },

  onStatusChange(e) {
    const i = Number(e.detail.value);
    const statuses = ['active', 'done', 'expired'];
    this.setData({ status: statuses[i] ?? 'active' });
  },

  onSave() {
    const { id, name, desc, endDate, tagIndex, priorityIndex, status, tags, priorities } =
      this.data;
    const n = (name || '').trim();
    if (!n) {
      wx.showToast({ title: '请填写目标名称', icon: 'none' });
      return;
    }
    const goal = {
      id: id || genId('g'),
      name: n,
      desc: (desc || '').trim(),
      endDate: endDate || '',
      tag: tags[tagIndex] || '其他',
      priority: priorities[priorityIndex].value,
      status,
      progress: 0,
    };
    repository.saveGoal(goal);
    repository.refreshMainGoalStatus(goal.id);
    wx.showToast({ title: '已保存', icon: 'success' });
    setTimeout(() => {
      if (id) wx.navigateBack();
      else wx.redirectTo({ url: `/pages/goals/detail/detail?id=${goal.id}` });
    }, 400);
  },
});
