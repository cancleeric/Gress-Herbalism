# 工作單 0265

## 編號
0265

## 日期
2026-01-31

## 工作單標題
實作遊戲紀錄儲存

## 工單主旨
實作演化論遊戲結束時的資料儲存邏輯

## 內容

### 任務描述

當演化論遊戲結束時，將遊戲紀錄和玩家成績儲存到資料庫。

### 後端實作

#### 1. 遊戲紀錄服務

```javascript
// backend/services/evolutionRecordService.js
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

class EvolutionRecordService {
  /**
   * 儲存遊戲紀錄
   * @param {Object} gameData - 完整遊戲資料
   */
  async saveGameRecord(gameData) {
    const { roomId, players, rounds, winner, startedAt, endedAt } = gameData;

    // 1. 儲存遊戲紀錄
    const { data: game, error: gameError } = await supabase
      .from('evolution_games')
      .insert({
        room_id: roomId,
        started_at: startedAt,
        ended_at: endedAt,
        rounds_played: rounds,
        winner_id: winner?.id,
        game_data: gameData
      })
      .select()
      .single();

    if (gameError) throw gameError;

    // 2. 儲存參與者紀錄
    const participants = players.map((player, index) => ({
      game_id: game.id,
      player_id: player.id,
      final_score: player.score,
      creatures_survived: player.creatures?.length || 0,
      traits_count: player.creatures?.reduce((sum, c) => sum + c.traits.length, 0) || 0,
      is_winner: player.id === winner?.id,
      placement: index + 1
    }));

    const { error: participantError } = await supabase
      .from('evolution_participants')
      .insert(participants);

    if (participantError) throw participantError;

    return game.id;
  }

  /**
   * 取得玩家遊戲歷史
   * @param {string} playerId
   * @param {number} limit
   */
  async getPlayerHistory(playerId, limit = 10) {
    const { data, error } = await supabase
      .from('evolution_participants')
      .select(`
        *,
        game:evolution_games(*)
      `)
      .eq('player_id', playerId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  /**
   * 取得玩家統計
   * @param {string} playerId
   */
  async getPlayerStats(playerId) {
    const { data, error } = await supabase
      .from('evolution_player_stats')
      .select('*')
      .eq('player_id', playerId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || this.getDefaultStats();
  }

  getDefaultStats() {
    return {
      games_played: 0,
      games_won: 0,
      total_score: 0,
      total_creatures: 0,
      total_traits: 0,
      highest_score: 0,
      win_streak: 0
    };
  }
}

module.exports = new EvolutionRecordService();
```

#### 2. 遊戲結束時呼叫

```javascript
// 在 evolutionRoomManager.js 中
const evolutionRecordService = require('./evolutionRecordService');

async function handleGameEnd(room) {
  // 計算分數
  const scores = calculateFinalScores(room.gameState);

  // 排序取得名次
  scores.sort((a, b) => b.score - a.score);
  const winner = scores[0];

  // 儲存紀錄
  try {
    await evolutionRecordService.saveGameRecord({
      roomId: room.id,
      players: scores,
      rounds: room.gameState.round,
      winner,
      startedAt: room.startedAt,
      endedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to save game record:', error);
  }

  return { scores, winner };
}
```

### API 端點

```javascript
// backend/routes/evolution.js
const express = require('express');
const router = express.Router();
const evolutionRecordService = require('../services/evolutionRecordService');

// 取得玩家歷史
router.get('/history/:playerId', async (req, res) => {
  try {
    const history = await evolutionRecordService.getPlayerHistory(req.params.playerId);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 取得玩家統計
router.get('/stats/:playerId', async (req, res) => {
  try {
    const stats = await evolutionRecordService.getPlayerStats(req.params.playerId);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

### 前置條件
- 工單 0264 已完成（資料表建立）
- 工單 0232 已完成（遊戲邏輯）

### 驗收標準
- [ ] 遊戲結束時正確儲存紀錄
- [ ] 參與者資料正確儲存
- [ ] 玩家統計自動更新
- [ ] API 端點正常運作
- [ ] 錯誤處理完善

### 相關檔案
- `backend/services/evolutionRecordService.js` — 新建
- `backend/routes/evolution.js` — 新建
- `backend/server.js` — 修改（註冊路由）
- `backend/services/evolutionRoomManager.js` — 修改

### 參考計畫書
`docs/演化論/PLAN_EVOLUTION_DEVELOPMENT.md` 第三章 3.5 節
