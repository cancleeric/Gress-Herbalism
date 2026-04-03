/**
 * 遊戲結束彈窗
 *
 * @module components/games/evolution/modals/GameOverModal
 */

import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ScoreBoard } from './ScoreBoard';
import { selectMyPlayerId, selectGameId } from '../../../../store/evolution/selectors';
import { getRarity } from '../../../../components/common/AchievementToast/AchievementToast';
import './GameOverModal.css';

/**
 * 彈窗背景動畫
 */
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

/**
 * 彈窗內容動畫
 */
const modalVariants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { type: 'spring', stiffness: 300, damping: 25 },
  },
  exit: { scale: 0.8, opacity: 0 },
};

/**
 * 圖示動畫
 */
const iconVariants = {
  animate: {
    rotate: [0, -10, 10, 0],
    scale: [1, 1.2, 1],
    transition: { duration: 0.5, delay: 0.5 },
  },
};

/**
 * 遊戲結束彈窗組件
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - 是否顯示（用於外部控制）
 * @param {Function} props.onClose - 關閉回調
 * @param {Function} props.onPlayAgain - 再玩一局回調
 * @param {Array} props.newAchievements - 本局解鎖的成就列表
 */
export const GameOverModal = ({ isOpen = true, onClose, onPlayAgain, newAchievements }) => {
  const navigate = useNavigate();
  const myPlayerId = useSelector(selectMyPlayerId);
  const gameId = useSelector(selectGameId);
  const winner = useSelector((state) => state.evolutionGame?.winner);
  const scores = useSelector((state) => state.evolutionGame?.scores || {});
  const players = useSelector((state) => state.evolutionPlayer?.players || {});

  const isWinner = winner === myPlayerId;
  const winnerName = players[winner]?.name || winner || '未知';

  const handlePlayAgain = useCallback(() => {
    if (onPlayAgain) {
      onPlayAgain();
    } else {
      navigate('/evolution/lobby');
    }
  }, [onPlayAgain, navigate]);

  const handleViewStats = useCallback(() => {
    if (gameId) {
      navigate(`/evolution/stats/${gameId}`);
    } else {
      navigate('/evolution/lobby');
    }
  }, [gameId, navigate]);

  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
    } else {
      navigate('/evolution/lobby');
    }
  }, [onClose, navigate]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="game-over-modal__overlay"
        variants={overlayVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={handleClose}
        data-testid="game-over-overlay"
      >
        <motion.div
          className="game-over-modal"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={(e) => e.stopPropagation()}
          data-testid="game-over-modal"
        >
          {/* 勝利動畫 */}
          <div
            className={`game-over-modal__header ${isWinner ? 'game-over-modal__header--winner' : ''}`}
          >
            <motion.div
              className="game-over-modal__icon"
              variants={iconVariants}
              animate="animate"
              data-testid="game-over-icon"
            >
              {isWinner ? '🏆' : '🎮'}
            </motion.div>
            <h2 className="game-over-modal__title">
              {isWinner ? '恭喜獲勝！' : '遊戲結束'}
            </h2>
            {!isWinner && winner && (
              <p className="game-over-modal__winner-name" data-testid="winner-name">
                勝利者：{winnerName}
              </p>
            )}
          </div>

          {/* 計分板 */}
          <div className="game-over-modal__scores">
            <ScoreBoard scores={scores} players={players} winnerId={winner} />
          </div>

          {/* 新解鎖成就 */}
          {newAchievements && newAchievements.length > 0 && (
            <div className="game-over-modal__achievements" data-testid="new-achievements">
              <h3 className="game-over-modal__achievements-title">🏅 成就解鎖！</h3>
              <div className="game-over-modal__achievements-list">
                {newAchievements.map((ach) => {
                  const rarity = getRarity(ach.points || 0);
                  return (
                    <div
                      key={ach.id}
                      className={`game-over-modal__achievement-item ${rarity.className}`}
                      data-testid="new-achievement-item"
                    >
                      <span className="game-over-modal__achievement-icon">{ach.icon}</span>
                      <div className="game-over-modal__achievement-info">
                        <span className="game-over-modal__achievement-name">{ach.name}</span>
                        {ach.description && (
                          <span className="game-over-modal__achievement-desc">{ach.description}</span>
                        )}
                      </div>
                      <span className="game-over-modal__achievement-points">+{ach.points}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 按鈕區 */}
          <div className="game-over-modal__actions">
            <button
              className="game-over-modal__btn game-over-modal__btn--primary"
              onClick={handlePlayAgain}
              data-testid="btn-play-again"
            >
              再來一局
            </button>
            <button
              className="game-over-modal__btn game-over-modal__btn--secondary"
              onClick={handleViewStats}
              data-testid="btn-view-stats"
            >
              查看統計
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

GameOverModal.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
  onPlayAgain: PropTypes.func,
  newAchievements: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      description: PropTypes.string,
      icon: PropTypes.string,
      points: PropTypes.number,
    })
  ),
};

export default GameOverModal;
