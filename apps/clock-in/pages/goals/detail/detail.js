/**
 * 主目标详情：子目标列表、打卡、进度
 */
const repository = require('../../../utils/repository');

Page({
  data: {
    goalId: '',
    goal: null,
    subGoals: [],
    checkinModal: false,
    activeSubId: '',
    checkinNote: '',
    checkinImages: [],
    recentCheckins: [],
  },

  onLoad(query) {
    this.setData({ goalId: query.id || '' });
  },

  onShow() {
    const { goalId } = this.data;
    if (!goalId) return;
    repository.refreshMainGoalStatus(goalId);
    const goal = repository.getGoalById(goalId);
    const subGoals = repository.getSubGoalsByMain(goalId);
    this.setData({ goal, subGoals });
    if (!goal) {
      wx.showToast({ title: '目标不存在', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
    }
  },

  onEditMainTap() {
    wx.navigateTo({ url: `/pages/goals/edit/edit?id=${this.data.goalId}` });
  },

  onReminderTap() {
    wx.navigateTo({ url: `/pages/reminders/edit/edit?mainGoalId=${this.data.goalId}` });
  },

  onAddSubTap() {
    wx.navigateTo({ url: `/pages/subgoal/edit/edit?mainGoalId=${this.data.goalId}` });
  },

  onSubTap(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/subgoal/edit/edit?mainGoalId=${this.data.goalId}&id=${id}`,
    });
  },

  openCheckin(e) {
    const { id } = e.currentTarget.dataset;
    const recent = repository.getCheckinsBySub(id).slice(0, 5);
    this.setData({
      checkinModal: true,
      activeSubId: id,
      checkinNote: '',
      checkinImages: [],
      recentCheckins: recent,
    });
  },

  closeCheckin() {
    this.setData({ checkinModal: false, activeSubId: '' });
  },

  onNoteInput(e) {
    this.setData({ checkinNote: e.detail.value });
  },

  onChooseImage() {
    wx.chooseMedia({
      count: 3 - this.data.checkinImages.length,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const paths = (res.tempFiles || []).map((f) => f.tempFilePath);
        this.setData({
          checkinImages: [...this.data.checkinImages, ...paths].slice(0, 3),
        });
      },
      fail: () => {
        wx.showToast({ title: '未添加图片', icon: 'none' });
      },
    });
  },

  onRemoveImage(e) {
    const { index } = e.currentTarget.dataset;
    const imgs = [...this.data.checkinImages];
    imgs.splice(index, 1);
    this.setData({ checkinImages: imgs });
  },

  submitCheckin() {
    const { goalId, activeSubId, checkinNote, checkinImages } = this.data;
    if (!activeSubId) return;
    repository.addCheckin({
      subGoalId: activeSubId,
      mainGoalId: goalId,
      note: checkinNote,
      images: checkinImages,
    });
    wx.showToast({ title: '打卡成功', icon: 'success' });
    this.closeCheckin();
    this.onShow();
  },

  onMarkMainDone() {
    const g = repository.getGoalById(this.data.goalId);
    if (!g) return;
    wx.showModal({
      title: '确认完成',
      content: '将主目标标记为已完成，可随时在编辑中改回进行中。',
      success: (res) => {
        if (!res.confirm) return;
        repository.saveGoal({ ...g, status: 'done' });
        this.onShow();
      },
    });
  },

  onDeleteGoal() {
    wx.showModal({
      title: '删除目标',
      content: '将删除该目标及下属子目标、打卡与提醒，不可恢复。',
      success: (res) => {
        if (!res.confirm) return;
        repository.deleteGoal(this.data.goalId);
        wx.navigateBack();
      },
    });
  },

  noop() {},
});
