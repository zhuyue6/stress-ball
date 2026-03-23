/**
 * 新建 / 编辑提醒：站内 + 订阅消息（用户主动勾选并授权）
 */
const { genId } = require('../../../utils/id');
const repository = require('../../../utils/repository');
const { requestReminderSubscribe, hasSubscribeTemplatesConfigured } = require('../../../utils/subscribe');
const { QUIET_HOURS } = require('../../../utils/constants');

Page({
  data: {
    id: '',
    goalIndex: 0,
    goals: [],
    goalIds: [],
    subIndex: 0,
    subOptions: [{ id: '', name: '不指定子目标' }],
    typeIndex: 0,
    typeLabels: ['固定时间（每日）', '截止日期预警'],
    time: '09:00',
    beforeDays: 3,
    channelInApp: true,
    channelSubscribe: false,
    hasTmpl: false,
    quietHint: '',
  },

  onLoad(query) {
    const goals = repository.getGoals().filter((g) => g.status !== 'done');
    const goalIds = goals.map((g) => g.id);
    const hasTmpl = hasSubscribeTemplatesConfigured();
    const qh = `建议避免 ${QUIET_HOURS.start}:00 - 次日 ${QUIET_HOURS.end}:00 推送打扰休息。`;
    this.setData({
      goals,
      goalIds,
      hasTmpl,
      quietHint: qh,
    });

    if (!goalIds.length) {
      wx.showModal({
        title: '暂无可用目标',
        content: '请先在「目标」页创建进行中的主目标，再设置提醒。',
        showCancel: false,
        success: () => wx.navigateBack(),
      });
      return;
    }

    if (query.id) {
      const r = repository.getReminderById(query.id);
      if (r) {
        const gi = goalIds.indexOf(r.mainGoalId);
        const ch = r.channels || {};
        this.setData({
          id: r.id,
          goalIndex: gi >= 0 ? gi : 0,
          typeIndex: r.type === 'deadline' ? 1 : 0,
          time: r.time || '09:00',
          beforeDays: r.beforeDays != null ? r.beforeDays : 3,
          channelInApp: r.channels ? !!ch.inApp : true,
          channelSubscribe: !!ch.subscribe,
        });
        this.refreshSubOptions(r.mainGoalId, r.subGoalId || '');
        wx.setNavigationBarTitle({ title: '编辑提醒' });
      }
    } else {
      const preMain = query.mainGoalId || '';
      const gi = preMain ? goalIds.indexOf(preMain) : 0;
      this.setData({ goalIndex: gi >= 0 ? gi : 0 });
      const mainId = goalIds[this.data.goalIndex];
      this.refreshSubOptions(mainId, query.subGoalId || '');
      wx.setNavigationBarTitle({ title: '新建提醒' });
    }
  },

  refreshSubOptions(mainGoalId, selectedSubId) {
    const subs = repository.getSubGoalsByMain(mainGoalId);
    const subOptions = [{ id: '', name: '不指定子目标' }].concat(
      subs.map((s) => ({ id: s.id, name: s.name })),
    );
    let subIndex = 0;
    if (selectedSubId) {
      const i = subOptions.findIndex((o) => o.id === selectedSubId);
      subIndex = i >= 0 ? i : 0;
    }
    this.setData({ subOptions, subIndex });
  },

  onGoalChange(e) {
    const goalIndex = Number(e.detail.value);
    const mainGoalId = this.data.goalIds[goalIndex];
    this.setData({ goalIndex });
    this.refreshSubOptions(mainGoalId, '');
  },

  onSubChange(e) {
    this.setData({ subIndex: Number(e.detail.value) });
  },

  onTypeChange(e) {
    this.setData({ typeIndex: Number(e.detail.value) });
  },

  onTimeChange(e) {
    this.setData({ time: e.detail.value });
  },

  onBeforeDaysInput(e) {
    const n = parseInt(e.detail.value, 10);
    this.setData({ beforeDays: Number.isNaN(n) ? 0 : Math.max(0, n) });
  },

  onInAppChange(e) {
    this.setData({ channelInApp: e.detail.value });
  },

  onSubscribeChange(e) {
    const v = e.detail.value;
    if (!v) {
      this.setData({ channelSubscribe: false });
      return;
    }
    this.setData({ channelSubscribe: false });
    if (!this.data.hasTmpl) {
      wx.showToast({ title: '请先在 constants 配置模板 ID', icon: 'none' });
      return;
    }
    wx.showModal({
      title: '订阅消息说明',
      content:
        '仅在您同意的场景下，用于与您目标相关的打卡/到期提醒。可随时在本页关闭。实际下发需在服务端调用发送接口，并遵守频次与内容规范。',
      confirmText: '去授权',
      cancelText: '暂不',
      success: (res) => {
        if (!res.confirm) return;
        requestReminderSubscribe(({ accepted }) => {
          this.setData({ channelSubscribe: !!accepted });
        });
      },
    });
  },

  onSave() {
    const {
      id,
      goalIndex,
      goalIds,
      subOptions,
      subIndex,
      typeIndex,
      time,
      beforeDays,
      channelInApp,
      channelSubscribe,
    } = this.data;
    const mainGoalId = goalIds[goalIndex];
    const subGoalId = subOptions[subIndex] ? subOptions[subIndex].id : '';

    const reminder = {
      id: id || genId('rm'),
      mainGoalId,
      subGoalId: subGoalId || '',
      type: typeIndex === 1 ? 'deadline' : 'fixed',
      repeat: 'daily',
      time: typeIndex === 0 ? time : '',
      beforeDays: typeIndex === 1 ? beforeDays : 0,
      channels: {
        inApp: channelInApp,
        subscribe: channelSubscribe,
      },
      enabled: true,
    };
    repository.saveReminder(reminder);
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
      title: '删除提醒',
      content: '确定删除该条提醒规则？',
      success: (res) => {
        if (!res.confirm) return;
        repository.deleteReminder(id);
        wx.navigateBack();
      },
    });
  },
});
