# 工單 0346：Socket.io 事件處理整合

## 基本資訊
- **工單編號**：0346
- **所屬計畫**：P2-B 前端 UI
- **前置工單**：0345（Store 狀態管理）
- **預計影響檔案**：
  - `frontend/src/services/evolutionSocket.js`（新增）
  - `frontend/src/hooks/useEvolutionSocket.js`（新增）

---

## 目標

整合 Socket.io 與遊戲狀態：
1. 封裝 Socket 連線管理
2. 事件監聽與狀態同步
3. 錯誤處理與重連
4. 動作發送封裝

---

## 詳細規格

### 1. Socket 服務

```javascript
// frontend/src/services/evolutionSocket.js

import { io } from 'socket.io-client';
import { store } from '../store';
import {
  setGameState,
  setPhase,
  setRound,
  setCurrentPlayer,
  setFoodPool,
  setGameEnd,
  addActionLog,
} from '../store/evolution/gameSlice';
import {
  setPlayers,
  setHand,
  addCreature,
  removeCreature,
  updateCreature,
  setPlayerPassed,
} from '../store/evolution/playerSlice';
import { enqueue } from '../store/evolution/animationSlice';

class EvolutionSocketService {
  constructor() {
    this.socket = null;
    this.gameId = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.listeners = new Map();
  }

  /**
   * 連線到遊戲
   */
  connect(gameId, playerId, token) {
    if (this.socket?.connected) {
      this.disconnect();
    }

    this.gameId = gameId;

    this.socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001', {
      auth: { token, playerId },
      query: { gameId },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
    });

    this._setupListeners();

    return new Promise((resolve, reject) => {
      this.socket.on('connect', () => {
        this.reconnectAttempts = 0;
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * 設定事件監聽
   */
  _setupListeners() {
    const dispatch = store.dispatch;

    // 遊戲狀態同步
    this.socket.on('gameState', (state) => {
      dispatch(setGameState(state));
      dispatch(setPlayers(state.players));
    });

    // 階段變更
    this.socket.on('phaseChange', ({ phase, round }) => {
      dispatch(setPhase(phase));
      if (round !== undefined) {
        dispatch(setRound(round));
      }
      dispatch(enqueue({ type: 'phase', priority: 15, data: { phase } }));
    });

    // 當前玩家變更
    this.socket.on('turnChange', ({ playerIndex, playerId }) => {
      dispatch(setCurrentPlayer(playerIndex));
    });

    // 手牌更新
    this.socket.on('handUpdate', ({ playerId, hand }) => {
      dispatch(setHand({ playerId, hand }));
    });

    // 生物創建
    this.socket.on('creatureCreated', ({ playerId, creature }) => {
      dispatch(addCreature({ playerId, creature }));
      dispatch(addActionLog({
        type: 'createCreature',
        playerName: store.getState().evolutionPlayer.players[playerId]?.name,
      }));
    });

    // 性狀添加
    this.socket.on('traitAdded', ({ playerId, creatureId, trait }) => {
      dispatch(updateCreature({
        playerId,
        creatureId,
        updates: { traits: trait },
      }));
      dispatch(addActionLog({
        type: 'addTrait',
        playerName: store.getState().evolutionPlayer.players[playerId]?.name,
        traitName: trait.type,
      }));
    });

    // 進食
    this.socket.on('creatureFed', ({ playerId, creatureId, food, fromPool }) => {
      dispatch(updateCreature({
        playerId,
        creatureId,
        updates: { food },
      }));
      if (fromPool) {
        dispatch(setFoodPool({ amount: store.getState().evolutionGame.foodPool - 1 }));
      }
      dispatch(enqueue({ type: 'feed', priority: 5, data: { creatureId } }));
    });

    // 攻擊
    this.socket.on('attackResult', ({ attackerId, defenderId, success, defenderDied }) => {
      dispatch(enqueue({ type: 'attack', priority: 10, data: { attackerId, defenderId } }));
      if (defenderDied) {
        dispatch(enqueue({ type: 'death', priority: 8, data: { creatureId: defenderId } }));
      }
    });

    // 生物死亡
    this.socket.on('creatureDied', ({ playerId, creatureId }) => {
      dispatch(removeCreature({ playerId, creatureId }));
    });

    // 食物池更新
    this.socket.on('foodPoolUpdate', ({ amount, roll }) => {
      dispatch(setFoodPool({ amount, roll }));
    });

    // 玩家跳過
    this.socket.on('playerPassed', ({ playerId }) => {
      dispatch(setPlayerPassed({ playerId, passed: true }));
    });

    // 遊戲結束
    this.socket.on('gameEnd', ({ winner, scores }) => {
      dispatch(setGameEnd({ winner, scores }));
    });

    // 錯誤處理
    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      this._notifyListeners('error', error);
    });

    // 重連
    this.socket.on('reconnect', (attemptNumber) => {
      console.log('Reconnected after', attemptNumber, 'attempts');
      this._notifyListeners('reconnect', attemptNumber);
    });

    // 斷線
    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected:', reason);
      this._notifyListeners('disconnect', reason);
    });
  }

  /**
   * 發送動作
   */
  sendAction(action, data) {
    if (!this.socket?.connected) {
      console.error('Socket not connected');
      return Promise.reject(new Error('Not connected'));
    }

    return new Promise((resolve, reject) => {
      this.socket.emit('action', { action, ...data }, (response) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.error || 'Action failed'));
        }
      });
    });
  }

  // === 遊戲動作封裝 ===

  playAsCreature(cardId) {
    return this.sendAction('playAsCreature', { cardId });
  }

  playAsTrait(cardId, side, creatureId, linkedCreatureId = null) {
    return this.sendAction('playAsTrait', { cardId, side, creatureId, linkedCreatureId });
  }

  feed(creatureId) {
    return this.sendAction('feed', { creatureId });
  }

  attack(attackerCreatureId, defenderCreatureId) {
    return this.sendAction('attack', { attackerCreatureId, defenderCreatureId });
  }

  useFat(creatureId) {
    return this.sendAction('useFat', { creatureId });
  }

  pass() {
    return this.sendAction('pass', {});
  }

  rollFood() {
    return this.sendAction('rollFood', {});
  }

  // === 事件監聽 ===

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  _notifyListeners(event, data) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(cb => cb(data));
    }
  }

  /**
   * 斷開連線
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * 是否已連線
   */
  get isConnected() {
    return this.socket?.connected || false;
  }
}

export const evolutionSocket = new EvolutionSocketService();
export default evolutionSocket;
```

### 2. Socket Hook

```jsx
// frontend/src/hooks/useEvolutionSocket.js

import { useEffect, useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { evolutionSocket } from '../services/evolutionSocket';
import { selectMyPlayerId, selectIsMyTurn } from '../store/evolution/selectors';

/**
 * 演化論 Socket Hook
 */
export function useEvolutionSocket(gameId) {
  const dispatch = useDispatch();
  const myPlayerId = useSelector(selectMyPlayerId);
  const isMyTurn = useSelector(selectIsMyTurn);

  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  // 連線
  useEffect(() => {
    if (!gameId || !myPlayerId) return;

    const connect = async () => {
      try {
        await evolutionSocket.connect(gameId, myPlayerId);
        setIsConnected(true);
        setError(null);
      } catch (err) {
        setError(err.message);
        setIsConnected(false);
      }
    };

    connect();

    // 監聽連線狀態
    const unsubscribeReconnect = evolutionSocket.on('reconnect', () => {
      setIsConnected(true);
    });

    const unsubscribeDisconnect = evolutionSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    const unsubscribeError = evolutionSocket.on('error', (err) => {
      setError(err.message);
    });

    return () => {
      unsubscribeReconnect();
      unsubscribeDisconnect();
      unsubscribeError();
      evolutionSocket.disconnect();
    };
  }, [gameId, myPlayerId]);

  // 動作封裝
  const playAsCreature = useCallback(async (cardId) => {
    if (!isMyTurn) return { success: false, error: 'Not your turn' };
    try {
      return await evolutionSocket.playAsCreature(cardId);
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [isMyTurn]);

  const playAsTrait = useCallback(async (cardId, side, creatureId, linkedCreatureId) => {
    if (!isMyTurn) return { success: false, error: 'Not your turn' };
    try {
      return await evolutionSocket.playAsTrait(cardId, side, creatureId, linkedCreatureId);
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [isMyTurn]);

  const feed = useCallback(async (creatureId) => {
    if (!isMyTurn) return { success: false, error: 'Not your turn' };
    try {
      return await evolutionSocket.feed(creatureId);
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [isMyTurn]);

  const attack = useCallback(async (attackerCreatureId, defenderCreatureId) => {
    if (!isMyTurn) return { success: false, error: 'Not your turn' };
    try {
      return await evolutionSocket.attack(attackerCreatureId, defenderCreatureId);
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [isMyTurn]);

  const pass = useCallback(async () => {
    if (!isMyTurn) return { success: false, error: 'Not your turn' };
    try {
      return await evolutionSocket.pass();
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [isMyTurn]);

  const rollFood = useCallback(async () => {
    try {
      return await evolutionSocket.rollFood();
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  return {
    isConnected,
    error,
    isMyTurn,
    actions: {
      playAsCreature,
      playAsTrait,
      feed,
      attack,
      pass,
      rollFood,
    },
  };
}
```

---

## 驗收標準

1. [ ] Socket 連線正常
2. [ ] 事件監聯正確同步狀態
3. [ ] 動作發送正常
4. [ ] 錯誤處理完善
5. [ ] 重連機制正常
6. [ ] Hook API 易用
7. [ ] 與 Store 整合正常

---

## 備註

- Socket 是前後端通訊核心
- 需處理各種網路異常
