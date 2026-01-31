# 工作單 0256

## 編號
0256

## 日期
2026-01-31

## 工作單標題
建立階段指示器組件

## 工單主旨
建立演化論遊戲的階段指示器組件 `PhaseIndicator` 和回合計時器組件 `TurnTimer`

## 內容

### 任務描述

建立遊戲狀態指示組件，讓玩家清楚了解當前遊戲階段和剩餘時間。

### 組件結構

```
frontend/src/components/games/evolution/
├── PhaseIndicator/
│   ├── PhaseIndicator.js
│   ├── PhaseIndicator.css
│   └── index.js
├── TurnTimer/
│   ├── TurnTimer.js
│   ├── TurnTimer.css
│   └── index.js
```

### PhaseIndicator 組件

#### Props 定義
```javascript
PhaseIndicator.propTypes = {
  phase: PropTypes.oneOf([
    'waiting', 'evolution', 'foodSupply', 'feeding', 'extinction', 'gameEnd'
  ]).isRequired,
  round: PropTypes.number.isRequired,
  isLastRound: PropTypes.bool,
  currentPlayerName: PropTypes.string
};
```

#### 階段資訊
```javascript
const PHASE_INFO = {
  waiting: { name: '等待中', icon: '⏳', color: '#888' },
  evolution: { name: '演化階段', icon: '🧬', color: '#4caf50' },
  foodSupply: { name: '食物供給', icon: '🎲', color: '#ff9800' },
  feeding: { name: '進食階段', icon: '🍖', color: '#f44336' },
  extinction: { name: '滅絕階段', icon: '💀', color: '#9c27b0' },
  gameEnd: { name: '遊戲結束', icon: '🏆', color: '#ffd700' }
};
```

#### 視覺呈現
```jsx
function PhaseIndicator({ phase, round, isLastRound, currentPlayerName }) {
  const phaseInfo = PHASE_INFO[phase];

  return (
    <div className="phase-indicator">
      {/* 階段標籤列 */}
      <div className="phase-tabs">
        {Object.entries(PHASE_INFO).slice(1, 5).map(([key, info]) => (
          <div
            key={key}
            className={`phase-tab ${phase === key ? 'active' : ''}`}
            style={{ '--phase-color': info.color }}
          >
            <span className="phase-icon">{info.icon}</span>
            <span className="phase-name">{info.name}</span>
          </div>
        ))}
      </div>

      {/* 回合資訊 */}
      <div className="round-info">
        <span className="round-number">回合 {round}</span>
        {isLastRound && <span className="last-round-badge">最後一回合!</span>}
      </div>

      {/* 當前玩家 */}
      {currentPlayerName && (
        <div className="current-player">
          輪到: <strong>{currentPlayerName}</strong>
        </div>
      )}
    </div>
  );
}
```

### TurnTimer 組件

#### Props 定義
```javascript
TurnTimer.propTypes = {
  duration: PropTypes.number.isRequired,  // 秒數
  isActive: PropTypes.bool.isRequired,
  onTimeout: PropTypes.func
};
```

#### 視覺呈現
```jsx
function TurnTimer({ duration, isActive, onTimeout }) {
  const [remaining, setRemaining] = useState(duration);

  useEffect(() => {
    if (!isActive) {
      setRemaining(duration);
      return;
    }

    const timer = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          onTimeout?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, duration, onTimeout]);

  const progress = (remaining / duration) * 100;
  const isLow = remaining <= 10;

  return (
    <div className={`turn-timer ${isLow ? 'low' : ''}`}>
      <div className="timer-bar" style={{ width: `${progress}%` }} />
      <span className="timer-text">{remaining}秒</span>
    </div>
  );
}
```

### CSS 樣式要點

```css
.phase-indicator {
  display: flex;
  align-items: center;
  gap: 2rem;
  padding: 0.5rem 1rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
}

.phase-tabs {
  display: flex;
  gap: 0.5rem;
}

.phase-tab {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  opacity: 0.5;
  transition: all 0.3s;
}

.phase-tab.active {
  opacity: 1;
  background: var(--phase-color);
  color: white;
}

.last-round-badge {
  background: #f44336;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  animation: blink 1s infinite;
}

.turn-timer {
  position: relative;
  width: 100px;
  height: 24px;
  background: #333;
  border-radius: 12px;
  overflow: hidden;
}

.turn-timer.low .timer-bar {
  background: #f44336;
  animation: pulse 0.5s infinite;
}
```

### 前置條件
- 工單 0252 同步開發

### 驗收標準
- [ ] 階段指示器正確顯示當前階段
- [ ] 回合計時器正確倒數
- [ ] 最後一回合有明顯提示
- [ ] 動畫效果流暢
- [ ] 測試覆蓋率 ≥ 70%

### 相關檔案
- `frontend/src/components/games/evolution/PhaseIndicator/` — 新建
- `frontend/src/components/games/evolution/TurnTimer/` — 新建

### 參考計畫書
`docs/演化論/PLAN_EVOLUTION_DEVELOPMENT.md` 第五章 5.1 節
