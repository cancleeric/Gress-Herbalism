# 報告書 0313

## 工作單編號
0313

## 完成日期
2026-01-31

## 完成內容摘要

建立 `evolutionGameHandler.js` 基礎結構，實作房間管理功能。

### 產出檔案
- `backend/evolutionGameHandler.js`（新建）

### 實作內容

#### 1. 狀態管理
```javascript
const evoRooms = new Map();
const evoPlayerSockets = new Map();
```

#### 2. 房間操作函數
- `createRoom(socket, io, data)` - 創建房間
- `joinRoom(socket, io, data)` - 加入房間（含重連支援）
- `leaveRoom(socket, io, data)` - 離開房間
- `setReady(socket, io, data)` - 設定準備狀態
- `requestRoomList(socket)` - 請求房間列表

#### 3. 輔助函數
- `getRoomList()` - 取得房間列表
- `broadcastRoomList(io)` - 廣播房間列表
- `broadcastGameState(io, roomId)` - 廣播遊戲狀態
- `getClientGameState(room, playerId)` - 取得客戶端遊戲狀態
- `handleDisconnect(socket, io)` - 處理斷線

### 房間狀態結構
```javascript
const roomState = {
  id: roomId,
  name: roomName,
  maxPlayers: 4,
  hostId: socketId,
  gameType: 'evolution',
  phase: 'waiting',
  players: [{
    id, visitorId, name, socketId,
    firebaseUid, isHost, isReady
  }],
  gameState: null,
  createdAt: timestamp,
};
```

### 驗收標準確認
- [x] 檔案 `backend/evolutionGameHandler.js` 已建立
- [x] 房間 CRUD 操作函數已實作
- [x] 廣播函數已實作
- [x] 程式碼風格與現有程式碼一致

## 遇到的問題與解決方案
無

## 測試結果
語法驗證通過

## 下一步計劃
- 執行工單 0314：實作遊戲開始邏輯（已包含在此工單中）
- 執行工單 0315：修改 server.js 使用新模組
