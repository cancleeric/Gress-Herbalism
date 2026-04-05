/**
 * 回放列表組件
 *
 * 顯示本草遊戲的歷史回放列表，供玩家瀏覽和選擇
 */

import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { getHerbalismReplays } from '../../../services/apiService';
import './ReplayList.css';

/**
 * 格式化毫秒為可讀時長
 * @param {number} ms
 * @returns {string}
 */
function formatDuration(ms) {
  if (!ms) return '-';
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes === 0) return `${remainingSeconds}秒`;
  return `${minutes}分${remainingSeconds}秒`;
}

/**
 * 格式化時間戳
 * @param {string} isoString
 * @returns {string}
 */
function formatDate(isoString) {
  if (!isoString) return '-';
  const date = new Date(isoString);
  return date.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * 回放列表組件
 */
function ReplayList({ onSelectReplay, currentPlayerName }) {
  const [replays, setReplays] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [playerNameFilter, setPlayerNameFilter] = useState(currentPlayerName || '');
  const [filterInput, setFilterInput] = useState(currentPlayerName || '');

  const loadReplays = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const resp = await getHerbalismReplays({ limit: 30, playerName: playerNameFilter });
      setReplays(resp.data || []);
    } catch (err) {
      setError('無法載入回放列表，請稍後再試。');
    } finally {
      setIsLoading(false);
    }
  }, [playerNameFilter]);

  useEffect(() => {
    loadReplays();
  }, [loadReplays]);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    setPlayerNameFilter(filterInput.trim());
  };

  return (
    <div className="replay-list">
      <div className="replay-list__header">
        <h2 className="replay-list__title">🎬 遊戲回放</h2>
        <form className="replay-list__filter" onSubmit={handleFilterSubmit}>
          <input
            className="replay-list__filter-input"
            type="text"
            placeholder="依玩家名稱篩選"
            value={filterInput}
            onChange={e => setFilterInput(e.target.value)}
          />
          <button className="replay-list__filter-btn" type="submit">
            搜尋
          </button>
          {playerNameFilter && (
            <button
              className="replay-list__filter-clear"
              type="button"
              onClick={() => {
                setFilterInput('');
                setPlayerNameFilter('');
              }}
            >
              清除
            </button>
          )}
        </form>
        <button
          className="replay-list__refresh-btn"
          onClick={loadReplays}
          disabled={isLoading}
          title="重新載入"
        >
          {isLoading ? '載入中…' : '↺ 重新整理'}
        </button>
      </div>

      {error && (
        <div className="replay-list__error">{error}</div>
      )}

      {!isLoading && !error && replays.length === 0 && (
        <div className="replay-list__empty">
          <p>目前沒有回放紀錄。</p>
          <p className="replay-list__empty-hint">完成一場本草遊戲後，回放將自動儲存。</p>
        </div>
      )}

      {replays.length > 0 && (
        <div className="replay-list__table-wrapper">
          <table className="replay-list__table">
            <thead>
              <tr>
                <th>日期</th>
                <th>玩家</th>
                <th>勝利者</th>
                <th>局數</th>
                <th>時長</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {replays.map(replay => (
                <tr key={replay.gameId} className="replay-list__row">
                  <td className="replay-list__date">{formatDate(replay.createdAt)}</td>
                  <td className="replay-list__players">
                    {(replay.playerNames || []).join('、') || '-'}
                  </td>
                  <td className="replay-list__winner">
                    {replay.winnerName
                      ? <span className="replay-list__winner-badge">🏆 {replay.winnerName}</span>
                      : '-'}
                  </td>
                  <td className="replay-list__rounds">{replay.roundsPlayed || '-'}</td>
                  <td className="replay-list__duration">{formatDuration(replay.durationMs)}</td>
                  <td className="replay-list__actions">
                    <button
                      className="replay-list__watch-btn"
                      onClick={() => onSelectReplay(replay.gameId)}
                    >
                      ▶ 觀看
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

ReplayList.propTypes = {
  /** 選擇回放的回調（傳入 gameId） */
  onSelectReplay: PropTypes.func.isRequired,
  /** 當前登入玩家名稱（用於預設篩選） */
  currentPlayerName: PropTypes.string,
};

export default ReplayList;
