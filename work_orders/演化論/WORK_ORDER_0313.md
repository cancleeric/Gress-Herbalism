# 工作單 0313

## 編號
0313

## 日期
2026-01-31

## 工作單標題
建立 evolutionGameHandler 基礎結構

## 工單主旨
演化論房間處理重寫 - 階段一

## 關聯計畫書
`docs/演化論/PLAN_EVOLUTION_ROOM_REWRITE.md`

## 內容

### 目標
建立新的 `evolutionGameHandler.js` 模組，實作房間管理基礎功能。

### 工作項目

#### 1. 建立新檔案
- `backend/evolutionGameHandler.js`

#### 2. 實作房間狀態管理
```javascript
// 演化論房間狀態
const evoRooms = new Map();

// 玩家 Socket 對應
const evoPlayerSockets = new Map();
```

#### 3. 實作房間操作函數
- `createRoom(socket, io, data)` - 創建房間
- `joinRoom(socket, io, data)` - 加入房間
- `leaveRoom(socket, io, data)` - 離開房間
- `setReady(socket, io, data)` - 設定準備狀態
- `getRoomList()` - 取得房間列表
- `handleDisconnect(socket, io)` - 處理斷線

#### 4. 實作輔助函數
- `broadcastRoomList(io)` - 廣播房間列表
- `broadcastRoomState(io, roomId)` - 廣播房間狀態
- `getClientRoomState(room)` - 取得客戶端房間狀態

#### 5. 房間狀態結構
```javascript
const roomState = {
  id: roomId,
  name: roomName,
  maxPlayers: 4,
  hostId: socketId,
  phase: 'waiting', // waiting | playing | finished

  players: [{
    id visitorId,
    name: playerName,
    socketId: socketId,
    visitorId: visitorId,
    isHost: boolean,
    isReady: boolean,
  }],

  gameState: null, // 遊戲開始後才有

  createdAt: timestamp,
};
```

### 驗收標準
1. 檔案 `backend/evolutionGameHandler.js` 已建立
2. 房間 CRUD 操作函數已實作
3. 廣播函數已實作
4. 程式碼風格與現有程式碼一致

### 相關檔案
- `backend/evolutionGameHandler.js`（新建）
- `backend/server.js`（參考）

### 依賴工單
無

### 被依賴工單
- 0314, 0315
