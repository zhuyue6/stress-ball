/**
 * 订阅消息：仅在用户主动操作场景请求，模板 ID 须与业务一致
 */

const { SUBSCRIBE_TMPL_IDS } = require('./constants');

/**
 * 请求订阅消息授权（需用户点击触发）
 * @param {Function} [onResult] 回调 { accepted: boolean }
 */
function requestReminderSubscribe(onResult) {
  const tmplIds = SUBSCRIBE_TMPL_IDS.filter(Boolean);
  if (!tmplIds.length) {
    wx.showToast({ title: '请先在后台配置订阅模板', icon: 'none' });
    if (typeof onResult === 'function') onResult({ accepted: false, reason: 'no_tmpl' });
    return;
  }
  wx.requestSubscribeMessage({
    tmplIds,
    success(res) {
      const accept = tmplIds.some((id) => res[id] === 'accept');
      if (typeof onResult === 'function') onResult({ accepted: accept, raw: res });
    },
    fail(err) {
      wx.showToast({ title: '授权未完成', icon: 'none' });
      if (typeof onResult === 'function') onResult({ accepted: false, err });
    },
  });
}

module.exports = {
  requestReminderSubscribe,
  hasSubscribeTemplatesConfigured: () => SUBSCRIBE_TMPL_IDS.filter(Boolean).length > 0,
};
