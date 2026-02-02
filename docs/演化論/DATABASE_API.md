# 演化論資料庫 API 文件

**文件編號**：DOC-EVO-DB-API
**版本**：1.0
**建立日期**：2026-02-02
**負責人**：Claude Code

---

## 一、概述

本文件描述演化論遊戲的資料庫 API，包括遊戲紀錄、玩家統計、排行榜、成就系統等功能。

### 1.1 技術棧
- **資料庫**：Supabase (PostgreSQL)
- **後端**：Node.js / Express
- **快取**：記憶體快取（5分鐘 TTL）

### 1.2 基礎路徑
```
/api/evolution/
```

---

## 二、排行榜 API

### 2.1 取得總排行榜

```
GET /api/evolution/leaderboard
```

**Query 參數**：
| 參數 | 類型 | 預設值 | 說明 |
|------|------|--------|------|
| limit | number | 100 | 返回筆數 |

**回應**：
```json
{
  "success": true,
  "data": [
    {
      "user_id": "uuid",
      "display_name": "玩家名稱",
      "games_played": 50,
      "games_won": 25,
      "win_rate": 50.0,
      "total_score": 2500,
      "rank": 1
    }
  ]
}
```

### 2.2 取得每日排行榜

```
GET /api/evolution/leaderboard/daily
```

**回應**：同總排行榜格式，但只包含當日資料。

### 2.3 取得每週排行榜

```
GET /api/evolution/leaderboard/weekly
```

**回應**：同總排行榜格式，但只包含本週資料。

---

## 三、玩家統計 API

### 3.1 取得玩家統計

```
GET /api/evolution/stats/:userId
```

**路徑參數**：
| 參數 | 類型 | 說明 |
|------|------|------|
| userId | string | 玩家 UUID |

**回應**：
```json
{
  "success": true,
  "data": {
    "player_id": "uuid",
    "games_played": 100,
    "games_won": 60,
    "win_rate": 60.0,
    "highest_score": 150,
    "total_score": 5000,
    "total_kills": 200,
    "total_creatures_created": 300,
    "total_creatures_survived": 250,
    "survival_rate": 83.3,
    "total_traits_played": 500,
    "favorite_trait": "carnivore",
    "trait_usage": {
      "carnivore": 50,
      "camouflage": 45,
      "fat_tissue": 40
    },
    "current_streak": 3,
    "best_win_streak": 7,
    "last_played_at": "2026-02-02T10:00:00Z"
  }
}
```

### 3.2 取得玩家遊戲歷史

```
GET /api/evolution/stats/:userId/history
```

**Query 參數**：
| 參數 | 類型 | 預設值 | 說明 |
|------|------|--------|------|
| limit | number | 20 | 返回筆數 |

**回應**：
```json
{
  "success": true,
  "data": [
    {
      "id": "game-uuid",
      "isWinner": true,
      "rank": 1,
      "score": 45,
      "creatures": 5,
      "traits": 8,
      "playedAt": "2026-02-01T15:00:00Z"
    }
  ]
}
```

### 3.3 取得玩家成就

```
GET /api/evolution/stats/:userId/achievements
```

**回應**：
```json
{
  "success": true,
  "data": [
    {
      "id": "first_victory",
      "name": "初露鋒芒",
      "description": "贏得第一場演化論遊戲",
      "icon": "🏆",
      "category": "gameplay",
      "points": 10,
      "unlocked": true,
      "unlockedAt": "2026-01-15T10:00:00Z"
    }
  ]
}
```

---

## 四、遊戲紀錄服務

### 4.1 記錄遊戲開始

**內部 API**（由 SocketService 調用）

```javascript
gameRecordService.recordGameStart(roomId, gameState, players);
```

**參數**：
| 參數 | 類型 | 說明 |
|------|------|------|
| roomId | string | 房間 ID |
| gameState | object | 遊戲初始狀態 |
| players | array | 玩家資訊陣列 |

### 4.2 記錄遊戲結束

```javascript
gameRecordService.recordGameEnd(roomId, finalState, playerResults);
```

**參數**：
| 參數 | 類型 | 說明 |
|------|------|------|
| roomId | string | 房間 ID |
| finalState | object | 遊戲最終狀態 |
| playerResults | array | 玩家結果陣列 |

**playerResults 格式**：
```javascript
{
  oderId: "uuid",
  finalScore: 45,
  rank: 1,
  isWinner: true,
  creaturesCreated: 6,
  creaturesSurvived: 5,
  traitsPlayed: 10,
  attacksMade: 3,
  attacksDefended: 2,
  foodEaten: 15
}
```

---

## 五、成就服務

### 5.1 檢查並解鎖成就

```javascript
achievementService.checkAndUnlockAchievements(userId, context);
```

**context 參數**：
```javascript
{
  stats: { /* 玩家統計 */ },
  gameResult: { /* 本場遊戲結果 */ },
  events: [ /* 遊戲中的特殊事件 */ ]
}
```

**回傳**：
```javascript
{
  newAchievements: [
    { id: "first_victory", name: "初露鋒芒", points: 10 }
  ]
}
```

### 5.2 成就條件類型

| 類型 | 說明 | 範例 |
|------|------|------|
| wins | 勝場數 | `{ type: "wins", count: 10 }` |
| games_played | 遊戲場數 | `{ type: "games_played", count: 100 }` |
| win_streak | 連勝次數 | `{ type: "win_streak", count: 5 }` |
| total_score | 累積分數 | `{ type: "total_score", count: 1000 }` |
| highest_score | 單場最高分 | `{ type: "highest_score", count: 100 }` |
| total_kills | 累積擊殺 | `{ type: "total_kills", count: 50 }` |
| win_rate | 勝率（>=） | `{ type: "win_rate", value: 60 }` |
| trait_usage | 特定性狀使用次數 | `{ type: "trait_usage", trait: "carnivore", count: 50 }` |
| trait_variety | 使用過的性狀種類數 | `{ type: "trait_variety", count: 19 }` |
| creatures_survived_single | 單場存活生物數 | `{ type: "creatures_survived_single", count: 10 }` |
| all_creatures_survived | 單場全部存活 | `{ type: "all_creatures_survived" }` |
| attacks_in_game | 單場攻擊次數 | `{ type: "attacks_in_game", count: 10 }` |
| perfect_game | 完美遊戲（全存活+最高分） | `{ type: "perfect_game" }` |

---

## 六、遊戲回放服務

### 6.1 記錄事件

```javascript
replayService.recordEvent(roomId, event);
```

**event 格式**：
```javascript
{
  type: "PLAY_CARD_AS_CREATURE",
  playerId: "uuid",
  data: { cardId: "card-1" },
  timestamp: 1706900000000
}
```

### 6.2 取得回放資料

```javascript
replayService.getReplay(roomId);
```

**回傳**：
```javascript
{
  events: [ /* 事件陣列 */ ],
  compressed: true
}
```

### 6.3 清除回放資料

```javascript
replayService.clearReplay(roomId);
```

---

## 七、快取機制

### 7.1 排行榜快取

- **TTL**：5 分鐘 (300000ms)
- **快取 Key**：
  - `leaderboard_all`
  - `leaderboard_daily`
  - `leaderboard_weekly`

### 7.2 統計快取

- **TTL**：2 分鐘 (120000ms)
- **快取 Key**：`stats_{userId}`

### 7.3 手動清除快取

```javascript
// 清除排行榜快取
leaderboardController.clearCache('all');
leaderboardController.clearCache('daily');
leaderboardController.clearCache('weekly');
```

---

## 八、錯誤處理

### 8.1 錯誤回應格式

```json
{
  "success": false,
  "error": "錯誤訊息"
}
```

### 8.2 常見錯誤碼

| HTTP 狀態碼 | 說明 |
|-------------|------|
| 400 | 請求參數錯誤 |
| 404 | 資源不存在 |
| 500 | 伺服器內部錯誤 |

### 8.3 Supabase 停用時的行為

當 Supabase 未設定或停用時，所有服務會返回預設值：
- 排行榜：空陣列
- 統計：預設統計物件（所有數值為 0）
- 成就：空陣列
- 遊戲紀錄：不儲存

---

## 九、安全性考量

### 9.1 Row Level Security (RLS)

Supabase 表格使用 RLS 保護：
- 玩家只能讀取自己的詳細統計
- 排行榜為公開讀取
- 遊戲紀錄為參與者可讀取

### 9.2 輸入驗證

所有 API 參數都會進行驗證：
- UUID 格式驗證
- 數字範圍驗證
- 字串長度限制

---

**文件結束**

*建立者：Claude Code*
*建立日期：2026-02-02*
