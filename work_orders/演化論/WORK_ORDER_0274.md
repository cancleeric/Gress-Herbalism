# 工作單 0274

## 編號
0274

## 日期
2026-01-31

## 標題
EvolutionRoom Socket 連接

## 主旨
BUG 修復 - Socket 連接

## 關聯計畫書
`BUG/BUG_PLAN_EVOLUTION_SOCKET.md`

## 內容

### 目標
修改 `EvolutionRoom.js` 連接 Socket.io，使遊戲能夠正常進行。

### 工作項目

#### 1. 導入 Socket 服務

```javascript
import {
  evoCreateCreature,
  evoAddTrait,
  evoPassEvolution,
  evoFeedCreature,
  evoAttack,
  evoRespondAttack,
  evoUseTrait,
  onEvoGameState,
  onEvoCreatureCreated,
  onEvoTraitAdded,
  onEvoPlayerPassed,
  onEvoCreatureFed,
  onEvoChainTriggered,
  onEvoAttackPending,
  onEvoAttackResolved,
  onEvoTraitUsed,
  onEvoError
} from '../../../../services/socketService';
```

#### 2. 實現 Socket 事件監聽

```javascript
// Socket 事件處理
useEffect(() => {
  const unsubGameState = onEvoGameState((gameState) => {
    dispatch(evolutionActions.setGameState(gameState));
  });

  const unsubCreatureCreated = onEvoCreatureCreated((data) => {
    dispatch(evolutionActions.addLog({
      type: 'creatureCreated',
      ...data
    }));
  });

  const unsubTraitAdded = onEvoTraitAdded((data) => {
    dispatch(evolutionActions.addLog({
      type: 'traitAdded',
      ...data
    }));
  });

  const unsubPlayerPassed = onEvoPlayerPassed((data) => {
    dispatch(evolutionActions.addLog({
      type: 'playerPassed',
      ...data
    }));
  });

  const unsubCreatureFed = onEvoCreatureFed((data) => {
    dispatch(evolutionActions.addLog({
      type: 'creatureFed',
      ...data
    }));
  });

  const unsubChainTriggered = onEvoChainTriggered((chainEffects) => {
    // 處理連鎖效應顯示
    console.log('Chain effects:', chainEffects);
  });

  const unsubAttackPending = onEvoAttackPending((pendingData) => {
    dispatch(evolutionActions.setPendingResponse(pendingData));
  });

  const unsubAttackResolved = onEvoAttackResolved((data) => {
    dispatch(evolutionActions.clearPendingResponse());
    dispatch(evolutionActions.addLog({
      type: 'attackResolved',
      ...data
    }));
  });

  const unsubTraitUsed = onEvoTraitUsed((data) => {
    dispatch(evolutionActions.addLog({
      type: 'traitUsed',
      ...data
    }));
  });

  const unsubError = onEvoError(({ message }) => {
    dispatch(evolutionActions.setError(message));
    // 可選：顯示錯誤通知
    setTimeout(() => dispatch(evolutionActions.clearError()), 3000);
  });

  return () => {
    unsubGameState();
    unsubCreatureCreated();
    unsubTraitAdded();
    unsubPlayerPassed();
    unsubCreatureFed();
    unsubChainTriggered();
    unsubAttackPending();
    unsubAttackResolved();
    unsubTraitUsed();
    unsubError();
  };
}, [dispatch]);
```

#### 3. 實現遊戲操作函數

```javascript
// 取得房間 ID（從 URL 參數）
const { roomId } = useParams();

// 處理出牌為生物
const handlePlayAsCreature = useCallback((cardId) => {
  if (!cardId) return;
  evoCreateCreature(roomId, user.uid, cardId);
  dispatch(evolutionActions.clearSelections());
}, [roomId, user.uid, dispatch]);

// 處理出牌為性狀
const handlePlayAsTrait = useCallback((cardId, creatureId, linkedCreatureId = null) => {
  if (!cardId || !creatureId) return;
  evoAddTrait(roomId, user.uid, cardId, creatureId, linkedCreatureId);
  dispatch(evolutionActions.clearSelections());
}, [roomId, user.uid, dispatch]);

// 處理進食
const handleFeed = useCallback((creatureId) => {
  if (!creatureId) return;
  evoFeedCreature(roomId, user.uid, creatureId);
}, [roomId, user.uid]);

// 處理攻擊
const handleAttack = useCallback((attackerId, defenderId) => {
  if (!attackerId || !defenderId) return;
  evoAttack(roomId, user.uid, attackerId, defenderId);
}, [roomId, user.uid]);

// 處理跳過
const handlePass = useCallback(() => {
  if (phase === 'evolution') {
    evoPassEvolution(roomId, user.uid);
  } else if (phase === 'feeding') {
    // 進食階段跳過邏輯
    evoPassEvolution(roomId, user.uid); // 暫時共用
  }
}, [roomId, user.uid, phase]);

// 處理防禦回應
const handleDefenseResponse = useCallback((responseType, traitId, targetId = null) => {
  evoRespondAttack(roomId, user.uid, {
    type: responseType,
    traitId,
    targetId
  });
}, [roomId, user.uid]);

// 處理使用性狀能力
const handleUseTrait = useCallback((creatureId, traitType, targetId = null) => {
  evoUseTrait(roomId, user.uid, creatureId, traitType, targetId);
}, [roomId, user.uid]);
```

#### 4. 整合房間等待介面

```javascript
// 根據遊戲階段顯示不同介面
if (phase === 'waiting') {
  return (
    <EvolutionLobby
      roomId={roomId}
      onGameStart={() => {
        // 遊戲開始時的處理
      }}
      onLeave={() => {
        navigate('/');
      }}
    />
  );
}

// 遊戲進行中的介面
return (
  <div className="evolution-room">
    {/* 現有的遊戲介面 */}
  </div>
);
```

#### 5. 添加錯誤顯示

```jsx
{evolutionState.error && (
  <div className="error-toast">
    {evolutionState.error}
  </div>
)}
```

### 驗收標準
1. 所有 Socket 事件正確連接
2. 遊戲操作（創造生物、賦予性狀、進食、攻擊等）可正常執行
3. 遊戲狀態正確同步到 Redux store
4. 錯誤訊息正確顯示
5. 防禦回應功能正常運作
6. 等待介面正確顯示

### 相關檔案
- `frontend/src/components/games/evolution/EvolutionRoom/EvolutionRoom.js`

### 依賴工單
- 0272, 0273

### 被依賴工單
- 0275
