/**
 * PlayerBoard - 玩家區域組件
 *
 * 顯示單個玩家的遊戲狀態，包括資訊、生物和手牌
 *
 * @module components/games/evolution/board/PlayerBoard
 */

import React, { useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { CreatureCard } from '../cards/CreatureCard';
import { Hand } from './Hand';
import './PlayerBoard.css';

/**
 * 玩家區域組件
 */
export const PlayerBoard = ({
  player,
  isCurrentPlayer = false,
  isMyTurn = false,
  isSelf = false,
  compact = false,
  currentPhase = 'evolution',
  attackingCreature = null,
  onCreatureSelect,
  onCreatureFeed,
  onCreatureAttack,
  onPlaceTrait,
  onPlayAsCreature,
  onPlayAsTrait,
  className = '',
}) => {
  // 計算可攻擊的生物
  const attackableCreatures = useMemo(() => {
    if (!attackingCreature || isSelf) return new Set();

    // 簡化版本：所有對手生物都可被攻擊
    // 實際應根據性狀過濾
    return new Set(player.creatures.map((c) => c.id));
  }, [attackingCreature, isSelf, player.creatures]);

  // 處理生物選擇
  const handleCreatureSelect = useCallback(
    (creatureId) => {
      onCreatureSelect?.(player.id, creatureId);
    },
    [player.id, onCreatureSelect]
  );

  // 處理進食
  const handleCreatureFeed = useCallback(
    (creatureId) => {
      onCreatureFeed?.(player.id, creatureId);
    },
    [player.id, onCreatureFeed]
  );

  // 處理攻擊
  const handleCreatureAttack = useCallback(
    (creatureId) => {
      onCreatureAttack?.(player.id, creatureId);
    },
    [player.id, onCreatureAttack]
  );

  // 處理放置性狀
  const handlePlaceTrait = useCallback(
    (creatureId, cardId, side) => {
      onPlaceTrait?.(player.id, creatureId, cardId, side);
    },
    [player.id, onPlaceTrait]
  );

  // 狀態類別
  const boardClasses = [
    'player-board',
    isCurrentPlayer && 'player-board--current',
    isSelf && 'player-board--self',
    player.passed && 'player-board--passed',
    !player.connected && 'player-board--disconnected',
    compact && 'player-board--compact',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={boardClasses} data-testid="player-board">
      {/* 玩家資訊 */}
      <div className="player-board__header" data-testid="player-header">
        <div className="player-board__avatar" data-testid="player-avatar">
          {player.name.charAt(0).toUpperCase()}
        </div>

        <div className="player-board__info">
          <span className="player-board__name" data-testid="player-name">
            {player.name}
          </span>
          {player.score !== undefined && (
            <span className="player-board__score" data-testid="player-score">
              {player.score} 分
            </span>
          )}
        </div>

        {/* 狀態標籤 */}
        <div className="player-board__status" data-testid="player-status">
          {isCurrentPlayer && (
            <span
              className="player-board__tag player-board__tag--turn"
              data-testid="tag-turn"
            >
              當前回合
            </span>
          )}
          {player.passed && (
            <span
              className="player-board__tag player-board__tag--passed"
              data-testid="tag-passed"
            >
              已跳過
            </span>
          )}
          {player.connected === false && (
            <span
              className="player-board__tag player-board__tag--offline"
              data-testid="tag-offline"
            >
              離線
            </span>
          )}
        </div>

        {/* 手牌數（對手） */}
        {!isSelf && (
          <div className="player-board__hand-count" data-testid="opponent-hand-count">
            <span className="player-board__hand-icon">🃏</span>
            <span data-testid="opponent-hand-count-number">{player.hand.length}</span>
          </div>
        )}
      </div>

      {/* 生物區域 */}
      <div className="player-board__creatures" data-testid="creatures-area">
        {player.creatures.length === 0 ? (
          <div className="player-board__empty" data-testid="empty-creatures">
            <span>尚無生物</span>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {player.creatures.map((creature) => (
              <motion.div
                key={creature.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                layout
                data-testid={`creature-wrapper-${creature.id}`}
              >
                <CreatureCard
                  creature={creature}
                  isOwn={isSelf}
                  canBeAttacked={attackableCreatures.has(creature.id)}
                  canReceiveTrait={isSelf && currentPhase === 'evolution'}
                  currentPhase={currentPhase}
                  onSelect={handleCreatureSelect}
                  onFeed={handleCreatureFeed}
                  onAttack={handleCreatureAttack}
                  onPlaceTrait={handlePlaceTrait}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* 手牌區域（自己） */}
      {isSelf && (
        <div className="player-board__hand" data-testid="hand-area">
          <Hand
            cards={player.hand}
            disabled={!isMyTurn}
            onPlayAsCreature={onPlayAsCreature}
            onPlayAsTrait={onPlayAsTrait}
          />
        </div>
      )}

      {/* 互動性狀連結線（預留） */}
      <svg className="player-board__links" data-testid="trait-links">
        {/* 連結線繪製需要 DOM 位置計算，此處預留 */}
      </svg>
    </div>
  );
};

PlayerBoard.propTypes = {
  player: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    hand: PropTypes.array.isRequired,
    creatures: PropTypes.array.isRequired,
    passed: PropTypes.bool,
    connected: PropTypes.bool,
    score: PropTypes.number,
  }).isRequired,
  isCurrentPlayer: PropTypes.bool,
  isMyTurn: PropTypes.bool,
  isSelf: PropTypes.bool,
  compact: PropTypes.bool,
  currentPhase: PropTypes.string,
  attackingCreature: PropTypes.string,
  onCreatureSelect: PropTypes.func,
  onCreatureFeed: PropTypes.func,
  onCreatureAttack: PropTypes.func,
  onPlaceTrait: PropTypes.func,
  onPlayAsCreature: PropTypes.func,
  onPlayAsTrait: PropTypes.func,
  className: PropTypes.string,
};

export default PlayerBoard;
