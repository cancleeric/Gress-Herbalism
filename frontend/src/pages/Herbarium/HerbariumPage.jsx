/**
 * 本草百科頁面
 * Issue #63 - 本草百科集收藏系統
 *
 * 顯示所有草藥卡牌，標示解鎖/鎖定狀態，並提供詳情查看。
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../firebase/AuthContext';
import {
  fetchEncyclopedia,
  fetchPlayerCollection,
  selectHerb,
  clearSelectedHerb,
} from '../../store/collectionSlice';
import './HerbariumPage.css';

// 稀有度顯示對應
const RARITY_LABELS = {
  common: '常見',
  uncommon: '少見',
  rare: '稀有',
  legendary: '傳奇',
};

const RARITY_COLORS = {
  common: '#78909c',
  uncommon: '#43a047',
  rare: '#1e88e5',
  legendary: '#f9a825',
};

// 草藥顏色代碼對應
const HERB_COLOR_MAP = {
  red: '#e53935',
  yellow: '#f9a825',
  green: '#43a047',
  blue: '#1e88e5',
};

/**
 * 草藥卡牌組件
 */
function HerbCard({ herb, isUnlocked, timesSeen, onClick }) {
  const rarityColor = RARITY_COLORS[herb.rarity] || RARITY_COLORS.common;
  const herbColor = HERB_COLOR_MAP[herb.herb_id] || '#9e9e9e';

  return (
    <div
      className={`herb-card ${isUnlocked ? 'unlocked' : 'locked'}`}
      onClick={() => isUnlocked && onClick(herb)}
      style={{ '--herb-color': herbColor, '--rarity-color': rarityColor }}
      title={isUnlocked ? herb.name_zh : '尚未解鎖'}
    >
      <div className="herb-card-color-band" />
      <div className="herb-card-body">
        {isUnlocked ? (
          <>
            <div className="herb-card-name">{herb.name_zh}</div>
            <div className="herb-card-scientific">{herb.scientific_name}</div>
            <div
              className="herb-card-rarity"
              style={{ color: rarityColor }}
            >
              {RARITY_LABELS[herb.rarity] || herb.rarity}
            </div>
            {timesSeen > 0 && (
              <div className="herb-card-seen">已見過 {timesSeen} 次</div>
            )}
          </>
        ) : (
          <>
            <div className="herb-card-lock-icon">🔒</div>
            <div className="herb-card-unlock-hint">
              {herb.unlock_condition === 'games_played'
                ? `完成 ${herb.unlock_threshold} 場遊戲`
                : `贏得 ${herb.unlock_threshold} 場遊戲`}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * 草藥詳情面板組件
 */
function HerbDetailPanel({ herb, onClose }) {
  if (!herb) return null;
  const herbColor = HERB_COLOR_MAP[herb.herb_id] || '#9e9e9e';
  const rarityColor = RARITY_COLORS[herb.rarity] || RARITY_COLORS.common;

  return (
    <div className="herb-detail-overlay" onClick={onClose}>
      <div
        className="herb-detail-panel"
        onClick={(e) => e.stopPropagation()}
        style={{ '--herb-color': herbColor }}
      >
        <button className="herb-detail-close" onClick={onClose}>✕</button>
        <div className="herb-detail-header">
          <div className="herb-detail-color-dot" style={{ background: herbColor }} />
          <div>
            <h2 className="herb-detail-name">{herb.name_zh}</h2>
            <p className="herb-detail-scientific">{herb.scientific_name}</p>
          </div>
          <span
            className="herb-detail-rarity-badge"
            style={{ background: rarityColor }}
          >
            {RARITY_LABELS[herb.rarity] || herb.rarity}
          </span>
        </div>

        <div className="herb-detail-section">
          <h3>簡介</h3>
          <p>{herb.description}</p>
        </div>

        <div className="herb-detail-section">
          <h3>藥性</h3>
          <p>{herb.properties}</p>
        </div>

        <div className="herb-detail-section">
          <h3>用途</h3>
          <p>{herb.uses}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * 收藏進度條組件
 */
function CollectionProgressBar({ progress }) {
  return (
    <div className="collection-progress">
      <div className="collection-progress-label">
        <span>收藏進度</span>
        <span>{progress.unlocked} / {progress.total}</span>
      </div>
      <div className="collection-progress-bar">
        <div
          className="collection-progress-fill"
          style={{ width: `${progress.percentage}%` }}
        />
      </div>
      <div className="collection-progress-pct">{progress.percentage}%</div>
    </div>
  );
}

/**
 * 本草百科主頁面
 */
function HerbariumPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useAuth();

  const {
    encyclopedia,
    collection,
    progress,
    selectedHerb,
    encyclopediaLoading,
    collectionLoading,
    error,
  } = useSelector((state) => state.collection);

  const [filterUnlocked, setFilterUnlocked] = useState('all');

  // 建立已解鎖的 herbId → 詳細收藏資訊 的映射
  const collectionMap = {};
  for (const entry of collection) {
    collectionMap[entry.herb_id] = entry;
  }

  const loadData = useCallback(() => {
    dispatch(fetchEncyclopedia());
    if (user && !user.isAnonymous) {
      dispatch(fetchPlayerCollection(user.uid));
    }
  }, [dispatch, user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleHerbClick = (herb) => {
    dispatch(selectHerb(herb));
  };

  const handleCloseDetail = () => {
    dispatch(clearSelectedHerb());
  };

  const filteredHerbs = encyclopedia.filter((herb) => {
    const isUnlocked = !!collectionMap[herb.herb_id];
    if (filterUnlocked === 'unlocked') return isUnlocked;
    if (filterUnlocked === 'locked') return !isUnlocked;
    return true;
  });

  const isLoading = encyclopediaLoading || collectionLoading;

  return (
    <div className="herbarium-page">
      {/* 頂部欄 */}
      <header className="herbarium-header">
        <button className="herbarium-back-btn" onClick={() => navigate('/')}>
          ← 返回
        </button>
        <h1 className="herbarium-title">🌿 本草百科</h1>
        <div className="herbarium-header-spacer" />
      </header>

      {/* 收藏進度 */}
      {!user?.isAnonymous && (
        <div className="herbarium-progress-section">
          <CollectionProgressBar progress={progress} />
        </div>
      )}

      {/* 篩選器 */}
      <div className="herbarium-filter">
        <button
          className={`filter-btn ${filterUnlocked === 'all' ? 'active' : ''}`}
          onClick={() => setFilterUnlocked('all')}
        >
          全部
        </button>
        <button
          className={`filter-btn ${filterUnlocked === 'unlocked' ? 'active' : ''}`}
          onClick={() => setFilterUnlocked('unlocked')}
        >
          已解鎖
        </button>
        <button
          className={`filter-btn ${filterUnlocked === 'locked' ? 'active' : ''}`}
          onClick={() => setFilterUnlocked('locked')}
        >
          未解鎖
        </button>
      </div>

      {/* 內容區 */}
      {isLoading ? (
        <div className="herbarium-loading">載入中...</div>
      ) : error ? (
        <div className="herbarium-error">
          <p>載入失敗：{error}</p>
          <button onClick={loadData}>重試</button>
        </div>
      ) : (
        <div className="herb-grid">
          {filteredHerbs.length === 0 ? (
            <p className="herbarium-empty">沒有符合條件的草藥</p>
          ) : (
            filteredHerbs.map((herb) => (
              <HerbCard
                key={herb.herb_id}
                herb={herb}
                isUnlocked={!!collectionMap[herb.herb_id]}
                timesSeen={collectionMap[herb.herb_id]?.times_seen || 0}
                onClick={handleHerbClick}
              />
            ))
          )}
        </div>
      )}

      {/* 草藥詳情面板 */}
      {selectedHerb && (
        <HerbDetailPanel herb={selectedHerb} onClose={handleCloseDetail} />
      )}

      {/* 訪客提示 */}
      {user?.isAnonymous && (
        <div className="herbarium-guest-notice">
          💡 登入後即可追蹤你的收藏進度
        </div>
      )}
    </div>
  );
}

export default HerbariumPage;
