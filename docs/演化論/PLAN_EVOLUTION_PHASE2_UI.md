# 演化論第二階段 - 前端 UI 完善計畫書

**文件編號**：PLAN-EVO-P2-B
**版本**：1.0
**建立日期**：2026-02-01
**負責人**：Claude Code
**狀態**：規劃中
**工單範圍**：0331-0350

---

## 一、目標

建立完整的遊戲 UI 體驗，包括：
1. 專業的卡牌視覺設計
2. 直覺的遊戲操作介面
3. 流暢的動畫效果
4. 響應式設計支援多裝置
5. 可擴展的組件架構

---

## 二、設計原則

### 2.1 組件可擴展性

```
組件設計原則：
─────────────────────────────────────
1. 組件接受性狀定義作為 props，不硬編碼
2. 使用 CSS 變數支援主題切換
3. 事件處理透過回調 props，不直接耦合 Redux
4. 組件支援插槽（slot）模式，方便擴充
```

### 2.2 視覺設計規範

```
色彩系統：
─────────────────────────────────────
主色調：
  - 草綠 #4CAF50 （生態/自然）
  - 深棕 #795548 （卡牌背景）
  - 米白 #FFF8E1 （紙質感）

食物顏色：
  - 紅色食物 #F44336
  - 藍色食物 #2196F3
  - 黃色脂肪 #FFC107

性狀類別色：
  - 肉食相關 #D32F2F
  - 防禦相關 #1976D2
  - 進食相關 #388E3C
  - 互動相關 #7B1FA2
  - 特殊能力 #F57C00
```

---

## 三、組件架構

### 3.1 組件樹狀結構

```
EvolutionRoom
├── GameHeader                     # 遊戲頂部資訊
│   ├── PhaseIndicator            # 階段指示器
│   ├── RoundCounter              # 回合計數
│   └── TurnTimer                 # 回合計時器
│
├── GameBoard                      # 遊戲主面板
│   ├── FoodPool                  # 食物池（中央）
│   │   ├── FoodCounter           # 食物計數
│   │   └── DeckCounter           # 牌庫計數
│   │
│   ├── OpponentAreas             # 對手區域（上方/左右）
│   │   └── PlayerArea            # 玩家區域（可重複）
│   │       ├── PlayerInfo        # 玩家資訊
│   │       ├── CreatureSlots     # 生物卡槽
│   │       │   └── CreatureCard  # 生物卡
│   │       │       ├── TraitStack # 性狀堆疊
│   │       │       └── FoodIndicator # 食物指示
│   │       └── HandCardCount     # 手牌數量
│   │
│   └── MyArea                    # 我的區域（下方）
│       ├── MyCreatures           # 我的生物
│       │   └── CreatureCard      # 生物卡（可互動）
│       │       ├── TraitStack    # 性狀堆疊
│       │       ├── FoodIndicator # 食物指示
│       │       └── ActionMenu    # 動作選單
│       │
│       └── InteractionLinks      # 互動性狀連結線
│
├── HandCards                      # 手牌區域
│   └── CardInHand                # 手牌卡片
│       ├── CardFront             # 卡牌正面（性狀）
│       ├── CardBack              # 卡牌背面（生物）
│       └── CardActions           # 卡牌動作
│
├── ActionPanel                    # 動作面板
│   ├── PassButton                # 跳過按鈕
│   ├── ConfirmButton             # 確認按鈕
│   └── CancelButton              # 取消按鈕
│
├── GameLog                        # 遊戲日誌
│   └── LogEntry                  # 日誌條目
│
├── ScoreBoard                     # 計分板
│   └── PlayerScore               # 玩家分數
│
└── Modals                         # 彈窗
    ├── TraitSelector             # 性狀選擇器
    ├── AttackResolver            # 攻擊判定
    ├── DiceRoller                # 擲骰器
    ├── DefenseResponse           # 防禦回應
    └── GameResult                # 遊戲結果
```

### 3.2 組件檔案結構

```
frontend/src/components/games/evolution/
├── index.js                       # 統一匯出
│
├── EvolutionRoom/                 # 遊戲房間（已有）
│   ├── EvolutionRoom.js
│   ├── EvolutionRoom.css
│   └── index.js
│
├── cards/                         # 卡牌相關
│   ├── CardBase/                  # 卡牌基礎組件
│   │   ├── CardBase.js
│   │   ├── CardBase.css
│   │   └── index.js
│   │
│   ├── CreatureCard/              # 生物卡
│   │   ├── CreatureCard.js
│   │   ├── CreatureCard.css
│   │   └── index.js
│   │
│   ├── TraitCard/                 # 性狀卡
│   │   ├── TraitCard.js
│   │   ├── TraitCard.css
│   │   └── index.js
│   │
│   └── HandCard/                  # 手牌卡
│       ├── HandCard.js
│       ├── HandCard.css
│       └── index.js
│
├── board/                         # 遊戲面板
│   ├── GameBoard/
│   ├── FoodPool/
│   ├── PlayerArea/
│   └── InteractionLinks/
│
├── controls/                      # 控制項
│   ├── PhaseIndicator/
│   ├── ActionPanel/
│   ├── TurnTimer/
│   └── PassButton/
│
├── modals/                        # 彈窗
│   ├── TraitSelector/
│   ├── AttackResolver/
│   ├── DiceRoller/
│   ├── DefenseResponse/
│   └── GameResult/
│
├── display/                       # 顯示組件
│   ├── GameLog/
│   ├── ScoreBoard/
│   └── FoodIndicator/
│
└── common/                        # 共用組件
    ├── DraggableCard/
    ├── DropZone/
    ├── Tooltip/
    └── AnimatedContainer/
```

---

## 四、核心組件設計

### 4.1 CardBase - 卡牌基礎組件

```jsx
// cards/CardBase/CardBase.js

/**
 * 卡牌基礎組件
 * 支援雙面顯示、翻轉動畫、可擴展內容
 */
const CardBase = ({
  // 基本屬性
  id,
  frontContent,      // 正面內容（ReactNode）
  backContent,       // 背面內容（ReactNode）
  isFlipped = false, // 是否翻面

  // 尺寸
  size = 'medium',   // 'small' | 'medium' | 'large'

  // 狀態
  isSelected = false,
  isHighlighted = false,
  isDisabled = false,

  // 事件
  onClick,
  onDoubleClick,
  onDragStart,
  onDragEnd,

  // 樣式
  className,
  style,

  // 擴展
  overlay,           // 覆蓋層（如食物指示器）
  badge,             // 徽章（如數量標記）
  children,
}) => {
  return (
    <div
      className={classNames(
        'card-base',
        `card-${size}`,
        {
          'is-flipped': isFlipped,
          'is-selected': isSelected,
          'is-highlighted': isHighlighted,
          'is-disabled': isDisabled,
        },
        className
      )}
      style={style}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      draggable={!!onDragStart}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="card-inner">
        <div className="card-front">
          {frontContent}
        </div>
        <div className="card-back">
          {backContent}
        </div>
      </div>
      {overlay && <div className="card-overlay">{overlay}</div>}
      {badge && <div className="card-badge">{badge}</div>}
      {children}
    </div>
  );
};
```

### 4.2 CreatureCard - 生物卡組件

```jsx
// cards/CreatureCard/CreatureCard.js

/**
 * 生物卡組件
 * 顯示生物、性狀堆疊、食物狀態
 */
const CreatureCard = ({
  creature,          // 生物資料
  traits = [],       // 性狀列表
  isOwner = false,   // 是否為擁有者
  isTargetable = false, // 是否可作為目標
  onSelect,          // 選擇回調
  onFeed,            // 餵食回調
  onAttack,          // 攻擊回調
  onUseTrait,        // 使用性狀回調
}) => {
  const { id, food, foodNeeded, isFed, isPoisoned, isHibernating } = creature;

  // 計算食物狀態
  const currentFood = food.red + food.blue;
  const fatStored = food.yellow;

  return (
    <div className={classNames('creature-card', {
      'is-fed': isFed,
      'is-hungry': !isFed && currentFood < foodNeeded,
      'is-poisoned': isPoisoned,
      'is-hibernating': isHibernating,
      'is-targetable': isTargetable,
    })}>
      {/* 生物圖示 */}
      <div className="creature-icon">
        <LizardIcon />
      </div>

      {/* 食物需求指示 */}
      <div className="food-requirement">
        <span className="current">{currentFood}</span>
        <span className="separator">/</span>
        <span className="needed">{foodNeeded}</span>
      </div>

      {/* 性狀堆疊 */}
      <TraitStack
        traits={traits}
        isOwner={isOwner}
        onUseTrait={onUseTrait}
      />

      {/* 食物指示器 */}
      <FoodIndicator
        red={food.red}
        blue={food.blue}
        yellow={food.yellow}
      />

      {/* 狀態圖示 */}
      <div className="status-icons">
        {isPoisoned && <PoisonIcon />}
        {isHibernating && <HibernateIcon />}
      </div>

      {/* 動作選單（擁有者可見） */}
      {isOwner && (
        <ActionMenu
          creature={creature}
          onFeed={onFeed}
          onAttack={onAttack}
        />
      )}
    </div>
  );
};
```

### 4.3 TraitCard - 性狀卡組件

```jsx
// cards/TraitCard/TraitCard.js

/**
 * 性狀卡組件
 * 使用性狀處理器的定義顯示
 */
const TraitCard = ({
  traitType,         // 性狀類型
  traitInfo,         // 性狀資訊（來自處理器）
  isUsed = false,    // 是否已使用
  isActive = true,   // 是否可用
  showTooltip = true,
  onClick,
}) => {
  // 如果沒有 traitInfo，使用 Registry 取得
  const info = traitInfo || useTraitInfo(traitType);

  if (!info) return null;

  const { name, description, foodBonus, category } = info;

  return (
    <div
      className={classNames('trait-card', `trait-${category}`, {
        'is-used': isUsed,
        'is-inactive': !isActive,
      })}
      onClick={onClick}
    >
      {/* 食量加成標記 */}
      {foodBonus > 0 && (
        <div className="food-bonus">+{foodBonus}</div>
      )}

      {/* 性狀名稱 */}
      <div className="trait-name">{name}</div>

      {/* 性狀圖示 */}
      <div className="trait-icon">
        <TraitIcon type={traitType} />
      </div>

      {/* 工具提示 */}
      {showTooltip && (
        <Tooltip content={description} />
      )}
    </div>
  );
};

// 使用 CSS 變數根據類別顯示不同顏色
// .trait-carnivore { --trait-color: var(--color-carnivore); }
// .trait-defense { --trait-color: var(--color-defense); }
// ...
```

### 4.4 FoodPool - 食物池組件

```jsx
// board/FoodPool/FoodPool.js

/**
 * 食物池組件
 * 顯示中央食物和牌庫狀態
 */
const FoodPool = ({
  redFood,           // 紅色食物數量
  blueFood = 0,      // 藍色食物數量（通常為 0）
  deckCount,         // 牌庫剩餘
  isLastRound,       // 是否最後回合
  onFoodClick,       // 點擊食物
}) => {
  return (
    <div className="food-pool">
      {/* 食物區 */}
      <div className="food-area">
        <div className="food-title">食物池</div>

        {/* 紅色食物 */}
        <div className="food-row red">
          {Array(Math.min(redFood, 12)).fill().map((_, i) => (
            <FoodToken
              key={i}
              type="red"
              onClick={() => onFoodClick?.('red')}
            />
          ))}
          {redFood > 12 && (
            <span className="food-overflow">+{redFood - 12}</span>
          )}
        </div>

        {/* 藍色食物（如果有） */}
        {blueFood > 0 && (
          <div className="food-row blue">
            {Array(blueFood).fill().map((_, i) => (
              <FoodToken key={i} type="blue" />
            ))}
          </div>
        )}

        {redFood === 0 && blueFood === 0 && (
          <div className="empty-message">沒有食物</div>
        )}
      </div>

      {/* 牌庫 */}
      <div className="deck-area">
        <div className="deck-icon">
          <DeckIcon />
        </div>
        <div className="deck-count">
          {deckCount}
        </div>
        {isLastRound && (
          <div className="last-round-badge">最後回合</div>
        )}
      </div>
    </div>
  );
};
```

### 4.5 InteractionLinks - 互動性狀連結

```jsx
// board/InteractionLinks/InteractionLinks.js

/**
 * 互動性狀連結視覺化
 * 使用 SVG 繪製連結線
 */
const InteractionLinks = ({
  links,             // 連結資料
  creatures,         // 生物位置資訊
}) => {
  const svgRef = useRef(null);
  const [lines, setLines] = useState([]);

  // 計算連結線位置
  useEffect(() => {
    const newLines = links.map(link => {
      const creature1 = creatures.find(c => c.id === link.creature1Id);
      const creature2 = creatures.find(c => c.id === link.creature2Id);

      if (!creature1 || !creature2) return null;

      return {
        id: link.id,
        type: link.type,
        x1: creature1.x + creature1.width / 2,
        y1: creature1.y + creature1.height / 2,
        x2: creature2.x + creature2.width / 2,
        y2: creature2.y + creature2.height / 2,
      };
    }).filter(Boolean);

    setLines(newLines);
  }, [links, creatures]);

  return (
    <svg ref={svgRef} className="interaction-links">
      <defs>
        {/* 連結類型的線條樣式 */}
        <marker id="communication" ...>...</marker>
        <marker id="cooperation" ...>...</marker>
        <marker id="symbiosis" ...>...</marker>
      </defs>

      {lines.map(line => (
        <g key={line.id} className={`link-${line.type}`}>
          <line
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            className="link-line"
            markerEnd={`url(#${line.type})`}
          />
          <text
            x={(line.x1 + line.x2) / 2}
            y={(line.y1 + line.y2) / 2}
            className="link-label"
          >
            {getLinkLabel(line.type)}
          </text>
        </g>
      ))}
    </svg>
  );
};
```

---

## 五、動畫系統

### 5.1 動畫類型

| 動畫 | 觸發時機 | 效果 |
|------|----------|------|
| 卡牌翻轉 | 顯示性狀/生物 | 3D 翻轉 |
| 卡牌拖放 | 出牌時 | 平滑移動 |
| 食物獲取 | 進食時 | 食物飛入 |
| 攻擊效果 | 肉食攻擊 | 衝擊波動 |
| 滅絕效果 | 生物死亡 | 淡出消散 |
| 擲骰動畫 | 敏捷逃脫 | 骰子滾動 |
| 連鎖效果 | 溝通/合作 | 波紋擴散 |

### 5.2 動畫實作

```jsx
// common/AnimatedContainer/AnimatedContainer.js

import { motion, AnimatePresence } from 'framer-motion';

/**
 * 動畫容器組件
 * 使用 Framer Motion 實現動畫
 */
const AnimatedContainer = ({
  children,
  animation = 'fadeIn',
  duration = 0.3,
  delay = 0,
  onComplete,
}) => {
  const variants = {
    fadeIn: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    },
    slideUp: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 },
    },
    scale: {
      initial: { opacity: 0, scale: 0.8 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.8 },
    },
    flip: {
      initial: { rotateY: 90 },
      animate: { rotateY: 0 },
      exit: { rotateY: -90 },
    },
  };

  return (
    <motion.div
      variants={variants[animation]}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration, delay }}
      onAnimationComplete={onComplete}
    >
      {children}
    </motion.div>
  );
};
```

### 5.3 拖放系統

```jsx
// common/DraggableCard/DraggableCard.js

import { useDrag, useDrop } from 'react-dnd';

/**
 * 可拖放卡牌組件
 */
const DraggableCard = ({
  card,
  canDrag = true,
  onDragStart,
  onDragEnd,
  children,
}) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'CARD',
    item: () => {
      onDragStart?.(card);
      return { card };
    },
    end: (item, monitor) => {
      onDragEnd?.(card, monitor.didDrop());
    },
    canDrag: () => canDrag,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={drag}
      className={classNames('draggable-card', {
        'is-dragging': isDragging,
      })}
    >
      {children}
    </div>
  );
};

/**
 * 放置區域組件
 */
const DropZone = ({
  accept = 'CARD',
  onDrop,
  canDrop,
  children,
  className,
}) => {
  const [{ isOver, canDropHere }, drop] = useDrop({
    accept,
    drop: (item) => onDrop?.(item),
    canDrop: (item) => canDrop?.(item),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDropHere: monitor.canDrop(),
    }),
  });

  return (
    <div
      ref={drop}
      className={classNames('drop-zone', className, {
        'is-over': isOver,
        'can-drop': canDropHere,
        'cannot-drop': isOver && !canDropHere,
      })}
    >
      {children}
    </div>
  );
};
```

---

## 六、響應式設計

### 6.1 斷點設計

```css
/* 響應式斷點 */
:root {
  --breakpoint-mobile: 480px;
  --breakpoint-tablet: 768px;
  --breakpoint-laptop: 1024px;
  --breakpoint-desktop: 1280px;
}

/* 卡牌尺寸響應式 */
.card-base {
  --card-width: 80px;
  --card-height: 112px;
}

@media (max-width: 768px) {
  .card-base {
    --card-width: 60px;
    --card-height: 84px;
  }
}

@media (max-width: 480px) {
  .card-base {
    --card-width: 45px;
    --card-height: 63px;
  }
}
```

### 6.2 佈局適應

```
桌面版佈局：
┌─────────────────────────────────────────────────────────────────┐
│                          對手區域                                │
├───────────────┬─────────────────────────┬───────────────────────┤
│               │                         │                       │
│   對手 1      │       食物池/牌庫       │       對手 2          │
│               │                         │                       │
├───────────────┴─────────────────────────┴───────────────────────┤
│                          我的區域                                │
├─────────────────────────────────────────────────────────────────┤
│                          我的手牌                                │
└─────────────────────────────────────────────────────────────────┘

行動版佈局：
┌─────────────────────────────────────────┐
│              對手區域（可滑動）          │
├─────────────────────────────────────────┤
│                                         │
│               食物池/牌庫               │
│                                         │
├─────────────────────────────────────────┤
│              我的區域                    │
├─────────────────────────────────────────┤
│           我的手牌（可滑動）             │
├─────────────────────────────────────────┤
│              動作面板                    │
└─────────────────────────────────────────┘
```

---

## 七、工單詳細內容

### 工單 0331：設計卡牌視覺系統

**目標**：建立卡牌設計規範和基礎樣式

**交付物**：
- 卡牌設計規範文檔
- CSS 變數定義
- 基礎樣式表

**驗收標準**：
- [ ] 設計規範完整
- [ ] 支援擴展新性狀

---

### 工單 0332-0343：組件實作

（詳見工單總覽）

---

### 工單 0344：實作拖放系統

**目標**：卡牌拖放操作

**技術**：react-dnd

**功能**：
- 從手牌拖放到生物區域（創造生物）
- 從手牌拖放到生物卡上（添加性狀）
- 拖放預覽和驗證

---

### 工單 0345：實作動畫系統

**目標**：流暢的遊戲動畫

**技術**：Framer Motion

**動畫**：
- 卡牌翻轉
- 進食動畫
- 攻擊效果
- 滅絕效果

---

### 工單 0346：實作音效系統

**目標**：遊戲音效

**音效**：
- 出牌音效
- 進食音效
- 攻擊音效
- 擲骰音效
- 階段切換音效

---

### 工單 0347-0350：優化與測試

（詳見工單總覽）

---

## 八、依賴套件

| 套件 | 用途 | 版本 |
|------|------|------|
| framer-motion | 動畫 | ^10.x |
| react-dnd | 拖放 | ^16.x |
| react-dnd-html5-backend | 拖放後端 | ^16.x |
| classnames | 類名管理 | ^2.x |
| howler | 音效 | ^2.x |

---

## 九、驗收標準

- [ ] 所有組件可正常渲染
- [ ] 拖放操作流暢
- [ ] 動畫效果自然
- [ ] 響應式設計正常
- [ ] 行動裝置可操作
- [ ] 無 console 錯誤

---

**文件結束**

*建立者：Claude Code*
*建立日期：2026-02-01*
