/**
 * 賽季聯賽邏輯 - 純函數
 *
 * 負責賽季制度的計算，包含：
 * - 段位（Tier）計算：草民 / 藥童 / 醫師 / 藥師 / 本草大師
 * - 賽季結束 ELO 軟重置（保留 50% ELO 作為起始值）
 * - 賽季獎勵計算
 *
 * 工單 0064 - 賽季聯賽系統
 *
 * @module logic/common/seasonLogic
 */

const { DEFAULT_ELO } = require('./eloLogic');

// ==================== 段位定義 ====================

/**
 * 段位名稱常數
 */
const TIER_NAMES = {
  GRASS: 'grass',
  APPRENTICE: 'apprentice',
  DOCTOR: 'doctor',
  PHARMACIST: 'pharmacist',
  GRANDMASTER: 'grandmaster',
};

/**
 * 段位配置（ELO 下限、名稱、卡背、獎勵）
 */
const TIERS = [
  {
    id: TIER_NAMES.GRASS,
    name: '草民',
    minElo: 0,
    maxElo: 1099,
    cardBack: '基礎草葉紋',
    rewards: { title: '草民', coins: 10 },
    color: '#7cb87c',
    icon: '🌿',
  },
  {
    id: TIER_NAMES.APPRENTICE,
    name: '藥童',
    minElo: 1100,
    maxElo: 1299,
    cardBack: '青瓷紋',
    rewards: { title: '藥童', coins: 30 },
    color: '#4da6a6',
    icon: '🪴',
  },
  {
    id: TIER_NAMES.DOCTOR,
    name: '醫師',
    minElo: 1300,
    maxElo: 1499,
    cardBack: '藥典紋',
    rewards: { title: '醫師', coins: 60 },
    color: '#5577bb',
    icon: '📜',
  },
  {
    id: TIER_NAMES.PHARMACIST,
    name: '藥師',
    minElo: 1500,
    maxElo: 1699,
    cardBack: '金葉紋',
    rewards: { title: '藥師', coins: 100 },
    color: '#cc9900',
    icon: '⚗️',
  },
  {
    id: TIER_NAMES.GRANDMASTER,
    name: '本草大師',
    minElo: 1700,
    maxElo: Infinity,
    cardBack: '神農紋（動態）',
    rewards: { title: '本草大師', coins: 200 },
    color: '#cc4400',
    icon: '🌟',
  },
];

// ==================== 段位計算 ====================

/**
 * 依 ELO 取得段位資訊
 * @param {number} elo - 玩家 ELO 分數
 * @returns {object} 段位資訊（id, name, icon, color, minElo, maxElo, cardBack, rewards）
 */
function getTierByElo(elo) {
  const rating = typeof elo === 'number' ? elo : DEFAULT_ELO;
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (rating >= TIERS[i].minElo) {
      return TIERS[i];
    }
  }
  return TIERS[0];
}

/**
 * 計算距離下一段位還需多少 ELO
 * @param {number} elo - 玩家 ELO 分數
 * @returns {{ nextTier: object|null, eloNeeded: number, progressPercent: number }}
 */
function getTierProgress(elo) {
  const rating = typeof elo === 'number' ? elo : DEFAULT_ELO;
  const currentTier = getTierByElo(rating);
  const currentIndex = TIERS.findIndex(t => t.id === currentTier.id);
  const nextTier = currentIndex < TIERS.length - 1 ? TIERS[currentIndex + 1] : null;

  if (!nextTier) {
    // 已是最高段位
    return { nextTier: null, eloNeeded: 0, progressPercent: 100 };
  }

  const tierRange = nextTier.minElo - currentTier.minElo;
  const progress = rating - currentTier.minElo;
  const progressPercent = Math.min(100, Math.floor((progress / tierRange) * 100));
  const eloNeeded = nextTier.minElo - rating;

  return { nextTier, eloNeeded, progressPercent };
}

// ==================== 賽季軟重置 ====================

/**
 * ELO 軟重置比例（保留 50%）
 */
const SOFT_RESET_RATIO = 0.5;

/**
 * 軟重置後的基礎 ELO（向預設值靠攏）
 * 公式：newElo = currentElo * SOFT_RESET_RATIO + DEFAULT_ELO * (1 - SOFT_RESET_RATIO)
 */
const SOFT_RESET_BASE = DEFAULT_ELO;

/**
 * 計算賽季結束後的軟重置 ELO
 * 公式：newElo = currentElo * 0.5 + 1000 * 0.5
 *
 * @param {number} currentElo - 玩家當前 ELO
 * @returns {number} 重置後的 ELO（整數）
 */
function calculateSoftResetElo(currentElo) {
  const rating = typeof currentElo === 'number' ? currentElo : DEFAULT_ELO;
  const newElo = Math.round(rating * SOFT_RESET_RATIO + SOFT_RESET_BASE * (1 - SOFT_RESET_RATIO));
  return newElo;
}

// ==================== 賽季倒計時 ====================

/**
 * 計算距賽季結束的剩餘秒數
 * @param {string|Date} endDate - 賽季結束日期
 * @returns {number} 剩餘秒數（負數代表已結束）
 */
function getSeasonRemainingSeconds(endDate) {
  const end = new Date(endDate);
  const now = new Date();
  return Math.floor((end.getTime() - now.getTime()) / 1000);
}

/**
 * 將剩餘秒數格式化為天/時/分/秒
 * @param {number} totalSeconds - 總剩餘秒數
 * @returns {{ days: number, hours: number, minutes: number, seconds: number, ended: boolean }}
 */
function formatSeasonCountdown(totalSeconds) {
  if (totalSeconds <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, ended: true };
  }

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds, ended: false };
}

// ==================== 賽季獎勵 ====================

/**
 * 根據段位取得賽季獎勵
 * @param {string} tierId - 段位 ID
 * @returns {{ title: string, coins: number, cardBack: string }}
 */
function getSeasonRewards(tierId) {
  const tier = TIERS.find(t => t.id === tierId);
  if (!tier) {
    return TIERS[0].rewards;
  }
  return { ...tier.rewards, cardBack: tier.cardBack };
}

module.exports = {
  TIER_NAMES,
  TIERS,
  SOFT_RESET_RATIO,
  SOFT_RESET_BASE,
  getTierByElo,
  getTierProgress,
  calculateSoftResetElo,
  getSeasonRemainingSeconds,
  formatSeasonCountdown,
  getSeasonRewards,
};
