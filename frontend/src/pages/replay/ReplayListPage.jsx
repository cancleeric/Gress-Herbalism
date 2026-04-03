/**
 * 遊戲回放列表頁面
 *
 * 顯示玩家的歷史對局，提供回放和分享功能
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../firebase';
import { getEvolutionGameHistory } from '../../services/replayApi';
import './ReplayListPage.css';

/**
 * 格式化日期顯示
 */
function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * 格式化遊戲時長
 */
function formatDuration(seconds) {
  if (!seconds || seconds < 0) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * 單一對局記錄卡片
 */
function GameHistoryCard({ record, onWatchReplay }) {
  const game = record.game || record;
  const gameId = game.id || record.game_id;
  const startedAt = game.started_at || record.created_at;
  const status = game.status;
  const winnerId = game.winner_id;

  return (
    <div className="replay-list__card" data-testid="game-history-card">
      <div className="replay-list__card-header">
        <span className="replay-list__game-id">對局 #{gameId?.slice(-6) || '—'}</span>
        <span className={`replay-list__status replay-list__status--${status}`}>
          {status === 'finished' ? '已結束' : status === 'playing' ? '進行中' : status || '—'}
        </span>
      </div>

      <div className="replay-list__card-body">
        <div className="replay-list__meta">
          <span>📅 {formatDate(startedAt)}</span>
          {game.duration_seconds != null && (
            <span>⏱ {formatDuration(game.duration_seconds)}</span>
          )}
          {winnerId && (
            <span>🏆 {winnerId.slice(0, 8)}...</span>
          )}
        </div>
      </div>

      <div className="replay-list__card-actions">
        <button
          className="replay-list__btn replay-list__btn--watch"
          onClick={() => onWatchReplay(gameId, 'evolution')}
          disabled={!gameId}
          data-testid="watch-replay-btn"
        >
          ▶ 觀看回放
        </button>
        <button
          className="replay-list__btn replay-list__btn--share"
          onClick={() => {
            const url = `${window.location.origin}/replay/${gameId}?type=evolution`;
            navigator.clipboard?.writeText(url);
          }}
          disabled={!gameId}
          aria-label="分享回放連結"
        >
          🔗 複製連結
        </button>
      </div>
    </div>
  );
}

/**
 * 回放列表頁面
 */
function ReplayListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.uid;

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const loadHistory = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await getEvolutionGameHistory(userId, 30);
      if (result.success) {
        setRecords(result.data || []);
      } else {
        setError('載入對局歷史失敗');
      }
    } catch (err) {
      setError('載入對局歷史失敗');
      console.error('[ReplayListPage] 載入失敗:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleWatchReplay = useCallback(
    (gameId, gameType) => {
      navigate(`/replay/${gameId}?type=${gameType}`);
    },
    [navigate]
  );

  const handleBack = () => navigate(-1);

  const handleCopyCurrentUrl = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="replay-list-page" data-testid="replay-list-page">
      <header className="replay-list__header">
        <button className="replay-list__back-btn" onClick={handleBack}>
          ← 返回
        </button>
        <h1 className="replay-list__title">🎬 我的對局歷史</h1>
        <button
          className="replay-list__btn replay-list__btn--share"
          onClick={handleCopyCurrentUrl}
        >
          {copied ? '✓ 已複製' : '🔗 分享頁面'}
        </button>
      </header>

      <main className="replay-list__main">
        {loading && (
          <div className="replay-list__loading" data-testid="loading">
            載入中...
          </div>
        )}

        {!loading && error && (
          <div className="replay-list__error" data-testid="error-message">
            {error}
            <button onClick={loadHistory} className="replay-list__retry-btn">
              重試
            </button>
          </div>
        )}

        {!loading && !error && records.length === 0 && (
          <div className="replay-list__empty" data-testid="empty-state">
            <p>尚無對局記錄</p>
            <p>完成一場對局後，可在此查看回放。</p>
          </div>
        )}

        {!loading && !error && records.length > 0 && (
          <div className="replay-list__grid">
            {records.map((record, idx) => (
              <GameHistoryCard
                key={record.id || record.game_id || idx}
                record={record}
                onWatchReplay={handleWatchReplay}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default ReplayListPage;
