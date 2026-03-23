/**
 * 月度打卡日历：展示有打卡记录的日期
 */
const repository = require('../../utils/repository');
const { monthMeta, toDateStr } = require('../../utils/date');

Page({
  data: {
    year: 0,
    month: 0,
    title: '',
    weeks: [],
    todayStr: '',
  },

  onShow() {
    const d = new Date();
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const todayStr = toDateStr(d);
    this.setData({ todayStr });
    this.buildMonth(year, month, todayStr);
  },

  buildMonth(year, month, todayStr) {
    const today = todayStr || toDateStr(new Date());
    const monthIndex0 = month - 1;
    const { first, days } = monthMeta(year, monthIndex0);
    const startWeekday = first.getDay();
    const set = repository.getCheckinDatesSet();
    const cells = [];
    for (let i = 0; i < startWeekday; i += 1) {
      cells.push({ empty: true });
    }
    for (let day = 1; day <= days; day += 1) {
      const ds = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      cells.push({
        empty: false,
        day,
        dateStr: ds,
        checked: !!set[ds],
        isToday: ds === today,
      });
    }
    const weeks = [];
    for (let i = 0; i < cells.length; i += 7) {
      weeks.push(cells.slice(i, i + 7));
    }
    this.setData({
      year,
      month,
      title: `${year} 年 ${month} 月`,
      weeks,
    });
  },

  prevMonth() {
    let { year, month, todayStr } = this.data;
    month -= 1;
    if (month < 1) {
      month = 12;
      year -= 1;
    }
    this.buildMonth(year, month, todayStr);
  },

  nextMonth() {
    let { year, month, todayStr } = this.data;
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
    this.buildMonth(year, month, todayStr);
  },
});
