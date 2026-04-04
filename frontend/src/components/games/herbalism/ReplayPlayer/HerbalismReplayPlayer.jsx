/**
 * 本草遊戲回放播放器組件
 */

import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import ReplayPlayer from '../../evolution/replay/ReplayPlayer';
import './HerbalismReplayPlayer.css';

const COLOR_NAMES = {
  red: '紅色',
  yellow: '黃色',
  green: '綠色',
  blue: '藍色',
  none: '無',
};

const EVENT_LABELS = {
  game_start: '遊戲開始',
  question: '問牌',
  color_choice: '給牌',
  prediction: '預測',
  guess: '猜牌',
  follow_guess: '跟猜',
  round_end: '局結束',
  game_end: '遊戲結束',
};

/**
 * 顏色標籤組件
 */
function ColorTag({ color }) {
  const name = COLOR_NAMES[color] || color;
  return (
    <span className={`herbalism-replay__color-tag herbalism-replay__color-tag--${color || 'none'}`}>
      {name}
    </span>
  );
}

ColorTag.propTypes = {
  color: PropTypes.string,
};

/**
 * 依事件類型渲染事件描述
 */
function renderEventDescription(event, playerNames) {
  if (!event) return '—';

  const { type, data } = event;

  const getName = (id) => playerNames[id] || id;

  switch (type) {
    case 'game_start':
      return `遊戲開始，共 ${data.playerCount} 位玩家`;

    case 'question': {
      const colors = (data.colors || []).map((c) => <ColorTag key={c} color={c} />);
      return (
        <span>
          {getName(data.askingPlayerId)} 向 {getName(data.targetPlayerId)} 問{colors}
        </span>
      );
    }

    case 'color_choice':
      return (
        <span>
          {getName(data.targetPlayerId)} 給出{' '}
          <ColorTag color={data.chosenColor} />（共 {data.cardsTransferred} 張）
        </span>
      );

    case 'prediction':
      return (
        <span>
          {getName(data.playerId)} 預測蓋牌為 <ColorTag color={data.color} />
        </span>
      );

    case 'guess': {
      const guessColors = (data.guessedColors || []).map((c) => <ColorTag key={c} color={c} />);
      return (
        <span>
          {getName(data.playerId)} 猜{guessColors}
          {' — '}
          <strong style={{ color: data.isCorrect ? '#4caf50' : '#e74c3c' }}>
            {data.isCorrect ? '猜對！' : '猜錯'}
          </strong>
        </span>
      );
    }

    case 'follow_guess':
      return (
        <span>
          {getName(data.playerId)}{' '}
          <strong style={{ color: data.isFollowing ? '#4caf50' : '#e74c3c' }}>
            {data.isFollowing ? '跟猜' : '不跟猜'}
          </strong>
        </span>
      );

    case 'round_end': {
      const roundScores = Object.entries(data.scores || {})
        .map(([id, score]) => `${getName(id)}: ${score}`)
        .join('、');
      return `第 ${data.round} 局結束 — 分數：${roundScores}`;
    }

    case 'game_end': {
      const finalScores = Object.entries(data.scores || {})
        .map(([id, score]) => `${getName(id)}: ${score}`)
        .join('、');
      return (
        <span>
          遊戲結束 — 勝者：
          <strong style={{ color: '#f1c40f' }}>{getName(data.winner)}</strong>
          {' | '}最終分數：{finalScores}
        </span>
      );
    }

    default:
      return type;
  }
}

/**
 * 從 GAME_START 事件中提取玩家名稱對應表
 */
function buildPlayerNames(events) {
  const names = {};
  const startEvent = events.find((e) => e.type === 'game_start');
  if (startEvent && startEvent.data.players) {
    startEvent.data.players.forEach((p) => {
      names[p.id] = p.name;
    });
  }
  return names;
}

/**
 * 本草遊戲回放播放器
 */
function HerbalismReplayPlayer({ events, onComplete, className }) {
  const [currentEvent, setCurrentEvent] = useState(events?.[0] || null);
  const playerNames = events ? buildPlayerNames(events) : {};

  const handleEventPlay = useCallback(
    (event) => {
      setCurrentEvent(event);
    },
    []
  );

  if (!events || events.length === 0) {
    return (
      <div className={`herbalism-replay herbalism-replay--empty ${className || ''}`}>
        <p>沒有回放資料</p>
      </div>
    );
  }

  const roundEvent = events.find((e) => e.type === 'game_start');
  const currentRound =
    currentEvent?.type === 'round_end' || currentEvent?.type === 'game_end'
      ? currentEvent?.data?.round
      : roundEvent?.data?.round;

  return (
    <div className={`herbalism-replay ${className || ''}`}>
      <h3 className="herbalism-replay__title">🌿 本草 — 對局回放</h3>

      {currentRound != null && (
        <div className="herbalism-replay__round">第 {currentRound} 局</div>
      )}

      {/* 當前事件面板 */}
      <div className="herbalism-replay__event-panel">
        <div className="herbalism-replay__event-label">
          {currentEvent ? EVENT_LABELS[currentEvent.type] || currentEvent.type : '等待開始'}
        </div>
        <div className="herbalism-replay__event-content">
          {renderEventDescription(currentEvent, playerNames)}
        </div>
      </div>

      {/* 通用回放播放器控制列 */}
      <ReplayPlayer
        events={events}
        onEventPlay={handleEventPlay}
        onComplete={onComplete}
      />
    </div>
  );
}

HerbalismReplayPlayer.propTypes = {
  /** 回放事件列表 */
  events: PropTypes.arrayOf(
    PropTypes.shape({
      type: PropTypes.string.isRequired,
      timestamp: PropTypes.number,
      data: PropTypes.object,
    })
  ),
  /** 播放完成回調 */
  onComplete: PropTypes.func,
  /** 額外的 CSS 類名 */
  className: PropTypes.string,
};

export default HerbalismReplayPlayer;
