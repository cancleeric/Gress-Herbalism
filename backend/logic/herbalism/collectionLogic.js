/**
 * 本草百科解鎖邏輯 - 純函數
 *
 * 負責判斷玩家是否符合解鎖特定草藥的條件。
 * Issue #63 - 本草百科集收藏系統
 *
 * @module logic/herbalism/collectionLogic
 */

// 草藥解鎖條件定義（與 DB 中的 herb_encyclopedia 一致）
const HERB_UNLOCK_CONDITIONS = {
  red: { condition: 'games_played', threshold: 1 },
  yellow: { condition: 'games_played', threshold: 3 },
  green: { condition: 'games_won', threshold: 3 },
  blue: { condition: 'games_won', threshold: 5 },
};

// 所有草藥 ID（對應遊戲牌色）
const HERB_IDS = Object.keys(HERB_UNLOCK_CONDITIONS);

/**
 * 判斷玩家是否符合解鎖指定草藥的條件
 *
 * @param {string} herbId - 草藥 ID（red/yellow/green/blue）
 * @param {object} playerStats - 玩家統計 { games_played, games_won }
 * @returns {boolean} 是否符合解鎖條件
 */
function canUnlockHerb(herbId, playerStats) {
  const rule = HERB_UNLOCK_CONDITIONS[herbId];
  if (!rule) return false;
  if (!playerStats) return false;

  const value = playerStats[rule.condition] || 0;
  return value >= rule.threshold;
}

/**
 * 取得玩家在本局遊戲後應解鎖的草藥清單
 *
 * @param {object} playerStats - 更新後的玩家統計 { games_played, games_won }
 * @param {string[]} alreadyUnlocked - 玩家已解鎖的草藥 ID 列表
 * @returns {string[]} 本次新解鎖的草藥 ID 列表
 */
function getNewlyUnlockedHerbs(playerStats, alreadyUnlocked = []) {
  const unlockedSet = new Set(alreadyUnlocked);
  const newlyUnlocked = [];

  for (const herbId of HERB_IDS) {
    if (!unlockedSet.has(herbId) && canUnlockHerb(herbId, playerStats)) {
      newlyUnlocked.push(herbId);
    }
  }

  return newlyUnlocked;
}

/**
 * 計算玩家收藏進度（已解鎖數 / 總數）
 *
 * @param {string[]} unlockedHerbIds - 已解鎖的草藥 ID 列表
 * @returns {{ unlocked: number, total: number, percentage: number }}
 */
function getCollectionProgress(unlockedHerbIds = []) {
  const total = HERB_IDS.length;
  const unlocked = unlockedHerbIds.filter(id => HERB_IDS.includes(id)).length;
  const percentage = total > 0 ? Math.round((unlocked / total) * 100) : 0;
  return { unlocked, total, percentage };
}

module.exports = {
  HERB_IDS,
  HERB_UNLOCK_CONDITIONS,
  canUnlockHerb,
  getNewlyUnlockedHerbs,
  getCollectionProgress,
};
