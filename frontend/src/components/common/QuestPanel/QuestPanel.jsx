/**
 * QuestPanel 每日任務面板
 * Issue #61 - 每日任務系統
 *
 * 顯示每日任務、簽到獎勵和任務進度
 */

import React, { useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useAuth } from '../../../firebase/AuthContext';
import {
  fetchDailyQuests,
  performCheckin,
  claimQuestReward,
  toggleQuestPanel,
  clearLastReward,
} from '../../../store/questSlice';
import './QuestPanel.css';

// 難度顯示對應
const DIFFICULTY_LABELS = {
  easy: '簡單',
  normal: '普通',
  hard: '困難',
};

const DIFFICULTY_COLORS = {
  easy: '#4caf50',
  normal: '#ff9800',
  hard: '#f44336',
};

// 任務類型顯示對應
const QUEST_TYPE_LABELS = {
  play_games: '完成對局',
  win_games: '贏得對局',
  win_streak: '連勝挑戰',
};

/**
 * 任務進度條組件
 */
function QuestProgressBar({ progress, target }) {
  const percentage = Math.min((progress / target) * 100, 100);
  return (
    <div className="quest-progress-bar">
      <div
        className="quest-progress-fill"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

/**
 * 單個任務卡片組件
 */
function QuestCard({ quest, onClaim, isClaiming }) {
  const isCompleted = quest.completed;
  const isClaimed = quest.reward_claimed;
  const difficultyColor = DIFFICULTY_COLORS[quest.difficulty] || '#9e9e9e';

  return (
    <div className={`quest-card ${isCompleted ? 'completed' : ''} ${isClaimed ? 'claimed' : ''}`}>
      <div className="quest-card-header">
        <span
          className="quest-difficulty-badge"
          style={{ backgroundColor: difficultyColor }}
        >
          {DIFFICULTY_LABELS[quest.difficulty] || quest.difficulty}
        </span>
        <span className="quest-type">{QUEST_TYPE_LABELS[quest.quest_type] || quest.quest_type}</span>
      </div>

      <div className="quest-description">
        {quest.difficulty === 'easy' && `完成 ${quest.target} 場對局`}
        {quest.difficulty === 'normal' && quest.quest_type === 'play_games' && `完成 ${quest.target} 場對局`}
        {quest.difficulty === 'normal' && quest.quest_type === 'win_games' && `贏得 ${quest.target} 場對局`}
        {quest.difficulty === 'hard' && quest.quest_type === 'win_games' && `贏得 ${quest.target} 場對局`}
        {quest.difficulty === 'hard' && quest.quest_type === 'win_streak' && `連勝 ${quest.target} 場`}
        {!['easy', 'normal', 'hard'].includes(quest.difficulty) && `進度 ${quest.progress}/${quest.target}`}
      </div>

      <QuestProgressBar progress={quest.progress} target={quest.target} />

      <div className="quest-card-footer">
        <span className="quest-progress-text">
          {quest.progress}/{quest.target}
        </span>
        <span className="quest-reward">🪙 {quest.reward_coins}</span>

        {isCompleted && !isClaimed && (
          <button
            className="quest-claim-btn"
            onClick={() => onClaim(quest.id)}
            disabled={isClaiming}
          >
            {isClaiming ? '領取中...' : '領取獎勵'}
          </button>
        )}
        {isClaimed && (
          <span className="quest-claimed-badge">✓ 已領取</span>
        )}
      </div>
    </div>
  );
}

/**
 * 簽到行事曆組件
 */
function CheckinCalendar({ thisMonthDates, streakCount, todayCheckedIn, onCheckin, isLoading }) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const dateSet = new Set(thisMonthDates);

  return (
    <div className="checkin-section">
      <div className="checkin-header">
        <span className="checkin-title">每日簽到</span>
        <span className="streak-badge">🔥 連續 {streakCount} 天</span>
      </div>

      <div className="checkin-calendar">
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isChecked = dateSet.has(dateStr);
          const isToday = day === today.getDate();

          return (
            <div
              key={day}
              className={`calendar-day ${isChecked ? 'checked' : ''} ${isToday ? 'today' : ''}`}
              title={dateStr}
            >
              {day}
            </div>
          );
        })}
      </div>

      {!todayCheckedIn && (
        <button
          className="checkin-btn"
          onClick={onCheckin}
          disabled={isLoading}
        >
          {isLoading ? '簽到中...' : '立即簽到'}
        </button>
      )}
      {todayCheckedIn && (
        <div className="checkin-done">✓ 今日已簽到</div>
      )}
    </div>
  );
}

/**
 * QuestPanel 主組件
 */
function QuestPanel() {
  const dispatch = useDispatch();
  const { user } = useAuth();

  const {
    quests,
    checkin,
    loading,
    checkinLoading,
    claimingQuestId,
    error,
    lastRewardCoins,
    lastCheckinCoins,
    isPanelOpen,
  } = useSelector((state) => state.quest);

  // 載入任務資料
  useEffect(() => {
    if (isPanelOpen && user?.uid) {
      dispatch(fetchDailyQuests(user.uid));
    }
  }, [dispatch, isPanelOpen, user]);

  // 自動清除獎勵提示
  useEffect(() => {
    if (lastRewardCoins !== null || lastCheckinCoins !== null) {
      const timer = setTimeout(() => dispatch(clearLastReward()), 3000);
      return () => clearTimeout(timer);
    }
  }, [dispatch, lastRewardCoins, lastCheckinCoins]);

  const handleCheckin = useCallback(() => {
    if (user?.uid) {
      dispatch(performCheckin(user.uid));
    }
  }, [dispatch, user]);

  const handleClaimReward = useCallback((questId) => {
    if (user?.uid) {
      dispatch(claimQuestReward({ questId, firebaseUid: user.uid }));
    }
  }, [dispatch, user]);

  const handleToggle = useCallback(() => {
    dispatch(toggleQuestPanel());
  }, [dispatch]);

  return (
    <div className={`quest-panel ${isPanelOpen ? 'open' : ''}`}>
      {/* 面板切換按鈕 */}
      <button className="quest-panel-toggle" onClick={handleToggle} title="每日任務">
        📋
        {quests.some(q => q.completed && !q.reward_claimed) && (
          <span className="quest-notification-dot" />
        )}
      </button>

      {/* 面板內容 */}
      {isPanelOpen && (
        <div className="quest-panel-content">
          <div className="quest-panel-header">
            <h3>每日任務</h3>
            <button className="quest-panel-close" onClick={handleToggle}>✕</button>
          </div>

          {/* 獎勵提示 */}
          {(lastRewardCoins !== null || lastCheckinCoins !== null) && (
            <div className="quest-reward-toast">
              🪙 +{lastRewardCoins || lastCheckinCoins} 金幣！
            </div>
          )}

          {/* 錯誤提示 */}
          {error && (
            <div className="quest-error">{error}</div>
          )}

          {/* 簽到區域 */}
          <CheckinCalendar
            thisMonthDates={checkin.thisMonthDates}
            streakCount={checkin.streakCount}
            todayCheckedIn={checkin.todayCheckedIn}
            onCheckin={handleCheckin}
            isLoading={checkinLoading}
          />

          {/* 任務列表 */}
          <div className="quest-list-section">
            <h4>今日任務</h4>
            {loading && <div className="quest-loading">載入中...</div>}
            {!loading && quests.length === 0 && (
              <div className="quest-empty">暫無任務，請稍後再試</div>
            )}
            {quests.map((quest) => (
              <QuestCard
                key={quest.id}
                quest={quest}
                onClaim={handleClaimReward}
                isClaiming={claimingQuestId === quest.id}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default QuestPanel;
