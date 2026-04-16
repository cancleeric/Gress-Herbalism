/**
 * 每日任務邏輯
 * Issue #61 - 每日任務系統
 *
 * 定義任務類型、難度、獎勵，以及進度計算邏輯
 */

// ==================== 任務類型常數 ====================

const QUEST_TYPES = {
  PLAY_GAMES: 'play_games',   // 完成 N 場對局
  WIN_GAMES: 'win_games',     // 贏得 N 場對局
  WIN_STREAK: 'win_streak',   // 連勝 N 場
};

// ==================== 難度配置 ====================

const QUEST_TEMPLATES = [
  {
    quest_type: QUEST_TYPES.PLAY_GAMES,
    difficulty: 'easy',
    target: 1,
    reward_coins: 50,
    description: '完成 1 場對局',
  },
  {
    quest_type: QUEST_TYPES.PLAY_GAMES,
    difficulty: 'normal',
    target: 3,
    reward_coins: 100,
    description: '完成 3 場對局',
  },
  {
    quest_type: QUEST_TYPES.WIN_GAMES,
    difficulty: 'normal',
    target: 2,
    reward_coins: 150,
    description: '贏得 2 場對局',
  },
  {
    quest_type: QUEST_TYPES.WIN_GAMES,
    difficulty: 'hard',
    target: 3,
    reward_coins: 200,
    description: '贏得 3 場對局',
  },
  {
    quest_type: QUEST_TYPES.WIN_STREAK,
    difficulty: 'hard',
    target: 2,
    reward_coins: 300,
    description: '連勝 2 場',
  },
];

// ==================== 簽到獎勵配置 ====================

const CHECKIN_REWARDS = {
  base: 30,         // 每日基礎簽到獎勵
  streakBonus: 10,  // 每連續簽到 1 天加碼（最多 7 天）
  maxStreak: 7,     // 連續簽到上限（週獎勵）
  weekBonus: 200,   // 連續簽到滿 7 天週獎勵
};

// ==================== UTC+8 日期工具 ====================

/**
 * 取得 UTC+8 的今天日期字串（YYYY-MM-DD）
 * @returns {string}
 */
function getTodayUTC8() {
  const now = new Date();
  // 用 UTC 時間加 8 小時偏移後取日期，避免受本地時區影響
  const utc8Ms = now.getTime() + (8 * 60 * 60 * 1000);
  const utc8Date = new Date(utc8Ms);
  const y = utc8Date.getUTCFullYear();
  const m = String(utc8Date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(utc8Date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * 取得 UTC+8 昨天日期字串（YYYY-MM-DD）
 * @returns {string}
 */
function getYesterdayUTC8() {
  const now = new Date();
  const utc8Ms = now.getTime() + (8 * 60 * 60 * 1000) - (24 * 60 * 60 * 1000);
  const utc8Date = new Date(utc8Ms);
  const y = utc8Date.getUTCFullYear();
  const m = String(utc8Date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(utc8Date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ==================== 任務生成邏輯 ====================

/**
 * 為玩家生成今日任務（每日 3 個，難度分級）
 * 固定選取：1 個簡單 + 1 個普通 + 1 個困難
 * @returns {Array} 任務範本陣列（不含 player_id 與 date）
 */
function generateDailyQuests() {
  const easy = QUEST_TEMPLATES.filter(q => q.difficulty === 'easy');
  const normal = QUEST_TEMPLATES.filter(q => q.difficulty === 'normal');
  const hard = QUEST_TEMPLATES.filter(q => q.difficulty === 'hard');

  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  return [
    pick(easy),
    pick(normal),
    pick(hard),
  ].filter(Boolean);
}

// ==================== 進度更新邏輯 ====================

/**
 * 根據遊戲結果計算對任務進度的增量
 * @param {string} questType - 任務類型
 * @param {object} gameResult - 遊戲結果 { isWinner, consecutiveWins }
 * @returns {number} 進度增量
 */
function calculateProgressIncrement(questType, gameResult) {
  switch (questType) {
    case QUEST_TYPES.PLAY_GAMES:
      return 1; // 每場遊戲完成計 1
    case QUEST_TYPES.WIN_GAMES:
      return gameResult.isWinner ? 1 : 0;
    case QUEST_TYPES.WIN_STREAK:
      // 連勝型：贏則進度達到連勝數，輸則重置為 0
      if (gameResult.isWinner) {
        return 1;
      }
      return null; // null 代表需要重置為 0
    default:
      return 0;
  }
}

/**
 * 計算簽到獎勵金幣
 * @param {number} streakCount - 連續簽到天數
 * @returns {number} 獎勵金幣
 */
function calculateCheckinReward(streakCount) {
  const clampedStreak = Math.min(streakCount, CHECKIN_REWARDS.maxStreak);
  const base = CHECKIN_REWARDS.base + (clampedStreak - 1) * CHECKIN_REWARDS.streakBonus;
  const weekBonus = streakCount % CHECKIN_REWARDS.maxStreak === 0 ? CHECKIN_REWARDS.weekBonus : 0;
  return base + weekBonus;
}

module.exports = {
  QUEST_TYPES,
  QUEST_TEMPLATES,
  CHECKIN_REWARDS,
  getTodayUTC8,
  getYesterdayUTC8,
  generateDailyQuests,
  calculateProgressIncrement,
  calculateCheckinReward,
};
