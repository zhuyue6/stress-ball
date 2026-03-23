/**
 * 个人中心：统计、站内提醒总开关、公众号说明（可选）、清空数据、意见反馈
 */
const repository = require('../../utils/repository');

Page({
  data: {
    activeCount: 0,
    doneCount: 0,
    checkinCount: 0,
    inAppReminder: true,
    mpOptIn: false,
    mpNote: '',
  },

  onShow() {
    const goals = repository.getGoals();
    const activeCount = goals.filter((g) => g.status === 'active').length;
    const doneCount = goals.filter((g) => g.status === 'done').length;
    const checkinCount = repository.getCheckins().length;
    const prefs = repository.getPrefs();
    this.setData({
      activeCount,
      doneCount,
      checkinCount,
      inAppReminder: !!prefs.inAppReminder,
      mpOptIn: !!prefs.mpPushOptIn,
      mpNote:
        '公众号提醒为可选增强能力，须同主体绑定开放平台并由服务端发送模板消息。不关注公众号也可完整使用目标与打卡；此处仅记录您的意愿，不收集微信号等敏感信息。',
    });
  },

  onInAppSwitch(e) {
    const inAppReminder = e.detail.value;
    repository.setPrefs({ inAppReminder });
    this.setData({ inAppReminder });
  },

  onMpOptInChange(e) {
    const mpPushOptIn = e.detail.value;
    repository.setPrefs({
      mpPushOptIn,
      mpPushOptInAt: mpPushOptIn ? Date.now() : 0,
    });
    this.setData({ mpOptIn: mpPushOptIn });
    if (mpPushOptIn) {
      wx.showModal({
        title: '关于公众号提醒',
        content:
          '实际推送需您在微信公众平台完成模板申请，并由合规服务端在获得授权的前提下发送。本演示小程序仅保存「希望接收」的偏好，不会强制关注或限制核心功能。',
        showCancel: false,
        confirmText: '知道了',
      });
    }
  },

  onClearData() {
    wx.showModal({
      title: '清空本地数据',
      content: '将删除所有目标、打卡与提醒，不可恢复。',
      confirmText: '清空',
      confirmColor: '#c45c5c',
      success: (res) => {
        if (!res.confirm) return;
        repository.clearAllData();
        wx.showToast({ title: '已清空', icon: 'success' });
        this.onShow();
      },
    });
  },

  onFeedback() {
    wx.showModal({
      title: '意见反馈',
      content: '可通过微信公众平台小程序后台配置「客服消息」或「用户反馈」入口；开发阶段请将建议记录于项目 issue。',
      showCancel: false,
    });
  },
});
