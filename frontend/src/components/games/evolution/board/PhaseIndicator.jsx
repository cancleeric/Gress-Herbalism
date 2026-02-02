/**
 * PhaseIndicator - 階段指示器組件
 *
 * 顯示遊戲進度：回合、階段、當前玩家
 *
 * @module components/games/evolution/board/PhaseIndicator
 */

import React from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import './PhaseIndicator.css';

/**
 * 遊戲階段常數
 */
const GAME_PHASES = {
  EVOLUTION: 'evolution',
  FOOD_SUPPLY: 'foodSupply',
  FEEDING: 'feeding',
  EXTINCTION: 'extinction',
};

/**
 * 階段設定
 */
const PHASE_CONFIG = {
  [GAME_PHASES.EVOLUTION]: {
    name: '演化',
    icon: '🧬',
    description: '打出卡牌，建立生物或添加性狀',
    color: '#8b5cf6',
  },
  [GAME_PHASES.FOOD_SUPPLY]: {
    name: '食物供給',
    icon: '🎲',
    description: '擲骰決定食物池數量',
    color: '#f59e0b',
  },
  [GAME_PHASES.FEEDING]: {
    name: '進食',
    icon: '🍖',
    description: '餵食你的生物',
    color: '#10b981',
  },
  [GAME_PHASES.EXTINCTION]: {
    name: '滅絕',
    icon: '💀',
    description: '未吃飽的生物死亡',
    color: '#ef4444',
  },
};

/**
 * 階段順序
 */
const PHASE_ORDER = [
  GAME_PHASES.EVOLUTION,
  GAME_PHASES.FOOD_SUPPLY,
  GAME_PHASES.FEEDING,
  GAME_PHASES.EXTINCTION,
];

/**
 * 階段指示器組件
 */
export const PhaseIndicator = ({
  currentPhase = GAME_PHASES.EVOLUTION,
  round = 1,
  currentPlayer,
  isMyTurn = false,
  className = '',
}) => {
  const phaseIndex = PHASE_ORDER.indexOf(currentPhase);
  const currentConfig = PHASE_CONFIG[currentPhase] || PHASE_CONFIG[GAME_PHASES.EVOLUTION];

  return (
    <div className={`phase-indicator ${className}`} data-testid="phase-indicator">
      {/* 回合資訊 */}
      <div className="phase-indicator__round" data-testid="round-info">
        <span className="phase-indicator__round-label">第</span>
        <motion.span
          key={round}
          className="phase-indicator__round-number"
          initial={{ scale: 1.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          data-testid="round-number"
        >
          {round}
        </motion.span>
        <span className="phase-indicator__round-label">回合</span>
      </div>

      {/* 階段進度 */}
      <div className="phase-indicator__phases" data-testid="phases-progress">
        {PHASE_ORDER.map((phase, index) => {
          const config = PHASE_CONFIG[phase];
          const isActive = phase === currentPhase;
          const isPast = index < phaseIndex;

          const phaseClasses = [
            'phase-indicator__phase',
            isActive && 'phase-indicator__phase--active',
            isPast && 'phase-indicator__phase--past',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <React.Fragment key={phase}>
              <motion.div
                className={phaseClasses}
                animate={isActive ? { scale: [1, 1.05, 1] } : {}}
                transition={{ repeat: Infinity, duration: 2 }}
                data-testid={`phase-${phase}`}
              >
                <div
                  className="phase-indicator__phase-icon"
                  style={{
                    backgroundColor: isActive || isPast ? config.color : '#e2e8f0',
                  }}
                  data-testid={`phase-icon-${phase}`}
                >
                  {config.icon}
                </div>
                <span className="phase-indicator__phase-name">{config.name}</span>
              </motion.div>

              {/* 連接線 */}
              {index < PHASE_ORDER.length - 1 && (
                <div
                  className={`phase-indicator__connector ${isPast ? 'phase-indicator__connector--filled' : ''}`}
                  data-testid={`connector-${index}`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* 當前階段說明 */}
      <motion.div
        key={currentPhase}
        className="phase-indicator__current"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ borderColor: currentConfig.color }}
        data-testid="current-phase-info"
      >
        <span className="phase-indicator__current-icon">{currentConfig.icon}</span>
        <div className="phase-indicator__current-info">
          <span className="phase-indicator__current-name" data-testid="current-phase-name">
            {currentConfig.name}階段
          </span>
          <span className="phase-indicator__current-desc" data-testid="current-phase-desc">
            {currentConfig.description}
          </span>
        </div>
      </motion.div>

      {/* 當前玩家 */}
      {currentPlayer && (
        <div
          className={`phase-indicator__player ${isMyTurn ? 'phase-indicator__player--self' : ''}`}
          data-testid="current-player"
        >
          {isMyTurn ? (
            <motion.span
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              data-testid="my-turn-indicator"
            >
              ⭐ 你的回合
            </motion.span>
          ) : (
            <span data-testid="waiting-indicator">等待 {currentPlayer} 行動</span>
          )}
        </div>
      )}
    </div>
  );
};

PhaseIndicator.propTypes = {
  currentPhase: PropTypes.oneOf(Object.values(GAME_PHASES)),
  round: PropTypes.number,
  currentPlayer: PropTypes.string,
  isMyTurn: PropTypes.bool,
  className: PropTypes.string,
};

export default PhaseIndicator;
