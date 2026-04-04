/**
 * 回放頁面
 *
 * 支援本草（herbalism）與演化論（evolution）的回放觀看
 * 路由：/replay/:gameType/:gameId
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import HerbalismReplayPlayer from '../../components/games/herbalism/ReplayPlayer/HerbalismReplayPlayer';
import { ReplayPlayer as EvolutionReplayPlayer } from '../../components/games/evolution/replay';
import { getHerbalismReplay } from '../../services/apiService';
import './ReplayPage.css';

/**
 * 產生回放分享連結
 */
function buildShareUrl(gameType, gameId) {
  return `${window.location.origin}/replay/${gameType}/${gameId}`;
}

/**
 * 回放頁面
 */
function ReplayPage() {
  const { gameType, gameId } = useParams();
  const navigate = useNavigate();

  const [events, setEvents] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shareToast, setShareToast] = useState(null);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (!gameId || !gameType) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const loadReplay = async () => {
      try {
        if (gameType === 'herbalism') {
          const response = await getHerbalismReplay(gameId);
          setEvents(response.data?.events || []);
        } else {
          // Evolution replay loading is not yet supported from this page
          setError('演化論回放功能尚未支援，請稍後再試。');
          setEvents([]);
        }
      } catch {
        setError('無法載入回放資料，請確認連結是否正確。');
      } finally {
        setIsLoading(false);
      }
    };

    loadReplay();
  }, [gameId, gameType]);

  const handleShare = useCallback(async () => {
    const url = buildShareUrl(gameType, gameId);

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
      } else {
        const el = document.createElement('textarea');
        el.value = url;
        el.style.position = 'fixed';
        el.style.opacity = '0';
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      }
      setIsCopied(true);
      setShareToast('回放連結已複製！');
      setTimeout(() => {
        setIsCopied(false);
        setShareToast(null);
      }, 2000);
    } catch {
      setShareToast('複製失敗，請手動複製網址列連結。');
      setTimeout(() => setShareToast(null), 2000);
    }
  }, [gameType, gameId]);

  const handleBack = useCallback(() => {
    navigate('/replays');
  }, [navigate]);

  return (
    <div className="replay-page">
      {/* 頂部工具列 */}
      <div className="replay-page__header">
        <button className="replay-page__back-btn" onClick={handleBack}>
          ← 回到列表
        </button>
        <button
          className={`replay-page__share-btn${isCopied ? ' replay-page__share-btn--copied' : ''}`}
          onClick={handleShare}
          aria-label="分享回放連結"
        >
          {isCopied ? '✓ 已複製連結' : '🔗 分享此回放'}
        </button>
      </div>

      {/* 主要內容 */}
      <div className="replay-page__content">
        {isLoading && (
          <div className="replay-page__loading">載入回放中…</div>
        )}

        {!isLoading && error && (
          <div className="replay-page__error">{error}</div>
        )}

        {!isLoading && !error && events !== null && events.length === 0 && (
          <div className="replay-page__not-found">找不到此回放資料。</div>
        )}

        {!isLoading && !error && events && events.length > 0 && (
          <>
            {gameType === 'herbalism' && (
              <HerbalismReplayPlayer events={events} />
            )}
            {gameType === 'evolution' && (
              <EvolutionReplayPlayer events={events} />
            )}
          </>
        )}
      </div>

      {shareToast && (
        <div className="replay-page__toast" role="status">
          {shareToast}
        </div>
      )}
    </div>
  );
}

export default ReplayPage;
