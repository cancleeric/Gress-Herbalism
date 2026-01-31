# 工作單 0253

## 編號
0253

## 日期
2026-01-31

## 工作單標題
建立遊戲桌面組件

## 工單主旨
建立演化論遊戲的桌面組件 `GameBoard` 和食物池組件 `FoodPool`

## 內容

### 任務描述

建立遊戲桌面的核心視覺組件，包含食物池和中央區域顯示。

### 組件結構

```
frontend/src/components/games/evolution/
├── GameBoard/
│   ├── GameBoard.js
│   ├── GameBoard.css
│   └── index.js
├── FoodPool/
│   ├── FoodPool.js
│   ├── FoodPool.css
│   └── index.js
```

### GameBoard 組件

#### Props 定義
```javascript
GameBoard.propTypes = {
  players: PropTypes.array.isRequired,
  currentPlayerId: PropTypes.string.isRequired,
  foodPool: PropTypes.object.isRequired,
  deckCount: PropTypes.number.isRequired,
  phase: PropTypes.string.isRequired
};
```

#### 佈局結構
```jsx
function GameBoard({ players, currentPlayerId, foodPool, deckCount, phase }) {
  const opponents = players.filter(p => p.id !== currentPlayerId);
  const currentPlayer = players.find(p => p.id === currentPlayerId);

  return (
    <div className="game-board">
      {/* 2人: 對手在上方 */}
      {/* 3人: 對手在上方和側邊 */}
      {/* 4人: 對手在上方和兩側 */}
      <div className="opponents-row top">
        {opponents.slice(0, 2).map(opponent => (
          <OpponentArea key={opponent.id} player={opponent} />
        ))}
      </div>

      <div className="center-area">
        <FoodPool foodPool={foodPool} deckCount={deckCount} />
      </div>

      <div className="player-area">
        <MyArea player={currentPlayer} />
      </div>
    </div>
  );
}
```

### FoodPool 組件

#### Props 定義
```javascript
FoodPool.propTypes = {
  foodPool: PropTypes.shape({
    red: PropTypes.number.isRequired,
    blue: PropTypes.number.isRequired
  }).isRequired,
  deckCount: PropTypes.number.isRequired,
  onFoodClick: PropTypes.func  // 進食階段點擊食物
};
```

#### 視覺呈現
```jsx
function FoodPool({ foodPool, deckCount, onFoodClick }) {
  return (
    <div className="food-pool">
      <div className="food-container">
        <div className="food-type red">
          <span className="food-icon">🔴</span>
          <span className="food-count">{foodPool.red}</span>
        </div>
        {foodPool.blue > 0 && (
          <div className="food-type blue">
            <span className="food-icon">🔵</span>
            <span className="food-count">{foodPool.blue}</span>
          </div>
        )}
      </div>

      <div className="deck-info">
        <span className="deck-icon">🃏</span>
        <span className="deck-count">牌庫: {deckCount}</span>
      </div>
    </div>
  );
}
```

### CSS 樣式要點

```css
.game-board {
  display: grid;
  grid-template-rows: 1fr auto 2fr;
  height: 100%;
  gap: 1rem;
}

.food-pool {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  background: linear-gradient(145deg, #2a3a2a, #1a2a1a);
  border-radius: 1rem;
  box-shadow: inset 0 0 20px rgba(0,0,0,0.5);
}

.food-type {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.5rem;
}
```

### 前置條件
- 工單 0252 同步開發（遊戲房間組件）

### 驗收標準
- [ ] GameBoard 正確顯示玩家佈局
- [ ] FoodPool 正確顯示食物數量
- [ ] 支援 2-4 人不同佈局
- [ ] 響應式設計
- [ ] 測試覆蓋率 ≥ 70%

### 相關檔案
- `frontend/src/components/games/evolution/GameBoard/` — 新建
- `frontend/src/components/games/evolution/FoodPool/` — 新建

### 參考計畫書
`docs/演化論/PLAN_EVOLUTION_DEVELOPMENT.md` 第五章 5.1 節
