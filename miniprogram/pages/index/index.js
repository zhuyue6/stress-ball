/**
 * 玩耍页：捏捏核心交互 — 按压形变、拖拽、双指加强、音效与震动
 */
const { TOYS, SCENES, MATERIAL_SCALE } = require('../../utils/constants');
const storage = require('../../utils/storage');
const audio = require('../../utils/audio');

const HINT_KEY = 'nnl_hint_squeeze';

Page({
  data: {
    coins: 0,
    toyEmoji: '🐙',
    toyName: '小章鱼',
    toyMaterial: 'soft_rubber',
    toyId: 'octopus',
    soundKey: 'rubber',
    squishScale: 1,
    transitionMs: 420,
    pressing: false,
    offsetX: 0,
    offsetY: 0,
    rotateDeg: 0,
    sceneGradient: '',
    sceneParticles: 'curtain',
    toySheetVisible: false,
    sceneSheetVisible: false,
    toyList: [],
    sceneList: [],
    showHint: false,
    toast: '',
    jellyWobble: false,
    qualityClass: '',
  },

  /** @type {number|null} */
  _rewardTimer: null,
  _pageEnterAt: 0,
  /** 本次进入玩耍页时刻，用于累计发奖时长 */
  _playVisibleAt: 0,
  _touchStart: { x: 0, y: 0, ox: 0, oy: 0 },
  _startTime: 0,

  onLoad() {
    this._lastMoveVibrate = 0;
    this._pageEnterAt = Date.now();
    this.applyAppSelection();
    this.refreshLists();
    this.refreshCoins();
    const hinted = wx.getStorageSync(HINT_KEY);
    this.setData({ showHint: !hinted });
  },

  onShow() {
    this._playVisibleAt = Date.now();
    this.refreshCoins();
    this.applyAppSelection();
    const settings = storage.getSettings();
    this.setData({
      qualityClass: settings.quality === 'smooth' ? 'quality-smooth' : '',
    });
    this._startPlayRewardTimer();
    if (settings.musicOn) {
      audio.playBgm();
    } else {
      audio.stopBgm();
    }
  },

  onHide() {
    this._stopPlayRewardTimer();
    const delta = Date.now() - this._pageEnterAt;
    if (delta > 0) storage.addTotalPlayMs(delta);
    this._pageEnterAt = Date.now();
    const playDelta = Date.now() - this._playVisibleAt;
    if (playDelta > 0) storage.appendPlayRewardAccumMs(playDelta);
  },

  onUnload() {
    this._stopPlayRewardTimer();
    const playDelta = Date.now() - this._playVisibleAt;
    if (playDelta > 0) storage.appendPlayRewardAccumMs(playDelta);
    audio.stopBgm();
  },

  /** 同步 app.globalData 中的当前造型/场景 */
  applyAppSelection() {
    const app = getApp();
    let toy = TOYS.find((t) => t.id === app.globalData.currentToyId) || TOYS[0];
    if (!storage.isToyUnlocked(toy.id)) {
      toy = TOYS.find((t) => storage.isToyUnlocked(t.id)) || TOYS[0];
      app.globalData.currentToyId = toy.id;
    }
    let scene = SCENES.find((s) => s.id === app.globalData.currentSceneId) || SCENES[0];
    if (!storage.isSceneUnlocked(scene.id)) {
      scene = SCENES.find((s) => storage.isSceneUnlocked(s.id)) || SCENES[0];
      app.globalData.currentSceneId = scene.id;
    }
    const ms = MATERIAL_SCALE[toy.material] || MATERIAL_SCALE.soft_rubber;
    this.setData({
      toyId: toy.id,
      toyEmoji: toy.emoji,
      toyName: toy.name,
      toyMaterial: toy.material,
      soundKey: toy.soundKey,
      squishScale: 1,
      transitionMs: ms.duration,
      sceneGradient: scene.gradient,
      sceneParticles: scene.particles,
    });
  },

  refreshCoins() {
    this.setData({ coins: storage.getCoins() });
  },

  refreshLists() {
    const toyList = TOYS.map((t) => ({
      ...t,
      unlocked: storage.isToyUnlocked(t.id),
    }));
    const sceneList = SCENES.map((s) => ({
      ...s,
      unlocked: storage.isSceneUnlocked(s.id),
    }));
    this.setData({ toyList, sceneList });
  },

  _startPlayRewardTimer() {
    this._stopPlayRewardTimer();
    this._rewardTimer = setInterval(() => {
      const now = Date.now();
      const chunk = now - this._playVisibleAt;
      if (chunk > 0) {
        storage.appendPlayRewardAccumMs(chunk);
        this._playVisibleAt = now;
      }
      const gained = storage.tryGrantPlayTimeReward();
      if (gained > 0) {
        this.refreshCoins();
        this._showToast(`放松满 5 分钟，+${gained} 解压币`);
      }
    }, 15000);
  },

  _stopPlayRewardTimer() {
    if (this._rewardTimer) {
      clearInterval(this._rewardTimer);
      this._rewardTimer = null;
    }
  },

  _showToast(msg) {
    this.setData({ toast: msg });
    setTimeout(() => this.setData({ toast: '' }), 2200);
  },

  dismissHint() {
    wx.setStorageSync(HINT_KEY, true);
    this.setData({ showHint: false });
  },

  noop() {},

  openToySheet() {
    this.refreshLists();
    this.setData({ toySheetVisible: true, sceneSheetVisible: false });
  },

  openSceneSheet() {
    this.refreshLists();
    this.setData({ sceneSheetVisible: true, toySheetVisible: false });
  },

  closeSheets() {
    this.setData({ toySheetVisible: false, sceneSheetVisible: false });
  },

  onSelectToy(e) {
    const id = e.currentTarget.dataset.id;
    const item = TOYS.find((t) => t.id === id);
    if (!item) return;
    if (storage.isToyUnlocked(id)) {
      getApp().globalData.currentToyId = id;
      this.applyAppSelection();
      this.closeSheets();
      return;
    }
    if (storage.getCoins() < item.unlockPrice) {
      wx.showModal({
        title: '解压币不够啦',
        content: `再攒 ${item.unlockPrice - storage.getCoins()} 币就能带它回家～`,
        showCancel: false,
        confirmText: '好的',
        confirmColor: '#E8A0BF',
      });
      return;
    }
    wx.showModal({
      title: '解锁造型',
      content: `花费 ${item.unlockPrice} 解压币解锁「${item.name}」？`,
      confirmText: '解锁',
      confirmColor: '#E8A0BF',
      cancelText: '再想想',
      success: (res) => {
        if (!res.confirm) return;
        if (storage.spendCoins(item.unlockPrice)) {
          storage.unlockToy(id);
          getApp().globalData.currentToyId = id;
          this.refreshCoins();
          this.applyAppSelection();
          this.refreshLists();
          this.closeSheets();
          this._showToast(`已解锁 ${item.name}`);
        }
      },
    });
  },

  onSelectScene(e) {
    const id = e.currentTarget.dataset.id;
    const item = SCENES.find((s) => s.id === id);
    if (!item) return;
    if (storage.isSceneUnlocked(id)) {
      getApp().globalData.currentSceneId = id;
      this.applyAppSelection();
      this.closeSheets();
      return;
    }
    if (storage.getCoins() < item.unlockPrice) {
      wx.showModal({
        title: '解压币不够啦',
        content: `「${item.name}」需要 ${item.unlockPrice} 币，多来玩一会儿吧～`,
        showCancel: false,
        confirmText: '好的',
        confirmColor: '#E8A0BF',
      });
      return;
    }
    wx.showModal({
      title: '解锁场景',
      content: `花费 ${item.unlockPrice} 解压币解锁「${item.name}」？`,
      confirmText: '解锁',
      confirmColor: '#E8A0BF',
      cancelText: '再想想',
      success: (res) => {
        if (!res.confirm) return;
        if (storage.spendCoins(item.unlockPrice)) {
          storage.unlockScene(id);
          getApp().globalData.currentSceneId = id;
          this.refreshCoins();
          this.applyAppSelection();
          this.refreshLists();
          this.closeSheets();
          this._showToast(`已解锁 ${item.name}`);
        }
      },
    });
  },

  /**
   * 按压力度代理：优先用 touch.force，否则用按压时长
   */
  _pressureFromTouch(touch, holdMs) {
    if (touch && typeof touch.force === 'number' && touch.force > 0) {
      return Math.min(1, touch.force);
    }
    return Math.min(1, 0.35 + holdMs / 800);
  },

  onTouchStart(e) {
    const touches = e.touches || [];
    const isMulti = touches.length >= 2;
    const toy = TOYS.find((t) => t.id === this.data.toyId) || TOYS[0];
    const ms = MATERIAL_SCALE[toy.material] || MATERIAL_SCALE.soft_rubber;
    const baseMin = ms.min;
    const minScale = isMulti ? baseMin - 0.06 : baseMin;
    this._startTime = Date.now();
    this._touchStart = {
      x: touches[0].clientX,
      y: touches[0].clientY,
      ox: this.data.offsetX,
      oy: this.data.offsetY,
    };
    this.setData({
      pressing: true,
      squishScale: minScale,
      transitionMs: 80,
    });
    const settings = storage.getSettings();
    if (settings.vibrateOn) {
      try {
        wx.vibrateShort({ type: isMulti ? 'medium' : 'light' });
      } catch (err) {}
    }
  },

  onTouchMove(e) {
    const touches = e.touches || [];
    if (touches.length === 0) return;
    const dx = touches[0].clientX - this._touchStart.x;
    const dy = touches[0].clientY - this._touchStart.y;
    this.setData({
      offsetX: this._touchStart.ox + dx * 0.35,
      offsetY: this._touchStart.oy + dy * 0.35,
    });
    if (touches.length >= 2 && storage.getSettings().vibrateOn) {
      if (!this._lastMoveVibrate || Date.now() - this._lastMoveVibrate > 120) {
        this._lastMoveVibrate = Date.now();
        try {
          wx.vibrateShort({ type: 'light' });
        } catch (err) {}
      }
    }
  },

  onTouchEnd(e) {
    const toy = TOYS.find((t) => t.id === this.data.toyId) || TOYS[0];
    const ms = MATERIAL_SCALE[toy.material] || MATERIAL_SCALE.soft_rubber;
    const holdMs = Date.now() - this._startTime;
    const changed = (e.changedTouches && e.changedTouches[0]) || {};
    const pressure = this._pressureFromTouch(changed, holdMs);
    const settings = storage.getSettings();
    if (settings.soundOn) {
      audio.playSqueeze(toy.soundKey, pressure);
    }
    if (settings.vibrateOn) {
      try {
        wx.vibrateShort({ type: pressure > 0.65 ? 'heavy' : 'medium' });
      } catch (err) {}
    }
    if (toy.material === 'jelly') {
      this.setData({ jellyWobble: true });
      setTimeout(() => this.setData({ jellyWobble: false }), 450);
    }
    this.setData({
      pressing: false,
      squishScale: 1,
      transitionMs: ms.duration,
    });
  },

  onShareAppMessage() {
    return {
      title: '来捏一下，放松一下～',
      path: '/pages/index/index',
    };
  },
});
