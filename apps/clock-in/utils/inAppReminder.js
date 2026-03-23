/**
 * 打开小程序时的站内提醒（非推送）：固定时间 / 截止前 N 天
 * 同一提醒同一天仅提示一次，避免打扰
 */

const repository = require('./repository');
const { toDateStr } = require('./date');

const PREFIX = 'ci_inapp_shown_';

function parseTime(t) {
  if (!t || typeof t !== 'string') return null;
  const m = t.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return { h, min };
}

function minutesNow() {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

function goalDeadlineSoon(goal, beforeDays) {
  if (!goal || !goal.endDate) return false;
  const end = new Date(goal.endDate.replace(/-/g, '/'));
  if (Number.isNaN(end.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  const diff = Math.round((end - today) / 86400000);
  return diff >= 0 && diff <= beforeDays;
}

function alreadyShown(rid, dayStr) {
  return wx.getStorageSync(PREFIX + rid) === dayStr;
}

function markShown(rid, dayStr) {
  wx.setStorageSync(PREFIX + rid, dayStr);
}

/**
 * 尝试展示一条站内提醒（最多一条，避免连弹）
 */
function tryShowOneInAppReminder() {
  const prefs = repository.getPrefs();
  if (!prefs.inAppReminder) return;

  const dayStr = toDateStr(new Date());
  const nowMin = minutesNow();
  const list = repository.getReminders().filter((r) => r.enabled && r.channels && r.channels.inApp);

  for (let i = 0; i < list.length; i += 1) {
    const r = list[i];
    if (alreadyShown(r.id, dayStr)) continue;
    const g = repository.getGoalById(r.mainGoalId);
    if (!g || g.status === 'done') continue;

    let hit = false;
    let title = '目标提醒';
    let body = '';

    if (r.type === 'fixed') {
      const pt = parseTime(r.time);
      if (pt) {
        const target = pt.h * 60 + pt.min;
        if (Math.abs(nowMin - target) <= 30) {
          hit = true;
          const sub = r.subGoalId ? repository.getSubGoalById(r.subGoalId) : null;
          title = '定时打卡';
          body = sub ? `「${g.name}」· ${sub.name}` : `「${g.name}」`;
        }
      }
    } else if (r.type === 'deadline') {
      const bd = Number(r.beforeDays) || 0;
      if (bd >= 0 && goalDeadlineSoon(g, bd)) {
        hit = true;
        title = '截止日期临近';
        body = `「${g.name}」将在近期到期，记得推进打卡。`;
      }
    }

    if (hit) {
      markShown(r.id, dayStr);
      wx.showModal({
        title,
        content: body,
        showCancel: false,
        confirmText: '知道了',
      });
      return;
    }
  }
}

module.exports = {
  tryShowOneInAppReminder,
};
