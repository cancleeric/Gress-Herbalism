/**
 * 計分板組件
 *
 * @module components/games/evolution/modals/ScoreBoard
 */

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import './ScoreBoard.css';

/**
 * 計分板組件
 *
 * @param {Object} props
 * @param {Object} props.scores - 玩家分數對照表
 * @param {Object} props.players - 玩家資訊對照表
 * @param {string} props.winnerId - 獲勝者 ID
 */
export const ScoreBoard = ({ scores = {}, players = {}, winnerId }) => {
  // 排序玩家（分數高到低）
  const sortedPlayers = useMemo(() => {
    const entries = Object.entries(scores);
    if (entries.length === 0) return [];

    return entries
      .map(([playerId, score]) => {
        // 支援 score 為數字或物件格式
        const scoreValue = typeof score === 'number' ? score : (score?.total || 0);
        const details = typeof score === 'object' ? score : { total: score };

        return {
          playerId,
          name: players[playerId]?.name || playerId,
          score: scoreValue,
          details,
          isWinner: playerId === winnerId,
        };
      })
      .sort((a, b) => b.score - a.score);
  }, [scores, players, winnerId]);

  // 獲取排名圖示
  const getRankIcon = (index) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `${index + 1}`;
  };

  if (sortedPlayers.length === 0) {
    return (
      <div className="score-board" data-testid="score-board">
        <p className="score-board__empty">暫無計分資料</p>
      </div>
    );
  }

  return (
    <div className="score-board" data-testid="score-board">
      <h3 className="score-board__title">最終計分</h3>

      <div className="score-board__list">
        {sortedPlayers.map((player, index) => (
          <motion.div
            key={player.playerId}
            className={`score-board__item ${player.isWinner ? 'score-board__item--winner' : ''}`}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.15 }}
            data-testid={`score-item-${player.playerId}`}
          >
            {/* 排名 */}
            <div className="score-board__rank" data-testid="rank-icon">
              {getRankIcon(index)}
            </div>

            {/* 玩家資訊 */}
            <div className="score-board__player">
              <span className="score-board__name">{player.name}</span>
              {player.isWinner && <span className="score-board__crown">👑</span>}
            </div>

            {/* 分數詳情 */}
            <div className="score-board__details">
              {player.details.creatures !== undefined && (
                <div className="score-board__detail">
                  <span className="score-board__detail-icon">🦎</span>
                  <span>{player.details.creatures || 0} 隻生物</span>
                </div>
              )}
              {player.details.traits !== undefined && (
                <div className="score-board__detail">
                  <span className="score-board__detail-icon">🧬</span>
                  <span>{player.details.traits || 0} 個性狀</span>
                </div>
              )}
              {player.details.foodBonus !== undefined && (
                <div className="score-board__detail">
                  <span className="score-board__detail-icon">🍖</span>
                  <span>+{player.details.foodBonus || 0} 食量加成</span>
                </div>
              )}
            </div>

            {/* 總分 */}
            <motion.div
              className="score-board__total"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.15 + 0.3 }}
            >
              {player.score} 分
            </motion.div>
          </motion.div>
        ))}
      </div>

      {/* 計分說明 */}
      <div className="score-board__legend">
        <p>計分規則：生物 2分 + 性狀 1分 + 食量加成</p>
      </div>
    </div>
  );
};

ScoreBoard.propTypes = {
  scores: PropTypes.object,
  players: PropTypes.object,
  winnerId: PropTypes.string,
};

export default ScoreBoard;
