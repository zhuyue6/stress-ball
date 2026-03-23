/**
 * 本地数据仓库：主目标、子目标、打卡记录、提醒、用户偏好
 * 后续可替换为云开发 / 自建 API，保持函数签名即可
 */

const { genId } = require('./id');
const { toDateStr } = require('./date');

const KEYS = {
  INITED: 'ci_inited',
  GOALS: 'ci_goals',
  SUBGOALS: 'ci_subgoals',
  CHECKINS: 'ci_checkins',
  REMINDERS: 'ci_reminders',
  PREFS: 'ci_prefs',
};

const DEFAULT_PREFS = {
  /** 用户是否已看过首次说明（本地存储、非强制公众号） */
  sawWelcome: false,
  /** 是否允许在端内展示「今日待打卡」提示（非推送） */
  inAppReminder: true,
  /** 用户主动开启的「公众号增强提醒」意愿（实际推送须服务端与 UnionID） */
  mpPushOptIn: false,
  mpPushOptInAt: 0,
};

function initIfNeeded() {
  if (wx.getStorageSync(KEYS.INITED)) return;
  wx.setStorageSync(KEYS.INITED, true);
  wx.setStorageSync(KEYS.GOALS, []);
  wx.setStorageSync(KEYS.SUBGOALS, []);
  wx.setStorageSync(KEYS.CHECKINS, []);
  wx.setStorageSync(KEYS.REMINDERS, []);
  wx.setStorageSync(KEYS.PREFS, { ...DEFAULT_PREFS });
}

function getPrefs() {
  initIfNeeded();
  const p = wx.getStorageSync(KEYS.PREFS);
  return { ...DEFAULT_PREFS, ...(p || {}) };
}

function setPrefs(partial) {
  initIfNeeded();
  const next = { ...getPrefs(), ...partial };
  wx.setStorageSync(KEYS.PREFS, next);
  return next;
}

function readList(key) {
  initIfNeeded();
  const v = wx.getStorageSync(key);
  return Array.isArray(v) ? v : [];
}

function writeList(key, list) {
  wx.setStorageSync(key, list);
}

/** ---------- 主目标 ---------- */
function getGoals() {
  return readList(KEYS.GOALS);
}

function getGoalById(id) {
  return getGoals().find((g) => g.id === id) || null;
}

function saveGoal(goal) {
  const list = getGoals();
  const i = list.findIndex((g) => g.id === goal.id);
  const now = Date.now();
  const next = { ...goal, updatedAt: now };
  if (i >= 0) list[i] = next;
  else list.push({ ...next, createdAt: now });
  writeList(KEYS.GOALS, list);
  return next;
}

function deleteGoal(id) {
  writeList(
    KEYS.GOALS,
    getGoals().filter((g) => g.id !== id),
  );
  writeList(
    KEYS.SUBGOALS,
    getSubGoals().filter((s) => s.mainGoalId !== id),
  );
  writeList(
    KEYS.CHECKINS,
    getCheckins().filter((c) => c.mainGoalId !== id),
  );
  writeList(
    KEYS.REMINDERS,
    getReminders().filter((r) => r.mainGoalId !== id),
  );
}

/** ---------- 子目标 ---------- */
function getSubGoals() {
  return readList(KEYS.SUBGOALS);
}

function getSubGoalsByMain(mainGoalId) {
  return getSubGoals().filter((s) => s.mainGoalId === mainGoalId);
}

function getSubGoalById(id) {
  return getSubGoals().find((s) => s.id === id) || null;
}

function saveSubGoal(sub) {
  const list = getSubGoals();
  const i = list.findIndex((s) => s.id === sub.id);
  const now = Date.now();
  const next = { ...sub, updatedAt: now };
  if (i >= 0) list[i] = next;
  else list.push({ ...next, createdAt: now });
  writeList(KEYS.SUBGOALS, list);
  refreshMainGoalStatus(next.mainGoalId);
  return next;
}

function patchSubGoalsForMain(mainGoalId, mutator) {
  const list = getSubGoals();
  let changed = false;
  const next = list.map((s) => {
    if (s.mainGoalId !== mainGoalId) return s;
    const n = mutator(s);
    if (n && n !== s) {
      changed = true;
      return { ...n, updatedAt: Date.now() };
    }
    return s;
  });
  if (changed) writeList(KEYS.SUBGOALS, next);
}

function deleteSubGoal(id) {
  const sub = getSubGoalById(id);
  writeList(
    KEYS.SUBGOALS,
    getSubGoals().filter((s) => s.id !== id),
  );
  writeList(
    KEYS.CHECKINS,
    getCheckins().filter((c) => c.subGoalId !== id),
  );
  writeList(
    KEYS.REMINDERS,
    getReminders().filter((r) => r.subGoalId !== id),
  );
  if (sub) refreshMainGoalStatus(sub.mainGoalId);
}

/** ---------- 打卡 ---------- */
function getCheckins() {
  return readList(KEYS.CHECKINS);
}

function getCheckinsBySub(subGoalId) {
  return getCheckins()
    .filter((c) => c.subGoalId === subGoalId)
    .sort((a, b) => b.createdAt - a.createdAt);
}

function getCheckinDatesSet() {
  const set = {};
  getCheckins().forEach((c) => {
    if (c.date) set[c.date] = true;
  });
  return set;
}

function addCheckin({ subGoalId, mainGoalId, note, images }) {
  const id = genId('ck');
  const rec = {
    id,
    subGoalId,
    mainGoalId,
    date: toDateStr(new Date()),
    note: (note || '').trim(),
    images: Array.isArray(images) ? images : [],
    createdAt: Date.now(),
  };
  const list = getCheckins();
  list.push(rec);
  writeList(KEYS.CHECKINS, list);

  const sub = getSubGoalById(subGoalId);
  if (sub && sub.frequency === 'once' && sub.status !== 'done') {
    saveSubGoal({ ...sub, status: 'done' });
  }
  refreshMainGoalStatus(mainGoalId);
  return rec;
}

/** ---------- 提醒 ---------- */
function getReminders() {
  return readList(KEYS.REMINDERS);
}

function getReminderById(id) {
  return getReminders().find((r) => r.id === id) || null;
}

function saveReminder(r) {
  const list = getReminders();
  const i = list.findIndex((x) => x.id === r.id);
  const now = Date.now();
  const next = { ...r, updatedAt: now };
  if (i >= 0) list[i] = next;
  else list.push({ ...next, createdAt: now });
  writeList(KEYS.REMINDERS, list);
  return next;
}

function deleteReminder(id) {
  writeList(
    KEYS.REMINDERS,
    getReminders().filter((r) => r.id !== id),
  );
}

/**
 * 根据截止日期刷新主/子目标「已过期」状态（避免与 saveSubGoal 相互递归）
 */
function refreshMainGoalStatus(mainGoalId) {
  const g = getGoalById(mainGoalId);
  if (!g || g.status === 'done') {
    updateMainProgress(mainGoalId);
    return;
  }
  const today = toDateStr(new Date());
  patchSubGoalsForMain(mainGoalId, (s) => {
    if (s.endDate && s.endDate < today && s.status === 'active') {
      return { ...s, status: 'expired' };
    }
    return s;
  });
  const subs = getSubGoalsByMain(mainGoalId);
  const expired =
    Boolean(g.endDate && g.endDate < today) ||
    subs.some((s) => s.endDate && s.endDate < today);
  const nextStatus = expired ? 'expired' : 'active';
  if (g.status !== nextStatus) {
    saveGoal({ ...g, status: nextStatus });
  }
  updateMainProgress(mainGoalId);
}

/**
 * 主目标进度：已完成子目标数 / 子目标总数（无子目标则为 0）
 */
function updateMainProgress(mainGoalId) {
  const g = getGoalById(mainGoalId);
  if (!g) return;
  const subs = getSubGoalsByMain(mainGoalId);
  if (subs.length === 0) {
    saveGoal({ ...g, progress: 0 });
    return;
  }
  const done = subs.filter((s) => s.status === 'done').length;
  const progress = Math.round((done / subs.length) * 100);
  saveGoal({ ...g, progress });
}

/** 清空所有业务数据 */
function clearAllData() {
  writeList(KEYS.GOALS, []);
  writeList(KEYS.SUBGOALS, []);
  writeList(KEYS.CHECKINS, []);
  writeList(KEYS.REMINDERS, []);
  setPrefs({ ...DEFAULT_PREFS, sawWelcome: true });
}

module.exports = {
  KEYS,
  initIfNeeded,
  getPrefs,
  setPrefs,
  getGoals,
  getGoalById,
  saveGoal,
  deleteGoal,
  getSubGoals,
  getSubGoalsByMain,
  getSubGoalById,
  saveSubGoal,
  deleteSubGoal,
  getCheckins,
  getCheckinsBySub,
  getCheckinDatesSet,
  addCheckin,
  getReminders,
  getReminderById,
  saveReminder,
  deleteReminder,
  refreshMainGoalStatus,
  clearAllData,
};
