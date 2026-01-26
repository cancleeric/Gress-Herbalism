/**
 * AI 玩家管理 Hook
 *
 * @module useAIPlayers
 * @description 管理 AI 玩家實例，處理 AI 回合決策
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { createAIPlayer } from '../ai';
import { PLAYER_TYPE } from '../shared/constants';

/**
 * AI 玩家管理 Hook
 *
 * @param {Object} options - 選項
 * @param {Object} options.aiConfig - AI 配置 { aiCount, difficulties }
 * @param {Object} options.gameState - 遊戲狀態
 * @param {Function} options.onAIAction - AI 動作回調
 * @returns {Object} AI 玩家管理對象
 */
function useAIPlayers({ aiConfig, gameState, onAIAction }) {
  // AI 玩家實例陣列
  const [aiPlayers, setAIPlayers] = useState([]);

  // 使用 ref 避免重複創建
  const aiPlayersRef = useRef([]);

  // AI 思考中狀態
  const [aiThinking, setAIThinking] = useState(false);

  // 當前執行動作的 AI ID
  const [currentAIId, setCurrentAIId] = useState(null);

  /**
   * 初始化 AI 玩家
   */
  useEffect(() => {
    if (!aiConfig || !aiConfig.aiCount || aiConfig.aiCount === 0) {
      setAIPlayers([]);
      aiPlayersRef.current = [];
      return;
    }

    // 創建 AI 玩家實例
    const players = [];
    for (let i = 0; i < aiConfig.aiCount; i++) {
      const difficulty = aiConfig.difficulties[i] || 'medium';
      const aiPlayer = createAIPlayer(
        `ai-${i + 1}`,
        null, // 使用預設名稱
        difficulty
      );

      players.push(aiPlayer);
    }

    setAIPlayers(players);
    aiPlayersRef.current = players;

    console.log(`[AI] 初始化 ${aiConfig.aiCount} 個 AI 玩家`, players.map(p => ({
      id: p.id,
      name: p.name,
      difficulty: p.difficulty
    })));
  }, [aiConfig]);

  /**
   * 檢查玩家是否為 AI
   */
  const isAIPlayer = useCallback((player) => {
    if (!player) return false;
    return (
      player.isAI === true ||
      player.playerType === PLAYER_TYPE.AI ||
      player.id?.startsWith('ai-')
    );
  }, []);

  /**
   * 找到對應的 AI 實例
   */
  const getAIInstance = useCallback((playerId) => {
    return aiPlayersRef.current.find(ai => ai.id === playerId);
  }, []);

  /**
   * 處理 AI 回合
   */
  const handleAITurn = useCallback(async (player) => {
    if (!player || !isAIPlayer(player)) return;

    const aiInstance = getAIInstance(player.id);
    if (!aiInstance) {
      console.warn(`[AI] 找不到 AI 實例: ${player.id}`);
      return;
    }

    setAIThinking(true);
    setCurrentAIId(player.id);

    console.log(`[AI] ${aiInstance.name} 開始思考...`);

    try {
      // AI 執行決策（包含延遲）
      const action = await aiInstance.takeTurn(gameState);

      console.log(`[AI] ${aiInstance.name} 決定執行:`, action);

      // 回調通知父組件執行動作
      if (onAIAction) {
        onAIAction(action, aiInstance);
      }
    } catch (error) {
      console.error(`[AI] ${aiInstance.name} 決策失敗:`, error);
    } finally {
      setAIThinking(false);
      setCurrentAIId(null);
    }
  }, [gameState, isAIPlayer, getAIInstance, onAIAction]);

  /**
   * 處理 AI 跟猜決定
   */
  const handleAIFollowGuess = useCallback(async (player, guessedColors) => {
    if (!player || !isAIPlayer(player)) return null;

    const aiInstance = getAIInstance(player.id);
    if (!aiInstance) {
      console.warn(`[AI] 找不到 AI 實例: ${player.id}`);
      return null;
    }

    setAIThinking(true);
    setCurrentAIId(player.id);

    console.log(`[AI] ${aiInstance.name} 考慮是否跟猜 [${guessedColors.join(', ')}]...`);

    try {
      // AI 決定是否跟猜（包含延遲）
      const shouldFollow = await aiInstance.decideFollowGuess(gameState, guessedColors);

      console.log(`[AI] ${aiInstance.name} 決定:`, shouldFollow ? '跟猜' : '不跟');

      return shouldFollow;
    } catch (error) {
      console.error(`[AI] ${aiInstance.name} 跟猜決策失敗:`, error);
      return false;
    } finally {
      setAIThinking(false);
      setCurrentAIId(null);
    }
  }, [gameState, isAIPlayer, getAIInstance]);

  /**
   * 處理遊戲事件（更新 AI 的資訊追蹤）
   */
  const handleGameEvent = useCallback((event) => {
    aiPlayersRef.current.forEach(aiInstance => {
      aiInstance.onGameEvent(event);
    });
  }, []);

  /**
   * 重置所有 AI 玩家狀態
   */
  const resetAIPlayers = useCallback(() => {
    aiPlayersRef.current.forEach(aiInstance => {
      aiInstance.reset();
    });
    setAIThinking(false);
    setCurrentAIId(null);
  }, []);

  return {
    // 狀態
    aiPlayers,
    aiThinking,
    currentAIId,

    // 方法
    isAIPlayer,
    getAIInstance,
    handleAITurn,
    handleAIFollowGuess,
    handleGameEvent,
    resetAIPlayers
  };
}

export default useAIPlayers;
