# 演化論第二階段 - 資料庫與統計系統計畫書

**文件編號**：PLAN-EVO-P2-C
**版本**：1.0
**建立日期**：2026-02-01
**負責人**：Claude Code
**狀態**：已完成
**工單範圍**：0351-0360

---

## 一、目標

建立完整的資料持久化系統，包括：
1. 遊戲紀錄儲存
2. 玩家統計數據
3. 排行榜系統
4. 遊戲回放功能
5. 成就系統

---

## 二、資料庫設計

### 2.1 Schema 設計

```sql
-- ================================================
-- 演化論遊戲資料表
-- 使用 Supabase (PostgreSQL)
-- ================================================

-- 1. 遊戲紀錄主表
CREATE TABLE evolution_games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id VARCHAR(50) NOT NULL,

  -- 遊戲設定
  expansions TEXT[] DEFAULT ARRAY['base'],  -- 啟用的擴充包
  player_count INTEGER NOT NULL CHECK (player_count BETWEEN 2 AND 4),

  -- 時間
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,

  -- 遊戲結果
  rounds_played INTEGER DEFAULT 0,
  winner_id UUID REFERENCES players(id),
  end_reason VARCHAR(50), -- 'normal', 'forfeit', 'disconnect'

  -- 遊戲快照（JSON）
  final_state JSONB,      -- 結束時的完整狀態
  action_log JSONB,       -- 所有動作紀錄（用於回放）

  -- 元數據
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_evolution_games_winner ON evolution_games(winner_id);
CREATE INDEX idx_evolution_games_started ON evolution_games(started_at DESC);

-- 2. 遊戲參與者表
CREATE TABLE evolution_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES evolution_games(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id),

  -- 遊戲中的位置
  seat_index INTEGER NOT NULL CHECK (seat_index BETWEEN 0 AND 3),
  is_host BOOLEAN DEFAULT FALSE,

  -- 結果
  final_score INTEGER DEFAULT 0,
  rank INTEGER, -- 1 = 第一名
  is_winner BOOLEAN DEFAULT FALSE,

  -- 統計
  creatures_created INTEGER DEFAULT 0,
  creatures_survived INTEGER DEFAULT 0,
  traits_played INTEGER DEFAULT 0,
  attacks_made INTEGER DEFAULT 0,
  attacks_defended INTEGER DEFAULT 0,
  food_eaten INTEGER DEFAULT 0,

  -- 常用性狀（前 3 名）
  favorite_traits TEXT[],

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(game_id, player_id)
);

-- 索引
CREATE INDEX idx_evolution_participants_player ON evolution_participants(player_id);
CREATE INDEX idx_evolution_participants_game ON evolution_participants(game_id);

-- 3. 玩家演化論統計表
CREATE TABLE evolution_player_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID NOT NULL REFERENCES players(id) UNIQUE,

  -- 基本統計
  games_played INTEGER DEFAULT 0,
  games_won INTEGER DEFAULT 0,
  games_lost INTEGER DEFAULT 0,
  win_rate DECIMAL(5,2) DEFAULT 0,

  -- 分數統計
  total_score INTEGER DEFAULT 0,
  highest_score INTEGER DEFAULT 0,
  average_score DECIMAL(6,2) DEFAULT 0,

  -- 生物統計
  total_creatures_created INTEGER DEFAULT 0,
  total_creatures_survived INTEGER DEFAULT 0,
  survival_rate DECIMAL(5,2) DEFAULT 0,

  -- 性狀統計
  total_traits_played INTEGER DEFAULT 0,
  favorite_trait VARCHAR(50),
  trait_usage JSONB DEFAULT '{}', -- { "carnivore": 10, "camouflage": 8, ... }

  -- 戰鬥統計
  total_attacks INTEGER DEFAULT 0,
  successful_attacks INTEGER DEFAULT 0,
  attacks_defended INTEGER DEFAULT 0,
  attack_success_rate DECIMAL(5,2) DEFAULT 0,

  -- 連勝/連敗
  current_streak INTEGER DEFAULT 0, -- 正數=連勝，負數=連敗
  best_win_streak INTEGER DEFAULT 0,

  -- 時間統計
  total_play_time_seconds INTEGER DEFAULT 0,
  last_played_at TIMESTAMP WITH TIME ZONE,

  -- 擴充包統計
  expansion_stats JSONB DEFAULT '{}',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 排行榜視圖
CREATE OR REPLACE VIEW evolution_leaderboard AS
SELECT
  p.id AS player_id,
  p.display_name,
  p.avatar_url,
  s.games_played,
  s.games_won,
  s.win_rate,
  s.total_score,
  s.highest_score,
  s.average_score,
  s.best_win_streak,
  s.favorite_trait,
  RANK() OVER (ORDER BY s.total_score DESC) AS score_rank,
  RANK() OVER (ORDER BY s.games_won DESC) AS wins_rank,
  RANK() OVER (ORDER BY s.win_rate DESC) AS winrate_rank
FROM players p
JOIN evolution_player_stats s ON p.id = s.player_id
WHERE s.games_played >= 5  -- 至少 5 場才進入排行榜
ORDER BY s.total_score DESC;

-- 5. 成就定義表
CREATE TABLE evolution_achievements (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  icon VARCHAR(50),
  category VARCHAR(50), -- 'gameplay', 'traits', 'combat', 'social'

  -- 解鎖條件（JSON）
  condition JSONB NOT NULL,
  -- 例如: {"type": "wins", "count": 10}
  -- 或: {"type": "trait_usage", "trait": "carnivore", "count": 50}

  points INTEGER DEFAULT 10,
  is_hidden BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 玩家成就表
CREATE TABLE evolution_player_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID NOT NULL REFERENCES players(id),
  achievement_id VARCHAR(50) NOT NULL REFERENCES evolution_achievements(id),

  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  game_id UUID REFERENCES evolution_games(id), -- 解鎖時的遊戲

  UNIQUE(player_id, achievement_id)
);

-- 索引
CREATE INDEX idx_player_achievements ON evolution_player_achievements(player_id);

-- 7. 動作紀錄表（用於詳細回放）
CREATE TABLE evolution_game_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES evolution_games(id) ON DELETE CASCADE,

  -- 動作資訊
  action_index INTEGER NOT NULL,
  round INTEGER NOT NULL,
  phase VARCHAR(50) NOT NULL,
  player_id UUID REFERENCES players(id),

  -- 動作內容
  action_type VARCHAR(50) NOT NULL,
  action_data JSONB NOT NULL,

  -- 結果
  result_data JSONB,

  -- 時間
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(game_id, action_index)
);

-- 索引
CREATE INDEX idx_game_actions ON evolution_game_actions(game_id, action_index);
```

### 2.2 擴展性考量

```
為支援擴充包，設計考量：
─────────────────────────────────────

1. 性狀統計使用 JSONB
   - 不需要為每個性狀建立欄位
   - 新擴充包的性狀自動納入

2. 擴充包統計使用 JSONB
   - expansion_stats: { "base": {...}, "flight": {...} }
   - 按擴充包分別統計

3. 成就條件使用 JSONB
   - 靈活的條件定義
   - 支援複雜條件組合

4. 動作紀錄使用 JSONB
   - 不同類型動作有不同資料結構
   - 向後相容
```

---

## 三、API 設計

### 3.1 遊戲紀錄 API

```javascript
// backend/api/evolution/games.js

/**
 * 儲存遊戲結果
 * POST /api/evolution/games
 */
async function saveGameResult(gameState, participants) {
  const game = {
    room_id: gameState.roomId,
    expansions: gameState.enabledExpansions,
    player_count: participants.length,
    started_at: gameState.startedAt,
    ended_at: new Date(),
    duration_seconds: calculateDuration(gameState),
    rounds_played: gameState.round,
    winner_id: gameState.winnerId,
    end_reason: gameState.endReason,
    final_state: sanitizeState(gameState),
    action_log: gameState.actionLog,
  };

  // 開始交易
  const { data, error } = await supabase.rpc('save_evolution_game', {
    game_data: game,
    participants_data: participants.map(p => ({
      player_id: p.playerId,
      seat_index: p.seatIndex,
      is_host: p.isHost,
      final_score: p.score,
      rank: p.rank,
      is_winner: p.isWinner,
      creatures_created: p.stats.creaturesCreated,
      creatures_survived: p.stats.creaturesSurvived,
      traits_played: p.stats.traitsPlayed,
      attacks_made: p.stats.attacksMade,
      attacks_defended: p.stats.attacksDefended,
      food_eaten: p.stats.foodEaten,
      favorite_traits: p.stats.favoriteTraits,
    })),
  });

  return { success: !error, gameId: data?.id, error };
}

/**
 * 取得遊戲紀錄
 * GET /api/evolution/games/:id
 */
async function getGameById(gameId) {
  const { data, error } = await supabase
    .from('evolution_games')
    .select(`
      *,
      participants:evolution_participants(
        *,
        player:players(id, display_name, avatar_url)
      )
    `)
    .eq('id', gameId)
    .single();

  return { data, error };
}

/**
 * 取得玩家遊戲歷史
 * GET /api/evolution/games?player_id=xxx
 */
async function getPlayerGames(playerId, page = 1, limit = 10) {
  const offset = (page - 1) * limit;

  const { data, error, count } = await supabase
    .from('evolution_participants')
    .select(`
      *,
      game:evolution_games(*)
    `, { count: 'exact' })
    .eq('player_id', playerId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  return { data, error, total: count, page, limit };
}
```

### 3.2 統計 API

```javascript
// backend/api/evolution/stats.js

/**
 * 取得玩家統計
 * GET /api/evolution/stats/:playerId
 */
async function getPlayerStats(playerId) {
  const { data, error } = await supabase
    .from('evolution_player_stats')
    .select('*')
    .eq('player_id', playerId)
    .single();

  if (error?.code === 'PGRST116') {
    // 沒有記錄，返回預設值
    return { data: createDefaultStats(playerId), error: null };
  }

  return { data, error };
}

/**
 * 更新玩家統計
 * 遊戲結束時調用
 */
async function updatePlayerStats(playerId, gameResult) {
  const { data: current } = await getPlayerStats(playerId);

  const updates = {
    games_played: current.games_played + 1,
    games_won: current.games_won + (gameResult.isWinner ? 1 : 0),
    games_lost: current.games_lost + (gameResult.isWinner ? 0 : 1),
    total_score: current.total_score + gameResult.score,
    highest_score: Math.max(current.highest_score, gameResult.score),
    total_creatures_created: current.total_creatures_created + gameResult.creaturesCreated,
    total_creatures_survived: current.total_creatures_survived + gameResult.creaturesSurvived,
    total_traits_played: current.total_traits_played + gameResult.traitsPlayed,
    total_attacks: current.total_attacks + gameResult.attacksMade,
    successful_attacks: current.successful_attacks + gameResult.successfulAttacks,
    attacks_defended: current.attacks_defended + gameResult.attacksDefended,
    total_play_time_seconds: current.total_play_time_seconds + gameResult.duration,
    last_played_at: new Date(),
  };

  // 計算衍生欄位
  updates.win_rate = (updates.games_won / updates.games_played * 100).toFixed(2);
  updates.average_score = (updates.total_score / updates.games_played).toFixed(2);
  updates.survival_rate = (updates.total_creatures_survived / Math.max(updates.total_creatures_created, 1) * 100).toFixed(2);
  updates.attack_success_rate = (updates.successful_attacks / Math.max(updates.total_attacks, 1) * 100).toFixed(2);

  // 更新連勝/連敗
  if (gameResult.isWinner) {
    updates.current_streak = current.current_streak > 0 ? current.current_streak + 1 : 1;
    updates.best_win_streak = Math.max(updates.current_streak, current.best_win_streak);
  } else {
    updates.current_streak = current.current_streak < 0 ? current.current_streak - 1 : -1;
  }

  // 更新性狀使用統計
  updates.trait_usage = { ...current.trait_usage };
  for (const trait of gameResult.traitsUsed) {
    updates.trait_usage[trait] = (updates.trait_usage[trait] || 0) + 1;
  }
  updates.favorite_trait = getMostUsedTrait(updates.trait_usage);

  const { error } = await supabase
    .from('evolution_player_stats')
    .upsert({ player_id: playerId, ...updates });

  return { error };
}
```

### 3.3 排行榜 API

```javascript
// backend/api/evolution/leaderboard.js

/**
 * 取得排行榜
 * GET /api/evolution/leaderboard?type=score&limit=100
 */
async function getLeaderboard(type = 'score', limit = 100) {
  let orderColumn;
  switch (type) {
    case 'wins': orderColumn = 'games_won'; break;
    case 'winrate': orderColumn = 'win_rate'; break;
    case 'streak': orderColumn = 'best_win_streak'; break;
    default: orderColumn = 'total_score';
  }

  const { data, error } = await supabase
    .from('evolution_leaderboard')
    .select('*')
    .order(orderColumn, { ascending: false })
    .limit(limit);

  return { data, error };
}

/**
 * 取得玩家排名
 * GET /api/evolution/leaderboard/rank/:playerId
 */
async function getPlayerRank(playerId) {
  const { data, error } = await supabase
    .from('evolution_leaderboard')
    .select('*')
    .eq('player_id', playerId)
    .single();

  return { data, error };
}
```

---

## 四、成就系統

### 4.1 成就定義

```javascript
// shared/constants/evolutionAchievements.js

const ACHIEVEMENTS = {
  // 遊戲相關
  FIRST_VICTORY: {
    id: 'first_victory',
    name: '初露鋒芒',
    description: '贏得第一場演化論遊戲',
    icon: 'trophy',
    category: 'gameplay',
    condition: { type: 'wins', count: 1 },
    points: 10,
  },
  VETERAN: {
    id: 'veteran',
    name: '老練玩家',
    description: '完成 100 場遊戲',
    icon: 'star',
    category: 'gameplay',
    condition: { type: 'games_played', count: 100 },
    points: 50,
  },
  WINNING_STREAK: {
    id: 'winning_streak',
    name: '連勝王',
    description: '達成 5 連勝',
    icon: 'fire',
    category: 'gameplay',
    condition: { type: 'win_streak', count: 5 },
    points: 30,
  },

  // 性狀相關
  CARNIVORE_MASTER: {
    id: 'carnivore_master',
    name: '肉食專家',
    description: '使用肉食性狀 50 次',
    icon: 'meat',
    category: 'traits',
    condition: { type: 'trait_usage', trait: 'carnivore', count: 50 },
    points: 20,
  },
  TRAIT_COLLECTOR: {
    id: 'trait_collector',
    name: '性狀收集家',
    description: '使用過所有 19 種基礎版性狀',
    icon: 'collection',
    category: 'traits',
    condition: { type: 'trait_variety', count: 19 },
    points: 40,
  },

  // 戰鬥相關
  APEX_PREDATOR: {
    id: 'apex_predator',
    name: '頂級掠食者',
    description: '單場遊戲中成功攻擊 10 次',
    icon: 'attack',
    category: 'combat',
    condition: { type: 'attacks_in_game', count: 10 },
    points: 30,
  },
  SURVIVOR: {
    id: 'survivor',
    name: '生存大師',
    description: '一場遊戲中所有生物存活到最後',
    icon: 'shield',
    category: 'combat',
    condition: { type: 'all_creatures_survived' },
    points: 25,
  },

  // 特殊成就
  CHAIN_REACTION: {
    id: 'chain_reaction',
    name: '連鎖反應',
    description: '一次觸發 5 連鎖的互動性狀效果',
    icon: 'chain',
    category: 'special',
    condition: { type: 'chain_length', count: 5 },
    points: 35,
  },
};
```

### 4.2 成就檢查器

```javascript
// backend/services/achievementChecker.js

class AchievementChecker {
  constructor(supabase) {
    this.supabase = supabase;
  }

  /**
   * 檢查並解鎖成就
   */
  async checkAndUnlock(playerId, context) {
    const { stats, gameResult, events } = context;

    // 取得玩家已解鎖的成就
    const { data: unlocked } = await this.supabase
      .from('evolution_player_achievements')
      .select('achievement_id')
      .eq('player_id', playerId);

    const unlockedIds = new Set(unlocked?.map(a => a.achievement_id) || []);
    const newUnlocks = [];

    // 檢查每個成就
    for (const [id, achievement] of Object.entries(ACHIEVEMENTS)) {
      if (unlockedIds.has(id)) continue;

      if (this.checkCondition(achievement.condition, stats, gameResult, events)) {
        newUnlocks.push({
          player_id: playerId,
          achievement_id: id,
          game_id: gameResult?.gameId,
        });
      }
    }

    // 批量解鎖
    if (newUnlocks.length > 0) {
      await this.supabase
        .from('evolution_player_achievements')
        .insert(newUnlocks);
    }

    return newUnlocks.map(u => ACHIEVEMENTS[u.achievement_id]);
  }

  checkCondition(condition, stats, gameResult, events) {
    switch (condition.type) {
      case 'wins':
        return stats.games_won >= condition.count;

      case 'games_played':
        return stats.games_played >= condition.count;

      case 'win_streak':
        return stats.best_win_streak >= condition.count;

      case 'trait_usage':
        return (stats.trait_usage?.[condition.trait] || 0) >= condition.count;

      case 'trait_variety':
        return Object.keys(stats.trait_usage || {}).length >= condition.count;

      case 'attacks_in_game':
        return gameResult?.attacksMade >= condition.count;

      case 'all_creatures_survived':
        return gameResult?.creaturesSurvived === gameResult?.creaturesCreated
          && gameResult?.creaturesCreated > 0;

      case 'chain_length':
        return events?.some(e => e.type === 'chain' && e.length >= condition.count);

      default:
        return false;
    }
  }
}
```

---

## 五、遊戲回放系統

### 5.1 動作記錄格式

```javascript
// 動作紀錄結構
const actionRecord = {
  index: 1,
  round: 1,
  phase: 'evolution',
  playerId: 'player_1',
  timestamp: '2026-02-01T10:00:00Z',

  type: 'PLAY_CARD_AS_CREATURE',
  data: {
    cardId: 'card_1',
  },

  result: {
    success: true,
    creatureId: 'creature_1',
  },

  // 狀態快照（可選，用於快速跳轉）
  snapshot: null, // 每 10 個動作存一次
};
```

### 5.2 回放 API

```javascript
// backend/api/evolution/replay.js

/**
 * 取得遊戲回放資料
 * GET /api/evolution/games/:id/replay
 */
async function getGameReplay(gameId) {
  const { data: game } = await supabase
    .from('evolution_games')
    .select('action_log, final_state')
    .eq('id', gameId)
    .single();

  if (!game) {
    return { error: 'Game not found' };
  }

  return {
    data: {
      actions: game.action_log,
      finalState: game.final_state,
    },
  };
}
```

### 5.3 前端回放組件

```jsx
// frontend/src/components/games/evolution/Replay/ReplayViewer.js

const ReplayViewer = ({ gameId }) => {
  const [actions, setActions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [gameState, setGameState] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // 載入回放資料
  useEffect(() => {
    fetchReplay(gameId).then(data => {
      setActions(data.actions);
      setGameState(initializeFromActions([]));
    });
  }, [gameId]);

  // 自動播放
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      if (currentIndex < actions.length - 1) {
        setCurrentIndex(i => i + 1);
      } else {
        setIsPlaying(false);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying, currentIndex, actions.length]);

  // 當索引變更時更新狀態
  useEffect(() => {
    const newState = applyActions(actions.slice(0, currentIndex + 1));
    setGameState(newState);
  }, [currentIndex, actions]);

  return (
    <div className="replay-viewer">
      {/* 遊戲畫面 */}
      <GameBoard gameState={gameState} readOnly />

      {/* 控制列 */}
      <div className="replay-controls">
        <button onClick={() => setCurrentIndex(0)}>
          ⏮️ 開始
        </button>
        <button onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}>
          ⏪ 上一步
        </button>
        <button onClick={() => setIsPlaying(!isPlaying)}>
          {isPlaying ? '⏸️ 暫停' : '▶️ 播放'}
        </button>
        <button onClick={() => setCurrentIndex(i => Math.min(actions.length - 1, i + 1))}>
          ⏩ 下一步
        </button>
        <button onClick={() => setCurrentIndex(actions.length - 1)}>
          ⏭️ 結束
        </button>

        {/* 進度條 */}
        <input
          type="range"
          min={0}
          max={actions.length - 1}
          value={currentIndex}
          onChange={e => setCurrentIndex(Number(e.target.value))}
        />
        <span>{currentIndex + 1} / {actions.length}</span>
      </div>

      {/* 動作列表 */}
      <div className="action-list">
        {actions.map((action, i) => (
          <ActionItem
            key={i}
            action={action}
            isActive={i === currentIndex}
            onClick={() => setCurrentIndex(i)}
          />
        ))}
      </div>
    </div>
  );
};
```

---

## 六、工單詳細內容

### 工單 0351：設計資料庫 Schema

**目標**：建立 Supabase 資料表結構

**交付物**：
- SQL 遷移腳本
- 資料表文檔

**驗收標準**：
- [ ] 所有表格建立成功
- [ ] 索引正確建立
- [ ] 外鍵約束正確

---

### 工單 0352-0360

（詳見工單總覽）

---

## 七、資料遷移計畫

### 7.1 遷移步驟

1. 建立新資料表（不影響現有系統）
2. 部署遊戲紀錄儲存功能
3. 運行一段時間收集資料
4. 啟用排行榜和統計頁面
5. 啟用成就系統

### 7.2 回滾計畫

- 所有新功能使用 Feature Flag 控制
- 資料表操作有對應的回滾腳本
- 統計計算為非同步，不影響遊戲體驗

---

## 八、效能考量

| 考量 | 解決方案 |
|------|----------|
| 動作紀錄可能很大 | 使用 JSONB 壓縮，定期歸檔 |
| 排行榜查詢效能 | 使用物化視圖，定期更新 |
| 統計更新頻繁 | 使用批次更新，非同步處理 |
| 回放資料載入 | 分頁載入，使用快照 |

---

**文件結束**

*建立者：Claude Code*
*建立日期：2026-02-01*
