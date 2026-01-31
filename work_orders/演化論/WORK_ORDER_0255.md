# 工作單 0255

## 編號
0255

## 日期
2026-01-31

## 工作單標題
建立玩家區域組件

## 工單主旨
建立演化論遊戲的玩家區域組件 `PlayerArea` 和手牌組件 `HandCards`

## 內容

### 任務描述

建立玩家區域的組件，顯示玩家的生物群和手牌區域。

### 組件結構

```
frontend/src/components/games/evolution/
├── PlayerArea/
│   ├── PlayerArea.js
│   ├── PlayerArea.css
│   └── index.js
├── HandCards/
│   ├── HandCards.js
│   ├── HandCards.css
│   └── index.js
```

### PlayerArea 組件

#### Props 定義
```javascript
PlayerArea.propTypes = {
  player: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    creatures: PropTypes.array.isRequired,
    hand: PropTypes.array,  // 對手時為 null 或長度
    discardPile: PropTypes.array
  }).isRequired,
  isOpponent: PropTypes.bool,
  isCurrentTurn: PropTypes.bool,
  onCreatureSelect: PropTypes.func,
  onCreateCreature: PropTypes.func
};
```

#### 視覺呈現
```jsx
function PlayerArea({ player, isOpponent, isCurrentTurn, onCreatureSelect, onCreateCreature }) {
  return (
    <div className={`player-area ${isOpponent ? 'opponent' : 'self'} ${isCurrentTurn ? 'active' : ''}`}>
      {/* 玩家資訊 */}
      <div className="player-info">
        <span className="player-name">{player.name}</span>
        {isOpponent && (
          <span className="hand-count">手牌: {player.handCount || 0}</span>
        )}
      </div>

      {/* 生物區域 */}
      <div className="creatures-area">
        {player.creatures.map((creature, index) => (
          <div key={creature.id} className="creature-slot">
            <CreatureCard
              creature={creature}
              isOwn={!isOpponent}
              onSelect={onCreatureSelect}
            />

            {/* 互動連結顯示 */}
            {index < player.creatures.length - 1 && (
              <InteractionLink
                creature1={creature}
                creature2={player.creatures[index + 1]}
              />
            )}
          </div>
        ))}

        {/* 創造生物按鈕 */}
        {!isOpponent && (
          <button className="create-creature-btn" onClick={onCreateCreature}>
            + 創造生物
          </button>
        )}
      </div>
    </div>
  );
}
```

### HandCards 組件

#### Props 定義
```javascript
HandCards.propTypes = {
  cards: PropTypes.array.isRequired,
  onCardPlay: PropTypes.func.isRequired,
  isPlayable: PropTypes.bool,
  selectedCard: PropTypes.string
};
```

#### 視覺呈現
```jsx
function HandCards({ cards, onCardPlay, isPlayable, selectedCard }) {
  return (
    <div className="hand-cards">
      <div className="hand-label">我的手牌 ({cards.length})</div>

      <div className="cards-container">
        {cards.map((card, index) => (
          <div
            key={card.id}
            className="card-wrapper"
            style={{ '--index': index, '--total': cards.length }}
          >
            <TraitCard
              card={card}
              onPlay={onCardPlay}
              isPlayable={isPlayable}
              isSelected={card.id === selectedCard}
              showBothSides={true}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### CSS 樣式要點

```css
.player-area {
  padding: 1rem;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.2);
}

.player-area.active {
  border: 2px solid #ffd700;
  animation: pulse 1s infinite;
}

.creatures-area {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: center;
}

.hand-cards .cards-container {
  display: flex;
  justify-content: center;
  position: relative;
}

.hand-cards .card-wrapper {
  /* 扇形排列 */
  transform: rotate(calc((var(--index) - var(--total) / 2) * 5deg));
  margin-left: -30px;
  transition: all 0.2s;
}

.hand-cards .card-wrapper:hover {
  transform: translateY(-20px) scale(1.1);
  z-index: 10;
}
```

### 前置條件
- 工單 0252-0254 同步開發

### 驗收標準
- [ ] 玩家區域正確顯示生物
- [ ] 手牌扇形排列美觀
- [ ] 對手區域隱藏手牌內容
- [ ] 當前回合玩家高亮顯示
- [ ] 測試覆蓋率 ≥ 70%

### 相關檔案
- `frontend/src/components/games/evolution/PlayerArea/` — 新建
- `frontend/src/components/games/evolution/HandCards/` — 新建

### 參考計畫書
`docs/演化論/PLAN_EVOLUTION_DEVELOPMENT.md` 第五章 5.1 節
