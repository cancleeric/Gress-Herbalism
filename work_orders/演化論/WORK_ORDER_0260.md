# 工作單 0260

## 編號
0260

## 日期
2026-01-31

## 工作單標題
修改大廳支援遊戲選擇

## 工單主旨
修改大廳頁面 `Lobby` 組件，加入遊戲類型選擇器，支援本草和演化論兩款遊戲

## 內容

### 任務描述

修改現有大廳頁面，讓玩家可以選擇要玩的遊戲類型，並顯示對應的房間列表。

### 修改項目

#### 1. 遊戲選擇器 UI
```jsx
function GameSelector({ selectedGame, onSelect }) {
  return (
    <div className="game-selector">
      <button
        className={`game-btn ${selectedGame === 'herbalism' ? 'active' : ''}`}
        onClick={() => onSelect('herbalism')}
      >
        <span className="game-icon">🌿</span>
        <span className="game-name">本草</span>
      </button>
      <button
        className={`game-btn ${selectedGame === 'evolution' ? 'active' : ''}`}
        onClick={() => onSelect('evolution')}
      >
        <span className="game-icon">🦎</span>
        <span className="game-name">演化論</span>
      </button>
    </div>
  );
}
```

#### 2. 房間列表篩選
```javascript
// 根據選擇的遊戲類型篩選房間
const filteredRooms = rooms.filter(room => room.gameType === selectedGame);
```

#### 3. 創建房間時指定遊戲類型
```javascript
const handleCreateRoom = () => {
  socketService.emit('createRoom', {
    gameType: selectedGame,
    maxPlayers: selectedGame === 'herbalism' ? 4 : 4,
    roomName: roomName || `${playerName}的房間`
  });
};
```

#### 4. 房間列表項目顯示遊戲類型
```jsx
function RoomItem({ room }) {
  return (
    <div className="room-item">
      <span className="game-type-badge">
        {room.gameType === 'herbalism' ? '🌿 本草' : '🦎 演化論'}
      </span>
      <span className="room-name">{room.name}</span>
      <span className="player-count">{room.playerCount}/{room.maxPlayers}</span>
      <button onClick={() => joinRoom(room.id)}>加入</button>
    </div>
  );
}
```

### Socket 事件修改

| 事件 | 修改內容 |
|------|---------|
| createRoom | 加入 gameType 參數 |
| roomCreated | 返回 gameType |
| roomList | 每個房間包含 gameType |
| joinRoom | 根據 gameType 導向不同路由 |

### 路由修改

```javascript
// App.js
<Routes>
  <Route path="/" element={<Lobby />} />
  <Route path="/game/herbalism/:roomId" element={<HerbalismRoom />} />
  <Route path="/game/evolution/:roomId" element={<EvolutionRoom />} />
</Routes>
```

### 前置條件
- 工單 0252-0259 已完成（演化論前端組件）

### 驗收標準
- [ ] 遊戲選擇器正確顯示
- [ ] 房間列表按遊戲類型篩選
- [ ] 創建房間時正確傳送遊戲類型
- [ ] 加入房間後導向正確路由
- [ ] 測試覆蓋率 ≥ 70%

### 相關檔案
- `frontend/src/components/Lobby/Lobby.js` — 修改
- `frontend/src/components/Lobby/Lobby.css` — 修改
- `frontend/src/App.js` — 修改

### 參考計畫書
`docs/演化論/PLAN_EVOLUTION_DEVELOPMENT.md` 第二章 2.1.3 節
