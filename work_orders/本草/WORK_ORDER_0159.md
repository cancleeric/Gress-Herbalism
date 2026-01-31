# 工作單 0159

**建立日期**: 2026-01-27

**優先級**: P0 (嚴重)

**標題**: 修復 socketService 返回值問題

---

## 一、工作目標

修復 `socketService.js` 中所有 `on*` 函數可能返回 `undefined` 的問題，確保它們在任何情況下都返回有效的取消訂閱函數。

---

## 二、問題描述

### 現象
GameRoom 組件在 unmount 時拋出 TypeError：
```
TypeError: unsubPlayerLeft is not a function
at GameRoom.js:585
```

### 根本原因
`socketService.js` 中的事件監聽函數在 socket 未初始化時可能返回 `undefined`。

### 影響
- 15 個 GameRoom 測試失敗
- 潛在的記憶體洩漏

---

## 三、實施計畫

### 3.1 修改檔案
- `frontend/src/services/socketService.js`

### 3.2 修改內容

檢查並修改所有 `on*` 函數，確保返回有效的 unsubscribe 函數：

```javascript
// 修改前
export function onPlayerLeft(callback) {
  const s = getSocket();
  s.on('playerLeft', callback);
  return () => s.off('playerLeft', callback);
}

// 修改後
export function onPlayerLeft(callback) {
  const s = getSocket();
  if (!s) {
    console.warn('[socketService] Socket 未初始化，無法監聽 playerLeft');
    return () => {};  // 返回空函數
  }
  s.on('playerLeft', callback);
  return () => s.off('playerLeft', callback);
}
```

需要修改的函數清單：
1. `onRoomList`
2. `onGameState`
3. `onPlayerLeft`
4. `onError`
5. `onRoomCreated`
6. `onJoinedRoom`
7. `onHiddenCardsRevealed`
8. `onColorChoiceRequired`
9. `onWaitingForColorChoice`
10. `onColorChoiceResult`
11. `onFollowGuessStarted`
12. `onFollowGuessUpdate`
13. `onGuessResult`
14. `onRoundStarted`
15. `onPostQuestionPhase`
16. `onTurnEnded`
17. `onCardGiveNotification`
18. `onReconnected`
19. `onReconnectFailed`
20. `onConnectionChange`

### 3.3 輔助方案

建立通用的安全監聽函數：
```javascript
/**
 * 安全地建立事件監聽
 * @param {string} eventName - 事件名稱
 * @param {Function} callback - 回調函數
 * @returns {Function} 取消訂閱函數
 */
function safeOn(eventName, callback) {
  const s = getSocket();
  if (!s) {
    console.warn(`[socketService] Socket 未初始化，無法監聽 ${eventName}`);
    return () => {};
  }
  s.on(eventName, callback);
  return () => s.off(eventName, callback);
}

// 使用方式
export function onPlayerLeft(callback) {
  return safeOn('playerLeft', callback);
}
```

---

## 四、測試計畫

### 4.1 單元測試
修改 `socketService.test.js`：
```javascript
describe('socketService 安全性', () => {
  test('socket 未初始化時 onPlayerLeft 應返回空函數', () => {
    // 確保 socket 為 null
    const unsub = onPlayerLeft(jest.fn());
    expect(typeof unsub).toBe('function');
    expect(() => unsub()).not.toThrow();
  });
});
```

### 4.2 驗收測試
- [ ] 所有 `on*` 函數在 socket 未初始化時返回空函數
- [ ] GameRoom 測試全部通過
- [ ] 無 TypeError 錯誤

---

## 五、驗收標準

1. `socketService.js` 中所有 `on*` 函數確保返回函數
2. GameRoom 相關的 15 個測試全部通過
3. 組件 unmount 時不再拋出 TypeError
4. 無新的 console 錯誤

---

## 六、風險評估

| 風險 | 可能性 | 影響 | 緩解措施 |
|------|--------|------|----------|
| 修改影響正常監聽 | 低 | 中 | 完整測試驗證 |
| 遺漏某些函數 | 中 | 低 | 使用通用 safeOn 函數 |

---

## 七、相關工單

- 依賴: 無
- 被依賴: 0161 (E2E 測試基礎設施)

---

*工單建立時間: 2026-01-27*
