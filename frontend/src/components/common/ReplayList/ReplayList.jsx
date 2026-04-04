/**
 * 回放列表組件
 *
 * 顯示玩家的對局歷史與回放連結，支援分享功能
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../firebase/AuthContext';
import { getPlayerHistory } from '../../../services/apiService';
import './ReplayList.css';

const GAME_TYPE_FILTER = {
  ALL: 'all',
  HERBALISM: 'herbalism',
  EVOLUTION: 'evolution',
};

const GAME_TYPE_LABELS = {
  [GAME_TYPE_FILTER.ALL]: '全部',
  [GAME_TYPE_FILTER.HERBALISM]: '🌿 本草',
  [GAME_TYPE_FILTER.EVOLUTION]: '🦕 演化論',
};

const GAME_ICONS = {
  herbalism: '🌿',
  evolution: '🦕',
};

/**
 * 格式化日期
 */
function formatDate(dateString) {
  if (!dateString) return '—';
  const d = new Date(dateString);
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
 * 產生回放分享連結
 */
function buildShareUrl(gameId, gameType) {
  const base = window.location.origin;
  return `${base}/replay/${gameType}/${gameId}`;
}

/**
 * 回放列表組件
 */
function ReplayList() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState(GAME_TYPE_FILTER.ALL);
  const [shareToast, setShareToast] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // 載入對局歷史
  useEffect(() => {
    if (!user?.uid) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    getPlayerHistory(user.uid, 50)
      .then((response) => {
        setHistory(response.data || []);
      })
      .catch(() => {
        setError('無法載入對局歷史，請稍後再試。');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [user]);

  // 篩選對局
  const filteredHistory = history.filter((item) => {
    if (filter === GAME_TYPE_FILTER.ALL) return true;
    return (item.game_type || 'herbalism') === filter;
  });

  // 觀看回放
  const handleWatch = useCallback(
    (gameId, gameType) => {
      navigate(`/replay/${gameType || 'herbalism'}/${gameId}`);
    },
    [navigate]
  );

  // 分享回放連結
  const handleShare = useCallback(async (gameId, gameType) => {
    const url = buildShareUrl(gameId, gameType || 'herbalism');

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
      } else {
        // fallback
        const el = document.createElement('textarea');
        el.value = url;
        el.style.position = 'fixed';
        el.style.opacity = '0';
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      }
      setCopiedId(gameId);
      setShareToast('回放連結已複製到剪貼簿！');
      setTimeout(() => {
        setCopiedId(null);
        setShareToast(null);
      }, 2000);
    } catch {
      setShareToast('複製失敗，請手動複製連結。');
      setTimeout(() => setShareToast(null), 2000);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="replay-list">
        <h2 className="replay-list__title">我的對局回放</h2>
        <div className="replay-list__loading">載入中…</div>
      </div>
    );
  }

  return (
    <div className="replay-list">
      <h2 className="replay-list__title">我的對局回放</h2>

      {error && <div className="replay-list__error">{error}</div>}

      {/* 篩選標籤 */}
      <div className="replay-list__tabs" role="tablist">
        {Object.entries(GAME_TYPE_LABELS).map(([key, label]) => (
          <button
            key={key}
            role="tab"
            aria-selected={filter === key}
            className={`replay-list__tab${filter === key ? ' replay-list__tab--active' : ''}`}
            onClick={() => setFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 回放列表 */}
      {filteredHistory.length === 0 ? (
        <div className="replay-list__empty">
          <span className="replay-list__empty-icon">🎮</span>
          <p>尚無對局紀錄</p>
        </div>
      ) : (
        <div className="replay-list__items">
          {filteredHistory.map((item) => {
            const gameType = item.game_type || 'herbalism';
            const gameId = item.game_id || item.id;
            const isCopied = copiedId === gameId;

            return (
              <div key={gameId} className="replay-list__item">
                {/* 遊戲類型圖示 */}
                <span className="replay-list__game-icon">
                  {GAME_ICONS[gameType] || '🎮'}
                </span>

                {/* 對局資訊 */}
                <div className="replay-list__info">
                  <div className="replay-list__game-type">
                    {gameType === 'herbalism' ? '本草' : '演化論'}
                  </div>
                  <div className="replay-list__game-id" title={gameId}>
                    {gameId}
                  </div>
                  <div className="replay-list__date">
                    {formatDate(item.played_at || item.created_at)}
                  </div>
                </div>

                {/* 操作按鈕 */}
                <div className="replay-list__actions">
                  <button
                    className="replay-list__btn replay-list__btn--watch"
                    onClick={() => handleWatch(gameId, gameType)}
                  >
                    ▶ 觀看
                  </button>
                  <button
                    className={`replay-list__btn replay-list__btn--share${isCopied ? ' replay-list__btn--copied' : ''}`}
                    onClick={() => handleShare(gameId, gameType)}
                    aria-label={`分享 ${gameId} 的回放連結`}
                  >
                    {isCopied ? '✓ 已複製' : '🔗 分享'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 分享成功提示 */}
      {shareToast && (
        <div className="replay-list__share-toast" role="status">
          {shareToast}
        </div>
      )}
    </div>
  );
}

export { GAME_TYPE_FILTER };
export default ReplayList;
