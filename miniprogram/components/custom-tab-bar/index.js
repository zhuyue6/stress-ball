/**
 * 自定义底部导航：reLaunch 切换三主页，保证「单任务」式沉浸
 */
Component({
  properties: {
    current: {
      type: String,
      value: 'index',
    },
  },
  methods: {
    onTap(e) {
      const path = e.currentTarget.dataset.path;
      const cur = this.properties.current;
      if (!path || path === cur) return;
      wx.reLaunch({
        url: `/pages/${path}/${path}`,
      });
    },
  },
});
