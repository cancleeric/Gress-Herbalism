# 工單 0348：遊戲頁面組件

## 基本資訊
- **工單編號**：0348
- **所屬計畫**：P2-B 前端 UI
- **前置工單**：0337-0346（所有遊戲組件）
- **預計影響檔案**：
  - `frontend/src/pages/evolution/GamePage.jsx`（新增）
  - `frontend/src/pages/evolution/GamePage.css`（新增）

---

## 目標

建立遊戲主頁面，整合所有遊戲組件：
1. 遊戲狀態載入
2. 組件整合
3. 錯誤邊界
4. 載入狀態

---

## 詳細規格

### 組件實作

```jsx
// frontend/src/pages/evolution/GamePage.jsx

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { ErrorBoundary } from 'react-error-boundary';
import { GameBoard } from '../../components/games/evolution/board/GameBoard';
import { AnimationManager } from '../../components/games/evolution/animations/AnimationManager';
import { EvolutionDndContext } from '../../components/games/evolution/dnd/DndContext';
import { GameOverModal } from '../../components/games/evolution/modals/GameOverModal';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import { useEvolutionSocket } from '../../hooks/useEvolutionSocket';
import {
  selectGameStatus,
  selectGameId,
  selectMyPlayerId,
} from '../../store/evolution/selectors';
import { resetGame } from '../../store/evolution/gameSlice';
import { resetPlayers, setMyPlayerId } from '../../store/evolution/playerSlice';
import './GamePage.css';

/**
 * 演化論遊戲主頁面
 */
export const GamePage = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Store 狀態
  const gameStatus = useSelector(selectGameStatus);
  const storeGameId = useSelector(selectGameId);
  const myPlayerId = useSelector(selectMyPlayerId);

  // 本地狀態
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Socket 連線
  const { isConnected, error: socketError, actions } = useEvolutionSocket(gameId);

  // 初始化
  useEffect(() => {
    // 從 localStorage 或 URL 取得玩家 ID
    const playerId = localStorage.getItem('playerId') || 'guest';
    dispatch(setMyPlayerId(playerId));

    return () => {
      // 清理
      dispatch(resetGame());
      dispatch(resetPlayers());
    };
  }, [dispatch]);

  // 載入狀態
  useEffect(() => {
    if (isConnected && storeGameId === gameId) {
      setIsLoading(false);
    }
  }, [isConnected, storeGameId, gameId]);

  // 錯誤處理
  useEffect(() => {
    if (socketError) {
      setError(socketError);
    }
  }, [socketError]);

  // 動作處理
  const handleAction = async (actionType, data) => {
    try {
      switch (actionType) {
        case 'playAsCreature':
          await actions.playAsCreature(data.cardId);
          break;
        case 'playAsTrait':
          await actions.playAsTrait(data.cardId, data.side, data.creatureId, data.linkedCreatureId);
          break;
        case 'feed':
          await actions.feed(data.creatureId);
          break;
        case 'attack':
          await actions.attack(data.attackerCreatureId, data.defenderCreatureId);
          break;
        case 'pass':
          await actions.pass();
          break;
        case 'rollFood':
          await actions.rollFood();
          break;
        default:
          console.warn('Unknown action:', actionType);
      }
    } catch (err) {
      console.error('Action failed:', err);
      // TODO: 顯示錯誤提示
    }
  };

  // 離開遊戲
  const handleLeave = () => {
    if (window.confirm('確定要離開遊戲嗎？')) {
      navigate('/evolution/lobby');
    }
  };

  // 載入中
  if (isLoading) {
    return (
      <LoadingScreen
        message="連線中..."
        subMessage="正在加入遊戲"
      />
    );
  }

  // 錯誤狀態
  if (error) {
    return (
      <div className="game-page__error">
        <h2>無法連線到遊戲</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/evolution/lobby')}>
          返回大廳
        </button>
      </div>
    );
  }

  // 遊戲結束
  const isGameOver = gameStatus === 'finished';

  return (
    <ErrorBoundary
      FallbackComponent={GameErrorFallback}
      onReset={() => window.location.reload()}
    >
      <EvolutionDndContext>
        <div className="game-page">
          {/* 頂部工具列 */}
          <header className="game-page__header">
            <button className="game-page__back-btn" onClick={handleLeave}>
              ← 離開
            </button>
            <div className="game-page__connection-status">
              <span className={`status-dot ${isConnected ? 'status-dot--online' : 'status-dot--offline'}`} />
              {isConnected ? '已連線' : '重新連線中...'}
            </div>
          </header>

          {/* 遊戲主板 */}
          <main className="game-page__main">
            <GameBoard
              gameState={useSelector((state) => ({
                id: state.evolutionGame.gameId,
                status: state.evolutionGame.status,
                round: state.evolutionGame.round,
                currentPhase: state.evolutionGame.currentPhase,
                currentPlayerIndex: state.evolutionGame.currentPlayerIndex,
                turnOrder: state.evolutionGame.turnOrder,
                foodPool: state.evolutionGame.foodPool,
                lastFoodRoll: state.evolutionGame.lastFoodRoll,
                deck: { length: state.evolutionGame.deckCount },
                players: state.evolutionPlayer.players,
              }))}
              myPlayerId={myPlayerId}
              onAction={handleAction}
            />
          </main>

          {/* 動畫管理器 */}
          <AnimationManager />

          {/* 遊戲結束彈窗 */}
          {isGameOver && <GameOverModal />}
        </div>
      </EvolutionDndContext>
    </ErrorBoundary>
  );
};

/**
 * 錯誤邊界回退組件
 */
const GameErrorFallback = ({ error, resetErrorBoundary }) => (
  <div className="game-page__error">
    <h2>發生錯誤</h2>
    <p>{error.message}</p>
    <button onClick={resetErrorBoundary}>重新載入</button>
  </div>
);

export default GamePage;
```

### 樣式

```css
/* frontend/src/pages/evolution/GamePage.css */

.game-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
}

.game-page__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.9);
  border-bottom: 1px solid #e2e8f0;
}

.game-page__back-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  background: #f1f5f9;
  cursor: pointer;
}

.game-page__connection-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot--online {
  background: #10b981;
}

.status-dot--offline {
  background: #ef4444;
  animation: pulse 1s infinite;
}

.game-page__main {
  flex: 1;
  overflow: hidden;
}

.game-page__error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 24px;
  text-align: center;
}

.game-page__error h2 {
  margin-bottom: 16px;
  color: #dc2626;
}

.game-page__error button {
  margin-top: 24px;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  background: var(--color-primary);
  color: #fff;
  cursor: pointer;
}
```

---

## 驗收標準

1. [ ] 頁面正確載入遊戲
2. [ ] Socket 連線正常
3. [ ] 組件整合正確
4. [ ] 錯誤邊界正常
5. [ ] 載入狀態顯示
6. [ ] 離開遊戲功能正常
7. [ ] 遊戲結束彈窗顯示

---

## 備註

- 這是遊戲的主入口頁面
- 需整合所有前端功能
