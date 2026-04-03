/**
 * 遊戲回放播放器組件
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import './ReplayPlayer.css';

/**
 * 播放狀態
 */
const PLAYBACK_STATES = {
  IDLE: 'idle',
  PLAYING: 'playing',
  PAUSED: 'paused',
  FINISHED: 'finished',
};

/**
 * 播放速度選項
 */
const SPEED_OPTIONS = [0.5, 1, 1.5, 2, 4];

/**
 * 關鍵事件類型（精彩時刻）
 */
const KEY_EVENT_TYPES = new Set([
  'attack',
  'defense',
  'extinction',
  'game_end',
  'guess_result',
  'round_end',
]);

/**
 * 遊戲回放播放器
 */
function ReplayPlayer({ events, onEventPlay, onComplete, className }) {
  const [playbackState, setPlaybackState] = useState(PLAYBACK_STATES.IDLE);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [speed, setSpeed] = useState(1);
  const timerRef = useRef(null);

  const totalEvents = events?.length || 0;
  const progress = totalEvents > 0 ? (currentIndex / totalEvents) * 100 : 0;
  const currentEvent = events?.[currentIndex] || null;
  const isKeyMoment = currentEvent
    ? KEY_EVENT_TYPES.has(currentEvent.type) || currentEvent.isKeyMoment
    : false;

  // 預先計算關鍵時刻位置，避免每次渲染重算
  const keyMomentMarkers = React.useMemo(() => {
    if (!events) return [];
    return events
      .map((event, idx) => ({ idx, type: event.type, isKeyMoment: event.isKeyMoment }))
      .filter((item) => KEY_EVENT_TYPES.has(item.type) || item.isKeyMoment);
  }, [events]);

  /**
   * 播放下一個事件
   */
  const playNextEvent = useCallback(() => {
    if (currentIndex >= totalEvents - 1) {
      setPlaybackState(PLAYBACK_STATES.FINISHED);
      onComplete?.();
      return;
    }

    const nextIndex = currentIndex + 1;
    setCurrentIndex(nextIndex);

    const event = events[nextIndex];
    onEventPlay?.(event, nextIndex);

    // 計算下一個事件的延遲
    const currentTimestamp = events[currentIndex]?.timestamp || 0;
    const nextTimestamp = event?.timestamp || 0;
    const delay = Math.max((nextTimestamp - currentTimestamp) / speed, 50);

    timerRef.current = setTimeout(playNextEvent, delay);
  }, [currentIndex, totalEvents, events, speed, onEventPlay, onComplete]);

  /**
   * 開始播放
   */
  const play = useCallback(() => {
    if (playbackState === PLAYBACK_STATES.FINISHED) {
      setCurrentIndex(0);
    }
    setPlaybackState(PLAYBACK_STATES.PLAYING);
  }, [playbackState]);

  /**
   * 暫停播放
   */
  const pause = useCallback(() => {
    clearTimeout(timerRef.current);
    setPlaybackState(PLAYBACK_STATES.PAUSED);
  }, []);

  /**
   * 停止播放
   */
  const stop = useCallback(() => {
    clearTimeout(timerRef.current);
    setCurrentIndex(0);
    setPlaybackState(PLAYBACK_STATES.IDLE);
  }, []);

  /**
   * 跳轉到指定位置
   */
  const seekTo = useCallback(
    (index) => {
      const targetIndex = Math.max(0, Math.min(index, totalEvents - 1));
      setCurrentIndex(targetIndex);

      if (targetIndex < totalEvents - 1) {
        const event = events[targetIndex];
        onEventPlay?.(event, targetIndex);
      }
    },
    [totalEvents, events, onEventPlay]
  );

  /**
   * 上一步
   */
  const stepBackward = useCallback(() => {
    clearTimeout(timerRef.current);
    if (playbackState === PLAYBACK_STATES.PLAYING) {
      setPlaybackState(PLAYBACK_STATES.PAUSED);
    }
    seekTo(currentIndex - 1);
  }, [currentIndex, playbackState, seekTo]);

  /**
   * 下一步
   */
  const stepForward = useCallback(() => {
    clearTimeout(timerRef.current);
    if (playbackState === PLAYBACK_STATES.PLAYING) {
      setPlaybackState(PLAYBACK_STATES.PAUSED);
    }
    if (currentIndex >= totalEvents - 1) {
      setPlaybackState(PLAYBACK_STATES.FINISHED);
      onComplete?.();
    } else {
      seekTo(currentIndex + 1);
    }
  }, [currentIndex, totalEvents, playbackState, seekTo, onComplete]);

  /**
   * 切換播放/暫停
   */
  const togglePlayPause = useCallback(() => {
    if (playbackState === PLAYBACK_STATES.PLAYING) {
      pause();
    } else {
      play();
    }
  }, [playbackState, play, pause]);

  /**
   * 處理進度條點擊
   */
  const handleProgressClick = useCallback(
    (e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = clickX / rect.width;
      const targetIndex = Math.floor(percentage * totalEvents);
      seekTo(targetIndex);
    },
    [totalEvents, seekTo]
  );

  /**
   * 處理速度變更
   */
  const handleSpeedChange = useCallback((newSpeed) => {
    setSpeed(newSpeed);
  }, []);

  // 播放狀態變更時啟動/停止計時器
  useEffect(() => {
    if (playbackState === PLAYBACK_STATES.PLAYING && currentIndex === 0) {
      const event = events?.[0];
      onEventPlay?.(event, 0);
      timerRef.current = setTimeout(playNextEvent, 1000 / speed);
    } else if (playbackState === PLAYBACK_STATES.PLAYING) {
      timerRef.current = setTimeout(playNextEvent, 500 / speed);
    }

    return () => clearTimeout(timerRef.current);
  }, [playbackState, currentIndex, events, speed, playNextEvent, onEventPlay]);

  // 清理
  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  if (!events || events.length === 0) {
    return (
      <div className={`replay-player replay-player--empty ${className || ''}`}>
        <p>沒有回放資料</p>
      </div>
    );
  }

  return (
    <div className={`replay-player ${className || ''}`}>
      {/* 進度條 */}
      <div className="replay-player__progress" onClick={handleProgressClick}>
        <div
          className="replay-player__progress-bar"
          style={{ width: `${progress}%` }}
        />
        {/* 關鍵時刻標記 */}
        {keyMomentMarkers.map((marker) => (
          <div
            key={marker.idx}
            className="replay-player__key-marker"
            style={{ left: `${(marker.idx / totalEvents) * 100}%` }}
            title={marker.type}
          />
        ))}
      </div>

      {/* 控制列 */}
      <div className="replay-player__controls">
        {/* 上一步 */}
        <button
          className="replay-player__btn replay-player__btn--step"
          onClick={stepBackward}
          disabled={currentIndex === 0}
          aria-label="上一步"
        >
          ⏮
        </button>

        {/* 播放/暫停按鈕 */}
        <button
          className="replay-player__btn replay-player__btn--play"
          onClick={togglePlayPause}
          aria-label={playbackState === PLAYBACK_STATES.PLAYING ? '暫停' : '播放'}
        >
          {playbackState === PLAYBACK_STATES.PLAYING ? '⏸' : '▶'}
        </button>

        {/* 下一步 */}
        <button
          className="replay-player__btn replay-player__btn--step"
          onClick={stepForward}
          disabled={currentIndex >= totalEvents - 1}
          aria-label="下一步"
        >
          ⏭
        </button>

        {/* 停止按鈕 */}
        <button
          className="replay-player__btn replay-player__btn--stop"
          onClick={stop}
          aria-label="停止"
        >
          ⏹
        </button>

        {/* 事件計數 */}
        <span className="replay-player__counter">
          {currentIndex + 1} / {totalEvents}
        </span>

        {/* 速度控制 */}
        <div className="replay-player__speed">
          {SPEED_OPTIONS.map((s) => (
            <button
              key={s}
              className={`replay-player__speed-btn ${speed === s ? 'active' : ''}`}
              onClick={() => handleSpeedChange(s)}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* 當前事件資訊 */}
      {currentEvent && (
        <div className={`replay-player__event-info ${isKeyMoment ? 'replay-player__event-info--key' : ''}`}>
          <span className="replay-player__event-type">{currentEvent.type}</span>
          {isKeyMoment && <span className="replay-player__key-badge">⭐ 精彩時刻</span>}
        </div>
      )}
    </div>
  );
}

ReplayPlayer.propTypes = {
  /** 事件列表 */
  events: PropTypes.arrayOf(
    PropTypes.shape({
      type: PropTypes.string.isRequired,
      timestamp: PropTypes.number,
      data: PropTypes.object,
    })
  ),
  /** 事件播放回調 */
  onEventPlay: PropTypes.func,
  /** 播放完成回調 */
  onComplete: PropTypes.func,
  /** 額外的 CSS 類名 */
  className: PropTypes.string,
};

export { ReplayPlayer, PLAYBACK_STATES, SPEED_OPTIONS, KEY_EVENT_TYPES };
export default ReplayPlayer;
