# 工作單 0284

## 編號
0284

## 日期
2026-01-31

## 工作單標題
修復 EvolutionRoom.js 玩家識別與加入邏輯

## 工單主旨
BUG 修復 - 演化論遊戲無法開始（玩家 ID 不一致）

## 內容

### 問題描述
EvolutionRoom.js 中的加入房間邏輯使用不一致的玩家 ID 格式，導致玩家識別失敗。

### 根本原因
- 創建房間時：玩家物件包含 `id: player_xxx` 和 `firebaseUid`
- 加入房間時（EvolutionRoom.js）：只發送 `id: user.uid`（Firebase UID），沒有 `firebaseUid`
- 判斷是否在房間中時：使用 `p.id === user.uid` 進行比對，格式不一致

### 修改項目

1. **修改加入房間判斷邏輯（第 101 行）**
   - 原：`if (isCreator || (room && room.players?.some(p => p.id === user.uid))) {`
   - 新：`if (isCreator || (room && room.players?.some(p => p.firebaseUid === user.uid))) {`

2. **修改加入房間時的玩家物件（第 108-111 行）**
   - 原：
     ```javascript
     evoJoinRoom(roomId, {
       id: user.uid,
       name: user.displayName || user.email?.split('@')[0] || '玩家'
     });
     ```
   - 新：
     ```javascript
     evoJoinRoom(roomId, {
       id: `player_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
       name: user.displayName || user.email?.split('@')[0] || '玩家',
       firebaseUid: user.uid,
       photoURL: user?.photoURL || null
     });
     ```

3. **修改所有使用玩家 ID 的操作**
   - 確保 `evoCreateCreature`、`evoAddTrait`、`evoPassEvolution` 等使用正確的玩家 ID

### 修改檔案
- `frontend/src/components/games/evolution/EvolutionRoom/EvolutionRoom.js`

### 驗收標準
- [ ] 玩家加入房間後正確識別為房間成員
- [ ] 不會發送重複的加入請求
- [ ] 遊戲操作使用正確的玩家 ID

### 依賴工單
- 工單 0283（EvolutionLobby.js 修復）

### 參考文件
- `work_orders/演化論/BUG/BUG_PLAN_EVOLUTION_START.md`
