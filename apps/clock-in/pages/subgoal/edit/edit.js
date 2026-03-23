/**
 * 新建 / 编辑子目标
 */
const { genId } = require('../../../utils/id');
const repository = require('../../../utils/repository');

const FREQ_LABELS = ['单次完成', '每日打卡', '每周打卡'];
const FREQ_VALUES = ['once', 'daily', 'weekly'];

Page({
  data: {
    id: '',
    mainGoalId: '',
    name: '',
    endDate: '',
    freqIndex: 0,
    freqLabels: FREQ_LABELS,
    status: 'active',
  },

  onLoad(query) {
    const mainGoalId = query.mainGoalId || '';
    if (!mainGoalId) {
      wx.showToast({ title: '参数错误', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
      return;
    }
    this.setData({ mainGoalId });
    if (query.id) {
      const s = repository.getSubGoalById(query.id);
      if (s && s.mainGoalId === mainGoalId) {
        const fi = FREQ_VALUES.indexOf(s.frequency || 'once');
        this.setData({
          id: s.id,
          name: s.name,
          endDate: s.endDate || '',
          freqIndex: fi >= 0 ? fi : 0,
          status: s.status || 'active',
        });
        wx.setNavigationBarTitle({ title: '编辑子目标' });
      }
    } else {
      wx.setNavigationBarTitle({ title: '新建子目标' });
    }
  },

  onNameInput(e) {
    this.setData({ name: e.detail.value });
  },

  onEndDateChange(e) {
    this.setData({ endDate: e.detail.value });
  },

  onFreqChange(e) {
    this.setData({ freqIndex: Number(e.detail.value) });
  },

  onStatusChange(e) {
    const i = Number(e.detail.value);
    const statuses = ['active', 'done', 'expired'];
    this.setData({ status: statuses[i] ?? 'active' });
  },

  onSave() {
    const { id, mainGoalId, name, endDate, freqIndex, status } = this.data;
    const n = (name || '').trim();
    if (!n) {
      wx.showToast({ title: '请填写子目标名称', icon: 'none' });
      return;
    }
    const sub = {
      id: id || genId('s'),
      mainGoalId,
      name: n,
      endDate: endDate || '',
      frequency: FREQ_VALUES[freqIndex] || 'once',
      status,
    };
    repository.saveSubGoal(sub);
    wx.showToast({ title: '已保存', icon: 'success' });
    setTimeout(() => wx.navigateBack(), 400);
  },

  onDelete() {
    const { id } = this.data;
    if (!id) {
      wx.navigateBack();
      return;
    }
    wx.showModal({
      title: '删除子目标',
      content: '将同时删除相关打卡记录与提醒。',
      success: (res) => {
        if (!res.confirm) return;
        repository.deleteSubGoal(id);
        wx.navigateBack();
      },
    });
  },
});
