/**
 * 日期工具（本地时区）
 */

function pad2(n) {
  return n < 10 ? `0${n}` : `${n}`;
}

/** @returns {string} YYYY-MM-DD */
function toDateStr(d) {
  const x = d instanceof Date ? d : new Date(d);
  return `${x.getFullYear()}-${pad2(x.getMonth() + 1)}-${pad2(x.getDate())}`;
}

/** @returns {string} HH:mm */
function toTimeStr(d) {
  const x = d instanceof Date ? d : new Date(d);
  return `${pad2(x.getHours())}:${pad2(x.getMinutes())}`;
}

/** 当月第一天与天数 */
function monthMeta(year, monthIndex0) {
  const first = new Date(year, monthIndex0, 1);
  const next = new Date(year, monthIndex0 + 1, 1);
  const days = Math.round((next - first) / 86400000);
  return { first, days };
}

/** 解析 YYYY-MM-DD */
function parseDateStr(s) {
  if (!s || typeof s !== 'string') return null;
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const dt = new Date(y, mo, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo || dt.getDate() !== d) return null;
  return dt;
}

module.exports = {
  toDateStr,
  toTimeStr,
  monthMeta,
  parseDateStr,
  pad2,
};
