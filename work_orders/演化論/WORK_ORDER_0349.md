# 工單 0349：遊戲結束與計分畫面

## 基本資訊
- **工單編號**：0349
- **所屬計畫**：P2-B 前端 UI
- **前置工單**：0348（遊戲頁面）
- **預計影響檔案**：
  - `frontend/src/components/games/evolution/modals/GameOverModal.jsx`（新增）
  - `frontend/src/components/games/evolution/modals/ScoreBoard.jsx`（新增）

---

## 目標

建立遊戲結束畫面：
1. 勝利者公告
2. 詳細計分板
3. 排名動畫
4. 重新遊戲選項

---

## 詳細規格

### 1. 遊戲結束彈窗

```jsx
// frontend/src/components/games/evolution/modals/GameOverModal.jsx

import React from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ScoreBoard } from './ScoreBoard';
import { selectMyPlayerId } from '../../../../store/evolution/selectors';
import './GameOverModal.css';

export const GameOverModal = () => {
  const navigate = useNavigate();
  const myPlayerId = useSelector(selectMyPlayerId);
  const winner = useSelector((state) => state.evolutionGame.winner);
  const scores = useSelector((state) => state.evolutionGame.scores);
  const players = useSelector((state) => state.evolutionPlayer.players);

  const isWinner = winner === myPlayerId;
  const winnerName = players[winner]?.name || '未知';

  const handlePlayAgain = () => {
    navigate('/evolution/lobby');
  };

  const handleViewStats = () => {
    navigate(`/evolution/stats/${useSelector(selectGameId)}`);
  };

  return (
    <AnimatePresence>
      <motion.div
        className="game-over-modal__overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="game-over-modal"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          {/* 勝利動畫 */}
          <div className={`game-over-modal__header ${isWinner ? 'game-over-modal__header--winner' : ''}`}>
            <motion.div
              className="game-over-modal__icon"
              animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              {isWinner ? '🏆' : '🎮'}
            </motion.div>
            <h2 className="game-over-modal__title">
              {isWinner ? '恭喜獲勝！' : '遊戲結束'}
            </h2>
            {!isWinner && (
              <p className="game-over-modal__winner-name">
                勝利者：{winnerName}
              </p>
            )}
          </div>

          {/* 計分板 */}
          <div className="game-over-modal__scores">
            <ScoreBoard scores={scores} players={players} winnerId={winner} />
          </div>

          {/* 按鈕區 */}
          <div className="game-over-modal__actions">
            <button
              className="game-over-modal__btn game-over-modal__btn--primary"
              onClick={handlePlayAgain}
            >
              再來一局
            </button>
            <button
              className="game-over-modal__btn game-over-modal__btn--secondary"
              onClick={handleViewStats}
            >
              查看統計
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GameOverModal;
```

### 2. 計分板組件

```jsx
// frontend/src/components/games/evolution/modals/ScoreBoard.jsx

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import './ScoreBoard.css';

export const ScoreBoard = ({ scores, players, winnerId }) => {
  // 排序玩家（分數高到低）
  const sortedPlayers = useMemo(() => {
    return Object.entries(scores)
      .map(([playerId, score]) => ({
        playerId,
        name: players[playerId]?.name || playerId,
        score: score.total,
        details: score,
        isWinner: playerId === winnerId,
      }))
      .sort((a, b) => b.score - a.score);
  }, [scores, players, winnerId]);

  return (
    <div className="score-board">
      <h3 className="score-board__title">最終計分</h3>

      <div className="score-board__list">
        {sortedPlayers.map((player, index) => (
          <motion.div
            key={player.playerId}
            className={`score-board__item ${player.isWinner ? 'score-board__item--winner' : ''}`}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.15 }}
          >
            {/* 排名 */}
            <div className="score-board__rank">
              {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`}
            </div>

            {/* 玩家資訊 */}
            <div className="score-board__player">
              <span className="score-board__name">{player.name}</span>
              {player.isWinner && <span className="score-board__crown">👑</span>}
            </div>

            {/* 分數詳情 */}
            <div className="score-board__details">
              <div className="score-board__detail">
                <span className="score-board__detail-icon">🦎</span>
                <span>{player.details.creatures || 0} 隻生物</span>
              </div>
              <div className="score-board__detail">
                <span className="score-board__detail-icon">🧬</span>
                <span>{player.details.traits || 0} 個性狀</span>
              </div>
              <div className="score-board__detail">
                <span className="score-board__detail-icon">🍖</span>
                <span>+{player.details.foodBonus || 0} 食量加成</span>
              </div>
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
  scores: PropTypes.object.isRequired,
  players: PropTypes.object.isRequired,
  winnerId: PropTypes.string,
};

export default ScoreBoard;
```

### 3. 樣式

```css
/* frontend/src/components/games/evolution/modals/GameOverModal.css */

.game-over-modal__overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 24px;
}

.game-over-modal {
  background: #fff;
  border-radius: 24px;
  max-width: 500px;
  width: 100%;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.game-over-modal__header {
  padding: 32px 24px;
  text-align: center;
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
}

.game-over-modal__header--winner {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
}

.game-over-modal__icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.game-over-modal__title {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.game-over-modal__winner-name {
  margin-top: 8px;
  font-size: 18px;
  color: #64748b;
}

.game-over-modal__scores {
  padding: 24px;
}

.game-over-modal__actions {
  display: flex;
  gap: 12px;
  padding: 24px;
  border-top: 1px solid #e2e8f0;
}

.game-over-modal__btn {
  flex: 1;
  padding: 14px 24px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.game-over-modal__btn--primary {
  background: linear-gradient(135deg, var(--color-primary) 0%, #60a5fa 100%);
  color: #fff;
}

.game-over-modal__btn--secondary {
  background: #f1f5f9;
  color: #475569;
}

/* === ScoreBoard.css === */

.score-board__title {
  text-align: center;
  margin-bottom: 20px;
  font-size: 18px;
  color: #64748b;
}

.score-board__list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.score-board__item {
  display: grid;
  grid-template-columns: 40px 1fr auto auto;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #f8fafc;
  border-radius: 12px;
}

.score-board__item--winner {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
}

.score-board__rank {
  font-size: 24px;
  text-align: center;
}

.score-board__player {
  display: flex;
  align-items: center;
  gap: 8px;
}

.score-board__name {
  font-weight: 600;
  color: #1e293b;
}

.score-board__crown {
  font-size: 16px;
}

.score-board__details {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #64748b;
}

.score-board__detail {
  display: flex;
  align-items: center;
  gap: 4px;
}

.score-board__total {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-primary);
}

.score-board__legend {
  margin-top: 16px;
  text-align: center;
  font-size: 12px;
  color: #94a3b8;
}
```

---

## 驗收標準

1. [ ] 勝利者正確顯示
2. [ ] 計分詳情正確
3. [ ] 排名動畫流暢
4. [ ] 再來一局功能正常
5. [ ] 響應式設計正確
6. [ ] 動畫效果流暢

---

## 備註

- 遊戲結束畫面是重要的成就感來源
- 計分詳情幫助玩家理解遊戲策略
