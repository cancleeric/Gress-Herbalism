# 工作單 0257

## 編號
0257

## 日期
2026-01-31

## 工作單標題
建立攻擊判定組件

## 工單主旨
建立演化論遊戲的攻擊判定組件 `AttackResolver` 和擲骰組件 `DiceRoller`

## 內容

### 任務描述

建立處理肉食攻擊互動的 UI 組件，包含攻擊確認、防禦選擇、擲骰動畫等。

### 組件結構

```
frontend/src/components/games/evolution/
├── AttackResolver/
│   ├── AttackResolver.js
│   ├── AttackResolver.css
│   └── index.js
├── DiceRoller/
│   ├── DiceRoller.js
│   ├── DiceRoller.css
│   └── index.js
```

### AttackResolver 組件

#### Props 定義
```javascript
AttackResolver.propTypes = {
  attack: PropTypes.shape({
    attackerId: PropTypes.string.isRequired,
    defenderId: PropTypes.string.isRequired,
    attackerName: PropTypes.string,
    defenderName: PropTypes.string,
    pendingResponse: PropTypes.string  // 'tailLoss', 'mimicry', 'agile'
  }).isRequired,
  defenderTraits: PropTypes.array,
  availableMimicryTargets: PropTypes.array,
  isDefender: PropTypes.bool,  // 是否為被攻擊方
  onResolve: PropTypes.func.isRequired
};
```

#### 視覺呈現
```jsx
function AttackResolver({ attack, defenderTraits, availableMimicryTargets, isDefender, onResolve }) {
  const [selectedOption, setSelectedOption] = useState(null);

  const renderDefenseOptions = () => {
    switch (attack.pendingResponse) {
      case 'tailLoss':
        return (
          <div className="defense-options">
            <h4>斷尾防禦</h4>
            <p>選擇要棄置的性狀來取消攻擊：</p>
            {defenderTraits.map(trait => (
              <button
                key={trait.id}
                className={`trait-option ${selectedOption === trait.id ? 'selected' : ''}`}
                onClick={() => setSelectedOption(trait.id)}
              >
                {trait.name}
              </button>
            ))}
            <button onClick={() => onResolve({ useTailLoss: true, traitId: selectedOption })}>
              確認斷尾
            </button>
            <button onClick={() => onResolve({ useTailLoss: false })}>
              放棄防禦
            </button>
          </div>
        );

      case 'mimicry':
        return (
          <div className="defense-options">
            <h4>擬態防禦</h4>
            <p>選擇要轉移攻擊的生物：</p>
            {availableMimicryTargets.map(creature => (
              <button
                key={creature.id}
                onClick={() => onResolve({ useMimicry: true, targetId: creature.id })}
              >
                轉移給 {creature.name}
              </button>
            ))}
            <button onClick={() => onResolve({ useMimicry: false })}>
              放棄防禦
            </button>
          </div>
        );

      case 'agile':
        return (
          <div className="defense-options">
            <h4>敏捷閃避</h4>
            <DiceRoller onResult={(dice) => onResolve({ agileRoll: dice })} />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="attack-resolver-overlay">
      <div className="attack-resolver-modal">
        <div className="attack-header">
          <span className="attacker">🦖 {attack.attackerName}</span>
          <span className="arrow">⚔️</span>
          <span className="defender">🦎 {attack.defenderName}</span>
        </div>

        {isDefender ? (
          renderDefenseOptions()
        ) : (
          <div className="waiting-message">
            等待 {attack.defenderName} 選擇防禦方式...
          </div>
        )}
      </div>
    </div>
  );
}
```

### DiceRoller 組件

#### Props 定義
```javascript
DiceRoller.propTypes = {
  onResult: PropTypes.func.isRequired,
  autoRoll: PropTypes.bool,
  targetNumber: PropTypes.number  // 4-6 成功的閾值
};
```

#### 視覺呈現
```jsx
function DiceRoller({ onResult, autoRoll = false, targetNumber = 4 }) {
  const [isRolling, setIsRolling] = useState(false);
  const [result, setResult] = useState(null);

  const rollDice = () => {
    setIsRolling(true);
    setResult(null);

    // 動畫效果
    const animationDuration = 1500;
    const finalResult = Math.floor(Math.random() * 6) + 1;

    setTimeout(() => {
      setIsRolling(false);
      setResult(finalResult);
      onResult(finalResult);
    }, animationDuration);
  };

  useEffect(() => {
    if (autoRoll) {
      rollDice();
    }
  }, [autoRoll]);

  return (
    <div className="dice-roller">
      <div className={`dice ${isRolling ? 'rolling' : ''}`}>
        {result || '?'}
      </div>

      {result !== null && (
        <div className={`result ${result >= targetNumber ? 'success' : 'fail'}`}>
          {result >= targetNumber ? '逃脫成功！' : '逃脫失敗...'}
        </div>
      )}

      {!autoRoll && result === null && (
        <button className="roll-btn" onClick={rollDice} disabled={isRolling}>
          擲骰
        </button>
      )}
    </div>
  );
}
```

### CSS 樣式要點

```css
.attack-resolver-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.attack-resolver-modal {
  background: #2a3a2a;
  padding: 2rem;
  border-radius: 12px;
  min-width: 400px;
}

.dice {
  width: 80px;
  height: 80px;
  font-size: 3rem;
  display: flex;
  justify-content: center;
  align-items: center;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
}

.dice.rolling {
  animation: shake 0.1s infinite;
}

@keyframes shake {
  0%, 100% { transform: rotate(-5deg); }
  50% { transform: rotate(5deg); }
}
```

### 前置條件
- 工單 0252-0254 同步開發

### 驗收標準
- [ ] 攻擊判定彈窗正確顯示
- [ ] 斷尾選擇功能正確
- [ ] 擬態選擇功能正確
- [ ] 敏捷擲骰動畫流暢
- [ ] 測試覆蓋率 ≥ 70%

### 相關檔案
- `frontend/src/components/games/evolution/AttackResolver/` — 新建
- `frontend/src/components/games/evolution/DiceRoller/` — 新建

### 參考計畫書
`docs/演化論/PLAN_EVOLUTION_DEVELOPMENT.md` 第五章
