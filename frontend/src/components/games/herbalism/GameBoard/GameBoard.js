/**
 * 遊戲桌面組件
 *
 * @module GameBoard
 * @description 顯示遊戲桌面，包含蓋牌區域和遊戲進行狀態
 */

import React, { useMemo, useCallback } from 'react';
import { useSelector, shallowEqual } from 'react-redux';
import {
  GAME_PHASE_WAITING,
  GAME_PHASE_PLAYING,
  GAME_PHASE_FINISHED
} from '../../../../shared/constants';
import ColorCombinationCards from '../ColorCombinationCards';
import './GameBoard.css';

/**
 * 蓋牌組件
 *
 * @param {Object} props - 組件屬性
 * @param {Object} props.card - 卡牌資料
 * @param {boolean} props.isRevealed - 是否翻開顯示
 * @param {number} props.index - 卡牌索引
 * @returns {JSX.Element} 蓋牌組件
 */
function HiddenCard({ card, isRevealed, index }) {
  const cardClass = isRevealed && card
    ? `hidden-card revealed card-${card.color}`
    : 'hidden-card';

  return (
    <div
      className={cardClass}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className="card-inner">
        <div className="card-front">
          {isRevealed && card ? (
            <span className="card-color-text">{card.color}</span>
          ) : null}
        </div>
        <div className="card-back">
          <div className="card-pattern">
            <span className="pattern-icon">?</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 遊戲桌面組件
 *
 * @param {Object} props - 組件屬性
 * @param {string} props.currentPlayerId - 當前玩家ID（用於判斷是否為猜牌者）
 * @param {boolean} props.isGuessing - 是否正在猜牌
 * @param {boolean} props.canSelectColorCard - 是否可以選擇顏色組合牌
 * @param {string|null} props.myDisabledCardId - 自己上回合選過的牌ID
 * @param {Object} props.cardMarkers - 卡牌上的玩家標記
 * @param {Function} props.onColorCardSelect - 選擇顏色組合牌的回調
 * @param {Function} props.onDisabledCardClick - 點擊禁用牌的回調
 * @returns {JSX.Element} 遊戲桌面組件
 */
function GameBoard({
  currentPlayerId,
  isGuessing = false,
  canSelectColorCard = false,
  myDisabledCardId = null,
  cardMarkers = {},
  onColorCardSelect,
  onDisabledCardClick
}) {
  // 從 Redux store 取得遊戲狀態（使用 shallowEqual 避免不必要的重新渲染）
  const hiddenCards = useSelector(state => state.hiddenCards);
  const gamePhase = useSelector(state => state.gamePhase);
  const winner = useSelector(state => state.winner);
  const currentPlayerIndex = useSelector(state => state.currentPlayerIndex);
  const players = useSelector(state => state.players);

  /**
   * 判斷是否應該顯示蓋牌
   *
   * @returns {boolean} 是否顯示蓋牌
   */
  const shouldRevealCards = () => {
    // 遊戲結束且有獲勝者時顯示
    if (gamePhase === GAME_PHASE_FINISHED && winner) {
      return true;
    }

    // 正在猜牌時，猜牌者可以看到蓋牌
    if (isGuessing && currentPlayerId) {
      const currentPlayer = players[currentPlayerIndex];
      if (currentPlayer && currentPlayer.id === currentPlayerId) {
        return true;
      }
    }

    return false;
  };

  /**
   * 取得當前回合玩家名稱
   *
   * @returns {string} 玩家名稱
   */
  const getCurrentPlayerName = () => {
    if (players && players[currentPlayerIndex]) {
      return players[currentPlayerIndex].name;
    }
    return '';
  };

  /**
   * 渲染蓋牌區域
   *
   * @returns {JSX.Element} 蓋牌區域
   */
  const renderHiddenCards = () => {
    const isRevealed = shouldRevealCards();

    // 如果沒有蓋牌資料，顯示佔位符
    if (!hiddenCards || hiddenCards.length === 0) {
      return (
        <div className="hidden-cards-container">
          <HiddenCard card={null} isRevealed={false} index={0} />
          <HiddenCard card={null} isRevealed={false} index={1} />
        </div>
      );
    }

    return (
      <div className={`hidden-cards-container ${isRevealed ? 'revealed' : ''}`}>
        {hiddenCards.map((card, index) => (
          <HiddenCard
            key={card.id || index}
            card={card}
            isRevealed={isRevealed}
            index={index}
          />
        ))}
      </div>
    );
  };

  /**
   * 渲染遊戲狀態訊息
   *
   * @returns {JSX.Element} 狀態訊息
   */
  const renderGameStatus = () => {
    switch (gamePhase) {
      case GAME_PHASE_WAITING:
        return (
          <div className="game-status waiting">
            <h2>等待玩家加入</h2>
            <p>目前有 {players?.length || 0} 位玩家</p>
            <p className="hint">需要 3-4 位玩家才能開始</p>
          </div>
        );

      case GAME_PHASE_PLAYING:
        return (
          <div className="game-status playing">
            <h2>遊戲進行中</h2>
            <p className="current-turn">
              當前回合: <strong>{getCurrentPlayerName()}</strong>
            </p>
            {isGuessing && (
              <p className="guessing-hint">正在猜牌中...</p>
            )}
          </div>
        );

      case GAME_PHASE_FINISHED:
        return (
          <div className="game-status finished">
            <h2>遊戲結束!</h2>
            {winner ? (
              <p className="winner-announcement">
                獲勝者: <strong>
                  {players?.find(p => p.id === winner)?.name || winner}
                </strong>
              </p>
            ) : (
              <p className="no-winner">沒有獲勝者</p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="game-board">
      {/* 顏色組合牌區域 */}
      {gamePhase !== GAME_PHASE_WAITING && (
        <section className="color-cards-section">
          <ColorCombinationCards
            interactive={canSelectColorCard}
            myDisabledCardId={myDisabledCardId}
            cardMarkers={cardMarkers}
            currentPlayerId={currentPlayerId}
            onCardSelect={onColorCardSelect}
            onDisabledCardClick={onDisabledCardClick}
          />
          {canSelectColorCard && (
            <p className="select-card-hint">點擊顏色牌開始問牌</p>
          )}
        </section>
      )}

      {/* 蓋牌區域 */}
      <section className="hidden-cards-section">
        <h3 className="section-title">蓋牌</h3>
        {renderHiddenCards()}
        {shouldRevealCards() && (
          <p className="reveal-message">蓋牌已揭曉!</p>
        )}
      </section>

      {/* 遊戲狀態 */}
      <section className="game-status-section">
        {renderGameStatus()}
      </section>
    </div>
  );
}

export default GameBoard;
