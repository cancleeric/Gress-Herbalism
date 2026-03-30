/**
 * 回放檢視頁面
 *
 * 顯示指定遊戲的完整回放，支援分享連結與關鍵時刻導航。
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReplayPlayer from '../../games/evolution/replay/ReplayPlayer';
import { getReplay } from '../../../services/apiService';
import './ReplayViewer.css';

/**
 * 事件類型中文標籤對照表
 */
const EVENT_LABELS = {
  game_start: '遊戲開始',
  phase_change: '階段切換',
  card_play: '出牌',
  create_creature: '創造生物',
  add_trait: '添加性狀',
  food_reveal: '揭示食物',
  feeding: '進食',
  attack: '⚔️ 攻擊',
  defense: '🛡️ 防禦',
  extinction: '💀 滅絕',
  game_end: '🏆 遊戲結束',
  // 本草事件
  ask_card: '🃏 問牌',
  guess_card: '🎯 猜牌',
  follow_guess: '跟猜',
};

/**
 * 格式化時間戳為可讀時間
 */
function formatTimestamp(ms) {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

/**
 * 回放檢視頁面組件
 */
function ReplayViewer() {
  const { gameId } = useParams();
  const navigate = useNavigate();

  const [replay, setReplay] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentEvent, setCurrentEvent] = useState(null);
  const [copied, setCopied] = useState(false);
  const [eventLog, setEventLog] = useState([]);

  // 載入回放資料
  useEffect(() => {
    if (!gameId) return;

    setLoading(true);
    setError('');

    getReplay(gameId)
      .then((result) => {
        if (result.success && result.data) {
          setReplay(result.data);
        } else {
          setError('找不到回放資料');
        }
      })
      .catch(() => {
        setError('載入回放失敗，請稍後再試');
      })
      .finally(() => setLoading(false));
  }, [gameId]);

  // 事件播放回調
  const handleEventPlay = useCallback((event, index) => {
    setCurrentEvent(event);
    setEventLog((prev) => {
      const newLog = [...prev, { event, index }];
      // 最多保留最新 20 筆
      return newLog.slice(-20);
    });
  }, []);

  // 回放完成回調
  const handleComplete = useCallback(() => {
    setCurrentEvent(null);
  }, []);

  // 複製分享連結
  const handleShare = useCallback(() => {
    const url = window.location.href;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        // 降級：用 prompt 顯示
        window.prompt('複製此連結：', url);
      });
  }, []);

  const handleBack = () => navigate(-1);

  if (loading) {
    return (
      <div className="replay-viewer">
        <div className="replay-viewer__loading">載入回放中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="replay-viewer">
        <div className="replay-viewer__error">
          <p>{error}</p>
          <button className="replay-viewer__back-btn" onClick={handleBack}>
            ← 返回
          </button>
        </div>
      </div>
    );
  }

  const baseTimestamp = replay?.events?.[0]?.timestamp || 0;

  return (
    <div className="replay-viewer">
      {/* 頂部導航 */}
      <header className="replay-viewer__header">
        <button className="replay-viewer__back-btn" onClick={handleBack}>
          ← 返回
        </button>
        <h1 className="replay-viewer__title">🎬 對局回放</h1>
        <button
          className={`replay-viewer__share-btn ${copied ? 'copied' : ''}`}
          onClick={handleShare}
          title="分享此回放連結"
        >
          {copied ? '✓ 已複製！' : '🔗 分享連結'}
        </button>
      </header>

      {/* 遊戲資訊 */}
      {replay && (
        <div className="replay-viewer__info">
          <span className="replay-viewer__game-id">對局 ID：{gameId}</span>
          {replay.createdAt && (
            <span className="replay-viewer__date">
              {new Date(replay.createdAt).toLocaleString('zh-TW')}
            </span>
          )}
          <span className="replay-viewer__event-count">
            共 {replay.events?.length || 0} 個事件
          </span>
        </div>
      )}

      {/* 主要區域 */}
      <div className="replay-viewer__body">
        {/* 播放器 */}
        <div className="replay-viewer__player-wrap">
          <ReplayPlayer
            events={replay?.events}
            onEventPlay={handleEventPlay}
            onComplete={handleComplete}
            className="replay-viewer__player"
          />
        </div>

        {/* 事件面板 */}
        <div className="replay-viewer__event-panel">
          {/* 當前事件詳情 */}
          {currentEvent && (
            <div className="replay-viewer__current-event">
              <h3 className="replay-viewer__section-title">當前事件</h3>
              <div className="replay-viewer__event-card">
                <div className="replay-viewer__event-label">
                  {EVENT_LABELS[currentEvent.type] || currentEvent.type}
                </div>
                {currentEvent.timestamp && (
                  <div className="replay-viewer__event-time">
                    {formatTimestamp(currentEvent.timestamp - baseTimestamp)}
                  </div>
                )}
                {currentEvent.data && Object.keys(currentEvent.data).length > 0 && (
                  <div className="replay-viewer__event-data">
                    {Object.entries(currentEvent.data).map(([key, val]) => (
                      <div key={key} className="replay-viewer__event-data-row">
                        <span className="replay-viewer__data-key">{key}：</span>
                        <span className="replay-viewer__data-val">
                          {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 事件紀錄 */}
          <div className="replay-viewer__event-log">
            <h3 className="replay-viewer__section-title">事件紀錄</h3>
            <div className="replay-viewer__log-list">
              {eventLog.length === 0 ? (
                <p className="replay-viewer__log-empty">點擊播放開始回放</p>
              ) : (
                [...eventLog].reverse().map(({ event, index }) => (
                  <div
                    key={`${index}-${event.timestamp ?? index}`}
                    className="replay-viewer__log-item"
                  >
                    <span className="replay-viewer__log-index">#{index + 1}</span>
                    <span className="replay-viewer__log-label">
                      {EVENT_LABELS[event.type] || event.type}
                    </span>
                    {event.timestamp && (
                      <span className="replay-viewer__log-time">
                        {formatTimestamp(event.timestamp - baseTimestamp)}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReplayViewer;
