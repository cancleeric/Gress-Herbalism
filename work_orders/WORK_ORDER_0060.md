# 工作單 0060

**日期：** 2026-01-24

**工作單標題：** 分數保存與排行榜

**工單主旨：** 帳號系統 - 永久保存玩家分數並提供排行榜功能

**內容：**

## 目標

將玩家的遊戲分數和統計數據永久保存到資料庫，並提供排行榜功能。

## 依賴

- 工單 0055（Supabase 資料庫設置）完成
- 工單 0059（Firebase Auth 整合）完成

## 功能需求

### 1. 玩家統計
- 總遊戲場數
- 總勝利場數
- 勝率
- 總得分
- 最高單場分數

### 2. 遊戲記錄
- 每場遊戲自動保存
- 記錄參與玩家和分數
- 記錄勝利者

### 3. 排行榜
- 依勝利場數排序
- 依勝率排序
- 依總得分排序

### 4. 個人資料頁面
- 顯示玩家統計
- 顯示最近遊戲記錄

## 技術實作

### 階段 1：資料表設計

```sql
-- 在 Supabase 執行以下 SQL

-- 玩家資料表
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_uid VARCHAR(128) UNIQUE NOT NULL,
  email VARCHAR(255),
  display_name VARCHAR(50) NOT NULL,
  avatar_url TEXT,

  -- 統計數據
  total_games INTEGER DEFAULT 0,
  total_wins INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  highest_score INTEGER DEFAULT 0,

  -- 計算欄位（用觸發器更新）
  win_rate DECIMAL(5,2) DEFAULT 0,

  -- 時間戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_played_at TIMESTAMP WITH TIME ZONE,

  -- 索引
  CONSTRAINT valid_win_rate CHECK (win_rate >= 0 AND win_rate <= 100)
);

-- 遊戲記錄表
CREATE TABLE game_records (
  id SERIAL PRIMARY KEY,
  game_id VARCHAR(100) NOT NULL,

  -- 遊戲資訊
  player_count INTEGER NOT NULL,
  rounds_played INTEGER DEFAULT 1,
  duration_seconds INTEGER,
  winner_id UUID REFERENCES players(id),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 遊戲參與者表
CREATE TABLE game_participants (
  id SERIAL PRIMARY KEY,
  game_record_id INTEGER REFERENCES game_records(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id),

  -- 該場遊戲數據
  final_score INTEGER DEFAULT 0,
  is_winner BOOLEAN DEFAULT FALSE,
  correct_guesses INTEGER DEFAULT 0,
  wrong_guesses INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 建立索引
CREATE INDEX idx_players_firebase_uid ON players(firebase_uid);
CREATE INDEX idx_players_total_wins ON players(total_wins DESC);
CREATE INDEX idx_players_win_rate ON players(win_rate DESC);
CREATE INDEX idx_players_total_score ON players(total_score DESC);
CREATE INDEX idx_game_records_created ON game_records(created_at DESC);
CREATE INDEX idx_game_participants_player ON game_participants(player_id);

-- 更新時間戳觸發器
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER players_updated_at
  BEFORE UPDATE ON players
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 更新勝率觸發器
CREATE OR REPLACE FUNCTION update_win_rate()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.total_games > 0 THEN
    NEW.win_rate = ROUND((NEW.total_wins::DECIMAL / NEW.total_games) * 100, 2);
  ELSE
    NEW.win_rate = 0;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER players_win_rate
  BEFORE INSERT OR UPDATE OF total_games, total_wins ON players
  FOR EACH ROW
  EXECUTE FUNCTION update_win_rate();
```

### 階段 2：後端 API

#### 2.1 玩家服務

```javascript
// backend/services/playerService.js

const supabase = require('../db/supabase');

/**
 * 取得或建立玩家資料
 * @param {string} firebaseUid - Firebase 使用者 ID
 * @param {object} userData - 使用者資料
 */
async function getOrCreatePlayer(firebaseUid, userData) {
  // 先嘗試取得現有玩家
  let { data: player, error } = await supabase
    .from('players')
    .select('*')
    .eq('firebase_uid', firebaseUid)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  // 如果不存在，建立新玩家
  if (!player) {
    const { data: newPlayer, error: createError } = await supabase
      .from('players')
      .insert({
        firebase_uid: firebaseUid,
        email: userData.email,
        display_name: userData.displayName || '玩家',
        avatar_url: userData.photoURL,
      })
      .select()
      .single();

    if (createError) throw createError;
    player = newPlayer;
  }

  return player;
}

/**
 * 更新玩家資料
 * @param {string} firebaseUid - Firebase 使用者 ID
 * @param {object} updates - 更新內容
 */
async function updatePlayer(firebaseUid, updates) {
  const { data, error } = await supabase
    .from('players')
    .update(updates)
    .eq('firebase_uid', firebaseUid)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * 取得玩家統計
 * @param {string} firebaseUid - Firebase 使用者 ID
 */
async function getPlayerStats(firebaseUid) {
  const { data, error } = await supabase
    .from('players')
    .select('total_games, total_wins, total_score, highest_score, win_rate')
    .eq('firebase_uid', firebaseUid)
    .single();

  if (error) throw error;
  return data;
}

/**
 * 取得玩家遊戲歷史
 * @param {string} playerId - 玩家 ID
 * @param {number} limit - 筆數限制
 */
async function getPlayerHistory(playerId, limit = 20) {
  const { data, error } = await supabase
    .from('game_participants')
    .select(`
      final_score,
      is_winner,
      created_at,
      game_records (
        game_id,
        player_count,
        rounds_played
      )
    `)
    .eq('player_id', playerId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

module.exports = {
  getOrCreatePlayer,
  updatePlayer,
  getPlayerStats,
  getPlayerHistory,
};
```

#### 2.2 遊戲記錄服務

```javascript
// backend/services/gameRecordService.js

const supabase = require('../db/supabase');

/**
 * 儲存遊戲結果
 * @param {object} gameData - 遊戲資料
 */
async function saveGameResult(gameData) {
  const {
    gameId,
    playerCount,
    roundsPlayed,
    durationSeconds,
    winnerId,
    participants,
  } = gameData;

  // 開始交易
  // 1. 建立遊戲記錄
  const { data: gameRecord, error: gameError } = await supabase
    .from('game_records')
    .insert({
      game_id: gameId,
      player_count: playerCount,
      rounds_played: roundsPlayed,
      duration_seconds: durationSeconds,
      winner_id: winnerId,
    })
    .select()
    .single();

  if (gameError) throw gameError;

  // 2. 建立參與者記錄
  const participantRecords = participants.map(p => ({
    game_record_id: gameRecord.id,
    player_id: p.playerId,
    final_score: p.finalScore,
    is_winner: p.isWinner,
    correct_guesses: p.correctGuesses || 0,
    wrong_guesses: p.wrongGuesses || 0,
  }));

  const { error: participantError } = await supabase
    .from('game_participants')
    .insert(participantRecords);

  if (participantError) throw participantError;

  // 3. 更新玩家統計
  for (const p of participants) {
    if (!p.playerId) continue; // 跳過匿名玩家

    const { data: player } = await supabase
      .from('players')
      .select('total_games, total_wins, total_score, highest_score')
      .eq('id', p.playerId)
      .single();

    if (player) {
      await supabase
        .from('players')
        .update({
          total_games: player.total_games + 1,
          total_wins: player.total_wins + (p.isWinner ? 1 : 0),
          total_score: player.total_score + p.finalScore,
          highest_score: Math.max(player.highest_score, p.finalScore),
          last_played_at: new Date().toISOString(),
        })
        .eq('id', p.playerId);
    }
  }

  return gameRecord;
}

module.exports = {
  saveGameResult,
};
```

#### 2.3 排行榜服務

```javascript
// backend/services/leaderboardService.js

const supabase = require('../db/supabase');

/**
 * 取得排行榜
 * @param {string} sortBy - 排序欄位：'wins' | 'winRate' | 'score'
 * @param {number} limit - 筆數限制
 */
async function getLeaderboard(sortBy = 'wins', limit = 10) {
  let orderColumn;

  switch (sortBy) {
    case 'wins':
      orderColumn = 'total_wins';
      break;
    case 'winRate':
      orderColumn = 'win_rate';
      break;
    case 'score':
      orderColumn = 'total_score';
      break;
    default:
      orderColumn = 'total_wins';
  }

  const { data, error } = await supabase
    .from('players')
    .select('id, display_name, avatar_url, total_games, total_wins, total_score, win_rate')
    .gt('total_games', 0)  // 至少玩過一場
    .order(orderColumn, { ascending: false })
    .limit(limit);

  if (error) throw error;

  // 加上排名
  return data.map((player, index) => ({
    rank: index + 1,
    ...player,
  }));
}

module.exports = {
  getLeaderboard,
};
```

#### 2.4 API 路由

```javascript
// backend/routes/api.js

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const playerService = require('../services/playerService');
const gameRecordService = require('../services/gameRecordService');
const leaderboardService = require('../services/leaderboardService');

// 取得或建立玩家資料
router.post('/players/sync', verifyToken, async (req, res) => {
  try {
    const player = await playerService.getOrCreatePlayer(
      req.user.uid,
      {
        email: req.user.email,
        displayName: req.user.name || req.body.displayName,
        photoURL: req.user.picture,
      }
    );
    res.json(player);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 取得玩家統計
router.get('/players/me/stats', verifyToken, async (req, res) => {
  try {
    const stats = await playerService.getPlayerStats(req.user.uid);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 取得玩家遊戲歷史
router.get('/players/me/history', verifyToken, async (req, res) => {
  try {
    // 先取得玩家 ID
    const player = await playerService.getOrCreatePlayer(req.user.uid, {});
    const history = await playerService.getPlayerHistory(player.id);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 儲存遊戲結果
router.post('/games', verifyToken, async (req, res) => {
  try {
    const gameRecord = await gameRecordService.saveGameResult(req.body);
    res.json(gameRecord);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 取得排行榜
router.get('/leaderboard', async (req, res) => {
  try {
    const { sortBy = 'wins', limit = 10 } = req.query;
    const leaderboard = await leaderboardService.getLeaderboard(sortBy, Number(limit));
    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

### 階段 3：前端整合

#### 3.1 API 服務

```javascript
// frontend/src/services/apiService.js

import { getIdToken } from './authService';

const API_URL = process.env.REACT_APP_API_URL;

async function fetchWithAuth(url, options = {}) {
  const token = await getIdToken();

  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || '請求失敗');
  }

  return response.json();
}

// 同步玩家資料
export async function syncPlayer(displayName) {
  return fetchWithAuth('/api/players/sync', {
    method: 'POST',
    body: JSON.stringify({ displayName }),
  });
}

// 取得玩家統計
export async function getMyStats() {
  return fetchWithAuth('/api/players/me/stats');
}

// 取得玩家歷史
export async function getMyHistory() {
  return fetchWithAuth('/api/players/me/history');
}

// 儲存遊戲結果
export async function saveGameResult(gameData) {
  return fetchWithAuth('/api/games', {
    method: 'POST',
    body: JSON.stringify(gameData),
  });
}

// 取得排行榜（不需要登入）
export async function getLeaderboard(sortBy = 'wins', limit = 10) {
  const response = await fetch(`${API_URL}/api/leaderboard?sortBy=${sortBy}&limit=${limit}`);
  return response.json();
}
```

#### 3.2 個人資料頁面

```jsx
// frontend/src/components/Profile/ProfilePage.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getMyStats, getMyHistory } from '../../services/apiService';
import './ProfilePage.css';

function ProfilePage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsData, historyData] = await Promise.all([
        getMyStats(),
        getMyHistory(),
      ]);
      setStats(statsData);
      setHistory(historyData);
    } catch (error) {
      console.error('載入資料失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">載入中...</div>;
  }

  return (
    <div className="profile-page">
      {/* 玩家資訊 */}
      <div className="profile-header">
        <img
          src={user.photoURL || '/images/default-avatar.png'}
          alt="頭像"
          className="avatar"
        />
        <h2>{user.displayName || '玩家'}</h2>
      </div>

      {/* 統計數據 */}
      <div className="stats-section">
        <h3>遊戲統計</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-value">{stats?.total_games || 0}</span>
            <span className="stat-label">總場數</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats?.total_wins || 0}</span>
            <span className="stat-label">勝利</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats?.win_rate || 0}%</span>
            <span className="stat-label">勝率</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats?.total_score || 0}</span>
            <span className="stat-label">總得分</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats?.highest_score || 0}</span>
            <span className="stat-label">最高分</span>
          </div>
        </div>
      </div>

      {/* 遊戲歷史 */}
      <div className="history-section">
        <h3>最近遊戲</h3>
        {history.length === 0 ? (
          <p className="no-history">還沒有遊戲記錄</p>
        ) : (
          <ul className="history-list">
            {history.map((record, index) => (
              <li key={index} className={`history-item ${record.is_winner ? 'win' : 'lose'}`}>
                <span className="result-icon">
                  {record.is_winner ? '🏆' : '💔'}
                </span>
                <div className="history-info">
                  <span className="score">得分：{record.final_score}</span>
                  <span className="details">
                    {record.game_records?.player_count} 人遊戲 •
                    {record.game_records?.rounds_played} 局
                  </span>
                </div>
                <span className="date">
                  {new Date(record.created_at).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default ProfilePage;
```

#### 3.3 排行榜頁面

```jsx
// frontend/src/components/Leaderboard/LeaderboardPage.jsx

import React, { useState, useEffect } from 'react';
import { getLeaderboard } from '../../services/apiService';
import './LeaderboardPage.css';

function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [sortBy, setSortBy] = useState('wins');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, [sortBy]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const data = await getLeaderboard(sortBy, 20);
      setLeaderboard(data);
    } catch (error) {
      console.error('載入排行榜失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return rank;
    }
  };

  return (
    <div className="leaderboard-page">
      <h2>🏆 排行榜</h2>

      {/* 排序選擇 */}
      <div className="sort-tabs">
        <button
          className={sortBy === 'wins' ? 'active' : ''}
          onClick={() => setSortBy('wins')}
        >
          勝場數
        </button>
        <button
          className={sortBy === 'winRate' ? 'active' : ''}
          onClick={() => setSortBy('winRate')}
        >
          勝率
        </button>
        <button
          className={sortBy === 'score' ? 'active' : ''}
          onClick={() => setSortBy('score')}
        >
          總得分
        </button>
      </div>

      {/* 排行榜列表 */}
      {loading ? (
        <div className="loading">載入中...</div>
      ) : leaderboard.length === 0 ? (
        <p className="no-data">暫無排行資料</p>
      ) : (
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th>排名</th>
              <th>玩家</th>
              <th>場數</th>
              <th>勝場</th>
              <th>勝率</th>
              <th>總分</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((player) => (
              <tr key={player.id} className={player.rank <= 3 ? 'top-rank' : ''}>
                <td className="rank">{getRankIcon(player.rank)}</td>
                <td className="player">
                  <img
                    src={player.avatar_url || '/images/default-avatar.png'}
                    alt=""
                    className="mini-avatar"
                  />
                  {player.display_name}
                </td>
                <td>{player.total_games}</td>
                <td>{player.total_wins}</td>
                <td>{player.win_rate}%</td>
                <td>{player.total_score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default LeaderboardPage;
```

### 階段 4：遊戲結束時保存

```javascript
// 在遊戲結束時呼叫（後端 server.js 或前端）

// 前端方式：遊戲結束時呼叫 API
async function handleGameEnd(gameState) {
  if (gameState.gamePhase !== 'finished') return;

  const gameData = {
    gameId: gameState.gameId,
    playerCount: gameState.players.length,
    roundsPlayed: gameState.currentRound || 1,
    durationSeconds: Math.floor((Date.now() - gameState.startTime) / 1000),
    winnerId: getPlayerDbId(gameState.winner),
    participants: gameState.players.map(p => ({
      playerId: p.dbId || null,  // 匿名玩家為 null
      finalScore: p.score || 0,
      isWinner: p.id === gameState.winner,
    })),
  };

  try {
    await saveGameResult(gameData);
    console.log('遊戲記錄已保存');
  } catch (error) {
    console.error('保存遊戲記錄失敗:', error);
  }
}
```

## 受影響檔案

### 新增檔案
- `backend/services/playerService.js`
- `backend/services/gameRecordService.js`
- `backend/services/leaderboardService.js`
- `backend/routes/api.js`
- `frontend/src/services/apiService.js`
- `frontend/src/components/Profile/ProfilePage.jsx`
- `frontend/src/components/Profile/ProfilePage.css`
- `frontend/src/components/Leaderboard/LeaderboardPage.jsx`
- `frontend/src/components/Leaderboard/LeaderboardPage.css`

### 修改檔案
- `backend/server.js` - 加入 API 路由
- 遊戲結束邏輯 - 呼叫保存 API

## 測試案例

### 案例 1：新玩家首次遊戲
1. 新玩家登入
2. 參與一場遊戲並獲勝
3. 檢查統計：1 場、1 勝、100% 勝率

### 案例 2：多場遊戲統計
1. 玩家參與 5 場遊戲
2. 贏 3 場、輸 2 場
3. 檢查統計：5 場、3 勝、60% 勝率

### 案例 3：排行榜顯示
1. 多個玩家有不同統計
2. 開啟排行榜
3. 依勝場數排序正確
4. 切換排序方式正確

### 案例 4：遊戲歷史
1. 玩家參與多場遊戲
2. 開啟個人資料頁面
3. 顯示最近遊戲記錄

## 驗收標準

- [ ] 資料表建立完成
- [ ] 玩家統計 API 正常
- [ ] 遊戲記錄保存 API 正常
- [ ] 排行榜 API 正常
- [ ] 個人資料頁面顯示正確
- [ ] 排行榜頁面顯示正確
- [ ] 遊戲結束自動保存記錄
- [ ] 統計數據計算正確
