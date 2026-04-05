/**
 * 遊戲狀態顯示組件
 *
 * @module GameStatus
 * @description 顯示遊戲狀態，包含當前玩家、玩家狀態、遊戲階段和歷史記錄
 */

import React, { memo } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import {
  GAME_PHASE_WAITING,
  GAME_PHASE_PLAYING,
  GAME_PHASE_FINISHED,
  ACTION_TYPE_QUESTION,
  ACTION_TYPE_GUESS
} from '../../../../shared/constants';
import './GameStatus.css';

/**
 * 遊戲階段對應的中文名稱
 */
const PHASE_NAMES = {
  [GAME_PHASE_WAITING]: '等待中',
  [GAME_PHASE_PLAYING]: '進行中',
  [GAME_PHASE_FINISHED]: '已結束'
};

/**
 * 當前玩家顯示組件
 *
 * @param {Object} props - 組件屬性
 * @param {Object} props.currentPlayer - 當前玩家資訊
 * @param {boolean} props.isYourTurn - 是否是自己的回合
 * @returns {JSX.Element} 當前玩家顯示
 */
function CurrentPlayerDisplay({ currentPlayer, isYourTurn }) {
  if (!currentPlayer) {
    return (
      <div className="current-player-display">
        <h4>當前回合</h4>
        <p className="no-player">等待玩家加入...</p>
      </div>
    );
  }

  return (
    <div className={`current-player-display ${isYourTurn ? 'your-turn' : ''}`}>
      <h4>當前回合</h4>
      <div className="current-player-name">
        <span className="player-indicator"></span>
        <span>{currentPlayer.name}</span>
        {isYourTurn && <span className="your-turn-badge">你的回合</span>}
      </div>
    </div>
  );
}

CurrentPlayerDisplay.propTypes = {
  currentPlayer: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string
  }),
  isYourTurn: PropTypes.bool
};

/**
 * 玩家狀態列表組件
 *
 * @param {Object} props - 組件屬性
 * @param {Array} props.players - 玩家列表
 * @param {number} props.currentPlayerIndex - 當前玩家索引
 * @param {string} props.myPlayerId - 自己的玩家ID
 * @returns {JSX.Element} 玩家狀態列表
 */
function PlayerStatusList({ players, currentPlayerIndex, myPlayerId }) {
  if (!players || players.length === 0) {
    return (
      <div className="player-status-list">
        <h4>玩家狀態</h4>
        <p className="no-players">尚無玩家</p>
      </div>
    );
  }

  return (
    <div className="player-status-list">
      <h4>玩家狀態</h4>
      <ul className="players-list">
        {players.map((player, index) => (
          <li
            key={player.id}
            className={`player-item ${!player.isActive ? 'eliminated' : ''} ${player.isDisconnected ? 'disconnected' : ''} ${index === currentPlayerIndex ? 'current' : ''} ${player.id === myPlayerId ? 'is-me' : ''}`}
          >
            <span className="player-name">
              {player.name}
              {player.id === myPlayerId && <span className="me-badge">(我)</span>}
            </span>
            <span className={`player-status ${player.isActive ? (player.isDisconnected ? 'disconnected' : 'active') : 'inactive'}`}>
              {/* 工單 0079：顯示斷線狀態 */}
              {!player.isActive ? '已退出' : (player.isDisconnected ? '斷線中' : '活躍')}
            </span>
            {index === currentPlayerIndex && player.isActive && (
              <span className="turn-indicator">●</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

PlayerStatusList.propTypes = {
  players: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    isActive: PropTypes.bool
  })),
  currentPlayerIndex: PropTypes.number,
  myPlayerId: PropTypes.string
};

/**
 * 遊戲階段顯示組件
 *
 * @param {Object} props - 組件屬性
 * @param {string} props.gamePhase - 遊戲階段
 * @param {string} props.winner - 獲勝者ID
 * @param {Array} props.players - 玩家列表
 * @returns {JSX.Element} 遊戲階段顯示
 */
function GamePhaseDisplay({ gamePhase, winner, players }) {
  const phaseName = PHASE_NAMES[gamePhase] || gamePhase;
  const winnerPlayer = winner ? players?.find(p => p.id === winner) : null;

  return (
    <div className={`game-phase-display phase-${gamePhase}`}>
      <h4>遊戲狀態</h4>
      <div className="phase-badge">
        {phaseName}
      </div>
      {gamePhase === GAME_PHASE_FINISHED && (
        <div className="game-result">
          {winnerPlayer ? (
            <p className="winner-announcement">
              🏆 獲勝者: <strong>{winnerPlayer.name}</strong>
            </p>
          ) : (
            <p className="no-winner">遊戲結束，沒有獲勝者</p>
          )}
        </div>
      )}
    </div>
  );
}

GamePhaseDisplay.propTypes = {
  gamePhase: PropTypes.string,
  winner: PropTypes.string,
  players: PropTypes.array
};

/**
 * 顏色名稱對照
 */
const COLOR_NAMES = {
  red: '紅色',
  yellow: '黃色',
  green: '綠色',
  blue: '藍色'
};

/**
 * 問牌類型描述
 */
const QUESTION_TYPE_NAMES = {
  1: '各一張',
  2: '其中一種全部',
  3: '給一張要全部'
};

/**
 * 格式化顏色列表
 * @param {Array} colors - 顏色陣列
 * @returns {string} 格式化後的顏色名稱
 */
function formatColors(colors) {
  if (!colors || colors.length === 0) return '未知顏色';
  return colors.map(c => COLOR_NAMES[c] || c).join('、');
}

/**
 * 格式化歷史記錄條目
 *
 * @param {Object} entry - 歷史記錄條目
 * @param {Array} players - 玩家列表
 * @returns {string} 格式化後的文字
 */
function formatHistoryEntry(entry, players) {
  const player = players?.find(p => p.id === entry.playerId);
  const playerName = player?.name || '未知玩家';

  if (entry.type === ACTION_TYPE_QUESTION) {
    const targetPlayer = players?.find(p => p.id === entry.targetPlayerId);
    const targetName = targetPlayer?.name || '未知玩家';
    // 不顯示問牌顏色，避免洩漏策略資訊
    const transferredCount = entry.cardsTransferred ?? entry.result?.cardsReceived?.length ?? 0;
    const questionTypeName = QUESTION_TYPE_NAMES[entry.questionType] || '';

    // 不再顯示 chosenColor，避免洩漏被問牌者選擇的顏色
    if (transferredCount === 0) {
      return `${playerName} 向 ${targetName} 問牌（${questionTypeName}），沒有`;
    }

    return `${playerName} 向 ${targetName} 問牌（${questionTypeName}），收到 ${transferredCount} 張`;
  }

  if (entry.type === ACTION_TYPE_GUESS) {
    const colors = formatColors(entry.guessedColors);
    const result = entry.isCorrect ? '猜對了！' : '猜錯了';
    return `${playerName} 猜牌 [${colors}] - ${result}`;
  }

  return '未知動作';
}

/**
 * 遊戲歷史記錄組件
 *
 * @param {Object} props - 組件屬性
 * @param {Array} props.history - 遊戲歷史記錄
 * @param {Array} props.players - 玩家列表
 * @param {number} props.maxItems - 最大顯示條數
 * @returns {JSX.Element} 遊戲歷史記錄
 */
function GameHistoryList({ history, players, maxItems = 10 }) {
  if (!history || history.length === 0) {
    return (
      <div className="game-history-list">
        <h4>遊戲記錄</h4>
        <p className="no-history">尚無記錄</p>
      </div>
    );
  }

  // 取最近的記錄，倒序顯示
  const recentHistory = history.slice(-maxItems).reverse();

  return (
    <div className="game-history-list">
      <h4>遊戲記錄 ({history.length})</h4>
      <ul className="history-list">
        {recentHistory.map((entry, index) => (
          <li
            key={entry.timestamp || index}
            className={`history-item ${entry.type}`}
          >
            <span className="history-icon">
              {entry.type === ACTION_TYPE_QUESTION ? '❓' : '🎯'}
            </span>
            <span className="history-text">
              {formatHistoryEntry(entry, players)}
            </span>
          </li>
        ))}
      </ul>
      {history.length > maxItems && (
        <p className="more-history">
          還有 {history.length - maxItems} 條更早的記錄
        </p>
      )}
    </div>
  );
}

GameHistoryList.propTypes = {
  history: PropTypes.arrayOf(PropTypes.shape({
    type: PropTypes.string,
    playerId: PropTypes.string,
    timestamp: PropTypes.number
  })),
  players: PropTypes.array,
  maxItems: PropTypes.number
};

/**
 * 遊戲狀態顯示組件
 *
 * @param {Object} props - 組件屬性
 * @param {Array} props.players - 玩家列表
 * @param {number} props.currentPlayerIndex - 當前玩家索引
 * @param {string} props.gamePhase - 遊戲階段
 * @param {string} props.winner - 獲勝者ID
 * @param {Array} props.gameHistory - 遊戲歷史
 * @param {string} props.myPlayerId - 自己的玩家ID
 * @param {boolean} props.showHistory - 是否顯示歷史記錄
 * @returns {JSX.Element} 遊戲狀態顯示組件
 */
function GameStatus({
  players = [],
  currentPlayerIndex = 0,
  gamePhase = GAME_PHASE_WAITING,
  winner = null,
  gameHistory = [],
  myPlayerId = null,
  showHistory = true
}) {
  const currentPlayer = players[currentPlayerIndex] || null;
  const isYourTurn = currentPlayer?.id === myPlayerId;

  return (
    <div className="game-status">
      {/* 遊戲階段 */}
      <GamePhaseDisplay
        gamePhase={gamePhase}
        winner={winner}
        players={players}
      />

      {/* 當前玩家 */}
      {gamePhase === GAME_PHASE_PLAYING && (
        <CurrentPlayerDisplay
          currentPlayer={currentPlayer}
          isYourTurn={isYourTurn}
        />
      )}

      {/* 玩家狀態列表 */}
      <PlayerStatusList
        players={players}
        currentPlayerIndex={currentPlayerIndex}
        myPlayerId={myPlayerId}
      />

      {/* 遊戲歷史記錄 */}
      {showHistory && (
        <GameHistoryList
          history={gameHistory}
          players={players}
        />
      )}
    </div>
  );
}

GameStatus.propTypes = {
  players: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    isActive: PropTypes.bool
  })),
  currentPlayerIndex: PropTypes.number,
  gamePhase: PropTypes.string,
  winner: PropTypes.string,
  gameHistory: PropTypes.array,
  myPlayerId: PropTypes.string,
  showHistory: PropTypes.bool
};

/**
 * 遊戲狀態顯示容器組件
 * 連接 Redux Store
 *
 * @param {Object} props - 組件屬性
 * @param {boolean} props.showHistory - 是否顯示歷史記錄
 * @returns {JSX.Element} 遊戲狀態顯示容器
 */
function GameStatusContainer({ showHistory = true }) {
  // 從 Redux store 取得遊戲狀態（分開選取以避免不必要的重新渲染）
  const players = useSelector(state => state.players);
  const currentPlayerIndex = useSelector(state => state.currentPlayerIndex);
  const gamePhase = useSelector(state => state.gamePhase);
  const winner = useSelector(state => state.winner);
  const gameHistory = useSelector(state => state.gameHistory);
  const currentPlayerId = useSelector(state => state.currentPlayerId);

  return (
    <GameStatus
      players={players}
      currentPlayerIndex={currentPlayerIndex}
      gamePhase={gamePhase}
      winner={winner}
      gameHistory={gameHistory}
      myPlayerId={currentPlayerId}
      showHistory={showHistory}
    />
  );
}

GameStatusContainer.propTypes = {
  showHistory: PropTypes.bool
};

// Issue #7：React.memo 避免遊戲狀態組件不必要的重渲染
export default memo(GameStatus);
export { GameStatusContainer };
