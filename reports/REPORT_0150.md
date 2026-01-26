# 工單 0150 完成報告

**完成日期：** 2026-01-27

**工單標題：** 修復「遊戲不存在」錯誤處理 - 改善 Cloud Run 狀態丟失的使用者體驗

---

## 一、完成摘要

已改善「遊戲不存在」錯誤的處理方式，當發生此錯誤時：
1. 自動關閉所有進行中的 Modal（避免卡在「處理中」）
2. 顯示友善的全螢幕提示（取代紅色錯誤條）
3. 3 秒倒數後自動導航回大廳
4. 清除本地儲存的遊戲資訊

---

## 二、修改內容

### 修改檔案

| 檔案 | 修改內容 |
|------|----------|
| `frontend/src/components/GameRoom/GameRoom.js` | 新增 `gameNotExist` 和 `redirectCountdown` 狀態 |
| `frontend/src/components/GameRoom/GameRoom.js` | 改善 `onError` 處理，重置所有 Modal |
| `frontend/src/components/GameRoom/GameRoom.js` | 新增倒數計時與自動導航 useEffect |
| `frontend/src/components/GameRoom/GameRoom.js` | 新增全螢幕錯誤提示 UI |
| `frontend/src/components/GameRoom/GameRoom.js` | 新增 `onReconnectFailed` 訂閱 |
| `frontend/src/components/GameRoom/GameRoom.css` | 新增全螢幕提示樣式 |

### 具體變更

#### 新增狀態

```javascript
const [gameNotExist, setGameNotExist] = useState(false);
const [redirectCountdown, setRedirectCountdown] = useState(3);
```

#### 改善 onError 處理

```javascript
const unsubError = onError(({ message }) => {
  setError(message);
  setIsLoading(false);

  // 重置所有 Modal 狀態，避免卡在「處理中」
  setShowQuestionFlow(false);
  setShowQuestionCard(false);
  setShowGuessCard(false);
  setShowColorChoice(false);
  setColorChoiceData(null);
  setShowFollowGuessPanel(false);
  setShowPrediction(false);
  setSelectedColorCard(null);

  // 特殊處理「遊戲不存在」錯誤
  if (message === '遊戲不存在') {
    setGameNotExist(true);
    clearCurrentRoom();
    localStorage.removeItem('lastRoomId');
    localStorage.removeItem('lastPlayerId');
    localStorage.removeItem('lastPlayerName');
  }
});
```

#### 倒數計時與自動導航

```javascript
useEffect(() => {
  if (!gameNotExist) return;

  const countdownTimer = setInterval(() => {
    setRedirectCountdown(prev => prev <= 1 ? 0 : prev - 1);
  }, 1000);

  const redirectTimer = setTimeout(() => {
    dispatch(resetGame());
    navigate('/');
  }, 3000);

  return () => {
    clearInterval(countdownTimer);
    clearTimeout(redirectTimer);
  };
}, [gameNotExist, dispatch, navigate]);
```

#### 全螢幕錯誤 UI

```jsx
{gameNotExist && (
  <div className="game-not-exist-overlay">
    <div className="game-not-exist-card">
      <span className="material-symbols-outlined">cloud_off</span>
      <h2>遊戲連線中斷</h2>
      <p>遊戲房間已不存在，可能是伺服器重啟或連線逾時。</p>
      <p>{redirectCountdown} 秒後自動返回大廳...</p>
      <button onClick={handleReturnToLobby}>立即返回</button>
    </div>
  </div>
)}
```

---

## 三、驗收結果

- [x] 「遊戲不存在」錯誤時，所有 Modal 自動關閉
- [x] 顯示全螢幕友善提示（非紅色錯誤條）
- [x] 3 秒倒數顯示
- [x] 3 秒後自動導航回大廳
- [x] 點擊「立即返回」可立即導航
- [x] 本地儲存的遊戲資訊被清除
- [x] 其他錯誤仍以紅色條提示
- [x] 重連失敗時也觸發相同處理
- [x] 前端編譯無錯誤

---

## 四、UI 設計

全螢幕提示採用深色背景配金色邊框，與遊戲整體風格一致：
- 圖示：`cloud_off`（雲端離線）
- 標題：「遊戲連線中斷」
- 說明：「遊戲房間已不存在，可能是伺服器重啟或連線逾時。」
- 倒數：「X 秒後自動返回大廳...」
- 按鈕：「立即返回」（綠色主題按鈕）

---

## 五、備註

此為短期方案，改善使用者體驗。長期方案建議：
- 使用 Redis/Supabase 持久化遊戲狀態
- Cloud Run 配置最小實例數為 1
- 實作遊戲狀態快照與恢復機制

