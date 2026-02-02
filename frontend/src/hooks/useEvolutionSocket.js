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
 */
export function useEvolutionGameEvents(handlers = {}) {
  useEffect(() => {
    const unsubscribers = [];

    if (handlers.onGameState) {
      unsubscribers.push(onEvoGameState(handlers.onGameState));
    }
    if (handlers.onCreatureCreated) {
      unsubscribers.push(onEvoCreatureCreated(handlers.onCreatureCreated));
    }
    if (handlers.onTraitAdded) {
      unsubscribers.push(onEvoTraitAdded(handlers.onTraitAdded));
    }
    if (handlers.onPlayerPassed) {
      unsubscribers.push(onEvoPlayerPassed(handlers.onPlayerPassed));
    }
    if (handlers.onCreatureFed) {
      unsubscribers.push(onEvoCreatureFed(handlers.onCreatureFed));
    }
    if (handlers.onAttackPending) {
      unsubscribers.push(onEvoAttackPending(handlers.onAttackPending));
    }
    if (handlers.onAttackResolved) {
      unsubscribers.push(onEvoAttackResolved(handlers.onAttackResolved));
    }
    if (handlers.onError) {
      unsubscribers.push(onEvoError(handlers.onError));
    }
    if (handlers.onPlayerJoined) {
      unsubscribers.push(onEvoPlayerJoined(handlers.onPlayerJoined));
    }
    if (handlers.onPlayerLeft) {
      unsubscribers.push(onEvoPlayerLeft(handlers.onPlayerLeft));
    }
    if (handlers.onGameStarted) {
      unsubscribers.push(onEvoGameStarted(handlers.onGameStarted));
    }

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [handlers]);
}

export default useEvolutionSocket;
