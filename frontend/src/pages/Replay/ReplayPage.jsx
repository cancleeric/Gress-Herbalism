/**
 * 回放頁面
 *
 * 顯示本草遊戲回放列表，並提供特定回放的查看功能
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../firebase';
import ReplayList from '../../components/common/ReplayList';
import HerbalismReplayPlayer from '../../components/games/herbalism/ReplayPlayer';
import { getHerbalismReplay } from '../../services/apiService';
import './ReplayPage.css';

/**
 * 回放頁面組件
 *
 * 路由：
 *  - /replays               → 顯示回放列表
 *  - /replay/herbalism/:id  → 直接開啟特定回放
 */
function ReplayPage() {
  const { gameId } = useParams();      // 若從 /replay/herbalism/:gameId 進入
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [replay, setReplay] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // 若 URL 包含 gameId，自動載入該回放
  useEffect(() => {
    if (!gameId) return;

    setIsLoading(true);
    setError(null);
    setReplay(null);

    getHerbalismReplay(gameId)
      .then(resp => {
        setReplay(resp.data);
      })
      .catch(() => {
        setError('無法載入回放，請確認連結是否正確。');
      })
      .finally(() => setIsLoading(false));
  }, [gameId]);

  /** 從列表選擇回放 */
  const handleSelectReplay = async (selectedGameId) => {
    navigate(`/replay/herbalism/${selectedGameId}`);
  };

  /** 關閉播放器，回到列表 */
  const handleClosePlayer = () => {
    navigate('/replays');
  };

  /** 分享回放連結 */
  const handleShare = () => {
    const url = `${window.location.origin}/replay/herbalism/${gameId}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        alert('回放連結已複製到剪貼簿！');
      });
    } else {
      // Fallback for non-HTTPS or older browsers
      window.prompt('複製以下連結以分享回放：', url);
    }
  };

  const isPlayerView = !!gameId;
  const currentPlayerName = user?.displayName || '';

  return (
    <div className="replay-page">
      <div className="replay-page__nav">
        <button
          className="replay-page__back-btn"
          onClick={() => navigate('/')}
        >
          ← 返回首頁
        </button>
        {isPlayerView && (
          <button
            className="replay-page__list-btn"
            onClick={handleClosePlayer}
          >
            📋 回放列表
          </button>
        )}
      </div>

      {/* 回放播放器 */}
      {isPlayerView && (
        <div className="replay-page__player-section">
          {isLoading && (
            <div className="replay-page__loading">載入回放中…</div>
          )}
          {error && (
            <div className="replay-page__error">
              {error}
              <button className="replay-page__retry-btn" onClick={() => navigate('/replays')}>
                返回列表
              </button>
            </div>
          )}
          {!isLoading && !error && replay && (
            <>
              <div className="replay-page__player-header">
                <h2 className="replay-page__player-title">遊戲回放</h2>
                <button
                  className="replay-page__share-btn"
                  onClick={handleShare}
                  title="複製分享連結"
                >
                  🔗 分享
                </button>
              </div>
              <HerbalismReplayPlayer
                replay={replay}
                onClose={handleClosePlayer}
              />
            </>
          )}
        </div>
      )}

      {/* 回放列表 */}
      {!isPlayerView && (
        <ReplayList
          onSelectReplay={handleSelectReplay}
          currentPlayerName={currentPlayerName}
        />
      )}
    </div>
  );
}

export default ReplayPage;
