# BUG 修復計畫書：「遊戲不存在」錯誤處理改善

## 問題描述

### 現象
1. **「遊戲不存在」錯誤**：遊戲進行中突然出現紅色錯誤提示「遊戲不存在」
2. **操作卡住**：問牌流程卡在「處理中...」狀態，無法操作
3. **重整後失效**：頁面重整後，遊戲無法繼續

### 重現步驟
1. 在 Cloud Run 上部署遊戲
2. 開始多人遊戲
3. 等待一段時間或觸發實例重啟
4. 嘗試任何遊戲操作
5. 出現「遊戲不存在」錯誤

---

## 問題分析

### 根本原因

**Cloud Run 記憶體狀態不持久**

後端使用 `Map` 物件 (`gameRooms`) 儲存遊戲狀態：

```javascript
const gameRooms = new Map();
```

當以下情況發生時，所有遊戲資料會丟失：
1. **實例冷啟動**：Cloud Run 自動縮放，新實例沒有舊資料
2. **實例重啟**：部署更新或健康檢查失敗導致重啟
3. **多實例問題**：多個實例運行時，玩家可能連到不同實例

### 前端問題點

**問題 1：錯誤處理不完善**

`GameRoom.js` line 397-400：
```javascript
const unsubError = onError(({ message }) => {
    setError(message);
    setIsLoading(false);
    // 缺少：重置其他 UI 狀態（showQuestionFlow, showGuessCard 等）
    // 缺少：特殊處理「遊戲不存在」錯誤
});
```

**問題 2：Modal 未關閉**

當錯誤發生時，以下 Modal 狀態未重置：
- `showQuestionFlow`（問牌流程）
- `showGuessCard`（猜牌介面）
- `showColorChoice`（顏色選擇）
- `showFollowGuessPanel`（跟猜面板）

**問題 3：無自動導航**

「遊戲不存在」是致命錯誤，應該：
- 顯示友善提示
- 自動導航回大廳
- 清除本地儲存的遊戲資訊

---

## 修復方案

### 方案一：改善前端錯誤處理（短期）

#### 1.1 增加「遊戲不存在」特殊處理

```javascript
const unsubError = onError(({ message }) => {
    setError(message);
    setIsLoading(false);

    // 重置所有 Modal 狀態
    setShowQuestionFlow(false);
    setShowGuessCard(false);
    setShowColorChoice(false);
    setShowFollowGuessPanel(false);
    setShowPrediction(false);

    // 特殊處理「遊戲不存在」錯誤
    if (message === '遊戲不存在') {
        // 清除本地儲存
        clearCurrentRoom();
        localStorage.removeItem('lastRoomId');
        localStorage.removeItem('lastPlayerId');
        localStorage.removeItem('lastPlayerName');

        // 3 秒後自動導航回大廳
        setTimeout(() => {
            dispatch(resetGame());
            navigate('/');
        }, 3000);
    }
});
```

#### 1.2 改善錯誤 UI

將「遊戲不存在」錯誤改為全螢幕提示：

```jsx
{error === '遊戲不存在' && (
    <div className="game-not-exist-overlay">
        <div className="game-not-exist-card">
            <span className="material-symbols-outlined">error</span>
            <h2>遊戲已結束</h2>
            <p>此遊戲房間已不存在，可能是伺服器重啟或房間已關閉。</p>
            <p>3 秒後自動返回大廳...</p>
            <button onClick={handleLeaveRoom}>立即返回</button>
        </div>
    </div>
)}
```

### 方案二：後端狀態持久化（中期）

使用 Redis 或 Supabase 持久化遊戲狀態：

```javascript
// 使用 Supabase 儲存遊戲狀態
async function saveGameState(gameId, gameState) {
    await supabase.from('active_games').upsert({
        game_id: gameId,
        state: gameState,
        updated_at: new Date().toISOString()
    });
}

async function loadGameState(gameId) {
    const { data } = await supabase
        .from('active_games')
        .select('state')
        .eq('game_id', gameId)
        .single();
    return data?.state;
}
```

### 方案三：Cloud Run 配置優化（中期）

1. **最小實例數設為 1**：避免冷啟動
2. **單一實例運行**：避免多實例資料不同步

---

## 實施步驟（本工單）

### 步驟 1：修改前端錯誤處理

**檔案**：`frontend/src/components/GameRoom/GameRoom.js`

1. 在 `onError` 處理中增加 Modal 狀態重置
2. 增加「遊戲不存在」特殊處理邏輯
3. 實作自動導航回大廳

### 步驟 2：新增錯誤 UI 樣式

**檔案**：`frontend/src/components/GameRoom/GameRoom.css`

1. 新增 `.game-not-exist-overlay` 樣式
2. 新增 `.game-not-exist-card` 樣式

### 步驟 3：改善重連邏輯

**檔案**：`frontend/src/services/socketService.js`

1. 在重連失敗時清除本地儲存
2. 增加重連失敗的回調處理

---

## 修改檔案清單

| 檔案 | 修改內容 |
|------|----------|
| `frontend/src/components/GameRoom/GameRoom.js` | 改善 `onError` 處理，增加自動導航 |
| `frontend/src/components/GameRoom/GameRoom.css` | 新增「遊戲不存在」全螢幕樣式 |
| `frontend/src/services/socketService.js` | 改善重連失敗處理 |

---

## 驗收標準

- [ ] 「遊戲不存在」錯誤時，所有 Modal 自動關閉
- [ ] 「遊戲不存在」錯誤顯示全螢幕友善提示
- [ ] 3 秒後自動導航回大廳
- [ ] 點擊「立即返回」可立即導航
- [ ] 本地儲存的遊戲資訊被清除
- [ ] 其他錯誤仍以紅色條提示顯示

---

## 測試步驟

### 場景 1：模擬遊戲不存在
1. 開始遊戲
2. 在後端手動刪除遊戲房間（或重啟後端）
3. 嘗試問牌操作
4. **預期**：顯示全螢幕提示，3 秒後返回大廳

### 場景 2：問牌中錯誤
1. 開始遊戲
2. 打開問牌流程
3. 觸發「遊戲不存在」錯誤
4. **預期**：問牌 Modal 關閉，顯示錯誤提示

### 場景 3：重整後錯誤
1. 開始遊戲
2. 重啟後端
3. 重整前端頁面
4. **預期**：自動嘗試重連，失敗後顯示提示並返回大廳

---

## 風險評估

- **低風險**：僅修改前端錯誤處理邏輯
- **使用者體驗改善**：錯誤發生時有明確指引

---

## 未來改善（後續工單）

1. **工單 015X**：使用 Supabase 持久化遊戲狀態
2. **工單 015X**：Cloud Run 配置最小實例數
3. **工單 015X**：實作遊戲狀態恢復機制

---

**建立日期**：2026-01-27
**建立者**：Claude
**狀態**：待實施
