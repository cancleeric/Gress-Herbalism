# 工作單 0273

## 編號
0273

## 日期
2026-01-31

## 標題
演化論房間等待介面

## 主旨
BUG 修復 - Socket 連接

## 關聯計畫書
`BUG/BUG_PLAN_EVOLUTION_SOCKET.md`

## 內容

### 目標
創建演化論遊戲的房間等待/準備介面，讓玩家可以在遊戲開始前加入房間並準備。

### 工作項目

#### 1. 創建 EvolutionLobby 組件

**檔案結構：**
```
frontend/src/components/games/evolution/EvolutionLobby/
├── EvolutionLobby.js
├── EvolutionLobby.css
└── index.js
```

**EvolutionLobby.js 功能：**
- 顯示房間資訊（房間名稱、房間 ID）
- 顯示玩家列表（名稱、準備狀態、是否為房主）
- 準備/取消準備按鈕
- 房主專用：開始遊戲按鈕（所有玩家準備後才能點擊）
- 離開房間按鈕
- 顯示連線狀態

#### 2. 組件架構

```jsx
function EvolutionLobby({ roomId, onGameStart, onLeave }) {
  const { user } = useAuth();
  const [room, setRoom] = useState(null);
  const [isReady, setIsReady] = useState(false);

  // Socket 事件監聽
  useEffect(() => {
    // 監聽玩家加入/離開
    // 監聯準備狀態變更
    // 監聽遊戲開始
    // 監聽錯誤
  }, []);

  // 處理準備切換
  const handleToggleReady = () => { ... };

  // 處理開始遊戲
  const handleStartGame = () => { ... };

  // 處理離開房間
  const handleLeaveRoom = () => { ... };

  return (
    <div className="evolution-lobby">
      <div className="room-header">
        <h2>{room?.name || '演化論房間'}</h2>
        <span className="room-id">房間 ID: {roomId}</span>
      </div>

      <div className="players-section">
        <h3>玩家列表 ({room?.players?.length || 0}/{room?.maxPlayers || 4})</h3>
        <div className="player-list">
          {room?.players?.map(player => (
            <div key={player.id} className="player-card">
              <span className="player-name">{player.name}</span>
              {player.isHost && <span className="host-badge">房主</span>}
              <span className={`ready-status ${player.isReady ? 'ready' : ''}`}>
                {player.isReady ? '已準備' : '未準備'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="action-buttons">
        <button onClick={handleToggleReady}>
          {isReady ? '取消準備' : '準備'}
        </button>
        {isHost && (
          <button
            onClick={handleStartGame}
            disabled={!allPlayersReady || room?.players?.length < 2}
          >
            開始遊戲
          </button>
        )}
        <button onClick={handleLeaveRoom} className="leave-btn">
          離開房間
        </button>
      </div>
    </div>
  );
}
```

#### 3. 樣式設計

```css
.evolution-lobby {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.room-header {
  text-align: center;
  margin-bottom: 20px;
}

.room-id {
  color: #666;
  font-size: 0.9em;
}

.players-section {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
}

.player-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.player-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: white;
  border-radius: 4px;
}

.host-badge {
  background: #ffd700;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.8em;
}

.ready-status {
  margin-left: auto;
  color: #999;
}

.ready-status.ready {
  color: #4caf50;
  font-weight: bold;
}

.action-buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.leave-btn {
  background: #f44336;
  color: white;
}
```

#### 4. 更新 index.js 導出

```javascript
export { default as EvolutionLobby } from './EvolutionLobby';
```

### 驗收標準
1. EvolutionLobby 組件正確顯示房間資訊
2. 玩家列表正確顯示所有玩家及其狀態
3. 準備/取消準備功能正常運作
4. 房主可以在條件滿足時開始遊戲
5. 離開房間功能正常
6. Socket 事件正確處理

### 相關檔案
- `frontend/src/components/games/evolution/EvolutionLobby/EvolutionLobby.js`（新增）
- `frontend/src/components/games/evolution/EvolutionLobby/EvolutionLobby.css`（新增）
- `frontend/src/components/games/evolution/EvolutionLobby/index.js`（新增）
- `frontend/src/components/games/evolution/index.js`（更新導出）

### 依賴工單
- 0272

### 被依賴工單
- 0274
