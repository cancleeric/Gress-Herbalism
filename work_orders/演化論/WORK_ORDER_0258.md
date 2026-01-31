# 工作單 0258

## 編號
0258

## 日期
2026-01-31

## 工作單標題
建立互動性狀組件

## 工單主旨
建立演化論遊戲的互動性狀連結顯示組件 `InteractionLink` 和性狀選擇器組件 `TraitSelector`

## 內容

### 任務描述

建立互動性狀（溝通、合作、共生）的視覺化連結顯示，以及放置性狀時的選擇介面。

### 組件結構

```
frontend/src/components/games/evolution/
├── InteractionLink/
│   ├── InteractionLink.js
│   ├── InteractionLink.css
│   └── index.js
├── TraitSelector/
│   ├── TraitSelector.js
│   ├── TraitSelector.css
│   └── index.js
```

### InteractionLink 組件

#### Props 定義
```javascript
InteractionLink.propTypes = {
  links: PropTypes.arrayOf(PropTypes.shape({
    type: PropTypes.oneOf(['communication', 'cooperation', 'symbiosis']).isRequired,
    creature1Id: PropTypes.string.isRequired,
    creature2Id: PropTypes.string.isRequired,
    representativeId: PropTypes.string  // 共生專用
  })).isRequired,
  creature1Position: PropTypes.object,
  creature2Position: PropTypes.object
};
```

#### 連結類型樣式
```javascript
const LINK_STYLES = {
  communication: {
    color: '#4caf50',
    label: '溝通',
    icon: '💬',
    lineStyle: 'solid'
  },
  cooperation: {
    color: '#2196f3',
    label: '合作',
    icon: '🤝',
    lineStyle: 'dashed'
  },
  symbiosis: {
    color: '#9c27b0',
    label: '共生',
    icon: '🛡️',
    lineStyle: 'dotted'
  }
};
```

#### 視覺呈現
```jsx
function InteractionLink({ links, creature1Position, creature2Position }) {
  return (
    <svg className="interaction-links-layer">
      {links.map((link, index) => {
        const style = LINK_STYLES[link.type];

        return (
          <g key={index} className="link-group">
            {/* 連結線 */}
            <line
              x1={creature1Position.x}
              y1={creature1Position.y}
              x2={creature2Position.x}
              y2={creature2Position.y}
              stroke={style.color}
              strokeWidth="3"
              strokeDasharray={style.lineStyle === 'dashed' ? '10,5' : 'none'}
            />

            {/* 連結標籤 */}
            <text
              x={(creature1Position.x + creature2Position.x) / 2}
              y={(creature1Position.y + creature2Position.y) / 2 - 10}
              fill={style.color}
              textAnchor="middle"
            >
              {style.icon} {style.label}
            </text>

            {/* 共生箭頭（指向被保護者） */}
            {link.type === 'symbiosis' && (
              <marker>
                {/* 箭頭標記 */}
              </marker>
            )}
          </g>
        );
      })}
    </svg>
  );
}
```

### TraitSelector 組件

#### Props 定義
```javascript
TraitSelector.propTypes = {
  card: PropTypes.object.isRequired,
  playerCreatures: PropTypes.array.isRequired,
  opponentCreatures: PropTypes.array,  // 寄生蟲用
  onSelect: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};
```

#### 視覺呈現
```jsx
function TraitSelector({ card, playerCreatures, opponentCreatures, onSelect, onCancel }) {
  const [selectedCreature, setSelectedCreature] = useState(null);
  const [secondCreature, setSecondCreature] = useState(null);
  const [symbiosisRole, setSymbiosisRole] = useState(null);

  const traitInfo = getTraitInfo(card.traitType);
  const isInteractive = ['communication', 'cooperation', 'symbiosis'].includes(card.traitType);
  const isParasite = card.traitType === 'parasite';

  const handleConfirm = () => {
    if (isInteractive) {
      onSelect({
        cardId: card.id,
        creature1Id: selectedCreature,
        creature2Id: secondCreature,
        symbiosisRole: symbiosisRole
      });
    } else {
      onSelect({
        cardId: card.id,
        creatureId: selectedCreature
      });
    }
  };

  return (
    <div className="trait-selector-overlay">
      <div className="trait-selector-modal">
        <div className="trait-info">
          <h3>{traitInfo.name}</h3>
          <p>{traitInfo.description}</p>
        </div>

        <div className="selection-area">
          {isParasite ? (
            <>
              <h4>選擇對手的生物：</h4>
              <div className="creatures-list">
                {opponentCreatures.map(creature => (
                  <CreatureCard
                    key={creature.id}
                    creature={creature}
                    isSelected={selectedCreature === creature.id}
                    onSelect={() => setSelectedCreature(creature.id)}
                  />
                ))}
              </div>
            </>
          ) : isInteractive ? (
            <>
              <h4>選擇兩隻相鄰的生物：</h4>
              <div className="creatures-list">
                {playerCreatures.map(creature => (
                  <CreatureCard
                    key={creature.id}
                    creature={creature}
                    isSelected={selectedCreature === creature.id || secondCreature === creature.id}
                    onSelect={() => {
                      if (!selectedCreature) setSelectedCreature(creature.id);
                      else if (!secondCreature) setSecondCreature(creature.id);
                    }}
                  />
                ))}
              </div>

              {card.traitType === 'symbiosis' && selectedCreature && secondCreature && (
                <div className="symbiosis-role">
                  <h4>指定代表動物：</h4>
                  <button onClick={() => setSymbiosisRole(selectedCreature)}>
                    {playerCreatures.find(c => c.id === selectedCreature)?.name} 為代表
                  </button>
                  <button onClick={() => setSymbiosisRole(secondCreature)}>
                    {playerCreatures.find(c => c.id === secondCreature)?.name} 為代表
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              <h4>選擇要賦予性狀的生物：</h4>
              <div className="creatures-list">
                {playerCreatures.map(creature => (
                  <CreatureCard
                    key={creature.id}
                    creature={creature}
                    isSelected={selectedCreature === creature.id}
                    onSelect={() => setSelectedCreature(creature.id)}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="actions">
          <button onClick={onCancel}>取消</button>
          <button onClick={handleConfirm} disabled={!selectedCreature}>確認</button>
        </div>
      </div>
    </div>
  );
}
```

### 前置條件
- 工單 0252-0255 同步開發

### 驗收標準
- [ ] 互動連結正確顯示
- [ ] 共生方向正確標示
- [ ] 性狀選擇器功能完整
- [ ] 寄生蟲選擇對手生物
- [ ] 測試覆蓋率 ≥ 70%

### 相關檔案
- `frontend/src/components/games/evolution/InteractionLink/` — 新建
- `frontend/src/components/games/evolution/TraitSelector/` — 新建

### 參考計畫書
`docs/演化論/PLAN_EVOLUTION_DEVELOPMENT.md` 第五章 5.3 節
