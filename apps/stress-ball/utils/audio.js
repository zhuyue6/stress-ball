/**
 * 音效管理：使用 InnerAudioContext
 * 实际 mp3 请放入 /assets/sounds/ 并替换下方路径（需自有或授权素材）
 */

const SOUND_FILES = {
  rubber: '/assets/sounds/rubber.mp3',
  foam: '/assets/sounds/foam.mp3',
  jelly: '/assets/sounds/jelly.mp3',
  plush: '/assets/sounds/plush.mp3',
  bgm: '/assets/sounds/bgm-soft.mp3',
};

let ctxMap = {};

function getCtx(key) {
  if (!ctxMap[key]) {
    const inner = wx.createInnerAudioContext();
    inner.obeyMuteSwitch = true;
    ctxMap[key] = inner;
  }
  return ctxMap[key];
}

/**
 * 播放短音效；音量 0~1 随按压力度
 * @param {string} soundKey constants 中 soundKey
 * @param {number} volume 0-1
 */
function playSqueeze(soundKey, volume) {
  const path = SOUND_FILES[soundKey] || SOUND_FILES.rubber;
  const ctx = getCtx(`sfx_${soundKey}`);
  try {
    ctx.src = path;
    ctx.volume = Math.max(0.15, Math.min(1, volume));
    ctx.play();
  } catch (e) {
    /* 无文件时静默失败，不打扰用户 */
  }
}

/** 背景音乐循环，需在设置里开启 */
let bgmCtx = null;

function ensureBgm() {
  if (!bgmCtx) {
    bgmCtx = wx.createInnerAudioContext();
    bgmCtx.loop = true;
    bgmCtx.obeyMuteSwitch = true;
    bgmCtx.src = SOUND_FILES.bgm;
  }
  return bgmCtx;
}

function playBgm() {
  try {
    const ctx = ensureBgm();
    ctx.volume = 0.25;
    ctx.play();
  } catch (e) {}
}

function stopBgm() {
  try {
    if (bgmCtx) {
      bgmCtx.stop();
    }
  } catch (e) {}
}

function destroyAll() {
  Object.keys(ctxMap).forEach((k) => {
    try {
      ctxMap[k].destroy();
    } catch (e) {}
  });
  ctxMap = {};
  try {
    if (bgmCtx) {
      bgmCtx.destroy();
      bgmCtx = null;
    }
  } catch (e) {}
}

module.exports = {
  playSqueeze,
  playBgm,
  stopBgm,
  destroyAll,
  SOUND_FILES,
};
