# 演化論第二階段 - 品質保證計畫書

**文件編號**：PLAN-EVO-P2-D
**版本**：1.0
**建立日期**：2026-02-01
**負責人**：Claude Code
**狀態**：規劃中
**工單範圍**：0361-0375

---

## 一、目標

確保演化論遊戲的品質和穩定性：
1. 斷線重連機制
2. 行動裝置相容性
3. 效能優化
4. 完整 E2E 測試
5. 錯誤監控與追蹤

---

## 二、斷線重連系統

### 2.1 重連架構設計

```
斷線重連流程：
─────────────────────────────────────

正常遊戲中
    │
    ▼
玩家斷線 ──────────────────────────────────────────┐
    │                                              │
    ▼                                              │
伺服器偵測斷線                                     │
    │                                              │
    ├──▶ 遊戲進行中？                              │
    │       │                                      │
    │       ├── 是 ──▶ 標記玩家為「暫時離開」      │
    │       │            設定 30 秒重連時限         │
    │       │            通知其他玩家               │
    │       │                                      │
    │       └── 否 ──▶ 直接移除玩家                │
    │                                              │
    ▼                                              │
等待重連中... ◀────────────────────────────────────┘
    │
    ├── 30 秒內重連 ──▶ 恢復遊戲狀態
    │                    繼續遊戲
    │
    └── 超時未重連 ──▶ 玩家判定離開
                        遊戲繼續或結束
```

### 2.2 遊戲狀態快照

```javascript
// backend/logic/evolution/reconnection.js

/**
 * 遊戲狀態快照管理
 */
class GameStateSnapshot {
  constructor() {
    this.snapshots = new Map(); // roomId -> snapshot
  }

  /**
   * 儲存快照
   */
  save(roomId, gameState) {
    const snapshot = {
      timestamp: Date.now(),
      state: this.serialize(gameState),
      version: 1,
    };

    this.snapshots.set(roomId, snapshot);

    // 同時存到 Redis（生產環境）
    // await redis.set(`evo:snapshot:${roomId}`, JSON.stringify(snapshot));
  }

  /**
   * 載入快照
   */
  load(roomId) {
    const snapshot = this.snapshots.get(roomId);
    if (!snapshot) return null;

    // 檢查是否過期（30 分鐘）
    if (Date.now() - snapshot.timestamp > 30 * 60 * 1000) {
      this.snapshots.delete(roomId);
      return null;
    }

    return this.deserialize(snapshot.state);
  }

  /**
   * 序列化（移除不必要的資料）
   */
  serialize(gameState) {
    return {
      phase: gameState.phase,
      round: gameState.round,
      currentPlayerIndex: gameState.currentPlayerIndex,
      isLastRound: gameState.isLastRound,
      foodPool: gameState.foodPool,
      deck: gameState.deck,
      discardPile: gameState.discardPile,
      players: gameState.players.map(p => ({
        id: p.id,
        name: p.name,
        hand: p.hand,
        creatures: p.creatures,
        score: p.score,
        hasPassed: p.hasPassed,
      })),
      pendingAttack: gameState.pendingAttack,
      actionLog: gameState.actionLog.slice(-50), // 只保留最近 50 條
    };
  }

  deserialize(data) {
    return { ...data };
  }
}
```

### 2.3 重連處理器

```javascript
// backend/logic/evolution/reconnectionHandler.js

class ReconnectionHandler {
  constructor(io, snapshotManager) {
    this.io = io;
    this.snapshots = snapshotManager;
    this.pendingReconnections = new Map(); // playerId -> { roomId, timeout }
  }

  /**
   * 處理玩家斷線
   */
  handleDisconnect(socket, roomId, playerId) {
    const room = evoRooms.get(roomId);
    if (!room) return;

    // 遊戲進行中
    if (room.phase !== 'waiting') {
      // 標記玩家為暫時離開
      const player = room.players.find(p => p.id === playerId);
      if (player) {
        player.isDisconnected = true;
        player.disconnectedAt = Date.now();
      }

      // 儲存快照
      this.snapshots.save(roomId, room.gameState);

      // 設定超時
      const timeout = setTimeout(() => {
        this.handleTimeout(roomId, playerId);
      }, 30000); // 30 秒

      this.pendingReconnections.set(playerId, { roomId, timeout });

      // 通知其他玩家
      this.io.to(roomId).emit('evo:playerDisconnected', {
        playerId,
        playerName: player?.name,
        timeout: 30,
      });

      console.log(`[Evolution] Player ${playerId} disconnected, waiting for reconnection...`);
    } else {
      // 等待中直接移除
      this.removePlayer(roomId, playerId);
    }
  }

  /**
   * 處理玩家重連
   */
  handleReconnect(socket, playerId, roomId) {
    const pending = this.pendingReconnections.get(playerId);
    if (!pending) {
      // 沒有待重連記錄
      socket.emit('evo:reconnectFailed', { reason: '遊戲已結束或不存在' });
      return;
    }

    // 清除超時
    clearTimeout(pending.timeout);
    this.pendingReconnections.delete(playerId);

    // 載入快照
    const snapshot = this.snapshots.load(roomId);
    const room = evoRooms.get(roomId);

    if (!room || !snapshot) {
      socket.emit('evo:reconnectFailed', { reason: '遊戲狀態無法恢復' });
      return;
    }

    // 恢復玩家狀態
    const player = room.players.find(p => p.id === playerId);
    if (player) {
      player.isDisconnected = false;
      player.socketId = socket.id;
      delete player.disconnectedAt;
    }

    // 更新 socket 映射
    evoPlayerSockets.set(playerId, socket.id);

    // 加入房間
    socket.join(roomId);

    // 發送當前狀態給重連玩家
    socket.emit('evo:reconnected', {
      room: room,
      gameState: getClientGameState(room, playerId),
    });

    // 通知其他玩家
    socket.to(roomId).emit('evo:playerReconnected', {
      playerId,
      playerName: player?.name,
    });

    console.log(`[Evolution] Player ${playerId} reconnected to room ${roomId}`);
  }

  /**
   * 處理超時
   */
  handleTimeout(roomId, playerId) {
    this.pendingReconnections.delete(playerId);

    const room = evoRooms.get(roomId);
    if (!room) return;

    // 標記玩家為永久離開
    const player = room.players.find(p => p.id === playerId);
    if (player) {
      player.hasForfeited = true;
    }

    // 通知其他玩家
    this.io.to(roomId).emit('evo:playerForfeited', {
      playerId,
      playerName: player?.name,
    });

    // 檢查遊戲是否可以繼續
    const activePlayers = room.players.filter(p => !p.hasForfeited);
    if (activePlayers.length < 2) {
      // 遊戲結束
      this.endGame(roomId, 'forfeit');
    } else {
      // 跳過該玩家的回合
      this.skipDisconnectedPlayer(roomId, playerId);
    }
  }

  /**
   * 跳過斷線玩家
   */
  skipDisconnectedPlayer(roomId, playerId) {
    const room = evoRooms.get(roomId);
    if (!room?.gameState) return;

    const currentPlayer = room.players[room.gameState.currentPlayerIndex];
    if (currentPlayer?.id === playerId) {
      // 自動跳過
      room.gameState = gameLogic.processAction(room.gameState, {
        type: 'PASS',
        playerId,
      });

      // 廣播
      this.io.to(roomId).emit('evo:gameState', getClientGameState(room));
    }
  }
}
```

### 2.4 前端重連 UI

```jsx
// frontend/src/components/games/evolution/ReconnectionOverlay.js

const ReconnectionOverlay = ({ isDisconnected, onRetry }) => {
  const [countdown, setCountdown] = useState(30);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    if (!isDisconnected) return;

    const timer = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(timer);
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isDisconnected]);

  if (!isDisconnected) return null;

  return (
    <div className="reconnection-overlay">
      <div className="reconnection-modal">
        <div className="icon">
          <DisconnectIcon />
        </div>

        <h2>連線中斷</h2>

        <p>正在嘗試重新連線...</p>

        <div className="countdown">
          剩餘時間：{countdown} 秒
        </div>

        <div className="actions">
          <button
            onClick={() => {
              setIsRetrying(true);
              onRetry().finally(() => setIsRetrying(false));
            }}
            disabled={isRetrying}
          >
            {isRetrying ? '重連中...' : '立即重連'}
          </button>
        </div>

        {countdown === 0 && (
          <p className="timeout-message">
            重連超時，遊戲將繼續進行
          </p>
        )}
      </div>
    </div>
  );
};
```

---

## 三、行動裝置相容性

### 3.1 測試矩陣

| 裝置類型 | 系統 | 瀏覽器 | 優先級 |
|---------|------|--------|--------|
| iPhone | iOS 15+ | Safari | P0 |
| iPhone | iOS 15+ | Chrome | P1 |
| Android | Android 10+ | Chrome | P0 |
| Android | Android 10+ | Samsung Internet | P1 |
| iPad | iPadOS 15+ | Safari | P0 |
| Android Tablet | Android 10+ | Chrome | P1 |

### 3.2 觸控優化

```javascript
// frontend/src/hooks/useTouchOptimization.js

/**
 * 觸控優化 Hook
 */
function useTouchOptimization() {
  const isTouchDevice = 'ontouchstart' in window;

  // 禁用雙擊縮放
  useEffect(() => {
    if (!isTouchDevice) return;

    const handler = (e) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    document.addEventListener('touchstart', handler, { passive: false });
    return () => document.removeEventListener('touchstart', handler);
  }, [isTouchDevice]);

  // 長按事件（取代右鍵）
  const useLongPress = (callback, delay = 500) => {
    const timeoutRef = useRef(null);

    const start = useCallback((e) => {
      timeoutRef.current = setTimeout(() => {
        callback(e);
      }, delay);
    }, [callback, delay]);

    const clear = useCallback(() => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    }, []);

    return {
      onTouchStart: start,
      onTouchEnd: clear,
      onTouchMove: clear,
    };
  };

  return { isTouchDevice, useLongPress };
}
```

### 3.3 觸控拖放適配

```javascript
// frontend/src/utils/touchDragAdapter.js

/**
 * 觸控拖放適配器
 * 用於 react-dnd 的觸控後端
 */
import { TouchBackend } from 'react-dnd-touch-backend';

export const touchBackendOptions = {
  enableMouseEvents: true,      // 同時支援滑鼠
  enableTouchEvents: true,      // 啟用觸控
  delayTouchStart: 100,         // 延遲觸發（避免誤觸）
  ignoreContextMenu: true,      // 忽略右鍵選單
};

// 自定義預覽
export const CustomDragPreview = ({ item, currentOffset }) => {
  if (!currentOffset) return null;

  const transform = `translate(${currentOffset.x}px, ${currentOffset.y}px)`;

  return (
    <div
      className="drag-preview"
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        transform,
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    >
      <CardPreview card={item.card} />
    </div>
  );
};
```

### 3.4 視窗適配

```css
/* 行動裝置視窗適配 */

/* 防止 iOS 橡皮筋效果 */
html, body {
  overscroll-behavior: none;
}

/* 安全區域適配（瀏海/底部手勢區）*/
.game-container {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}

/* 防止選取文字 */
.game-board {
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
}

/* 防止縮放 */
.game-container {
  touch-action: manipulation;
}

/* 橫向模式優化 */
@media (orientation: landscape) and (max-height: 500px) {
  .hand-cards {
    max-height: 80px;
  }

  .phase-indicator {
    font-size: 12px;
  }
}
```

---

## 四、效能優化

### 4.1 React 渲染優化

```javascript
// frontend/src/components/games/evolution/optimizations.js

/**
 * 使用 React.memo 優化組件
 */
export const CreatureCard = React.memo(
  ({ creature, ...props }) => {
    return <CreatureCardImpl creature={creature} {...props} />;
  },
  (prevProps, nextProps) => {
    // 自定義比較函數
    return (
      prevProps.creature.id === nextProps.creature.id &&
      prevProps.creature.food.red === nextProps.creature.food.red &&
      prevProps.creature.food.blue === nextProps.creature.food.blue &&
      prevProps.creature.food.yellow === nextProps.creature.food.yellow &&
      prevProps.creature.traits.length === nextProps.creature.traits.length &&
      prevProps.isSelected === nextProps.isSelected
    );
  }
);

/**
 * 使用 useMemo 優化計算
 */
function useGameStateSelectors(gameState) {
  const myCreatures = useMemo(
    () => gameState?.players?.find(p => p.id === myId)?.creatures || [],
    [gameState?.players, myId]
  );

  const foodPool = useMemo(
    () => gameState?.foodPool || { red: 0, blue: 0 },
    [gameState?.foodPool]
  );

  const isMyTurn = useMemo(
    () => {
      const currentPlayer = gameState?.players?.[gameState?.currentPlayerIndex];
      return currentPlayer?.id === myId;
    },
    [gameState?.currentPlayerIndex, gameState?.players, myId]
  );

  return { myCreatures, foodPool, isMyTurn };
}

/**
 * 使用 useCallback 優化事件處理
 */
function useGameActions(dispatch) {
  const onFeed = useCallback(
    (creatureId) => dispatch(evoFeedCreature(creatureId)),
    [dispatch]
  );

  const onAttack = useCallback(
    (attackerId, targetId) => dispatch(evoAttack(attackerId, targetId)),
    [dispatch]
  );

  return { onFeed, onAttack };
}
```

### 4.2 虛擬化長列表

```jsx
// frontend/src/components/games/evolution/GameLog/VirtualizedGameLog.js

import { FixedSizeList as List } from 'react-window';

const VirtualizedGameLog = ({ logs }) => {
  const Row = ({ index, style }) => (
    <div style={style} className="log-entry">
      <LogEntry log={logs[index]} />
    </div>
  );

  return (
    <List
      height={300}
      itemCount={logs.length}
      itemSize={40}
      width="100%"
    >
      {Row}
    </List>
  );
};
```

### 4.3 效能監控

```javascript
// frontend/src/utils/performanceMonitor.js

/**
 * 效能監控
 */
class PerformanceMonitor {
  constructor() {
    this.metrics = [];
  }

  // 測量渲染時間
  measureRender(componentName) {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.record('render', componentName, duration);
    };
  }

  // 測量動作處理時間
  measureAction(actionType) {
    const start = performance.now();
    return (result) => {
      const duration = performance.now() - start;
      this.record('action', actionType, duration);
      return result;
    };
  }

  record(type, name, duration) {
    this.metrics.push({
      type,
      name,
      duration,
      timestamp: Date.now(),
    });

    // 警告慢操作
    if (duration > 100) {
      console.warn(`[Perf] Slow ${type}: ${name} took ${duration.toFixed(2)}ms`);
    }

    // 保留最近 1000 條
    if (this.metrics.length > 1000) {
      this.metrics.shift();
    }
  }

  getReport() {
    const grouped = {};
    for (const m of this.metrics) {
      const key = `${m.type}:${m.name}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(m.duration);
    }

    const report = {};
    for (const [key, durations] of Object.entries(grouped)) {
      report[key] = {
        count: durations.length,
        avg: durations.reduce((a, b) => a + b, 0) / durations.length,
        max: Math.max(...durations),
        min: Math.min(...durations),
      };
    }

    return report;
  }
}

export const perfMonitor = new PerformanceMonitor();
```

---

## 五、E2E 測試

### 5.1 測試場景

```javascript
// frontend/cypress/e2e/evolution/gameplay.cy.js

describe('Evolution Gameplay', () => {
  beforeEach(() => {
    // 登入兩個測試帳號
    cy.loginAsPlayer1();
    cy.loginAsPlayer2();
  });

  it('should complete a full game', () => {
    // 玩家 1 創建房間
    cy.get('[data-testid="create-room"]').click();
    cy.get('[data-testid="room-name"]').type('測試房間');
    cy.get('[data-testid="confirm-create"]').click();

    // 玩家 2 加入房間
    cy.switchToPlayer2();
    cy.get('[data-testid="room-list"]').contains('測試房間').click();
    cy.get('[data-testid="join-room"]').click();

    // 兩個玩家準備
    cy.switchToPlayer1();
    cy.get('[data-testid="ready-btn"]').click();
    cy.switchToPlayer2();
    cy.get('[data-testid="ready-btn"]').click();

    // 玩家 1 開始遊戲
    cy.switchToPlayer1();
    cy.get('[data-testid="start-game"]').click();

    // 驗證遊戲開始
    cy.get('[data-testid="phase-indicator"]').should('contain', '演化階段');

    // 玩家 1 創造生物
    cy.get('[data-testid="hand-card-0"]').drag('[data-testid="creature-slot"]');
    cy.get('[data-testid="confirm-create"]').click();

    // 驗證生物創建成功
    cy.get('[data-testid="my-creatures"]').children().should('have.length', 1);

    // 玩家 1 跳過
    cy.get('[data-testid="pass-btn"]').click();

    // 玩家 2 回合...
    // ... 更多測試步驟
  });

  it('should handle disconnection', () => {
    // 創建並開始遊戲
    // ...

    // 模擬玩家 2 斷線
    cy.switchToPlayer2();
    cy.window().then(win => {
      win.socket.disconnect();
    });

    // 驗證玩家 1 看到斷線提示
    cy.switchToPlayer1();
    cy.get('[data-testid="disconnect-notice"]').should('be.visible');

    // 模擬玩家 2 重連
    cy.switchToPlayer2();
    cy.window().then(win => {
      win.socket.connect();
    });

    // 驗證重連成功
    cy.get('[data-testid="game-board"]').should('be.visible');
    cy.switchToPlayer1();
    cy.get('[data-testid="disconnect-notice"]').should('not.exist');
  });
});
```

### 5.2 性狀互動測試

```javascript
// frontend/cypress/e2e/evolution/traits.cy.js

describe('Trait Interactions', () => {
  beforeEach(() => {
    // 使用預設遊戲狀態
    cy.setupGameWithState('mid-game');
  });

  it('should handle carnivore attack flow', () => {
    // 選擇肉食生物
    cy.get('[data-testid="creature-carnivore"]').click();
    cy.get('[data-testid="attack-btn"]').click();

    // 選擇目標
    cy.get('[data-testid="opponent-creature-0"]').click();

    // 驗證攻擊結果
    cy.get('[data-testid="attack-result"]').should('be.visible');
    cy.get('[data-testid="food-gained"]').should('contain', '+2');
  });

  it('should trigger communication chain', () => {
    // 有溝通連結的生物進食
    cy.get('[data-testid="creature-with-communication"]').click();
    cy.get('[data-testid="feed-btn"]').click();

    // 驗證連鎖觸發
    cy.get('[data-testid="chain-animation"]').should('be.visible');
    cy.get('[data-testid="linked-creature"]')
      .find('[data-testid="food-red"]')
      .should('have.length', 1);
  });
});
```

---

## 六、錯誤監控

### 6.1 Sentry 整合

```javascript
// frontend/src/utils/sentry.js

import * as Sentry from '@sentry/react';

export function initSentry() {
  if (process.env.NODE_ENV === 'production') {
    Sentry.init({
      dsn: process.env.REACT_APP_SENTRY_DSN,
      environment: process.env.NODE_ENV,
      release: process.env.REACT_APP_VERSION,

      // 效能監控
      tracesSampleRate: 0.1, // 10% 取樣

      // 過濾無用錯誤
      ignoreErrors: [
        'ResizeObserver loop limit exceeded',
        'Non-Error promise rejection captured',
      ],

      // 自定義標籤
      beforeSend(event, hint) {
        // 添加遊戲狀態資訊
        const gameState = window.__EVOLUTION_GAME_STATE__;
        if (gameState) {
          event.contexts = event.contexts || {};
          event.contexts.game = {
            roomId: gameState.roomId,
            phase: gameState.phase,
            round: gameState.round,
          };
        }
        return event;
      },
    });
  }
}

// 自定義錯誤追蹤
export function trackGameError(error, context) {
  Sentry.withScope(scope => {
    scope.setTag('game', 'evolution');
    scope.setContext('game_context', context);
    Sentry.captureException(error);
  });
}
```

### 6.2 後端錯誤處理

```javascript
// backend/middleware/errorHandler.js

/**
 * 統一錯誤處理中間件
 */
function evolutionErrorHandler(err, socket, next) {
  console.error('[Evolution Error]', err);

  // 記錄錯誤
  const errorLog = {
    timestamp: new Date(),
    error: err.message,
    stack: err.stack,
    socketId: socket.id,
    playerId: socket.playerId,
    roomId: socket.currentRoom,
  };

  // 發送到監控系統
  // sendToMonitoring(errorLog);

  // 通知客戶端
  socket.emit('evo:error', {
    message: getClientMessage(err),
    code: err.code || 'UNKNOWN',
  });
}

function getClientMessage(err) {
  // 轉換為使用者友善訊息
  const messages = {
    'INVALID_ACTION': '無效的操作',
    'NOT_YOUR_TURN': '現在不是你的回合',
    'GAME_NOT_FOUND': '遊戲不存在',
    'ROOM_FULL': '房間已滿',
  };

  return messages[err.code] || '發生錯誤，請重試';
}
```

---

## 七、工單詳細內容

### 工單 0361-0364：斷線重連

| 工單 | 標題 | 說明 |
|------|------|------|
| 0361 | 斷線重連機制設計 | 架構設計文檔 |
| 0362 | 實作遊戲狀態快照 | GameStateSnapshot |
| 0363 | 實作重連恢復 | ReconnectionHandler |
| 0364 | 實作重連 UI | ReconnectionOverlay |

### 工單 0365-0367：行動裝置

| 工單 | 標題 | 說明 |
|------|------|------|
| 0365 | iOS 測試與修復 | Safari 相容性 |
| 0366 | Android 測試與修復 | Chrome 相容性 |
| 0367 | 觸控操作優化 | 拖放、長按等 |

### 工單 0368-0370：效能優化

| 工單 | 標題 | 說明 |
|------|------|------|
| 0368 | 效能基準測試 | 建立效能指標 |
| 0369 | React 渲染優化 | memo/useMemo |
| 0370 | 記憶體優化 | 避免洩漏 |

### 工單 0371-0375：測試與發布

| 工單 | 標題 | 說明 |
|------|------|------|
| 0371 | E2E 完整測試 | Cypress 測試 |
| 0372 | 壓力測試 | 多房間同時 |
| 0373 | 安全性檢查 | 作弊防護 |
| 0374 | 錯誤監控整合 | Sentry |
| 0375 | 發布準備 | 文檔、部署 |

---

## 八、驗收標準

### 8.1 斷線重連

- [ ] 玩家斷線後 30 秒內可重連
- [ ] 重連後遊戲狀態正確恢復
- [ ] 超時後遊戲正確處理

### 8.2 行動裝置

- [ ] iOS Safari 正常運行
- [ ] Android Chrome 正常運行
- [ ] 觸控操作流暢

### 8.3 效能

- [ ] 首屏載入 < 3s
- [ ] 動作回應 < 200ms
- [ ] 無明顯卡頓

### 8.4 測試

- [ ] E2E 測試覆蓋主要流程
- [ ] 壓力測試通過
- [ ] 無 P0 級別 BUG

---

**文件結束**

*建立者：Claude Code*
*建立日期：2026-02-01*
