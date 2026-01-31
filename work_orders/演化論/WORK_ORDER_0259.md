# 工作單 0259

## 編號
0259

## 日期
2026-01-31

## 工作單標題
建立計分與日誌組件

## 工單主旨
建立演化論遊戲的計分板組件 `ScoreBoard` 和遊戲日誌組件 `GameLog`

## 內容

### 任務描述

建立遊戲結束時的計分顯示和遊戲進行中的事件日誌組件。

### 組件結構

```
frontend/src/components/games/evolution/
├── ScoreBoard/
│   ├── ScoreBoard.js
│   ├── ScoreBoard.css
│   └── index.js
├── GameLog/
│   ├── GameLog.js
│   ├── GameLog.css
│   └── index.js
```

### ScoreBoard 組件

#### Props 定義
```javascript
ScoreBoard.propTypes = {
  players: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    score: PropTypes.number.isRequired,
    breakdown: PropTypes.shape({
      creatures: PropTypes.number,
      traits: PropTypes.number,
      foodBonus: PropTypes.number
    })
  })).isRequired,
  winnerId: PropTypes.string,
  onClose: PropTypes.func,
  onPlayAgain: PropTypes.func
};
```

#### 計分規則
```javascript
const SCORING_RULES = [
  { label: '存活生物', perUnit: '每隻 +2 分', key: 'creatures' },
  { label: '性狀卡', perUnit: '每張 +1 分', key: 'traits' },
  { label: '食量加成', perUnit: '+1/+2 性狀額外', key: 'foodBonus' }
];
```

#### 視覺呈現
```jsx
function ScoreBoard({ players, winnerId, onClose, onPlayAgain }) {
  // 按分數排序
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="scoreboard-overlay">
      <div className="scoreboard-modal">
        <h2>🏆 遊戲結束</h2>

        <div className="scores-table">
          <div className="table-header">
            <span>排名</span>
            <span>玩家</span>
            <span>生物</span>
            <span>性狀</span>
            <span>加成</span>
            <span>總分</span>
          </div>

          {sortedPlayers.map((player, index) => (
            <div
              key={player.id}
              className={`score-row ${player.id === winnerId ? 'winner' : ''}`}
            >
              <span className="rank">
                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
              </span>
              <span className="player-name">{player.name}</span>
              <span>{player.breakdown.creatures} × 2 = {player.breakdown.creatures * 2}</span>
              <span>{player.breakdown.traits} × 1 = {player.breakdown.traits}</span>
              <span>+{player.breakdown.foodBonus}</span>
              <span className="total-score">{player.score}</span>
            </div>
          ))}
        </div>

        <div className="winner-announcement">
          🎉 {sortedPlayers[0].name} 獲勝！
        </div>

        <div className="actions">
          <button onClick={onClose}>返回大廳</button>
          <button onClick={onPlayAgain}>再來一局</button>
        </div>
      </div>
    </div>
  );
}
```

### GameLog 組件

#### Props 定義
```javascript
GameLog.propTypes = {
  logs: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    timestamp: PropTypes.number,
    type: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    playerId: PropTypes.string
  })).isRequired,
  maxVisible: PropTypes.number
};
```

#### 日誌類型
```javascript
const LOG_TYPES = {
  creature_created: { icon: '🦎', color: '#4caf50' },
  trait_added: { icon: '🧬', color: '#2196f3' },
  food_taken: { icon: '🔴', color: '#ff9800' },
  attack: { icon: '⚔️', color: '#f44336' },
  attack_success: { icon: '💀', color: '#9c27b0' },
  attack_failed: { icon: '🛡️', color: '#4caf50' },
  dice_roll: { icon: '🎲', color: '#ffc107' },
  extinction: { icon: '☠️', color: '#795548' },
  chain_effect: { icon: '⛓️', color: '#607d8b' },
  phase_change: { icon: '📢', color: '#03a9f4' }
};
```

#### 視覺呈現
```jsx
function GameLog({ logs, maxVisible = 10 }) {
  const logContainerRef = useRef(null);

  // 自動滾動到最新
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const visibleLogs = logs.slice(-maxVisible);

  return (
    <div className="game-log">
      <div className="log-header">
        <span>📜 遊戲日誌</span>
      </div>

      <div className="log-container" ref={logContainerRef}>
        {visibleLogs.map(log => {
          const logStyle = LOG_TYPES[log.type] || { icon: '📝', color: '#888' };

          return (
            <div key={log.id} className="log-entry" style={{ borderLeftColor: logStyle.color }}>
              <span className="log-icon">{logStyle.icon}</span>
              <span className="log-message">{log.message}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

### CSS 樣式要點

```css
.scoreboard-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.score-row.winner {
  background: linear-gradient(90deg, rgba(255,215,0,0.3), transparent);
  font-weight: bold;
}

.game-log {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  max-height: 200px;
  overflow: hidden;
}

.log-container {
  max-height: 160px;
  overflow-y: auto;
}

.log-entry {
  padding: 0.5rem;
  border-left: 3px solid;
  margin: 0.25rem 0;
  font-size: 0.9rem;
}
```

### 前置條件
- 工單 0252 同步開發

### 驗收標準
- [ ] 計分板正確顯示分數明細
- [ ] 日誌自動滾動到最新
- [ ] 不同類型日誌有不同樣式
- [ ] 動畫效果流暢
- [ ] 測試覆蓋率 ≥ 70%

### 相關檔案
- `frontend/src/components/games/evolution/ScoreBoard/` — 新建
- `frontend/src/components/games/evolution/GameLog/` — 新建

### 參考計畫書
`docs/演化論/PLAN_EVOLUTION_DEVELOPMENT.md` 第五章
