/**
 * 演化論成就定義
 */

/**
 * 成就類別
 */
const ACHIEVEMENT_CATEGORIES = {
  MILESTONE: 'milestone', // 里程碑
  GAMEPLAY: 'gameplay', // 遊戲玩法
  COLLECTION: 'collection', // 收集類
  SPECIAL: 'special', // 特殊成就
};

/**
 * 成就定義
 */
const ACHIEVEMENTS = {
  // === 里程碑 ===
  FIRST_GAME: {
    id: 'first_game',
    name: '初試啼聲',
    nameEn: 'First Steps',
    description: '完成第一場遊戲',
    icon: '🎮',
    category: ACHIEVEMENT_CATEGORIES.MILESTONE,
    condition: { type: 'games_played', value: 1 },
    points: 10,
    rarity: 'common',
    hidden: false,
  },
  FIRST_WIN: {
    id: 'first_win',
    name: '初嚐勝果',
    nameEn: 'First Victory',
    description: '贏得第一場遊戲',
    icon: '🏆',
    category: ACHIEVEMENT_CATEGORIES.MILESTONE,
    condition: { type: 'games_won', value: 1 },
    points: 10,
    rarity: 'common',
    hidden: false,
  },
  VETERAN: {
    id: 'veteran',
    name: '老手',
    nameEn: 'Veteran',
    description: '完成 10 場遊戲',
    icon: '🎮',
    category: ACHIEVEMENT_CATEGORIES.MILESTONE,
    condition: { type: 'games_played', value: 10 },
    points: 20,
    rarity: 'common',
    hidden: false,
  },
  CHAMPION: {
    id: 'champion',
    name: '冠軍',
    nameEn: 'Champion',
    description: '贏得 10 場遊戲',
    icon: '👑',
    category: ACHIEVEMENT_CATEGORIES.MILESTONE,
    condition: { type: 'games_won', value: 10 },
    points: 50,
    rarity: 'rare',
    hidden: false,
  },

  // === 遊戲玩法 ===
  CARNIVORE_KING: {
    id: 'carnivore_king',
    name: '肉食之王',
    nameEn: 'Carnivore King',
    description: '單場遊戲擊殺 5 隻生物',
    icon: '🦖',
    category: ACHIEVEMENT_CATEGORIES.GAMEPLAY,
    condition: { type: 'kills_in_game', value: 5 },
    points: 30,
    rarity: 'rare',
    hidden: false,
  },
  PACIFIST: {
    id: 'pacifist',
    name: '和平主義者',
    nameEn: 'Pacifist',
    description: '不擊殺任何生物贏得遊戲',
    icon: '☮️',
    category: ACHIEVEMENT_CATEGORIES.GAMEPLAY,
    condition: { type: 'win_without_kills', value: true },
    points: 40,
    rarity: 'rare',
    hidden: true,
  },
  CREATURE_MASTER: {
    id: 'creature_master',
    name: '生物大師',
    nameEn: 'Creature Master',
    description: '單場遊戲擁有 8 隻生物',
    icon: '🦎',
    category: ACHIEVEMENT_CATEGORIES.GAMEPLAY,
    condition: { type: 'creatures_in_game', value: 8 },
    points: 30,
    rarity: 'rare',
    hidden: false,
  },
  PERFECT_SCORE: {
    id: 'perfect_score',
    name: '完美得分',
    nameEn: 'Perfect Score',
    description: '單場獲得 40 分以上',
    icon: '💯',
    category: ACHIEVEMENT_CATEGORIES.GAMEPLAY,
    condition: { type: 'score_in_game', value: 40 },
    points: 50,
    rarity: 'rare',
    hidden: false,
  },
  SURVIVOR: {
    id: 'survivor',
    name: '生存者',
    nameEn: 'Survivor',
    description: '所有生物存活至遊戲結束',
    icon: '💪',
    category: ACHIEVEMENT_CATEGORIES.GAMEPLAY,
    condition: { type: 'all_survived', value: true },
    points: 35,
    rarity: 'rare',
    hidden: false,
  },
  QUICK_WIN: {
    id: 'quick_win',
    name: '閃電戰',
    nameEn: 'Quick Win',
    description: '在 5 回合內獲勝',
    icon: '⚡',
    category: ACHIEVEMENT_CATEGORIES.GAMEPLAY,
    condition: { type: 'win_in_rounds', value: 5 },
    points: 45,
    rarity: 'rare',
    hidden: true,
  },

  // === 收集類 ===
  TRAIT_COLLECTOR: {
    id: 'trait_collector',
    name: '性狀收藏家',
    nameEn: 'Trait Collector',
    description: '累計獲得 100 個性狀',
    icon: '🧬',
    category: ACHIEVEMENT_CATEGORIES.COLLECTION,
    condition: { type: 'total_traits', value: 100 },
    points: 40,
    rarity: 'rare',
    hidden: false,
  },
  CREATURE_BREEDER: {
    id: 'creature_breeder',
    name: '生物繁殖者',
    nameEn: 'Creature Breeder',
    description: '累計創造 50 隻生物',
    icon: '🥚',
    category: ACHIEVEMENT_CATEGORIES.COLLECTION,
    condition: { type: 'total_creatures', value: 50 },
    points: 30,
    rarity: 'rare',
    hidden: false,
  },
  SERIAL_KILLER: {
    id: 'serial_killer',
    name: '連環殺手',
    nameEn: 'Serial Killer',
    description: '累計擊殺 25 隻生物',
    icon: '💀',
    category: ACHIEVEMENT_CATEGORIES.COLLECTION,
    condition: { type: 'total_kills', value: 25 },
    points: 30,
    rarity: 'rare',
    hidden: false,
  },

  // === 特殊成就 ===
  PERFECT_GAME: {
    id: 'perfect_game',
    name: '完美遊戲',
    nameEn: 'Perfect Game',
    description: '贏得遊戲且所有生物都吃飽',
    icon: '✨',
    category: ACHIEVEMENT_CATEGORIES.SPECIAL,
    condition: { type: 'perfect_game', value: true },
    points: 100,
    rarity: 'legendary',
    hidden: true,
  },
  HIGH_WIN_RATE: {
    id: 'high_win_rate',
    name: '常勝將軍',
    nameEn: 'High Win Rate',
    description: '在至少 20 場遊戲後維持 60% 以上勝率',
    icon: '⭐',
    category: ACHIEVEMENT_CATEGORIES.SPECIAL,
    condition: { type: 'win_rate', value: 60, minGames: 20 },
    points: 100,
    rarity: 'legendary',
    hidden: false,
  },
};

/**
 * 依 ID 取得成就
 * @param {string} id
 * @returns {Object|null}
 */
function getAchievementById(id) {
  return (
    Object.values(ACHIEVEMENTS).find((a) => a.id === id) || null
  );
}

/**
 * 取得所有可見成就
 * @returns {Array}
 */
function getVisibleAchievements() {
  return Object.values(ACHIEVEMENTS).filter((a) => !a.hidden);
}

/**
 * 取得類別下的成就
 * @param {string} category
 * @returns {Array}
 */
function getAchievementsByCategory(category) {
  return Object.values(ACHIEVEMENTS).filter((a) => a.category === category);
}

module.exports = {
  ACHIEVEMENT_CATEGORIES,
  ACHIEVEMENTS,
  getAchievementById,
  getVisibleAchievements,
  getAchievementsByCategory,
};
