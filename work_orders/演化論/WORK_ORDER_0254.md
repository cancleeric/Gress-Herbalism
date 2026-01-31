# 工作單 0254

## 編號
0254

## 日期
2026-01-31

## 工作單標題
建立卡牌組件

## 工單主旨
建立演化論遊戲的卡牌組件 `CreatureCard` 和 `TraitCard`

## 內容

### 任務描述

建立遊戲中最重要的視覺元素——卡牌組件，包含生物卡和性狀卡的呈現。

### 組件結構

```
frontend/src/components/games/evolution/
├── CreatureCard/
│   ├── CreatureCard.js
│   ├── CreatureCard.css
│   └── index.js
├── TraitCard/
│   ├── TraitCard.js
│   ├── TraitCard.css
│   └── index.js
```

### CreatureCard 組件

#### Props 定義
```javascript
CreatureCard.propTypes = {
  creature: PropTypes.shape({
    id: PropTypes.string.isRequired,
    traits: PropTypes.array.isRequired,
    food: PropTypes.object.isRequired,
    foodNeeded: PropTypes.number.isRequired,
    isFed: PropTypes.bool.isRequired,
    hibernating: PropTypes.bool
  }).isRequired,
  isOwn: PropTypes.bool,
  onSelect: PropTypes.func,
  isSelected: PropTypes.bool,
  isTargetable: PropTypes.bool
};
```

#### 視覺呈現
```jsx
function CreatureCard({ creature, isOwn, onSelect, isSelected, isTargetable }) {
  return (
    <div
      className={`creature-card ${isSelected ? 'selected' : ''} ${isTargetable ? 'targetable' : ''}`}
      onClick={() => isTargetable && onSelect?.(creature.id)}
    >
      {/* 生物圖示 */}
      <div className="creature-icon">🦎</div>

      {/* 性狀列表 */}
      <div className="traits-list">
        {creature.traits.map(trait => (
          <TraitBadge key={trait.id} trait={trait} />
        ))}
      </div>

      {/* 食物顯示 */}
      <div className="food-display">
        <FoodIndicator food={creature.food} needed={creature.foodNeeded} />
      </div>

      {/* 狀態標記 */}
      {creature.isFed && <span className="status-badge fed">飽</span>}
      {creature.hibernating && <span className="status-badge hibernate">眠</span>}
    </div>
  );
}
```

### TraitCard 組件（手牌用）

#### Props 定義
```javascript
TraitCard.propTypes = {
  card: PropTypes.shape({
    id: PropTypes.string.isRequired,
    traitType: PropTypes.string.isRequired,
    foodBonus: PropTypes.number
  }).isRequired,
  onPlay: PropTypes.func,
  isPlayable: PropTypes.bool,
  showBothSides: PropTypes.bool  // 顯示雙面
};
```

#### 雙面卡設計
```jsx
function TraitCard({ card, onPlay, isPlayable, showBothSides }) {
  const [showCreatureSide, setShowCreatureSide] = useState(false);
  const traitInfo = getTraitInfo(card.traitType);

  return (
    <div
      className={`trait-card ${isPlayable ? 'playable' : ''}`}
      onMouseEnter={() => showBothSides && setShowCreatureSide(true)}
      onMouseLeave={() => setShowCreatureSide(false)}
    >
      {showCreatureSide ? (
        <div className="card-side creature-side">
          <div className="creature-icon">🦎</div>
          <span>創造生物</span>
        </div>
      ) : (
        <div className="card-side trait-side">
          {card.foodBonus > 0 && (
            <span className="food-bonus">+{card.foodBonus}</span>
          )}
          <div className="trait-name">{traitInfo.name}</div>
          <div className="trait-description">{traitInfo.description}</div>
        </div>
      )}

      {isPlayable && (
        <div className="play-options">
          <button onClick={() => onPlay(card.id, 'creature')}>生物</button>
          <button onClick={() => onPlay(card.id, 'trait')}>性狀</button>
        </div>
      )}
    </div>
  );
}
```

### TraitBadge 組件（生物上的性狀標籤）

```jsx
function TraitBadge({ trait }) {
  const traitInfo = getTraitInfo(trait.type);

  return (
    <div className={`trait-badge ${trait.type}`}>
      <span className="trait-icon">{traitInfo.icon}</span>
      <span className="trait-name">{traitInfo.name}</span>
      {trait.foodBonus > 0 && <span className="bonus">+{trait.foodBonus}</span>}
    </div>
  );
}
```

### CSS 樣式要點

```css
.creature-card {
  width: 120px;
  min-height: 150px;
  border-radius: 8px;
  background: linear-gradient(145deg, #3a4a3a, #2a3a2a);
  border: 2px solid #4a5a4a;
  transition: all 0.2s;
}

.creature-card.selected {
  border-color: #4a9eff;
  box-shadow: 0 0 10px rgba(74, 158, 255, 0.5);
}

.trait-card {
  width: 80px;
  height: 120px;
  perspective: 1000px;
}

.trait-card .card-side {
  backface-visibility: hidden;
  transition: transform 0.3s;
}
```

### 前置條件
- 工單 0252, 0253 同步開發

### 驗收標準
- [ ] 生物卡正確顯示所有資訊
- [ ] 性狀卡支援雙面顯示
- [ ] 卡牌互動狀態正確
- [ ] 樣式美觀一致
- [ ] 測試覆蓋率 ≥ 70%

### 相關檔案
- `frontend/src/components/games/evolution/CreatureCard/` — 新建
- `frontend/src/components/games/evolution/TraitCard/` — 新建

### 參考計畫書
`docs/演化論/PLAN_EVOLUTION_DEVELOPMENT.md` 第五章 5.2 節
