# 工作單 0270

## 編號
0270

## 日期
2026-01-31

## 工作單標題
效能優化

## 工單主旨
對演化論遊戲進行效能優化，確保流暢的遊戲體驗

## 內容

### 任務描述

識別並解決效能瓶頸，優化渲染和計算效能。

### 優化項目

#### 1. 前端渲染優化

##### React.memo 優化
```javascript
// 避免不必要的重新渲染
const CreatureCard = React.memo(function CreatureCard({ creature, onSelect }) {
  // ...
}, (prevProps, nextProps) => {
  // 自定義比較函數
  return prevProps.creature.id === nextProps.creature.id &&
         prevProps.creature.food.red === nextProps.creature.food.red &&
         prevProps.creature.food.blue === nextProps.creature.food.blue &&
         prevProps.creature.isFed === nextProps.creature.isFed;
});
```

##### useMemo 優化
```javascript
// 避免重複計算
const sortedCreatures = useMemo(() => {
  return creatures.sort((a, b) => a.position - b.position);
}, [creatures]);

const canFeedCreatures = useMemo(() => {
  return myCreatures.filter(c => !c.isFed && canCreatureFeed(gameState, c.id));
}, [myCreatures, gameState.foodPool, gameState.symbiosisLinks]);
```

##### useCallback 優化
```javascript
// 穩定的回調函數
const handleCreatureSelect = useCallback((creatureId) => {
  dispatch(evolutionActions.setSelectedCreature(creatureId));
}, [dispatch]);
```

#### 2. 狀態更新優化

##### 批次更新
```javascript
// 避免多次渲染
const processFeedingChain = (gameState, creatureId) => {
  // 收集所有更新
  const updates = [];

  // 處理溝通連鎖
  const commUpdates = processCommunication(gameState, creatureId);
  updates.push(...commUpdates);

  // 處理合作連鎖
  const coopUpdates = processCooperation(gameState, creatureId);
  updates.push(...coopUpdates);

  // 一次性應用所有更新
  return applyUpdates(gameState, updates);
};
```

##### 選擇性更新
```javascript
// 只更新變化的部分
socket.emit('evo:creatureFed', {
  creatureId,
  food: creature.food,
  isFed: creature.isFed,
  chainEffects
});
// 而不是發送完整 gameState
```

#### 3. 連鎖效應優化

```javascript
// 使用 Set 避免重複處理
function processChainEffects(gameState, startCreatureId) {
  const processed = new Set();
  const queue = [startCreatureId];
  const effects = [];

  while (queue.length > 0) {
    const currentId = queue.shift();
    if (processed.has(currentId)) continue;
    processed.add(currentId);

    // 處理效果...
  }

  return effects;
}
```

#### 4. 動畫效能優化

```css
/* 使用 transform 代替 top/left */
.creature-card.moving {
  transform: translateX(var(--move-x)) translateY(var(--move-y));
  transition: transform 0.3s ease-out;
}

/* 使用 will-change 提示瀏覽器 */
.dice.rolling {
  will-change: transform;
  animation: shake 0.1s infinite;
}

/* 在動畫結束後移除 will-change */
.dice:not(.rolling) {
  will-change: auto;
}
```

#### 5. 記憶體優化

```javascript
// 組件卸載時清理
useEffect(() => {
  const subscription = gameEvents.subscribe(handleEvent);

  return () => {
    subscription.unsubscribe();
  };
}, []);

// 避免閉包陷阱
useEffect(() => {
  const handler = (data) => {
    // 使用 ref 獲取最新值
    if (gameStateRef.current.phase === 'feeding') {
      // ...
    }
  };

  socket.on('evo:gameState', handler);
  return () => socket.off('evo:gameState', handler);
}, []);
```

### 效能指標目標

| 指標 | 目標 |
|------|------|
| 首屏載入 | < 3s |
| 回合切換 | < 500ms |
| 連鎖效應計算 | < 200ms |
| 動畫幀率 | ≥ 60fps |
| 記憶體使用 | 無洩漏 |

### 效能測試工具

```javascript
// 使用 React Profiler
import { Profiler } from 'react';

function onRenderCallback(
  id, phase, actualDuration, baseDuration,
  startTime, commitTime, interactions
) {
  console.log(`${id} rendered in ${actualDuration}ms`);
}

<Profiler id="EvolutionRoom" onRender={onRenderCallback}>
  <EvolutionRoom />
</Profiler>
```

### 前置條件
- 工單 0252-0269 已完成（功能實作與測試）

### 驗收標準
- [ ] 首屏載入 < 3s
- [ ] 回合切換 < 500ms
- [ ] 連鎖效應計算 < 200ms
- [ ] 無記憶體洩漏
- [ ] Chrome DevTools 效能分數 ≥ 80

### 相關檔案
- `frontend/src/components/games/evolution/**/*.js` — 修改
- `backend/logic/evolution/**/*.js` — 修改

### 參考計畫書
`docs/演化論/PLAN_EVOLUTION_DEVELOPMENT.md` 第二章 NF001
