# 多遊戲平台改造計畫

## 一、目標

將「本草 Herbalism」單一遊戲網站改造為「Nicholas Game」多遊戲平台，支援多款桌遊。

## 二、支援遊戲

| 遊戲 | 狀態 |
|------|------|
| 本草 Herbalism | 已完成 |
| 演化論：物種起源 | 待開發 |

## 三、改造範圍

### 3.1 品牌重塑

| 項目 | 原本 | 改為 |
|------|------|------|
| 專案名稱 | herbalism-frontend/backend | nicholas-game-frontend/backend |
| 網站標題 | 本草 Herbalism | Nicholas Game |
| Logo/品牌 | 本草主題 | Nicholas Game 通用 |

### 3.2 前端架構調整

```
frontend/src/
├── components/
│   ├── common/              # 共用元件
│   │   ├── Lobby/           # 遊戲大廳（加遊戲選擇）
│   │   ├── RoomList/        # 房間列表
│   │   ├── PlayerList/      # 玩家列表
│   │   ├── Chat/            # 聊天功能
│   │   └── ...
│   │
│   ├── games/               # 遊戲專屬元件
│   │   ├── herbalism/       # 本草遊戲
│   │   │   ├── GameRoom/
│   │   │   ├── QuestionCard/
│   │   │   ├── GuessCard/
│   │   │   └── ...
│   │   │
│   │   └── evolution/       # 演化論遊戲
│   │       ├── GameRoom/
│   │       ├── AnimalBoard/
│   │       ├── TraitCard/
│   │       └── ...
│   │
│   ├── auth/                # 登入相關（共用）
│   ├── profile/             # 個人資料（共用）
│   └── friends/             # 好友系統（共用）
│
├── store/
│   ├── gameStore.js         # 通用遊戲狀態
│   ├── herbalism/           # 本草專屬狀態
│   └── evolution/           # 演化論專屬狀態
│
└── shared/
    ├── constants.js         # 通用常數
    ├── herbalism-constants.js
    └── evolution-constants.js
```

### 3.3 後端架構調整

```
backend/
├── server.js                # 主伺服器（路由分發）
├── logic/
│   ├── herbalism/           # 本草遊戲邏輯
│   │   ├── gameLogic.js
│   │   ├── cardService.js
│   │   └── ...
│   │
│   └── evolution/           # 演化論遊戲邏輯
│       ├── gameLogic.js
│       ├── deckManager.js
│       ├── feedingLogic.js
│       └── traitEffects.js
│
├── services/                # 共用服務
│   ├── roomService.js       # 房間管理（加 gameType）
│   ├── friendService.js
│   └── ...
│
└── db/
    └── supabase.js          # 資料庫（加遊戲類型欄位）
```

### 3.4 資料庫調整

**新增欄位：**
- `game_rooms.game_type`: 'herbalism' | 'evolution'
- `game_history.game_type`: 遊戲類型

**新增資料表（演化論專用）：**
- 暫時不需要，共用現有結構

### 3.5 共用功能（不需改動）

- Firebase 登入
- Supabase 資料庫連線
- 好友系統
- 個人資料
- 排行榜（加遊戲類型篩選）

## 四、工單規劃

| 工單編號 | 標題 | 優先級 |
|---------|------|--------|
| 0220 | 品牌重塑：重命名為 Nicholas Game | P0 |
| 0221 | 前端：新增遊戲選擇頁面 | P0 |
| 0222 | 後端：房間系統加入 gameType | P0 |
| 0223 | 前端：拆分本草遊戲元件到 games/herbalism | P1 |
| 0224 | 前端：建立演化論遊戲元件框架 | P1 |
| 0225 | 後端：建立演化論遊戲邏輯框架 | P1 |
| 0226 | 共用：建立演化論常數定義 | P1 |

## 五、實作順序

1. **階段一：品牌重塑** (0220)
   - 改 package.json 名稱
   - 改網站標題和 Logo
   - 改 CLAUDE.md

2. **階段二：架構調整** (0221-0223)
   - 加遊戲選擇頁面
   - 房間系統支援多遊戲
   - 拆分遊戲元件

3. **階段三：演化論開發** (0224-0226)
   - 建立元件框架
   - 實作遊戲邏輯
   - 測試

## 六、注意事項

1. **向後相容**：現有本草功能必須正常運作
2. **漸進式改造**：每個工單獨立可測試
3. **共用優先**：盡量複用現有程式碼

---

**建立日期**：2026-01-31
**狀態**：規劃中
