# Socket 連線狀態顯示問題修復計畫書

**版本**：1.1
**建立日期**：2026-02-07
**完成日期**：2026-02-07
**狀態**：✅ 已完成

---

## 問題描述

### 症狀
前端在 Socket 連線初始化階段立即顯示「與伺服器斷線，請確認後端是否啟動」錯誤，即使後端服務正在運行且連線最終會成功。

### 根本原因分析

經過代碼分析，發現以下問題：

| 優先級 | 問題 | 檔案位置 | 影響 |
|--------|------|----------|------|
| 🔴 P1 | 連線狀態初始化時機不當 | `socketService.js` | 連線中被誤判為斷線 |
| 🔴 P1 | Lobby 組件過早顯示錯誤訊息 | `Lobby.js` | 用戶體驗差 |
| 🟠 P2 | 缺少連線中狀態 | `socketService.js` | 無法區分「未連線」和「正在連線」 |

---

## 詳細問題說明

### 問題 1：連線狀態初始化時機不當（P1 - 臨界）

**現狀**：
```javascript
// frontend/src/services/socketService.js 第 128-137 行
export function onConnectionChange(callback) {
  connectionCallbacks.push(callback);
  // 立即通知目前狀態
  if (socket) {
    callback(socket.connected);  // 問題：連線過程中 connected 為 false
  }
  return () => { ... };
}
```

**問題**：
- 當 socket 正在連線過程中，`socket.connected` 為 `false`
- `onConnectionChange` 立即調用 callback，傳入 `false`
- 組件錯誤地認為連線失敗

### 問題 2：Lobby 組件過早顯示錯誤訊息（P1 - 臨界）

**現狀**：
```javascript
// frontend/src/components/common/Lobby/Lobby.js 第 112-119 行
const unsubConnect = onConnectionChange((connected) => {
  setIsConnected(connected);
  if (!connected) {
    setError('與伺服器斷線，請確認後端是否啟動');  // 問題：立即顯示錯誤
  } else {
    setError('');
  }
});
```

**問題**：
- 連線狀態變為 `false` 時立即顯示錯誤訊息
- 沒有給予連線重試的寬限期
- 無法區分「尚未連線」、「正在連線」、「連線失敗」

### 問題 3：缺少連線中狀態（P2 - 高）

**現狀**：
- 只有 `connected: true/false` 兩種狀態
- 無法表達「正在連線中」的狀態

**解決方案**：
- 添加連線狀態枚舉：`DISCONNECTED`, `CONNECTING`, `CONNECTED`

---

## 實施計畫

### 工單規劃

| 工單編號 | 標題 | 優先級 | 預估範圍 |
|----------|------|--------|----------|
| 0381 | 改進 onConnectionChange 初始化邏輯 | P1 | socketService.js |
| 0382 | 優化 Lobby 連線狀態處理 | P1 | Lobby.js |
| 0383 | 添加連線狀態枚舉 | P2 | socketService.js |
| 0384 | 整合測試與驗收 | - | 測試 |

### 工單詳細內容

#### 工單 0381：改進 onConnectionChange 初始化邏輯

**目標**：修正 socket 初始化時的狀態回報邏輯

**修改內容**：
1. 在 `socketService.js` 中：
   - 不在 `onConnectionChange` 中立即調用 callback（當 socket 尚未連線時）
   - 改為在 `connect` 事件後才開始追蹤狀態
   - 或添加初始化完成標記

**驗收標準**：
- [ ] 初始化時不會誤報斷線
- [ ] 實際斷線時仍能正確通知

#### 工單 0382：優化 Lobby 連線狀態處理

**目標**：改善 Lobby 組件的連線狀態顯示邏輯

**修改內容**：
1. 在 `Lobby.js` 中：
   - 添加連線嘗試延遲，避免閃爍
   - 只在持續斷線一段時間後才顯示錯誤
   - 使用 `setTimeout` 或狀態機來管理

```javascript
// 建議的修改方式
const unsubConnect = onConnectionChange((connected) => {
  setIsConnected(connected);
  if (!connected) {
    // 延遲顯示錯誤，給予重連時間
    setTimeout(() => {
      // 再次檢查是否仍然斷線
      if (!isConnected) {
        setError('與伺服器斷線，請確認後端是否啟動');
      }
    }, 3000);
  } else {
    setError('');
  }
});
```

**驗收標準**：
- [ ] 初始載入時不會閃現錯誤訊息
- [ ] 實際斷線 3 秒後才顯示錯誤
- [ ] 連線成功時自動清除錯誤

#### 工單 0383：添加連線狀態枚舉

**目標**：提供更精確的連線狀態表示

**修改內容**：
1. 在 `socketService.js` 中添加狀態枚舉：
```javascript
export const ConnectionState = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
};
```
2. 添加 `getConnectionState()` 函數
3. 在 connect/disconnect 事件中更新狀態

**驗收標準**：
- [ ] 能區分三種連線狀態
- [ ] 組件可根據狀態顯示不同 UI

#### 工單 0384：整合測試與驗收

**目標**：驗證所有修復正常運作

**測試內容**：
1. 啟動後端，重新整理前端
2. 確認不會立即顯示斷線錯誤
3. 停止後端，確認 3 秒後顯示錯誤
4. 重新啟動後端，確認自動恢復

**驗收標準**：
- [ ] 正常載入時不顯示錯誤
- [ ] 實際斷線時正確顯示錯誤
- [ ] 重連後自動清除錯誤

---

## 風險評估

| 風險 | 影響 | 緩解措施 |
|------|------|----------|
| 延遲顯示可能讓用戶等待過久 | 中 | 添加「連線中」提示 |
| 狀態管理複雜度增加 | 低 | 使用簡單的狀態機 |

---

## 驗收清單

- [x] 工單 0381 完成
- [x] 工單 0382 完成
- [x] 工單 0383 完成
- [x] 工單 0384 完成
- [x] 整合測試通過
- [x] 本計畫書更新為「已完成」

---

**計畫書完成**

*撰寫者：Claude Code*
*日期：2026-02-07*
