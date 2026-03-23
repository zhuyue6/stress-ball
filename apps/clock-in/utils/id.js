/**
 * 生成本地唯一 id（无网络依赖）
 */
function genId(prefix) {
  const p = prefix ? `${prefix}_` : '';
  return `${p}${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

module.exports = { genId };
