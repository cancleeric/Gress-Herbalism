/**
 * 離線狀態指示器組件
 * 顯示玩家離線狀態和倒數計時
 */

import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import './OfflineIndicator.css';

/**
 * 離線狀態
 */
const OFFLINE_STATUS = {
  ONLINE: 'online',
  TEMPORARILY_OFFLINE: 'temporarily_offline',
  FORFEITED: 'forfeited',
};

/**
 * 格式化時間
 * @param {number} ms - 毫秒數
 * @returns {string}
 */
function formatTime(ms) {
  const seconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes > 0) {
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  return `${seconds}s`;
}

/**
 * 單個玩家離線指示器
 */
function PlayerOfflineTag({ player, compact }) {
  const [remainingTime, setRemainingTime] = useState(null);

  useEffect(() => {
    if (player.status !== OFFLINE_STATUS.TEMPORARILY_OFFLINE) {
      setRemainingTime(null);
      return;
    }

    if (player.disconnectedAt && player.timeout) {
      const updateTime = () => {
        const elapsed = Date.now() - player.disconnectedAt;
        const remaining = Math.max(0, player.timeout - elapsed);
        setRemainingTime(remaining);
      };

      updateTime();
      const interval = setInterval(updateTime, 1000);
      return () => clearInterval(interval);
    }
  }, [player.status, player.disconnectedAt, player.timeout]);

  if (player.status === OFFLINE_STATUS.ONLINE) {
    return null;
  }

  const isForfeited = player.status === OFFLINE_STATUS.FORFEITED;

  if (compact) {
    return (
      <span
        className={`offline-tag offline-tag--compact ${isForfeited ? 'offline-tag--forfeited' : ''}`}
        title={isForfeited ? '已離開遊戲' : `離線中 - 剩餘 ${formatTime(remainingTime || 0)}`}
      >
        {isForfeited ? '❌' : '⏳'}
      </span>
    );
  }

  return (
    <span className={`offline-tag ${isForfeited ? 'offline-tag--forfeited' : ''}`}>
      {isForfeited ? (
        <>❌ 已離開</>
      ) : (
        <>⏳ 離線 {remainingTime !== null && `(${formatTime(remainingTime)})`}</>
      )}
    </span>
  );
}

PlayerOfflineTag.propTypes = {
  player: PropTypes.shape({
    playerId: PropTypes.string.isRequired,
    status: PropTypes.oneOf(Object.values(OFFLINE_STATUS)).isRequired,
    disconnectedAt: PropTypes.number,
    timeout: PropTypes.number,
  }).isRequired,
  compact: PropTypes.bool,
};

/**
 * 離線玩家列表
 */
function OfflinePlayerList({ players, onDismiss }) {
  const offlinePlayers = players.filter(
    p => p.status !== OFFLINE_STATUS.ONLINE
  );

  if (offlinePlayers.length === 0) {
    return null;
  }

  return (
    <div className="offline-player-list">
      <div className="offline-player-list__header">
        <span>離線玩家</span>
        {onDismiss && (
          <button
            className="offline-player-list__dismiss"
            onClick={onDismiss}
            aria-label="關閉"
          >
            ✕
          </button>
        )}
      </div>
      <div className="offline-player-list__content">
        {offlinePlayers.map(player => (
          <div key={player.playerId} className="offline-player-list__item">
            <span className="offline-player-list__name">
              {player.playerName || player.playerId.slice(0, 8)}
            </span>
            <PlayerOfflineTag player={player} />
          </div>
        ))}
      </div>
    </div>
  );
}

OfflinePlayerList.propTypes = {
  players: PropTypes.arrayOf(
    PropTypes.shape({
      playerId: PropTypes.string.isRequired,
      playerName: PropTypes.string,
      status: PropTypes.oneOf(Object.values(OFFLINE_STATUS)).isRequired,
    })
  ).isRequired,
  onDismiss: PropTypes.func,
};

/**
 * 離線通知 Banner
 */
function OfflineBanner({ player, onRetry }) {
  const [remainingTime, setRemainingTime] = useState(null);

  useEffect(() => {
    if (!player || player.status === OFFLINE_STATUS.ONLINE) {
      setRemainingTime(null);
      return;
    }

    if (player.disconnectedAt && player.timeout) {
      const updateTime = () => {
        const elapsed = Date.now() - player.disconnectedAt;
        const remaining = Math.max(0, player.timeout - elapsed);
        setRemainingTime(remaining);
      };

      updateTime();
      const interval = setInterval(updateTime, 1000);
      return () => clearInterval(interval);
    }
  }, [player]);

  if (!player || player.status === OFFLINE_STATUS.ONLINE) {
    return null;
  }

  const isForfeited = player.status === OFFLINE_STATUS.FORFEITED;

  return (
    <div className={`offline-banner ${isForfeited ? 'offline-banner--forfeited' : ''}`}>
      <div className="offline-banner__icon">
        {isForfeited ? '❌' : '📡'}
      </div>
      <div className="offline-banner__content">
        {isForfeited ? (
          <span>你已被判定離開遊戲</span>
        ) : (
          <>
            <span>連線中斷</span>
            {remainingTime !== null && (
              <span className="offline-banner__countdown">
                剩餘時間：{formatTime(remainingTime)}
              </span>
            )}
          </>
        )}
      </div>
      {!isForfeited && onRetry && (
        <button className="offline-banner__retry" onClick={onRetry}>
          重新連線
        </button>
      )}
    </div>
  );
}

OfflineBanner.propTypes = {
  player: PropTypes.shape({
    status: PropTypes.oneOf(Object.values(OFFLINE_STATUS)).isRequired,
    disconnectedAt: PropTypes.number,
    timeout: PropTypes.number,
  }),
  onRetry: PropTypes.func,
};

/**
 * 離線指示器主組件
 */
function OfflineIndicator({
  players,
  currentPlayer,
  showBanner,
  showList,
  compact,
  onRetry,
  onDismissList,
  className,
}) {
  return (
    <div className={`offline-indicator ${className || ''}`}>
      {showBanner && currentPlayer && (
        <OfflineBanner player={currentPlayer} onRetry={onRetry} />
      )}
      {showList && players && players.length > 0 && (
        <OfflinePlayerList players={players} onDismiss={onDismissList} />
      )}
    </div>
  );
}

OfflineIndicator.propTypes = {
  /** 所有玩家狀態 */
  players: PropTypes.arrayOf(
    PropTypes.shape({
      playerId: PropTypes.string.isRequired,
      playerName: PropTypes.string,
      status: PropTypes.oneOf(Object.values(OFFLINE_STATUS)).isRequired,
    })
  ),
  /** 當前玩家狀態 */
  currentPlayer: PropTypes.shape({
    status: PropTypes.oneOf(Object.values(OFFLINE_STATUS)).isRequired,
    disconnectedAt: PropTypes.number,
    timeout: PropTypes.number,
  }),
  /** 是否顯示 Banner */
  showBanner: PropTypes.bool,
  /** 是否顯示列表 */
  showList: PropTypes.bool,
  /** 是否使用緊湊模式 */
  compact: PropTypes.bool,
  /** 重試回調 */
  onRetry: PropTypes.func,
  /** 關閉列表回調 */
  onDismissList: PropTypes.func,
  /** 額外的 CSS 類名 */
  className: PropTypes.string,
};

OfflineIndicator.defaultProps = {
  showBanner: true,
  showList: true,
  compact: false,
};

export {
  OfflineIndicator,
  PlayerOfflineTag,
  OfflinePlayerList,
  OfflineBanner,
  OFFLINE_STATUS,
  formatTime,
};

export default OfflineIndicator;
