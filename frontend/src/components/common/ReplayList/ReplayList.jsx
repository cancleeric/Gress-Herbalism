/**
 * 回放列表頁面
 *
 * 顯示玩家的對局歷史記錄，提供回放連結。
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../firebase';
import { getPlayerHistory } from '../../../services/apiService';
import './ReplayList.css';

/**
 * 格式化遊戲時間
 */
function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * 遊戲類型標籤
 */
function GameTypeBadge({ gameType }) {
  const labels = {
    herbalism: '本草',
    evolution: '演化論',
  };
  const label = labels[gameType] || gameType || '未知';
  return (
    <span className={`replay-list__badge replay-list__badge--${gameType || 'unknown'}`}>
      {label}
    </span>
  );
}

/**
 * 單筆歷史記錄列
 */
function HistoryRow({ record, onViewReplay }) {
  const isWinner = record.is_winner;

  return (
    <div className={`replay-list__row ${isWinner ? 'replay-list__row--win' : 'replay-list__row--loss'}`}>
      <div className="replay-list__row-main">
        <div className="replay-list__result">
          {isWinner ? '🏆 勝利' : '😔 落敗'}
        </div>
        <div className="replay-list__meta">
          <GameTypeBadge gameType={record.game_type} />
          <span className="replay-list__date">{formatDate(record.created_at)}</span>
        </div>
        <div className="replay-list__score">
          得分：<strong>{record.score ?? '—'}</strong>
        </div>
      </div>
      <div className="replay-list__actions">
        {record.game_id ? (
          <button
            className="replay-list__replay-btn"
            onClick={() => onViewReplay(record.game_id)}
            title="觀看回放"
          >
            🎬 回放
          </button>
        ) : (
          <span className="replay-list__no-replay">無回放</span>
        )}
      </div>
    </div>
  );
}

/**
 * 回放列表頁面
 */
function ReplayList() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [limit, setLimit] = useState(20);

  useEffect(() => {
    if (!user?.uid) return;

    setLoading(true);
    setError('');

    getPlayerHistory(user.uid, limit)
      .then((result) => {
        if (result.success) {
          setHistory(result.data || []);
        } else {
          setError(result.message || '載入歷史記錄失敗');
        }
      })
      .catch(() => {
        setError('載入歷史記錄失敗，請稍後再試');
      })
      .finally(() => setLoading(false));
  }, [user, limit]);

  const handleViewReplay = (gameId) => {
    navigate(`/replay/${gameId}`);
  };

  const handleBack = () => navigate(-1);

  const handleLoadMore = () => {
    setLimit((prev) => prev + 20);
  };

  return (
    <div className="replay-list">
      {/* 頂部導航 */}
      <header className="replay-list__header">
        <button className="replay-list__back-btn" onClick={handleBack}>
          ← 返回
        </button>
        <h1 className="replay-list__title">🎬 我的對局記錄</h1>
      </header>

      <div className="replay-list__body">
        {loading ? (
          <div className="replay-list__loading">載入中...</div>
        ) : error ? (
          <div className="replay-list__error">
            <p>{error}</p>
            <button onClick={handleBack}>返回</button>
          </div>
        ) : history.length === 0 ? (
          <div className="replay-list__empty">
            <p>尚無對局記錄</p>
            <button
              className="replay-list__play-btn"
              onClick={() => navigate('/')}
            >
              開始遊戲
            </button>
          </div>
        ) : (
          <>
            <div className="replay-list__count">
              共 {history.length} 筆對局記錄
            </div>
            <div className="replay-list__list">
              {history.map((record, idx) => (
                <HistoryRow
                  key={record.game_id || idx}
                  record={record}
                  onViewReplay={handleViewReplay}
                />
              ))}
            </div>
            {history.length === limit && (
              <button
                className="replay-list__load-more"
                onClick={handleLoadMore}
              >
                載入更多
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default ReplayList;
