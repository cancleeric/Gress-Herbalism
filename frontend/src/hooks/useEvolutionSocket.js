/**
 * 演化論 Socket Hook
 *
 * 提供便捷的 Socket 連線和動作 API
 *
 * @module hooks/useEvolutionSocket
 */

import { useEffect, useCallback, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { evolutionSocket } from '../services/evolutionSocket';
import {
  onEvoGameState,
  onEvoCreatureCreated,
  onEvoTraitAdded,
  onEvoPlayerPassed,
  onEvoCreatureFed,
  onEvoAttackPending,
  onEvoAttackResolved,
  onEvoError,
  onEvoPlayerJoined,
  onEvoPlayerLeft,
  onEvoGameStarted,
} from '../services/socketService';

/**
 * 演化論 Socket Hook
 *
 * @param {string} roomId - 房間 ID
 * @param {Object} options - 選項
 * @param {boolean} options.autoConnect - 是否自動連線
 */
export function useEvolutionSocket(roomId, options = {}) {
  const { autoConnect = true } = options;
  const dispatch = useDispatch();

  const [isConnected, setIsConnected] = useState(evolutionSocket.isConnected);
  const [error, setError] = useState(null);
  const unsubscribersRef = useRef([]);

  // 設定事件監聽
  useEffect(() => {
    if (!roomId || !autoConnect) return;

    const unsubscribers = [];

    // 監聽連線狀態
    unsubscribers.push(
      evolutionSocket.on('connected', () => setIsConnected(true))
    );
    unsubscribers.push(
      evolutionSocket.on('disconnected', () => setIsConnected(false))
    );
    unsubscribers.push(
      evolutionSocket.on('error', (err) => setError(err.message || err))
    );

    // 監聽遊戲事件
    unsubscribers.push(onEvoError((err) => setError(err.message || err)));

    unsubscribersRef.current = unsubscribers;

    // 更新連線狀態
    setIsConnected(evolutionSocket.isConnected);

    return () => {
      unsubscribers.forEach(unsub => {
        if (typeof unsub === 'function') unsub();
      });
    };
  }, [roomId, autoConnect]);

  // 清除錯誤
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 創建房間
  const createRoom = useCallback(async (roomName, maxPlayers, player) => {
    try {
      setError(null);
      return await evolutionSocket.createRoom(roomName, maxPlayers, player);
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, []);

  // 加入房間
  const joinRoom = useCallback(async (joinRoomId, player) => {
    try {
      setError(null);
      return await evolutionSocket.joinRoom(joinRoomId, player);
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, []);

  // 離開房間
  const leaveRoom = useCallback((leaveRoomId, playerId) => {
    evolutionSocket.leaveRoom(leaveRoomId, playerId);
  }, []);

  // 設定準備狀態
  const setReady = useCallback((readyRoomId, playerId, isReady) => {
    evolutionSocket.setReady(readyRoomId, playerId, isReady);
  }, []);

  // 開始遊戲
  const startGame = useCallback((startRoomId, playerId) => {
    evolutionSocket.startGame(startRoomId, playerId);
  }, []);

  // 創造生物
  const createCreature = useCallback((playerId, cardId) => {
    if (!roomId) return;
    evolutionSocket.createCreature(roomId, playerId, cardId);
  }, [roomId]);

  // 添加性狀
  const addTrait = useCallback((playerId, cardId, creatureId, targetCreatureId = null) => {
    if (!roomId) return;
    evolutionSocket.addTrait(roomId, playerId, cardId, creatureId, targetCreatureId);
  }, [roomId]);

  // 跳過演化
  const passEvolution = useCallback((playerId) => {
    if (!roomId) return;
    evolutionSocket.passEvolution(roomId, playerId);
  }, [roomId]);

  // 進食
  const feedCreature = useCallback((playerId, creatureId) => {
    if (!roomId) return;
    evolutionSocket.feedCreature(roomId, playerId, creatureId);
  }, [roomId]);

  // 攻擊
  const attack = useCallback((playerId, attackerId, defenderId) => {
    if (!roomId) return;
    evolutionSocket.attack(roomId, playerId, attackerId, defenderId);
  }, [roomId]);

  // 回應攻擊
  const respondAttack = useCallback((playerId, response) => {
    if (!roomId) return;
    evolutionSocket.respondAttack(roomId, playerId, response);
  }, [roomId]);

  // 使用性狀
  const useTrait = useCallback((playerId, creatureId, traitType, targetId = null) => {
    if (!roomId) return;
    evolutionSocket.useTrait(roomId, playerId, creatureId, traitType, targetId);
  }, [roomId]);

  // 請求房間列表
  const requestRoomList = useCallback(() => {
    evolutionSocket.requestRoomList();
  }, []);

  return {
    // 狀態
    isConnected,
    error,
    clearError,

    // 房間操作
    createRoom,
    joinRoom,
    leaveRoom,
    setReady,
    startGame,
    requestRoomList,

    // 遊戲動作
    actions: {
      createCreature,
      addTrait,
      passEvolution,
      feedCreature,
      attack,
      respondAttack,
      useTrait,
    },

    // 事件監聽
    onGameState: evolutionSocket.onGameState.bind(evolutionSocket),
    onPlayerJoined: evolutionSocket.onPlayerJoined.bind(evolutionSocket),
    onPlayerLeft: evolutionSocket.onPlayerLeft.bind(evolutionSocket),
    onGameStarted: evolutionSocket.onGameStarted.bind(evolutionSocket),
    onError: evolutionSocket.onError.bind(evolutionSocket),
    onRoomListUpdated: evolutionSocket.onRoomListUpdated.bind(evolutionSocket),
  };
}

/**
 * 簡化版 - 僅監聽遊戲狀態
 */
export function useEvolutionGameState(callback) {
  useEffect(() => {
    const unsub = onEvoGameState(callback);
    return () => unsub();
  }, [callback]);
}

/**
 * 監聽遊戲事件
 *
 * Issue #7 效能優化：使用 useRef 存儲 handlers 避免 handlers 物件參考變化
 * 導致 useEffect 每次渲染都重新訂閱的記憶體洩漏問題
 */
export function useEvolutionGameEvents(handlers = {}) {
  const handlersRef = useRef(handlers);

  // 每次渲染更新 ref 的值，但不觸發 effect 重新執行
  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    const unsubscribers = [];

    if (handlersRef.current.onGameState) {
      unsubscribers.push(onEvoGameState((data) => handlersRef.current.onGameState?.(data)));
    }
    if (handlersRef.current.onCreatureCreated) {
      unsubscribers.push(onEvoCreatureCreated((data) => handlersRef.current.onCreatureCreated?.(data)));
    }
    if (handlersRef.current.onTraitAdded) {
      unsubscribers.push(onEvoTraitAdded((data) => handlersRef.current.onTraitAdded?.(data)));
    }
    if (handlersRef.current.onPlayerPassed) {
      unsubscribers.push(onEvoPlayerPassed((data) => handlersRef.current.onPlayerPassed?.(data)));
    }
    if (handlersRef.current.onCreatureFed) {
      unsubscribers.push(onEvoCreatureFed((data) => handlersRef.current.onCreatureFed?.(data)));
    }
    if (handlersRef.current.onAttackPending) {
      unsubscribers.push(onEvoAttackPending((data) => handlersRef.current.onAttackPending?.(data)));
    }
    if (handlersRef.current.onAttackResolved) {
      unsubscribers.push(onEvoAttackResolved((data) => handlersRef.current.onAttackResolved?.(data)));
    }
    if (handlersRef.current.onError) {
      unsubscribers.push(onEvoError((data) => handlersRef.current.onError?.(data)));
    }
    if (handlersRef.current.onPlayerJoined) {
      unsubscribers.push(onEvoPlayerJoined((data) => handlersRef.current.onPlayerJoined?.(data)));
    }
    if (handlersRef.current.onPlayerLeft) {
      unsubscribers.push(onEvoPlayerLeft((data) => handlersRef.current.onPlayerLeft?.(data)));
    }
    if (handlersRef.current.onGameStarted) {
      unsubscribers.push(onEvoGameStarted((data) => handlersRef.current.onGameStarted?.(data)));
    }

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 只在 mount/unmount 時訂閱/取消訂閱，handlers 透過 ref 更新
}

export default useEvolutionSocket;
