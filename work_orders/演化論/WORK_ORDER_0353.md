# 工單 0353：成就系統

## 基本資訊
- **工單編號**：0353
- **所屬計畫**：P2-C 資料庫統計
- **前置工單**：0352（遊戲記錄服務）
- **預計影響檔案**：
  - `backend/services/evolution/achievementService.js`（新增）
  - `shared/constants/evolutionAchievements.js`（新增）

---

## 目標

建立成就系統：
1. 成就定義
2. 成就檢查邏輯
3. 成就解鎖
4. 成就通知

---

## 詳細規格

### 1. 成就定義

```javascript
// shared/constants/evolutionAchievements.js

/**
 * 成就類別
 */
export const ACHIEVEMENT_CATEGORIES = {
  GAMES: 'games',         // 遊戲場次相關
  WINS: 'wins',           // 勝利相關
  CREATURES: 'creatures', // 生物相關
  TRAITS: 'traits',       // 性狀相關
  SCORE: 'score',         // 分數相關
  SPECIAL: 'special',     // 特殊成就
};

/**
 * 成就定義
 */
export const ACHIEVEMENTS = {
  // === 遊戲場次 ===
  FIRST_GAME: {
    id: 'first_game',
    name: '初試啼聲',
    nameEn: 'First Steps',
    description: '完成第一場遊戲',
    icon: '🎮',
    category: ACHIEVEMENT_CATEGORIES.GAMES,
    condition: { type: 'games_played', value: 1 },
    points: 10,
  },
  VETERAN: {
    id: 'veteran',
    name: '老練玩家',
    nameEn: 'Veteran',
    description: '完成 50 場遊戲',
    icon: '🎖️',
    category: ACHIEVEMENT_CATEGORIES.GAMES,
    condition: { type: 'games_played', value: 50 },
    points: 50,
  },
  EXPERT: {
    id: 'expert',
    name: '進化專家',
    nameEn: 'Evolution Expert',
    description: '完成 100 場遊戲',
    icon: '🏆',
    category: ACHIEVEMENT_CATEGORIES.GAMES,
    condition: { type: 'games_played', value: 100 },
    points: 100,
  },

  // === 勝利相關 ===
  FIRST_WIN: {
    id: 'first_win',
    name: '初嚐勝果',
    nameEn: 'First Victory',
    description: '贏得第一場遊戲',
    icon: '🏅',
    category: ACHIEVEMENT_CATEGORIES.WINS,
    condition: { type: 'games_won', value: 1 },
    points: 20,
  },
  WINNING_STREAK_3: {
    id: 'winning_streak_3',
    name: '三連勝',
    nameEn: 'Hat Trick',
    description: '連續贏得 3 場遊戲',
    icon: '🔥',
    category: ACHIEVEMENT_CATEGORIES.WINS,
    condition: { type: 'winning_streak', value: 3 },
    points: 50,
  },
  DOMINATOR: {
    id: 'dominator',
    name: '霸主',
    nameEn: 'Dominator',
    description: '贏得 25 場遊戲',
    icon: '👑',
    category: ACHIEVEMENT_CATEGORIES.WINS,
    condition: { type: 'games_won', value: 25 },
    points: 100,
  },
  HIGH_WIN_RATE: {
    id: 'high_win_rate',
    name: '常勝將軍',
    nameEn: 'Champion',
    description: '在至少 20 場遊戲後維持 60% 以上勝率',
    icon: '⭐',
    category: ACHIEVEMENT_CATEGORIES.WINS,
    condition: { type: 'win_rate', value: 60, minGames: 20 },
    points: 100,
  },

  // === 生物相關 ===
  CREATURE_MASTER: {
    id: 'creature_master',
    name: '物種大師',
    nameEn: 'Species Master',
    description: '累計創造 100 隻生物',
    icon: '🦎',
    category: ACHIEVEMENT_CATEGORIES.CREATURES,
    condition: { type: 'total_creatures', value: 100 },
    points: 50,
  },
  BIG_FAMILY: {
    id: 'big_family',
    name: '大家庭',
    nameEn: 'Big Family',
    description: '單場遊戲擁有 6 隻以上存活生物',
    icon: '👨‍👩‍👧‍👦',
    category: ACHIEVEMENT_CATEGORIES.CREATURES,
    condition: { type: 'creatures_in_game', value: 6 },
    points: 30,
  },
  SURVIVOR: {
    id: 'survivor',
    name: '倖存者',
    nameEn: 'Survivor',
    description: '所有生物都在滅絕階段存活',
    icon: '💪',
    category: ACHIEVEMENT_CATEGORIES.CREATURES,
    condition: { type: 'all_creatures_survived', value: true },
    points: 30,
  },

  // === 性狀相關 ===
  TRAIT_COLLECTOR: {
    id: 'trait_collector',
    name: '性狀收藏家',
    nameEn: 'Trait Collector',
    description: '使用過所有 19 種性狀',
    icon: '🧬',
    category: ACHIEVEMENT_CATEGORIES.TRAITS,
    condition: { type: 'unique_traits_used', value: 19 },
    points: 100,
  },
  CARNIVORE_MASTER: {
    id: 'carnivore_master',
    name: '掠食者',
    nameEn: 'Predator',
    description: '累計擊殺 50 隻生物',
    icon: '🦖',
    category: ACHIEVEMENT_CATEGORIES.TRAITS,
    condition: { type: 'total_kills', value: 50 },
    points: 50,
  },
  DEFENSE_EXPERT: {
    id: 'defense_expert',
    name: '防禦專家',
    nameEn: 'Defense Expert',
    description: '單隻生物擁有 4 個以上防禦性狀',
    icon: '🛡️',
    category: ACHIEVEMENT_CATEGORIES.TRAITS,
    condition: { type: 'defense_traits_on_creature', value: 4 },
    points: 40,
  },

  // === 分數相關 ===
  HIGH_SCORE_30: {
    id: 'high_score_30',
    name: '高分玩家',
    nameEn: 'High Scorer',
    description: '單場遊戲獲得 30 分以上',
    icon: '📊',
    category: ACHIEVEMENT_CATEGORIES.SCORE,
    condition: { type: 'score_in_game', value: 30 },
    points: 50,
  },
  HIGH_SCORE_50: {
    id: 'high_score_50',
    name: '得分王',
    nameEn: 'Score King',
    description: '單場遊戲獲得 50 分以上',
    icon: '💯',
    category: ACHIEVEMENT_CATEGORIES.SCORE,
    condition: { type: 'score_in_game', value: 50 },
    points: 100,
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
  },
  COMEBACK_KING: {
    id: 'comeback_king',
    name: '逆轉王',
    nameEn: 'Comeback King',
    description: '在最後一回合逆轉獲勝',
    icon: '🔄',
    category: ACHIEVEMENT_CATEGORIES.SPECIAL,
    condition: { type: 'comeback_win', value: true },
    points: 100,
    hidden: true,
  },
};
```

### 2. 成就服務

```javascript
// backend/services/evolution/achievementService.js

import supabase from '../supabaseClient.js';
import { ACHIEVEMENTS } from '@shared/constants/evolutionAchievements.js';

class AchievementService {
  /**
   * 檢查並解鎖成就
   */
  async checkAndUnlock(userId, gameState, stats) {
    const unlocked = [];

    // 取得玩家已解鎖的成就
    const { data: existing } = await supabase
      .from('evolution_player_achievements')
      .select('achievement_id')
      .eq('user_id', userId);

    const unlockedIds = new Set((existing || []).map(a => a.achievement_id));

    // 檢查每個成就
    for (const achievement of Object.values(ACHIEVEMENTS)) {
      if (unlockedIds.has(achievement.id)) continue;

      const isUnlocked = this.checkCondition(achievement.condition, stats, gameState);

      if (isUnlocked) {
        await this.unlockAchievement(userId, achievement.id, gameState?.id);
        unlocked.push(achievement);
      }
    }

    return unlocked;
  }

  /**
   * 檢查成就條件
   */
  checkCondition(condition, stats, gameState) {
    switch (condition.type) {
      case 'games_played':
        return stats.games_played >= condition.value;

      case 'games_won':
        return stats.games_won >= condition.value;

      case 'win_rate':
        if (stats.games_played < (condition.minGames || 0)) return false;
        const winRate = (stats.games_won / stats.games_played) * 100;
        return winRate >= condition.value;

      case 'total_creatures':
        return stats.total_creatures >= condition.value;

      case 'total_kills':
        return stats.total_kills >= condition.value;

      case 'score_in_game':
        return gameState?.score >= condition.value;

      case 'highest_score':
        return stats.highest_score >= condition.value;

      case 'creatures_in_game':
        return gameState?.creaturesAlive >= condition.value;

      case 'all_creatures_survived':
        return gameState?.allSurvived === true;

      case 'perfect_game':
        return gameState?.isWinner && gameState?.allFed;

      default:
        return false;
    }
  }

  /**
   * 解鎖成就
   */
  async unlockAchievement(userId, achievementId, gameId = null) {
    const { error } = await supabase
      .from('evolution_player_achievements')
      .insert({
        user_id: userId,
        achievement_id: achievementId,
        game_id: gameId,
      });

    if (error && error.code !== '23505') { // 忽略重複
      throw error;
    }

    return true;
  }

  /**
   * 取得玩家成就
   */
  async getPlayerAchievements(userId) {
    const { data, error } = await supabase
      .from('evolution_player_achievements')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;

    return data.map(a => ({
      ...ACHIEVEMENTS[a.achievement_id.toUpperCase()],
      unlockedAt: a.unlocked_at,
    }));
  }

  /**
   * 取得成就進度
   */
  async getAchievementProgress(userId, stats) {
    const { data: unlocked } = await supabase
      .from('evolution_player_achievements')
      .select('achievement_id')
      .eq('user_id', userId);

    const unlockedIds = new Set((unlocked || []).map(a => a.achievement_id));

    return Object.values(ACHIEVEMENTS).map(achievement => ({
      ...achievement,
      unlocked: unlockedIds.has(achievement.id),
      progress: this.calculateProgress(achievement.condition, stats),
    }));
  }

  /**
   * 計算進度
   */
  calculateProgress(condition, stats) {
    const current = this.getCurrentValue(condition, stats);
    const target = condition.value;
    return Math.min(Math.round((current / target) * 100), 100);
  }

  getCurrentValue(condition, stats) {
    switch (condition.type) {
      case 'games_played': return stats.games_played;
      case 'games_won': return stats.games_won;
      case 'total_creatures': return stats.total_creatures;
      case 'total_kills': return stats.total_kills;
      case 'highest_score': return stats.highest_score;
      default: return 0;
    }
  }
}

export const achievementService = new AchievementService();
export default achievementService;
```

---

## 驗收標準

1. [ ] 成就定義完整
2. [ ] 條件檢查正確
3. [ ] 解鎖邏輯正確
4. [ ] 進度計算正確
5. [ ] 不重複解鎖
6. [ ] 隱藏成就正確處理

---

## 備註

- 成就增加遊戲成就感
- 可根據玩家反饋調整條件
