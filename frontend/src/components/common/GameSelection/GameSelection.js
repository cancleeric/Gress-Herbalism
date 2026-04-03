/**
 * 遊戲選擇頁面
 *
 * @module GameSelection
 * @description 登入後的遊戲選擇頁面
 * 工單 0276
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../firebase/AuthContext';
import './GameSelection.css';

const LANGUAGES = [
  { code: 'zh-TW', label: '繁中' },
  { code: 'zh-CN', label: '简中' },
  { code: 'en', label: 'EN' },
  { code: 'ja', label: '日本語' },
];

/**
 * 遊戲選擇頁面組件
 */
function GameSelection() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();

  const displayName = user?.isAnonymous ? t('common.guest') : (user?.displayName || user?.email?.split('@')[0] || t('common.guest'));

  /**
   * 處理遊戲選擇
   */
  const handleSelectGame = (gameType) => {
    if (gameType === 'herbalism') {
      navigate('/lobby/herbalism');
    } else if (gameType === 'evolution') {
      navigate('/lobby/evolution');
    }
  };

  /**
   * 處理登出
   */
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('登出失敗:', error);
    }
  };

  return (
    <div className="game-selection">
      {/* 頂部欄 */}
      <header className="gs-header">
        <div className="gs-user-info">
          {user?.photoURL ? (
            <img
              className="gs-avatar"
              src={user.photoURL}
              alt={displayName}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="gs-avatar-placeholder">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="gs-username">{displayName}</span>
        </div>
        <div className="gs-header-actions">
          <div className="gs-language-switcher">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                className={`gs-lang-btn${i18n.language === lang.code ? ' active' : ''}`}
                onClick={() => i18n.changeLanguage(lang.code)}
                aria-label={lang.label}
              >
                {lang.label}
              </button>
            ))}
          </div>
          <button className="gs-logout-btn" onClick={handleLogout}>
            {t('common.logout')}
          </button>
        </div>
      </header>

      {/* 主內容 */}
      <main className="gs-main">
        <h1 className="gs-title">{t('game_selection.title')}</h1>
        <p className="gs-subtitle">{t('game_selection.subtitle')}</p>

        <div className="gs-games">
          {/* 本草 */}
          <div
            className="gs-game-card herbalism"
            onClick={() => handleSelectGame('herbalism')}
          >
            <div className="gs-game-icon">🌿</div>
            <h2 className="gs-game-title">{t('game_selection.herbalism_title')}</h2>
            <p className="gs-game-desc">
              {t('game_selection.herbalism_desc')}
              <br />
              {t('game_selection.herbalism_desc2')}
            </p>
            <div className="gs-game-info">
              <span>{t('game_selection.herbalism_players')}</span>
              <span>{t('game_selection.herbalism_duration')}</span>
            </div>
          </div>

          {/* 演化論 */}
          <div
            className="gs-game-card evolution"
            onClick={() => handleSelectGame('evolution')}
          >
            <div className="gs-game-icon">🦎</div>
            <h2 className="gs-game-title">{t('game_selection.evolution_title')}</h2>
            <p className="gs-game-desc">
              {t('game_selection.evolution_desc')}
              <br />
              {t('game_selection.evolution_desc2')}
            </p>
            <div className="gs-game-info">
              <span>{t('game_selection.evolution_players')}</span>
              <span>{t('game_selection.evolution_duration')}</span>
            </div>
          </div>
        </div>

        {/* 底部導航 */}
        <div className="gs-nav">
          <button
            className="gs-nav-btn"
            onClick={() => navigate('/profile')}
          >
            <span className="material-symbols-outlined">person</span>
            {t('game_selection.profile')}
          </button>
          <button
            className="gs-nav-btn"
            onClick={() => navigate('/friends')}
          >
            <span className="material-symbols-outlined">group</span>
            {t('game_selection.friends')}
          </button>
          <button
            className="gs-nav-btn"
            onClick={() => navigate('/leaderboard')}
          >
            <span className="material-symbols-outlined">leaderboard</span>
            {t('game_selection.leaderboard')}
          </button>
        </div>
      </main>
    </div>
  );
}

export default GameSelection;
