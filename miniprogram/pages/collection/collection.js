/**
 * 图鉴页：展示已解锁内容，无排行榜、无焦虑文案
 */
const { TOYS, SCENES } = require('../../utils/constants');
const storage = require('../../utils/storage');

Page({
  data: {
    toys: [],
    scenes: [],
    playMinutes: 0,
  },

  onShow() {
    this.load();
  },

  load() {
    const toys = TOYS.map((t) => ({
      ...t,
      unlocked: storage.isToyUnlocked(t.id),
    }));
    const scenes = SCENES.map((s) => ({
      ...s,
      unlocked: storage.isSceneUnlocked(s.id),
    }));
    const ms = storage.getTotalPlayMs();
    const playMinutes = Math.max(0, Math.round(ms / 60000));
    this.setData({ toys, scenes, playMinutes });
  },
});
