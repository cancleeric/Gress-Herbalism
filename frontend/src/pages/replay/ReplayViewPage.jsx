/**
 * 遊戲回放觀看頁面
 *
 * 支援演化論與本草遊戲回放，提供播放控制和分享功能
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import ReplayPlayer from '../../components/games/evolution/replay/ReplayPlayer';
import { getEvolutionReplay, getHerbalismReplay } from '../../services/replayApi';
import './ReplayViewPage.css';

/** 事件日誌保留的最大條數 */
const MAX_EVENT_LOG_SIZE = 50;

/** ID 截斷輔助函式 */
function truncateId(id, length = 6) {
  if (!id) return '—';
  return `${id.slice(0, length)}...`;
}

/**
 * 演化論事件類型顯示名稱
 */
const EVOLUTION_EVENT_LABELS = {
  game_start: '遊戲開始',
  phase_change: '階段切換',
  card_play: '出牌',
  create_creature: '建立生物',
  add_trait: '新增性狀',
  food_reveal: '食物揭示',
  feeding: '進食',
  attack: '⚔️ 攻擊',
  defense: '🛡️ 防禦',
  extinction: '💀 滅絕',
  game_end: '🏆 遊戲結束',
};

/**
 * 本草事件類型顯示名稱
 */
const HERBALISM_EVENT_LABELS = {
  game_start: '遊戲開始',
  round_start: '回合開始',
  ask_card: '問牌',
  color_choice: '顏色選擇',
  post_question: '問牌後',
  guess_cards: '猜牌',
  follow_guess: '跟猜',
  guess_result: '🎯 猜牌結果',
  score_update: '分數更新',
  round_end: '回合結束',
  game_end: '🏆 遊戲結束',
};

/**
 * 取得事件顯示名稱
 */
function getEventLabel(type, gameType) {
  const labels = gameType === 'herbalism' ? HERBALISM_EVENT_LABELS : EVOLUTION_EVENT_LABELS;
  return labels[type] || type;
}

/**
 * 演化論事件詳情渲染
 */
function EvolutionEventDetail({ event }) {
  if (!event) return null;
  const { type, data } = event;

  switch (type) {
    case 'create_creature':
      return (
        <div className="replay-view__event-detail">
          <span>玩家 {truncateId(data?.playerId)} 建立了生物 #{truncateId(data?.creatureId)}</span>
        </div>
      );
    case 'add_trait':
      return (
        <div className="replay-view__event-detail">
          <span>
            玩家 {truncateId(data?.playerId)} 為生物 #{truncateId(data?.creatureId)} 新增性狀：
            <strong>{data?.traitType}</strong>
          </span>
        </div>
      );
    case 'attack':
      return (
        <div className="replay-view__event-detail replay-view__event-detail--highlight">
          <span>
            ⚔️ {truncateId(data?.attackerId)} 的生物攻擊 {truncateId(data?.targetId)} 的生物
            {data?.success !== undefined && (
              <strong>{data.success ? ' — 成功！' : ' — 失敗'}</strong>
            )}
          </span>
        </div>
      );
    case 'defense':
      return (
        <div className="replay-view__event-detail replay-view__event-detail--highlight">
          <span>
            🛡️ {truncateId(data?.defenderId)} 的生物使用 <strong>{data?.traitUsed}</strong> 防禦
            {data?.success !== undefined && (
              <strong>{data.success ? ' — 成功！' : ' — 失敗'}</strong>
            )}
          </span>
        </div>
      );
    case 'extinction':
      return (
        <div className="replay-view__event-detail replay-view__event-detail--danger">
          <span>
            💀 玩家 {truncateId(data?.playerId)} 的生物滅絕（原因：{data?.reason || '未知'}）
          </span>
        </div>
      );
    case 'phase_change':
      return (
        <div className="replay-view__event-detail">
          <span>
            ▸ 進入階段：<strong>{data?.phase}</strong>（第 {data?.round} 回合）
          </span>
        </div>
      );
    case 'food_reveal':
      return (
        <div className="replay-view__event-detail">
          <span>🍎 食物池：{data?.foodAmount} 個</span>
        </div>
      );
    case 'feeding':
      return (
        <div className="replay-view__event-detail">
          <span>
            玩家 {truncateId(data?.playerId)} 的生物進食（{data?.foodType}）
          </span>
        </div>
      );
    case 'game_end':
      return (
        <div className="replay-view__event-detail replay-view__event-detail--highlight">
          <span>🏆 遊戲結束！</span>
        </div>
      );
    default:
      return null;
  }
}

/**
 * 本草事件詳情渲染
 */
function HerbalismEventDetail({ event }) {
  if (!event) return null;
  const { type, data } = event;

  switch (type) {
    case 'ask_card':
      return (
        <div className="replay-view__event-detail">
          <span>
            玩家 {truncateId(data?.askingPlayerId)} 向 {truncateId(data?.targetPlayerId)} 問牌
            （第 {data?.round} 局）
          </span>
        </div>
      );
    case 'color_choice':
      return (
        <div className="replay-view__event-detail">
          <span>
            玩家 {truncateId(data?.targetPlayerId)} 給出{' '}
            <strong style={{ color: data?.chosenColor === 'red' ? '#f44' : data?.chosenColor }}>
              {data?.chosenColor}
            </strong>{' '}
            色牌
          </span>
        </div>
      );
    case 'guess_cards':
      return (
        <div className="replay-view__event-detail replay-view__event-detail--highlight">
          <span>
            🎯 玩家 {truncateId(data?.guessingPlayerId)} 猜測：
            <strong>{(data?.guessedColors || []).join('、')}</strong>
          </span>
        </div>
      );
    case 'guess_result':
      return (
        <div
          className={`replay-view__event-detail ${
            data?.isCorrect ? 'replay-view__event-detail--success' : 'replay-view__event-detail--danger'
          }`}
        >
          <span>
            {data?.isCorrect ? '✓ 猜對了！' : '✗ 猜錯了。'}
            {data?.hiddenCards && (
              <> 蓋牌：{data.hiddenCards.map((c) => c.color || c).join('、')}</>
            )}
          </span>
        </div>
      );
    case 'game_end':
      return (
        <div className="replay-view__event-detail replay-view__event-detail--highlight">
          <span>🏆 遊戲結束！</span>
          {data?.scores && (
            <ul className="replay-view__scores">
              {Object.entries(data.scores).map(([pid, score]) => (
                <li key={pid}>
                  {pid.slice(0, 8)}...: {score} 分
                </li>
              ))}
            </ul>
          )}
        </div>
      );
    default:
      return null;
  }
}

/**
 * 回放觀看頁面
 */
function ReplayViewPage() {
  const { gameId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const gameType = searchParams.get('type') || 'evolution';

  const [events, setEvents] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentEvent, setCurrentEvent] = useState(null);
  const [copied, setCopied] = useState(false);
  const [eventLog, setEventLog] = useState([]);

  const loadReplay = useCallback(async () => {
    if (!gameId) return;

    setLoading(true);
    setError('');

    try {
      const fetchFn = gameType === 'herbalism' ? getHerbalismReplay : getEvolutionReplay;
      const result = await fetchFn(gameId);

      if (result.success && result.data?.events) {
        setEvents(result.data.events);
      } else {
        setError('找不到回放資料');
      }
    } catch (err) {
      setError('載入回放失敗');
      console.error('[ReplayViewPage] 載入失敗:', err);
    } finally {
      setLoading(false);
    }
  }, [gameId, gameType]);

  useEffect(() => {
    loadReplay();
  }, [loadReplay]);

  const handleEventPlay = useCallback((event, index) => {
    setCurrentEvent(event);
    setEventLog((prev) => {
      const newLog = [...prev, { ...event, index }];
      return newLog.slice(-MAX_EVENT_LOG_SIZE);
    });
  }, []);

  const handleComplete = useCallback(() => {
    setCurrentEvent(null);
  }, []);

  const handleShare = useCallback(() => {
    const url = window.location.href;
    navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const handleBack = () => navigate(-1);

  const EventDetail = gameType === 'herbalism' ? HerbalismEventDetail : EvolutionEventDetail;
  const eventLabels = gameType === 'herbalism' ? HERBALISM_EVENT_LABELS : EVOLUTION_EVENT_LABELS;

  return (
    <div className="replay-view-page" data-testid="replay-view-page">
      <header className="replay-view__header">
        <button className="replay-view__back-btn" onClick={handleBack}>
          ← 返回
        </button>
        <div className="replay-view__title-area">
          <h1 className="replay-view__title">
            🎬 {gameType === 'herbalism' ? '本草' : '演化論'} 回放
          </h1>
          <span className="replay-view__game-id">#{gameId?.slice(-8)}</span>
        </div>
        <button
          className="replay-view__share-btn"
          onClick={handleShare}
          data-testid="share-btn"
        >
          {copied ? '✓ 已複製連結' : '🔗 分享'}
        </button>
      </header>

      <main className="replay-view__main">
        {loading && (
          <div className="replay-view__loading" data-testid="loading">
            載入回放中...
          </div>
        )}

        {!loading && error && (
          <div className="replay-view__error" data-testid="error-message">
            {error}
            <button onClick={loadReplay} className="replay-view__retry-btn">
              重試
            </button>
          </div>
        )}

        {!loading && !error && events && (
          <div className="replay-view__content">
            {/* 回放播放器 */}
            <section className="replay-view__player-section">
              <ReplayPlayer
                events={events}
                onEventPlay={handleEventPlay}
                onComplete={handleComplete}
                className="replay-view__player"
              />
            </section>

            {/* 當前事件詳情 */}
            {currentEvent && (
              <section className="replay-view__current-event" data-testid="current-event">
                <h3 className="replay-view__section-title">
                  {eventLabels[currentEvent.type] || currentEvent.type}
                </h3>
                <EventDetail event={currentEvent} />
              </section>
            )}

            {/* 事件日誌 */}
            {eventLog.length > 0 && (
              <section className="replay-view__event-log" data-testid="event-log">
                <h3 className="replay-view__section-title">事件記錄</h3>
                <ul className="replay-view__log-list">
                  {[...eventLog].reverse().map((ev, idx) => (
                    <li
                      key={idx}
                      className={`replay-view__log-item ${
                        ev.isKeyMoment ? 'replay-view__log-item--key' : ''
                      }`}
                    >
                      <span className="replay-view__log-index">#{ev.index + 1}</span>
                      <span className="replay-view__log-type">
                        {eventLabels[ev.type] || ev.type}
                      </span>
                      {ev.isKeyMoment && (
                        <span className="replay-view__log-key">⭐</span>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default ReplayViewPage;
