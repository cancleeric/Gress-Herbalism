# 工作單 0110

**日期：** 2026-01-25

**工作單標題：** Socket 同步機制單元測試

**工單主旨：** 測試 - 建立 Socket 同步相關的單元測試

**計畫書：** [Socket 連線同步修復計畫書](../docs/SOCKET_SYNC_FIX_PLAN.md)

**優先級：** 中

---

## 測試範圍

### 1. findSocketByPlayerId 測試

```javascript
describe('findSocketByPlayerId', () => {
  test('player.socketId 有效時返回 socket', () => {});
  test('player.socketId 無效時嘗試 fallback', () => {});
  test('fallback 成功時自動修復 socketId', () => {});
  test('找不到時返回 null', () => {});
  test('玩家不存在時返回 null', () => {});
  test('房間不存在時返回 null', () => {});
});
```

### 2. handlePlayerReconnect 測試

```javascript
describe('handlePlayerReconnect', () => {
  test('重連時更新 player.socketId', () => {});
  test('重連時更新 playerSockets Map', () => {});
  test('重連時清除斷線計時器', () => {});
  test('重連時恢復 isDisconnected 狀態', () => {});
  test('房間不存在時發送 reconnectFailed', () => {});
  test('玩家不在房間時發送 reconnectFailed', () => {});
});
```

### 3. validateSocketConnections 測試

```javascript
describe('validateSocketConnections', () => {
  test('清理無效的 socketId', () => {});
  test('保留有效的 socketId', () => {});
  test('記錄清理日誌', () => {});
});
```

## 測試檔案

**檔案：** `backend/__tests__/socket.test.js`（新增）

## 驗收標準

- [ ] 測試覆蓋所有核心函數
- [ ] 測試覆蓋率 80% 以上
- [ ] 所有測試通過
