/**
 * 演化論遊戲回放頁面
 *
 * @module components/games/evolution/replay/ReplayPage
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEvolutionReplay } from '../../../../services/apiService';
import ReplayPlayer from './ReplayPlayer';
import './ReplayPage.css';

/**
 * 事件類型對應中文說明
 */
const EVENT_LABELS = {
  game_start: '遊戲開始',
  phase_change: '階段切換',
  card_play: '出牌',
  create_creature: '創造生物',
  add_trait: '賦予性狀',
  food_reveal: '揭示食物',
  feeding: '進食',
  attack: '攻擊',
  defense: '防禦',
  extinction: '滅絕',
  game_end: '遊戲結束',
};

/**
 * 將事件資料轉換為可讀說明
 */
function formatEventDescription(event) {
  const label = EVENT_LABELS[event.type] || event.type;
  const data = event.data || {};

  switch (event.type) {
    case 'create_creature':
      return `${label}：玩家 ${data.playerId || '?'} 創造生物`;
    case 'add_trait':
      return `${label}：玩家 ${data.playerId || '?'} 賦予性狀 ${data.traitType || '?'}`;
    case 'feeding':
      return `${label}：玩家 ${data.playerId || '?'} 的生物進食`;
    case 'attack':
      return `${label}：玩家 ${data.attackerId || '?'} 攻擊 ${data.targetId || '?'}（${data.success ? '成功' : '失敗'}）`;
    case 'extinction':
      return `${label}：玩家 ${data.playerId || '?'} 的生物滅絕`;
    case 'phase_change':
      return `${label}：進入${data.phase || '?'}階段（第 ${data.round || '?'} 回合）`;
    case 'game_end':
      return `${label}：勝利者 ${data.winner || '?'}`;
    default:
      return label;
  }
}

/**
 * 演化論遊戲回放頁面
 */
function ReplayPage() {
  const { gameId } = useParams();
  const navigate = useNavigate();

  const [events, setEvents] = useState(null);
  const [replayMeta, setReplayMeta] = useState(null);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 載入回放資料
  useEffect(() => {
    if (!gameId) return;

    setLoading(true);
    setError(null);

    getEvolutionReplay(gameId)
      .then(response => {
        if (response.success && response.data) {
          setEvents(response.data.events || []);
          setReplayMeta({
            createdAt: response.data.createdAt,
            sizeBytes: response.data.sizeBytes,
          });
        } else {
          setError('找不到回放資料');
        }
      })
      .catch(err => {
        setError(err.message || '載入回放失敗');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [gameId]);

  const handleEventPlay = useCallback((event, index) => {
    setCurrentEvent(event);
    setCurrentIndex(index);
  }, []);

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  if (loading) {
    return (
      <div className="replay-page replay-page--loading">
        <p>載入回放中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="replay-page replay-page--error">
        <p className="replay-page__error-msg">{error}</p>
        <button className="replay-page__btn" onClick={handleBack}>
          返回
        </button>
      </div>
    );
  }

  return (
    <div className="replay-page">
      <div className="replay-page__header">
        <button className="replay-page__back-btn" onClick={handleBack}>
          &larr; 返回
        </button>
        <h1 className="replay-page__title">對局回放</h1>
        {replayMeta?.createdAt && (
          <span className="replay-page__meta">
            {new Date(replayMeta.createdAt).toLocaleString('zh-TW')}
          </span>
        )}
      </div>

      <div className="replay-page__content">
        {/* 回放播放器 */}
        <div className="replay-page__player-section">
          <ReplayPlayer
            events={events}
            onEventPlay={handleEventPlay}
            className="replay-page__player"
          />
        </div>

        {/* 事件說明 */}
        <div className="replay-page__event-section">
          {currentEvent ? (
            <div className="replay-page__current-event">
              <h3 className="replay-page__event-label">目前事件</h3>
              <p className="replay-page__event-desc">
                {formatEventDescription(currentEvent)}
              </p>
              <span className="replay-page__event-index">
                第 {currentIndex + 1} 步 / 共 {events?.length || 0} 步
              </span>
            </div>
          ) : (
            <div className="replay-page__current-event replay-page__current-event--empty">
              <p>按下播放開始回放</p>
            </div>
          )}

          {/* 事件列表 */}
          <div className="replay-page__event-list">
            <h3 className="replay-page__event-list-title">事件紀錄</h3>
            <ul className="replay-page__events">
              {(events || []).map((event, index) => (
                <li
                  key={index}
                  className={`replay-page__event-item ${index === currentIndex ? 'replay-page__event-item--active' : ''}`}
                >
                  <span className="replay-page__event-num">{index + 1}</span>
                  <span className="replay-page__event-text">
                    {formatEventDescription(event)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReplayPage;
