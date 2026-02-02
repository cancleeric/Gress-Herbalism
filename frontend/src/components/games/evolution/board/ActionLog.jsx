/**
 * ActionLog - 行動日誌組件
 *
 * 記錄遊戲中的重要事件
 *
 * @module components/games/evolution/board/ActionLog
 */

import React, { useRef, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import './ActionLog.css';

/**
 * 行動圖示對照
 */
const ACTION_ICONS = {
  createCreature: '🦎',
  addTrait: '🧬',
  feed: '🍖',
  attack: '⚔️',
  killed: '💀',
  pass: '⏭️',
  phase: '📍',
  round: '🔄',
};

/**
 * 格式化行動訊息
 */
const formatAction = (action) => {
  switch (action.type) {
    case 'createCreature':
      return `${action.playerName} 創建了一隻生物`;
    case 'addTrait':
      return `${action.playerName} 為生物添加了「${action.traitName}」`;
    case 'feed':
      return `${action.playerName} 的生物進食了`;
    case 'attack':
      return `${action.attackerName} 攻擊了 ${action.defenderName} 的生物`;
    case 'killed':
      return `${action.playerName} 的生物被殺死`;
    case 'pass':
      return `${action.playerName} 跳過了回合`;
    case 'phase':
      return `進入「${action.phaseName}」階段`;
    case 'round':
      return `第 ${action.round} 回合開始`;
    default:
      return action.message || '未知行動';
  }
};

/**
 * 行動日誌組件
 */
export const ActionLog = ({
  actions = [],
  maxItems = 50,
  collapsed = false,
  onToggle,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(!collapsed);
  const logRef = useRef(null);

  // 自動滾動到底部
  useEffect(() => {
    if (logRef.current && isExpanded) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [actions, isExpanded]);

  // 切換展開
  const handleToggle = () => {
    setIsExpanded(!isExpanded);
    onToggle?.(!isExpanded);
  };

  // 顯示的日誌（限制數量）
  const displayLogs = actions.slice(-maxItems);

  return (
    <div
      className={`action-log ${isExpanded ? 'action-log--expanded' : ''} ${className}`}
      data-testid="action-log"
    >
      {/* 標題列 */}
      <div
        className="action-log__header"
        onClick={handleToggle}
        data-testid="action-log-header"
      >
        <span className="action-log__title">
          📜 行動日誌
          {!isExpanded && actions.length > 0 && (
            <span className="action-log__count" data-testid="action-count">
              ({actions.length})
            </span>
          )}
        </span>
        <button className="action-log__toggle" data-testid="toggle-button">
          {isExpanded ? '▼' : '▲'}
        </button>
      </div>

      {/* 日誌內容 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="action-log__content"
            ref={logRef}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            data-testid="action-log-content"
          >
            {displayLogs.length === 0 ? (
              <div className="action-log__empty" data-testid="empty-message">
                尚無行動記錄
              </div>
            ) : (
              displayLogs.map((action, index) => (
                <motion.div
                  key={action.id || index}
                  className={`action-log__item action-log__item--${action.type}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    delay: index === displayLogs.length - 1 ? 0.1 : 0,
                  }}
                  data-testid={`action-item-${index}`}
                >
                  <span className="action-log__icon" data-testid="action-icon">
                    {ACTION_ICONS[action.type] || '•'}
                  </span>
                  <span className="action-log__text" data-testid="action-text">
                    {formatAction(action)}
                  </span>
                  {action.timestamp && (
                    <span className="action-log__time" data-testid="action-time">
                      {new Date(action.timestamp).toLocaleTimeString('zh-TW', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

ActionLog.propTypes = {
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      type: PropTypes.string.isRequired,
      timestamp: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      playerName: PropTypes.string,
      traitName: PropTypes.string,
      attackerName: PropTypes.string,
      defenderName: PropTypes.string,
      phaseName: PropTypes.string,
      round: PropTypes.number,
      message: PropTypes.string,
    })
  ),
  maxItems: PropTypes.number,
  collapsed: PropTypes.bool,
  onToggle: PropTypes.func,
  className: PropTypes.string,
};

export default ActionLog;
