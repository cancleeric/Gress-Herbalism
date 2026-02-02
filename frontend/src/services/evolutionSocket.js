/**
 * 演化論遊戲 Socket 服務
 *
 * 封裝演化論遊戲的 Socket 通訊，整合 Store 狀態管理
 *
 * @module services/evolutionSocket
 */

import {
  getSocket,
  evoCreateRoom,
  evoJoinRoom,
  evoLeaveRoom,
  evoSetReady,
  evoStartGame,
  evoCreateCreature,
  evoAddTrait,
  evoPassEvolution,
  evoFeedCreature,
  evoAttack,
  evoRespondAttack,
  evoUseTrait,
  evoRequestRoomList,
  onEvoRoomCreated,
  onEvoJoinedRoom,
  onEvoPlayerJoined,
  onEvoPlayerLeft,
  onEvoPlayerReady,
  onEvoGameStarted,
  onEvoGameState,
  onEvoCreatureCreated,
  onEvoTraitAdded,
  onEvoPlayerPassed,
  onEvoCreatureFed,
  onEvoChainTriggered,
  onEvoAttackPending,
  onEvoAttackResolved,
  onEvoTraitUsed,
  onEvoRoomListUpdated,
  onEvoError,
} from './socketService';

/**
 * 演化論 Socket 服務類別
 *
 * 提供統一的 API 來處理演化論遊戲的 Socket 通訊
 */
class EvolutionSocketService {
  constructor() {
    this.listeners = new Map();
    this.unsubscribers = [];
  }

  /**
   * 檢查是否已連線
   */
  get isConnected() {
    const socket = getSocket();
    return socket?.connected || false;
  }

  /**
   * 設定事件監聽並與 Store 同步
   * @param {Function} dispatch - Redux dispatch 函數
   * @param {Object} actions - Store actions
   */
  setupStoreSync(dispatch, actions) {
    const {
      setGameState,
      setPhase,
      setRound,
      setCurrentPlayer,
      setFoodPool,
      setPlayers,
      addCreature,
      removeCreature,
      updateCreature,
      setPlayerPassed,
      setPendingResponse,
      addActionLog,
      setGameEnd,
      enqueueAnimation,
    } = actions;

    // 遊戲狀態同步
    this.unsubscribers.push(
      onEvoGameState((state) => {
        if (setGameState) dispatch(setGameState(state));
        if (setPlayers && state.players) dispatch(setPlayers(state.players));
      })
    );

    // 生物創建
    this.unsubscribers.push(
      onEvoCreatureCreated(({ playerId, creature }) => {
        if (addCreature) dispatch(addCreature({ playerId, creature }));
        if (addActionLog) {
          dispatch(addActionLog({
            type: 'createCreature',
            playerId,
          }));
        }
      })
    );

    // 性狀添加
    this.unsubscribers.push(
      onEvoTraitAdded(({ playerId, creatureId, trait }) => {
        if (updateCreature) {
          dispatch(updateCreature({
            playerId,
            creatureId,
            updates: { traits: trait },
          }));
        }
        if (addActionLog) {
          dispatch(addActionLog({
            type: 'addTrait',
            playerId,
            traitName: trait.type,
          }));
        }
      })
    );

    // 玩家跳過
    this.unsubscribers.push(
      onEvoPlayerPassed(({ playerId }) => {
        if (setPlayerPassed) dispatch(setPlayerPassed({ playerId, passed: true }));
      })
    );

    // 生物進食
    this.unsubscribers.push(
      onEvoCreatureFed(({ playerId, creatureId, food }) => {
        if (updateCreature) {
          dispatch(updateCreature({
            playerId,
            creatureId,
            updates: { food },
          }));
        }
        if (enqueueAnimation) {
          dispatch(enqueueAnimation({ type: 'feed', priority: 5, data: { creatureId } }));
        }
      })
    );

    // 攻擊待處理
    this.unsubscribers.push(
      onEvoAttackPending((data) => {
        if (setPendingResponse) dispatch(setPendingResponse(data));
        if (enqueueAnimation) {
          dispatch(enqueueAnimation({ type: 'attack', priority: 10, data }));
        }
      })
    );

    // 攻擊結果
    this.unsubscribers.push(
      onEvoAttackResolved(({ attackerId, defenderId, success, defenderDied }) => {
        if (defenderDied && removeCreature) {
          // 防禦者死亡由後端推送 creatureDied 事件處理
        }
      })
    );

    // 錯誤處理
    this.unsubscribers.push(
      onEvoError((error) => {
        console.error('[EvolutionSocket] Error:', error);
        this._notifyListeners('error', error);
      })
    );

    return () => this.cleanup();
  }

  /**
   * 清理所有監聽器
   */
  cleanup() {
    this.unsubscribers.forEach(unsub => unsub());
    this.unsubscribers = [];
  }

  // ========== 房間操作 ==========

  /**
   * 創建房間
   */
  createRoom(roomName, maxPlayers, player) {
    return new Promise((resolve, reject) => {
      const unsub = onEvoRoomCreated((data) => {
        unsub();
        resolve(data);
      });

      const errorUnsub = onEvoError((error) => {
        errorUnsub();
        reject(new Error(error.message || 'Create room failed'));
      });

      evoCreateRoom(roomName, maxPlayers, player);

      // 超時處理
      setTimeout(() => {
        unsub();
        errorUnsub();
        reject(new Error('Create room timeout'));
      }, 10000);
    });
  }

  /**
   * 加入房間
   */
  joinRoom(roomId, player) {
    return new Promise((resolve, reject) => {
      const unsub = onEvoJoinedRoom((data) => {
        unsub();
        resolve(data);
      });

      const errorUnsub = onEvoError((error) => {
        errorUnsub();
        reject(new Error(error.message || 'Join room failed'));
      });

      evoJoinRoom(roomId, player);

      setTimeout(() => {
        unsub();
        errorUnsub();
        reject(new Error('Join room timeout'));
      }, 10000);
    });
  }

  /**
   * 離開房間
   */
  leaveRoom(roomId, playerId) {
    evoLeaveRoom(roomId, playerId);
  }

  /**
   * 設定準備狀態
   */
  setReady(roomId, playerId, isReady) {
    evoSetReady(roomId, playerId, isReady);
  }

  /**
   * 開始遊戲
   */
  startGame(roomId, playerId) {
    evoStartGame(roomId, playerId);
  }

  /**
   * 請求房間列表
   */
  requestRoomList() {
    evoRequestRoomList();
  }

  // ========== 遊戲動作 ==========

  /**
   * 創造生物
   */
  createCreature(roomId, playerId, cardId) {
    evoCreateCreature(roomId, playerId, cardId);
  }

  /**
   * 添加性狀
   */
  addTrait(roomId, playerId, cardId, creatureId, targetCreatureId = null) {
    evoAddTrait(roomId, playerId, cardId, creatureId, targetCreatureId);
  }

  /**
   * 跳過演化
   */
  passEvolution(roomId, playerId) {
    evoPassEvolution(roomId, playerId);
  }

  /**
   * 進食
   */
  feedCreature(roomId, playerId, creatureId) {
    evoFeedCreature(roomId, playerId, creatureId);
  }

  /**
   * 攻擊
   */
  attack(roomId, playerId, attackerId, defenderId) {
    evoAttack(roomId, playerId, attackerId, defenderId);
  }

  /**
   * 回應攻擊
   */
  respondAttack(roomId, playerId, response) {
    evoRespondAttack(roomId, playerId, response);
  }

  /**
   * 使用性狀
   */
  useTrait(roomId, playerId, creatureId, traitType, targetId = null) {
    evoUseTrait(roomId, playerId, creatureId, traitType, targetId);
  }

  // ========== 事件監聽 ==========

  /**
   * 監聯房間列表更新
   */
  onRoomListUpdated(callback) {
    return onEvoRoomListUpdated(callback);
  }

  /**
   * 監聽玩家加入
   */
  onPlayerJoined(callback) {
    return onEvoPlayerJoined(callback);
  }

  /**
   * 監聽玩家離開
   */
  onPlayerLeft(callback) {
    return onEvoPlayerLeft(callback);
  }

  /**
   * 監聽玩家準備狀態
   */
  onPlayerReady(callback) {
    return onEvoPlayerReady(callback);
  }

  /**
   * 監聽遊戲開始
   */
  onGameStarted(callback) {
    return onEvoGameStarted(callback);
  }

  /**
   * 監聽遊戲狀態
   */
  onGameState(callback) {
    return onEvoGameState(callback);
  }

  /**
   * 監聽錯誤
   */
  onError(callback) {
    return onEvoError(callback);
  }

  // ========== 內部事件系統 ==========

  /**
   * 註冊自定義事件監聽
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
    return () => this.off(event, callback);
  }

  /**
   * 取消事件監聽
   */
  off(event, callback) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * 通知監聽器
   * @private
   */
  _notifyListeners(event, data) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(cb => cb(data));
    }
  }
}

export const evolutionSocket = new EvolutionSocketService();
export default evolutionSocket;
