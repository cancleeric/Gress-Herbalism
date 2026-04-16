/**
 * 賽季 Banner 組件
 *
 * 顯示在大廳主頁的賽季資訊橫幅：
 * - 當前賽季名稱
 * - 玩家段位和 ELO
 * - 賽季倒計時
 * - 段位進度條
 *
 * 工單 0064 - 賽季聯賽系統
 *
 * @module components/common/SeasonBanner
 */

import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import TierBadge from '../TierBadge/TierBadge';
import { getCurrentSeason } from '../../../services/apiService';
import './SeasonBanner.css';

/**
 * 倒計時顯示組件
 */
function CountdownDisplay({ countdown }) {
  if (!countdown || countdown.ended) {
    return <span className="season-banner__countdown-ended">賽季已結束</span>;
  }

  const { days, hours, minutes, seconds } = countdown;

  return (
    <div className="season-banner__countdown" aria-label="賽季剩餘時間">
      {days > 0 && (
        <span className="season-banner__countdown-unit">
          <strong>{days}</strong> 天
        </span>
      )}
      <span className="season-banner__countdown-unit">
        <strong>{String(hours).padStart(2, '0')}</strong> 時
      </span>
      <span className="season-banner__countdown-unit">
        <strong>{String(minutes).padStart(2, '0')}</strong> 分
      </span>
      <span className="season-banner__countdown-unit">
        <strong>{String(seconds).padStart(2, '0')}</strong> 秒
      </span>
    </div>
  );
}

CountdownDisplay.propTypes = {
  countdown: PropTypes.shape({
    days: PropTypes.number,
    hours: PropTypes.number,
    minutes: PropTypes.number,
    seconds: PropTypes.number,
    ended: PropTypes.bool,
  }),
};

/**
 * 賽季 Banner 主組件
 *
 * @param {object} props
 * @param {string} [props.firebaseUid] - 當前玩家的 Firebase UID（用於取得個人段位）
 * @param {string} [props.className] - 額外 CSS 類名
 */
function SeasonBanner({ firebaseUid, className }) {
  const [seasonData, setSeasonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  /**
   * 載入賽季資料
   */
  const loadSeasonData = useCallback(async () => {
    try {
      const result = await getCurrentSeason(firebaseUid || null);
      if (result && result.success && result.data) {
        setSeasonData(result.data);
        setRemainingSeconds(result.data.remainingSeconds || 0);
        setCountdown(result.data.countdown);
      }
    } catch (err) {
      console.error('[SeasonBanner] 載入賽季資料失敗:', err);
    } finally {
      setLoading(false);
    }
  }, [firebaseUid]);

  useEffect(() => {
    loadSeasonData();
  }, [loadSeasonData]);

  /**
   * 倒計時計時器（每秒更新）
   */
  useEffect(() => {
    if (remainingSeconds <= 0) return;

    const timer = setInterval(() => {
      setRemainingSeconds(prev => {
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(timer);
          setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0, ended: true });
          return 0;
        }

        const days = Math.floor(next / 86400);
        const hours = Math.floor((next % 86400) / 3600);
        const minutes = Math.floor((next % 3600) / 60);
        const seconds = next % 60;
        setCountdown({ days, hours, minutes, seconds, ended: false });
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingSeconds]);

  if (loading) {
    return (
      <div className={`season-banner season-banner--loading ${className || ''}`}>
        <span>載入賽季資訊...</span>
      </div>
    );
  }

  if (!seasonData) {
    return null;
  }

  const { season, player } = seasonData;

  return (
    <div className={`season-banner ${className || ''}`}>
      {/* 賽季標題 */}
      <div className="season-banner__header">
        <span className="season-banner__season-icon">🏆</span>
        <span className="season-banner__season-name">{season.name}</span>
      </div>

      <div className="season-banner__body">
        {/* 玩家段位資訊 */}
        {player && (
          <div className="season-banner__player-info">
            <TierBadge
              tier={player.tier}
              progress={player.progress}
              elo={player.eloRating}
              showProgress
              size="md"
            />
            {player.rank && (
              <div className="season-banner__rank">
                賽季排名：<strong>#{player.rank}</strong>
              </div>
            )}
          </div>
        )}

        {/* 賽季倒計時 */}
        <div className="season-banner__timer">
          <span className="season-banner__timer-label">賽季結束倒計時</span>
          <CountdownDisplay countdown={countdown} />
        </div>
      </div>
    </div>
  );
}

SeasonBanner.propTypes = {
  firebaseUid: PropTypes.string,
  className: PropTypes.string,
};

export { SeasonBanner, CountdownDisplay };
export default SeasonBanner;
