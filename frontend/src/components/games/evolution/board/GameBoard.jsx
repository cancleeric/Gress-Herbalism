/**
 * GameBoard - 遊戲主板組件
 *
 * 整合所有遊戲區域，支援 2-4 人布局
 *
 * @module components/games/evolution/board/GameBoard
 */

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { PlayerBoard } from './PlayerBoard';
import { FoodPool } from './FoodPool';
import './GameBoard.css';

/**
 * 遊戲主板組件
 */
export const GameBoard = ({
  gameState,
  myPlayerId,
  currentPhase = 'evolution',
  currentPlayerIndex = 0,
  onAction,
  className = '',
}) => {
  // 整理玩家順序（自己在下方）
  const orderedPlayers = useMemo(() => {
    const players = Object.values(gameState.players);
    const myIndex = players.findIndex((p) => p.id === myPlayerId);

    if (myIndex === -1) return players;

    // 將自己移到最後
    const reordered = [
      ...players.slice(myIndex + 1),
      ...players.slice(0, myIndex),
      players[myIndex],
    ];

    return reordered;
  }, [gameState.players, myPlayerId]);

  // 當前玩家
  const currentPlayerId = gameState.turnOrder?.[currentPlayerIndex];
  const isMyTurn = currentPlayerId === myPlayerId;

  // 佈局計算
  const playerCount = orderedPlayers.length;
  const layoutClass = `game-board--${playerCount}p`;

  // 動作處理
  const handleCreatureSelect = (playerId, creatureId) => {
    onAction?.('selectCreature', { playerId, creatureId });
  };

  const handleCreatureFeed = (playerId, creatureId) => {
    onAction?.('feed', { playerId, creatureId });
  };

  const handleCreatureAttack = (playerId, creatureId) => {
    onAction?.('attack', { playerId, creatureId });
  };

  const handlePlaceTrait = (playerId, creatureId, cardId, side) => {
    onAction?.('placeTrait', { playerId, creatureId, cardId, side });
  };

  const handlePlayAsCreature = (cardId) => {
    onAction?.('playAsCreature', { cardId });
  };

  const handlePlayAsTrait = (cardId, side) => {
    onAction?.('playAsTrait', { cardId, side });
  };

  const handleTakeFood = () => {
    onAction?.('takeFood', {});
  };

  const handleRollFood = () => {
    onAction?.('rollFood', {});
  };

  // 自己的玩家資料
  const selfPlayer = orderedPlayers[orderedPlayers.length - 1];
  const opponents = orderedPlayers.slice(0, -1);

  return (
    <DndProvider backend={HTML5Backend}>
      <div
        className={`game-board ${layoutClass} ${className}`}
        data-testid="game-board"
      >
        {/* 階段指示器區域 */}
        <div className="game-board__phase" data-testid="phase-area">
          <div className="game-board__phase-info">
            <span className="game-board__round" data-testid="round-display">
              第 {gameState.round || 1} 回合
            </span>
            <span className="game-board__phase-name" data-testid="phase-display">
              {getPhaseDisplayName(currentPhase)}
            </span>
            {isMyTurn && (
              <span
                className="game-board__turn-indicator"
                data-testid="my-turn-indicator"
              >
                輪到你了
              </span>
            )}
          </div>
        </div>

        {/* 對手區域 */}
        <div className="game-board__opponents" data-testid="opponents-area">
          {opponents.map((player, index) => (
            <div
              key={player.id}
              className={`game-board__opponent game-board__opponent--${index + 1}`}
              data-testid={`opponent-${index + 1}`}
            >
              <PlayerBoard
                player={player}
                isCurrentPlayer={player.id === currentPlayerId}
                isSelf={false}
                compact={playerCount > 2}
                currentPhase={currentPhase}
                onCreatureSelect={handleCreatureSelect}
                onCreatureFeed={handleCreatureFeed}
                onCreatureAttack={handleCreatureAttack}
              />
            </div>
          ))}
        </div>

        {/* 中央區域 */}
        <div className="game-board__center" data-testid="center-area">
          {/* 食物池 */}
          <FoodPool
            amount={gameState.foodPool || 0}
            lastRoll={gameState.lastFoodRoll}
            isRolling={gameState.isRolling || false}
            canTakeFood={currentPhase === 'feeding' && isMyTurn}
            onTakeFood={handleTakeFood}
            onRoll={handleRollFood}
            showRollButton={
              currentPhase === 'food_supply' &&
              currentPlayerIndex === 0 &&
              isMyTurn
            }
          />

          {/* 牌庫資訊 */}
          <div className="game-board__deck-info" data-testid="deck-info">
            <span className="game-board__deck-icon">🃏</span>
            <span className="game-board__deck-count" data-testid="deck-count">
              {gameState.deck?.length || 0}
            </span>
            <span className="game-board__deck-label">張剩餘</span>
          </div>
        </div>

        {/* 自己的區域 */}
        {selfPlayer && (
          <div className="game-board__self" data-testid="self-area">
            <PlayerBoard
              player={selfPlayer}
              isCurrentPlayer={myPlayerId === currentPlayerId}
              isMyTurn={isMyTurn}
              isSelf={true}
              currentPhase={currentPhase}
              onCreatureSelect={handleCreatureSelect}
              onCreatureFeed={handleCreatureFeed}
              onCreatureAttack={handleCreatureAttack}
              onPlaceTrait={handlePlaceTrait}
              onPlayAsCreature={handlePlayAsCreature}
              onPlayAsTrait={handlePlayAsTrait}
            />
          </div>
        )}
      </div>
    </DndProvider>
  );
};

/**
 * 取得階段顯示名稱
 */
function getPhaseDisplayName(phase) {
  const phaseNames = {
    evolution: '演化階段',
    food_supply: '食物供給',
    feeding: '進食階段',
    extinction: '滅絕階段',
  };
  return phaseNames[phase] || phase;
}

GameBoard.propTypes = {
  gameState: PropTypes.shape({
    players: PropTypes.object.isRequired,
    turnOrder: PropTypes.arrayOf(PropTypes.string),
    foodPool: PropTypes.number,
    deck: PropTypes.array,
    round: PropTypes.number,
    lastFoodRoll: PropTypes.object,
  }).isRequired,
  myPlayerId: PropTypes.string.isRequired,
  currentPhase: PropTypes.string,
  currentPlayerIndex: PropTypes.number,
  onAction: PropTypes.func,
  className: PropTypes.string,
};

export default GameBoard;
