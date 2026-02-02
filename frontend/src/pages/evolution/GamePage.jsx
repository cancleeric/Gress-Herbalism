/**
 * 演化論遊戲主頁面
 *
 * @module pages/evolution/GamePage
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { GameBoard } from '../../components/games/evolution/board/GameBoard';
import { AnimationManager } from '../../components/games/evolution/animations/AnimationManager';
import { EvolutionDndContext } from '../../components/games/evolution/dnd/DndContext';
import { MobileGameControls } from '../../components/games/evolution/mobile/MobileGameControls';
import { useEvolutionSocket } from '../../hooks/useEvolutionSocket';
import { useResponsive } from '../../hooks/useResponsive';
import {
  selectGameStatus,
  selectGameId,
  selectMyPlayerId,
  selectCurrentPhase,
  selectFoodPool,
  selectIsMyTurn,
  selectMyHand,
  selectMyCreatures,
  selectIsGameFinished,
  selectWinner,
  selectScores,
  selectPlayers,
  selectRound,
  selectCurrentPlayerIndex,
  selectTurnOrder,
  selectDeckCount,
  selectLastFoodRoll,
} from '../../store/evolution/selectors';
import { resetGame } from '../../store/evolution/gameSlice';
import { resetPlayers, setMyPlayerId } from '../../store/evolution/playerSlice';
import './GamePage.css';

/**
 * 載入畫面組件
 */
const LoadingScreen = ({ message = '載入中...', subMessage = '' }) => (
  <div className="loading-screen" data-testid="loading-screen">
    <div className="loading-screen__spinner" />
    <p className="loading-screen__message">{message}</p>
    {subMessage && <p className="loading-screen__sub">{subMessage}</p>}
  </div>
);

/**
 * 錯誤邊界回退組件
 */
const GameErrorFallback = ({ error, resetErrorBoundary }) => (
  <div className="game-page__error" data-testid="error-fallback">
    <h2>發生錯誤</h2>
    <p>{error?.message || '未知錯誤'}</p>
    <button onClick={resetErrorBoundary}>重新載入</button>
  </div>
);

/**
 * 遊戲結束彈窗
 */
const GameOverModal = ({ winner, scores, onClose, onPlayAgain }) => (
  <div className="game-over-modal" data-testid="game-over-modal">
    <div className="game-over-modal__content">
      <h2>遊戲結束</h2>
      {winner && <p className="game-over-modal__winner">獲勝者: {winner}</p>}
      {scores && (
        <div className="game-over-modal__scores">
          <h3>得分</h3>
          <ul>
            {Object.entries(scores).map(([playerId, score]) => (
              <li key={playerId}>
                {playerId}: {score} 分
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="game-over-modal__actions">
        <button onClick={onPlayAgain}>再玩一局</button>
        <button onClick={onClose}>返回大廳</button>
      </div>
    </div>
  </div>
);

/**
 * 簡易錯誤邊界
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('GamePage Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.FallbackComponent || GameErrorFallback;
      return (
        <FallbackComponent
          error={this.state.error}
          resetErrorBoundary={() => {
            this.setState({ hasError: false, error: null });
            this.props.onReset?.();
          }}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * 演化論遊戲主頁面
 */
export const GamePage = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isMobile } = useResponsive();

  // Store 狀態
  const gameStatus = useSelector(selectGameStatus);
  const storeGameId = useSelector(selectGameId);
  const myPlayerId = useSelector(selectMyPlayerId);
  const currentPhase = useSelector(selectCurrentPhase);
  const foodPool = useSelector(selectFoodPool);
  const isMyTurn = useSelector(selectIsMyTurn);
  const myHand = useSelector(selectMyHand);
  const myCreatures = useSelector(selectMyCreatures);
  const isGameFinished = useSelector(selectIsGameFinished);
  const winner = useSelector(selectWinner);
  const scores = useSelector(selectScores);
  const players = useSelector(selectPlayers);
  const round = useSelector(selectRound);
  const currentPlayerIndex = useSelector(selectCurrentPlayerIndex);
  const turnOrder = useSelector(selectTurnOrder);
  const deckCount = useSelector(selectDeckCount);
  const lastFoodRoll = useSelector(selectLastFoodRoll);

  // 本地狀態
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showHand, setShowHand] = useState(false);
  const [showCreatures, setShowCreatures] = useState(false);

  // Socket 連線
  const {
    isConnected,
    error: socketError,
    actions,
    createCreature,
    addTrait,
    passEvolution,
    feedCreature,
    attack,
    respondAttack,
    useTrait,
  } = useEvolutionSocket(gameId);

  // 初始化
  useEffect(() => {
    // 從 localStorage 或 URL 取得玩家 ID
    const playerId = localStorage.getItem('playerId') || `guest-${Date.now()}`;
    dispatch(setMyPlayerId(playerId));

    return () => {
      // 清理
      dispatch(resetGame());
      dispatch(resetPlayers());
    };
  }, [dispatch]);

  // 載入狀態
  useEffect(() => {
    if (isConnected) {
      // 連線後等待遊戲狀態
      const timer = setTimeout(() => {
        if (storeGameId === gameId || gameStatus) {
          setIsLoading(false);
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isConnected, storeGameId, gameId, gameStatus]);

  // 直接設定載入完成（測試用）
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // 錯誤處理
  useEffect(() => {
    if (socketError) {
      setError(socketError);
    }
  }, [socketError]);

  // 動作處理
  const handleAction = useCallback(async (actionType, data) => {
    if (!myPlayerId) return;

    try {
      switch (actionType) {
        case 'createCreature':
          actions.createCreature(myPlayerId, data.cardId);
          break;
        case 'addTrait':
          actions.addTrait(myPlayerId, data.cardId, data.creatureId, data.targetCreatureId);
          break;
        case 'feed':
          actions.feedCreature(myPlayerId, data.creatureId);
          break;
        case 'attack':
          actions.attack(myPlayerId, data.attackerId, data.defenderId);
          break;
        case 'pass':
          actions.passEvolution(myPlayerId);
          break;
        case 'useTrait':
          actions.useTrait(myPlayerId, data.creatureId, data.traitType, data.targetId);
          break;
        default:
          console.warn('Unknown action:', actionType);
      }
    } catch (err) {
      console.error('Action failed:', err);
      setError(err.message);
    }
  }, [myPlayerId, actions]);

  // 離開遊戲
  const handleLeave = useCallback(() => {
    if (window.confirm('確定要離開遊戲嗎？')) {
      navigate('/evolution/lobby');
    }
  }, [navigate]);

  // 遊戲結束處理
  const handlePlayAgain = useCallback(() => {
    dispatch(resetGame());
    dispatch(resetPlayers());
    navigate('/evolution/lobby');
  }, [dispatch, navigate]);

  const handleCloseGameOver = useCallback(() => {
    navigate('/evolution/lobby');
  }, [navigate]);

  // 移動端控制回調
  const handleFeed = useCallback(() => {
    // 打開進食選擇模式
    setShowCreatures(true);
  }, []);

  const handlePass = useCallback(() => {
    if (myPlayerId) {
      actions.passEvolution(myPlayerId);
    }
  }, [myPlayerId, actions]);

  const handleShowHand = useCallback(() => {
    setShowHand(prev => !prev);
  }, []);

  const handleShowCreatures = useCallback(() => {
    setShowCreatures(prev => !prev);
  }, []);

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
      <div className="game-page__error" data-testid="error-state">
        <h2>無法連線到遊戲</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/evolution/lobby')}>
          返回大廳
        </button>
      </div>
    );
  }

  // 組裝遊戲狀態
  const gameState = {
    id: storeGameId || gameId,
    status: gameStatus,
    round,
    currentPhase,
    currentPlayerIndex,
    turnOrder,
    foodPool,
    lastFoodRoll,
    deck: { length: deckCount },
    players,
  };

  const canFeed = currentPhase === 'feeding' && isMyTurn;
  const canPass = isMyTurn && (currentPhase === 'evolution' || currentPhase === 'feeding');
  const canAttack = currentPhase === 'feeding' && isMyTurn && myCreatures.some(c => c.traits?.includes('carnivore'));

  return (
    <ErrorBoundary
      FallbackComponent={GameErrorFallback}
      onReset={() => window.location.reload()}
    >
      <EvolutionDndContext>
        <div className="game-page" data-testid="game-page">
          {/* 頂部工具列 */}
          <header className="game-page__header">
            <button
              className="game-page__back-btn"
              onClick={handleLeave}
              data-testid="btn-leave"
            >
              ← 離開
            </button>
            <div className="game-page__connection-status">
              <span
                className={`status-dot ${isConnected ? 'status-dot--online' : 'status-dot--offline'}`}
                data-testid="connection-status"
              />
              {isConnected ? '已連線' : '重新連線中...'}
            </div>
          </header>

          {/* 遊戲主板 */}
          <main className="game-page__main">
            <GameBoard
              gameState={gameState}
              myPlayerId={myPlayerId}
              onAction={handleAction}
            />
          </main>

          {/* 動畫管理器 */}
          <AnimationManager />

          {/* 移動端控制面板 */}
          {isMobile && (
            <MobileGameControls
              isMyTurn={isMyTurn}
              currentPhase={currentPhase}
              canFeed={canFeed}
              canPass={canPass}
              canAttack={canAttack}
              onFeed={handleFeed}
              onPass={handlePass}
              onShowHand={handleShowHand}
              onShowCreatures={handleShowCreatures}
              handCount={myHand.length}
              creatureCount={myCreatures.length}
              foodPool={foodPool}
            />
          )}

          {/* 遊戲結束彈窗 */}
          {isGameFinished && (
            <GameOverModal
              winner={winner}
              scores={scores}
              onClose={handleCloseGameOver}
              onPlayAgain={handlePlayAgain}
            />
          )}
        </div>
      </EvolutionDndContext>
    </ErrorBoundary>
  );
};

export default GamePage;
