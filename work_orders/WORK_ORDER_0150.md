# 工作單 0150

**日期：** 2026-01-27

**工作單標題：** 修復「遊戲不存在」錯誤處理 - 改善 Cloud Run 狀態丟失的使用者體驗

**工單主旨：** BUG 修復 - 遊戲不存在時的錯誤處理和 UI 優化

**優先級：** 高

**依賴工單：** 無

**計畫書：** `docs/BUG_FIX_PLAN_GAME_NOT_EXIST.md`

---

## 一、問題描述

### 現象
1. 遊戲進行中突然出現「遊戲不存在」紅色錯誤條
2. 問牌/猜牌操作卡在「處理中...」無法操作
3. 頁面重整後遊戲無法繼續

### 根本原因
Cloud Run 後端使用記憶體 (`Map`) 儲存遊戲狀態，實例重啟後資料丟失。

### 前端問題
- 錯誤發生時 Modal 未關閉，導致「處理中」卡住
- 致命錯誤未自動導航回大廳
- 本地遊戲資訊未清除

---

## 二、修復內容

### 2.1 改善 onError 處理

在 `GameRoom.js` 的 `onError` 事件中：

1. **重置所有 Modal 狀態**
   - `showQuestionFlow = false`
   - `showGuessCard = false`
   - `showColorChoice = false`
   - `showFollowGuessPanel = false`
   - `showPrediction = false`

2. **特殊處理「遊戲不存在」**
   - 清除本地儲存
   - 3 秒後自動導航回大廳

### 2.2 新增全螢幕錯誤提示

當錯誤為「遊戲不存在」時，顯示：
- 圖示 + 標題「遊戲已結束」
- 說明文字
- 倒數提示
- 「立即返回」按鈕

### 2.3 改善重連失敗處理

在 `socketService.js` 中，重連失敗時清除本地儲存。

---

## 三、修改檔案

| 檔案 | 修改內容 |
|------|----------|
| `frontend/src/components/GameRoom/GameRoom.js` | 改善 `onError` 處理，新增自動導航 |
| `frontend/src/components/GameRoom/GameRoom.css` | 新增全螢幕錯誤提示樣式 |
| `frontend/src/services/socketService.js` | 改善重連失敗處理 |

---

## 四、程式碼修改

### 4.1 GameRoom.js - onError 處理

```javascript
const unsubError = onError(({ message }) => {
    setError(message);
    setIsLoading(false);

    // 重置所有 Modal 狀態
    setShowQuestionFlow(false);
    setShowGuessCard(false);
    setShowColorChoice(false);
    setColorChoiceData(null);
    setShowFollowGuessPanel(false);
    setShowPrediction(false);
    setSelectedColorCard(null);

    // 特殊處理「遊戲不存在」錯誤
    if (message === '遊戲不存在') {
        clearCurrentRoom();
        localStorage.removeItem('lastRoomId');
        localStorage.removeItem('lastPlayerId');
        localStorage.removeItem('lastPlayerName');

        // 3 秒後自動導航
        setTimeout(() => {
            dispatch(resetGame());
            navigate('/');
        }, 3000);
    }
});
```

### 4.2 GameRoom.js - 全螢幕錯誤 UI

```jsx
{error === '遊戲不存在' && (
    <div className="game-not-exist-overlay">
        <div className="game-not-exist-card">
            <span className="material-symbols-outlined">cloud_off</span>
            <h2>遊戲連線中斷</h2>
            <p>遊戲房間已不存在，可能是伺服器重啟或連線逾時。</p>
            <p className="countdown">3 秒後自動返回大廳...</p>
            <button className="btn-return" onClick={handleLeaveRoom}>
                立即返回
            </button>
        </div>
    </div>
)}
```

---

## 五、驗收標準

- [ ] 「遊戲不存在」錯誤時，所有 Modal 自動關閉
- [ ] 顯示全螢幕友善提示（非紅色錯誤條）
- [ ] 3 秒後自動導航回大廳
- [ ] 點擊「立即返回」可立即導航
- [ ] 本地儲存的遊戲資訊被清除
- [ ] 其他錯誤仍以紅色條提示

---

## 六、測試步驟

### 場景 1：問牌中發生錯誤
1. 開始 3 人遊戲
2. 打開問牌流程
3. 重啟後端伺服器
4. 確認問牌
5. **預期**：問牌 Modal 關閉，顯示全螢幕提示，3秒後返回大廳

### 場景 2：重整後錯誤
1. 開始遊戲
2. 重啟後端伺服器
3. 重整前端頁面
4. **預期**：自動嘗試重連，失敗後顯示提示並返回大廳

### 場景 3：一般錯誤
1. 觸發非「遊戲不存在」的錯誤
2. **預期**：仍顯示紅色錯誤條，不自動導航

---

## 七、備註

此工單為短期方案，改善使用者體驗。長期方案需要：
- 使用 Redis/Supabase 持久化遊戲狀態
- Cloud Run 配置最小實例數為 1
