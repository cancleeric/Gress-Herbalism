/**
 * 本草遊戲回放播放器
 *
 * 以步驟方式重播本草遊戲的每個動作
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import './HerbalismReplayPlayer.css';

/**
 * 事件類型常數（對應後端 HERBALISM_EVENT_TYPES）
 */
const EV = {
  GAME_START: 'game_start',
  ROUND_START: 'round_start',
  QUESTION: 'question',
  COLOR_CHOICE: 'color_choice',
  END_TURN: 'end_turn',
  GUESS: 'guess',
  FOLLOW_GUESS: 'follow_guess',
  ROUND_RESULT: 'round_result',
  GAME_END: 'game_end',
};

/**
 * 顏色標籤
 */
const COLOR_LABELS = {
  red: '🔴 紅',
  yellow: '🟡 黃',
  green: '🟢 綠',
  blue: '🔵 藍',
};

function colorLabel(c) {
  return COLOR_LABELS[c] || c;
}

/**
 * 將事件轉為人類可讀文字
 */
function describeEvent(event) {
  const d = event.data || {};
  switch (event.type) {
    case EV.GAME_START:
      return `遊戲開始！玩家：${(d.players || []).map(p => p.name).join('、')}（勝利分數：${d.winningScore || 7}分）`;
    case EV.ROUND_START:
      return `══ 第 ${d.round} 局開始，起始玩家：${d.startPlayerName} ══`;
    case EV.QUESTION: {
      const qType = d.questionType === 2 ? '兩色問牌' : '問牌';
      const colors = (d.colors || []).map(colorLabel).join('、');
      return `${d.playerName} 向 ${d.targetPlayerName} 出 ${qType}（${colors}）`;
    }
    case EV.COLOR_CHOICE: {
      const transferred = d.cardsTransferred || 0;
      if (d.chosenColor === 'none' || !d.chosenColor) {
        return `${d.playerName} 沒有相符的牌，未給出任何牌`;
      }
      return `${d.playerName} 選擇給出 ${colorLabel(d.chosenColor)}（共 ${transferred} 張）`;
    }
    case EV.END_TURN:
      if (d.prediction) {
        return `${d.playerName} 結束回合，預測蓋牌顏色為 ${colorLabel(d.prediction)}`;
      }
      return `${d.playerName} 結束回合（無預測）`;
    case EV.GUESS: {
      const guessed = (d.guessedColors || []).map(colorLabel).join('、');
      return `${d.playerName} 猜牌：${guessed}`;
    }
    case EV.FOLLOW_GUESS:
      return d.isFollowing
        ? `${d.playerName} 決定跟猜`
        : `${d.playerName} 決定不跟猜`;
    case EV.ROUND_RESULT: {
      const hidden = (d.hiddenColors || []).map(colorLabel).join('、');
      const guessed = (d.guessedColors || []).map(colorLabel).join('、');
      const followers = (d.followingPlayers || []).length;
      let text = `結果：${d.guessingPlayerName} 猜【${guessed}】，蓋牌為【${hidden}】`;
      text += d.isCorrect ? ' ✅ 猜對！' : ' ❌ 猜錯。';
      if (followers > 0) {
        text += `（${followers} 位玩家跟猜）`;
      }
      if (d.scoreChanges && Object.keys(d.scoreChanges).length > 0) {
        const changes = Object.entries(d.scoreChanges)
          .filter(([, v]) => v !== 0)
          .map(([pid, v]) => {
            const name = d.scores ? pid : pid;
            const sign = v > 0 ? '+' : '';
            return `${sign}${v}分`;
          });
        if (changes.length > 0) {
          text += ` 分數變化：${changes.join('、')}`;
        }
      }
      return text;
    }
    case EV.GAME_END: {
      const scores = d.scores || {};
      const scoreStr = Object.entries(scores)
        .map(([, score]) => `${score}分`)
        .join('、');
      return `🏁 遊戲結束！勝利者：${d.winnerName || '無'}（共 ${d.rounds} 局）${scoreStr ? `，最終分數：${scoreStr}` : ''}`;
    }
    default:
      return `[${event.type}]`;
  }
}

/**
 * 事件類型的 CSS 類別名
 */
function eventClass(type) {
  switch (type) {
    case EV.GAME_START: return 'ev--game-start';
    case EV.ROUND_START: return 'ev--round-start';
    case EV.QUESTION: return 'ev--question';
    case EV.COLOR_CHOICE: return 'ev--color-choice';
    case EV.END_TURN: return 'ev--end-turn';
    case EV.GUESS: return 'ev--guess';
    case EV.FOLLOW_GUESS: return 'ev--follow-guess';
    case EV.ROUND_RESULT: return 'ev--round-result';
    case EV.GAME_END: return 'ev--game-end';
    default: return '';
  }
}

const PLAYBACK_STATES = {
  IDLE: 'idle',
  PLAYING: 'playing',
  PAUSED: 'paused',
  FINISHED: 'finished',
};

const SPEED_OPTIONS = [0.5, 1, 2, 4];
const BASE_DELAY_MS = 1500;

/**
 * 本草遊戲回放播放器
 */
function HerbalismReplayPlayer({ replay, onClose }) {
  const events = replay?.events || [];
  const totalEvents = events.length;

  const [playbackState, setPlaybackState] = useState(PLAYBACK_STATES.IDLE);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [speed, setSpeed] = useState(1);
  const timerRef = useRef(null);
  const logEndRef = useRef(null);
  // Keep speed accessible inside callbacks without stale closure issues
  const speedRef = useRef(speed);
  useEffect(() => { speedRef.current = speed; }, [speed]);

  const visibleEvents = events.slice(0, currentIndex + 1);

  // Auto-scroll log to bottom
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentIndex]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const advanceIndex = useCallback((idx) => {
    const nextIdx = idx + 1;
    if (nextIdx >= totalEvents) {
      setPlaybackState(PLAYBACK_STATES.FINISHED);
      return;
    }
    setCurrentIndex(nextIdx);
    timerRef.current = setTimeout(() => advanceIndex(nextIdx), BASE_DELAY_MS / speedRef.current);
  }, [totalEvents]);

  const play = useCallback(() => {
    if (playbackState === PLAYBACK_STATES.FINISHED) {
      setCurrentIndex(-1);
      setPlaybackState(PLAYBACK_STATES.PLAYING);
      timerRef.current = setTimeout(() => advanceIndex(-1), BASE_DELAY_MS / speedRef.current);
    } else {
      setPlaybackState(PLAYBACK_STATES.PLAYING);
      timerRef.current = setTimeout(() => advanceIndex(currentIndex), BASE_DELAY_MS / speedRef.current);
    }
  }, [playbackState, currentIndex, advanceIndex]);

  const pause = useCallback(() => {
    clearTimer();
    setPlaybackState(PLAYBACK_STATES.PAUSED);
  }, [clearTimer]);

  const stop = useCallback(() => {
    clearTimer();
    setCurrentIndex(-1);
    setPlaybackState(PLAYBACK_STATES.IDLE);
  }, [clearTimer]);

  const stepForward = useCallback(() => {
    clearTimer();
    setPlaybackState(PLAYBACK_STATES.PAUSED);
    if (currentIndex < totalEvents - 1) {
      setCurrentIndex(i => i + 1);
    } else {
      setPlaybackState(PLAYBACK_STATES.FINISHED);
    }
  }, [clearTimer, currentIndex, totalEvents]);

  const stepBack = useCallback(() => {
    clearTimer();
    setPlaybackState(PLAYBACK_STATES.PAUSED);
    setCurrentIndex(i => Math.max(-1, i - 1));
  }, [clearTimer]);

  const seekTo = useCallback((idx) => {
    clearTimer();
    setPlaybackState(PLAYBACK_STATES.PAUSED);
    setCurrentIndex(Math.max(-1, Math.min(idx, totalEvents - 1)));
  }, [clearTimer, totalEvents]);

  const togglePlayPause = useCallback(() => {
    if (playbackState === PLAYBACK_STATES.PLAYING) {
      pause();
    } else {
      play();
    }
  }, [playbackState, play, pause]);

  // Cleanup on unmount
  useEffect(() => () => clearTimer(), [clearTimer]);

  const progress = totalEvents > 0 ? ((currentIndex + 1) / totalEvents) * 100 : 0;
  const isPlaying = playbackState === PLAYBACK_STATES.PLAYING;

  if (!replay) {
    return (
      <div className="herb-replay-player herb-replay-player--empty">
        <p>沒有回放資料</p>
      </div>
    );
  }

  return (
    <div className="herb-replay-player">
      {/* Header */}
      <div className="herb-replay-player__header">
        <div className="herb-replay-player__meta">
          <span className="herb-replay-player__meta-players">
            👥 {(replay.playerNames || []).join('、')}
          </span>
          {replay.winnerName && (
            <span className="herb-replay-player__meta-winner">
              🏆 {replay.winnerName}
            </span>
          )}
          {replay.roundsPlayed != null && (
            <span className="herb-replay-player__meta-rounds">
              共 {replay.roundsPlayed} 局
            </span>
          )}
        </div>
        {onClose && (
          <button className="herb-replay-player__close" onClick={onClose} aria-label="關閉">
            ✕
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div
        className="herb-replay-player__progress-wrap"
        onClick={e => {
          const rect = e.currentTarget.getBoundingClientRect();
          const pct = (e.clientX - rect.left) / rect.width;
          seekTo(Math.floor(pct * totalEvents) - 1);
        }}
        title="點擊跳轉"
      >
        <div className="herb-replay-player__progress-bar" style={{ width: `${progress}%` }} />
      </div>

      {/* Controls */}
      <div className="herb-replay-player__controls">
        <button
          className="herb-rp-btn"
          onClick={stepBack}
          disabled={currentIndex <= -1}
          title="上一步"
          aria-label="上一步"
        >
          ⏮
        </button>

        <button
          className="herb-rp-btn herb-rp-btn--primary"
          onClick={togglePlayPause}
          aria-label={isPlaying ? '暫停' : '播放'}
        >
          {isPlaying ? '⏸' : (playbackState === PLAYBACK_STATES.FINISHED ? '↺' : '▶')}
        </button>

        <button
          className="herb-rp-btn"
          onClick={stepForward}
          disabled={currentIndex >= totalEvents - 1}
          title="下一步"
          aria-label="下一步"
        >
          ⏭
        </button>

        <button
          className="herb-rp-btn"
          onClick={stop}
          title="重置"
          aria-label="重置"
        >
          ⏹
        </button>

        <span className="herb-replay-player__counter">
          {currentIndex + 1} / {totalEvents}
        </span>

        <div className="herb-replay-player__speed">
          <span className="herb-replay-player__speed-label">速度：</span>
          {SPEED_OPTIONS.map(s => (
            <button
              key={s}
              className={`herb-rp-speed-btn ${speed === s ? 'active' : ''}`}
              onClick={() => setSpeed(s)}
            >
              {s}×
            </button>
          ))}
        </div>
      </div>

      {/* Event log */}
      <div className="herb-replay-player__log">
        {currentIndex === -1 && (
          <div className="herb-replay-player__log-hint">
            按 ▶ 開始播放，或按 ⏭ 逐步查看每個動作。
          </div>
        )}
        {visibleEvents.map((event, idx) => (
          <div
            key={idx}
            className={`herb-replay-player__event ${eventClass(event.type)} ${idx === currentIndex ? 'current' : ''}`}
          >
            <span className="herb-replay-player__event-num">{idx + 1}.</span>
            <span className="herb-replay-player__event-text">{describeEvent(event)}</span>
          </div>
        ))}
        <div ref={logEndRef} />
      </div>

      {playbackState === PLAYBACK_STATES.FINISHED && (
        <div className="herb-replay-player__finished">
          回放結束 🎬
        </div>
      )}
    </div>
  );
}

HerbalismReplayPlayer.propTypes = {
  /** 回放資料物件，包含 events、playerNames、winnerName 等欄位 */
  replay: PropTypes.shape({
    gameId: PropTypes.string,
    events: PropTypes.arrayOf(
      PropTypes.shape({
        type: PropTypes.string.isRequired,
        data: PropTypes.object,
      })
    ),
    playerNames: PropTypes.arrayOf(PropTypes.string),
    winnerName: PropTypes.string,
    roundsPlayed: PropTypes.number,
  }),
  /** 關閉回調 */
  onClose: PropTypes.func,
};

export { PLAYBACK_STATES };
export default HerbalismReplayPlayer;
