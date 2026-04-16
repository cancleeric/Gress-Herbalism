/**
 * 本草圖鑑頁面
 * Issue #63 - 本草圖鑑收藏系統
 *
 * 顯示所有藥草卡牌，含解鎖/未解鎖狀態與詳情 Modal
 */

import React, { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useAuth } from '../../firebase/AuthContext';
import {
  fetchPlayerCollection,
  fetchEncyclopediaEntry,
  selectEntry,
  clearSelectedEntry,
} from '../../store/collectionSlice';
import './HerbariumPage.css';

// 稀有度標籤
const RARITY_LABELS = {
  common: '普通',
  rare: '稀有',
  epic: '史詩',
};

const RARITY_COLORS = {
  common: '#78909c',
  rare: '#1565c0',
  epic: '#6a1b9a',
};

// 顏色對應的 CSS 類別
const HERB_COLOR_CLASS = {
  red: 'herb-red',
  yellow: 'herb-yellow',
  green: 'herb-green',
  blue: 'herb-blue',
};

// 顏色對應的中文名（備用，避免圖鑑載入前空白）
const HERB_COLOR_EMOJI = {
  red: '🌸',
  yellow: '🌼',
  green: '🌿',
  blue: '💙',
};

/**
 * 單張藥草卡牌組件
 */
function HerbCard({ entry, onSelect }) {
  const colorClass = HERB_COLOR_CLASS[entry.herb_id] || '';
  const emoji = HERB_COLOR_EMOJI[entry.herb_id] || '🌱';

  return (
    <div
      className={`herb-card ${colorClass} ${entry.unlocked ? 'unlocked' : 'locked'}`}
      onClick={() => entry.unlocked && onSelect(entry)}
      role="button"
      tabIndex={entry.unlocked ? 0 : -1}
      aria-label={entry.unlocked ? `查看 ${entry.name_zh} 詳情` : '尚未解鎖'}
      onKeyDown={(e) => e.key === 'Enter' && entry.unlocked && onSelect(entry)}
    >
      <div className="herb-card-icon">{entry.unlocked ? emoji : '🔒'}</div>
      <div className="herb-card-name">
        {entry.unlocked ? entry.name_zh : '???'}
      </div>
      {entry.unlocked && (
        <div
          className="herb-card-rarity"
          style={{ color: RARITY_COLORS[entry.rarity] || RARITY_COLORS.common }}
        >
          {RARITY_LABELS[entry.rarity] || entry.rarity}
        </div>
      )}
      {entry.unlocked && entry.useCount > 0 && (
        <div className="herb-card-use-count">×{entry.useCount}</div>
      )}
    </div>
  );
}

/**
 * 詳情 Modal 組件
 */
function HerbDetailModal({ entry, detail, loading, error, onClose }) {
  const emoji = HERB_COLOR_EMOJI[entry.herb_id] || '🌱';

  return (
    <div
      className="herb-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${entry.name_zh} 詳情`}
    >
      <div
        className="herb-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="herb-modal-close" onClick={onClose} aria-label="關閉">
          ✕
        </button>

        <div className="herb-modal-header">
          <span className="herb-modal-emoji">{emoji}</span>
          <div>
            <h2 className="herb-modal-name">{entry.name_zh}</h2>
            {detail && (
              <p className="herb-modal-latin">{detail.name_latin}</p>
            )}
          </div>
          {detail && (
            <span
              className="herb-modal-rarity-badge"
              style={{ backgroundColor: RARITY_COLORS[detail.rarity] || RARITY_COLORS.common }}
            >
              {RARITY_LABELS[detail.rarity] || detail.rarity}
            </span>
          )}
        </div>

        {loading && (
          <div className="herb-modal-loading">載入中...</div>
        )}

        {error && (
          <div className="herb-modal-error">{error}</div>
        )}

        {detail && !loading && (
          <div className="herb-modal-body">
            <section className="herb-modal-section">
              <h3>功效</h3>
              <p>{detail.effect_desc}</p>
            </section>
            <section className="herb-modal-section">
              <h3>遊戲效果</h3>
              <p>{detail.game_effect}</p>
            </section>
            <section className="herb-modal-section">
              <h3>歷史典故</h3>
              <p>{detail.history_note}</p>
            </section>
          </div>
        )}

        <div className="herb-modal-stats">
          <span>使用次數：{entry.useCount || 0} 次</span>
          {entry.unlockedAt && (
            <span>
              解鎖於：{new Date(entry.unlockedAt).toLocaleDateString('zh-TW')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * 本草圖鑑主頁面組件
 */
function HerbariumPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useAuth();

  const {
    entries,
    unlockedCount,
    totalCount,
    loading,
    error,
    selectedEntry,
    selectedHerbDetail,
    detailLoading,
    detailError,
  } = useSelector((state) => state.collection);

  // 初始載入收藏資料
  useEffect(() => {
    if (user?.uid) {
      dispatch(fetchPlayerCollection(user.uid));
    }
  }, [dispatch, user]);

  // 選取卡牌並載入詳情
  const handleSelectEntry = useCallback((entry) => {
    dispatch(selectEntry(entry));
    dispatch(fetchEncyclopediaEntry({
      herbId: entry.herb_id,
      firebaseUid: user?.uid,
    }));
  }, [dispatch, user]);

  const handleCloseModal = useCallback(() => {
    dispatch(clearSelectedEntry());
  }, [dispatch]);

  const progressPercentage = totalCount > 0
    ? Math.round((unlockedCount / totalCount) * 100)
    : 0;

  return (
    <div className="herbarium-page">
      {/* 頂部 */}
      <header className="herbarium-header">
        <button className="herbarium-back-btn" onClick={() => navigate(-1)}>
          ← 返回
        </button>
        <h1 className="herbarium-title">🌿 本草圖鑑</h1>
      </header>

      {/* 進度統計 */}
      <div className="herbarium-progress">
        <div className="herbarium-progress-text">
          已解鎖 <strong>{unlockedCount}</strong> / {totalCount} 種本草
        </div>
        <div className="herbarium-progress-bar">
          <div
            className="herbarium-progress-fill"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="herbarium-progress-pct">{progressPercentage}%</div>
      </div>

      {/* 載入中 */}
      {loading && (
        <div className="herbarium-loading">載入圖鑑中...</div>
      )}

      {/* 錯誤訊息 */}
      {error && !loading && (
        <div className="herbarium-error">
          <p>載入失敗：{error}</p>
          <button
            aria-label="重新載入圖鑑"
            onClick={() => user?.uid && dispatch(fetchPlayerCollection(user.uid))}
          >
            重試
          </button>
        </div>
      )}

      {/* 卡牌網格 */}
      {!loading && !error && (
        <div className="herbarium-grid">
          {entries.map((entry) => (
            <HerbCard
              key={entry.herb_id}
              entry={entry}
              onSelect={handleSelectEntry}
            />
          ))}
          {entries.length === 0 && (
            <div className="herbarium-empty">
              <p>尚無圖鑑資料，請先進行遊戲對局以解鎖藥草。</p>
            </div>
          )}
        </div>
      )}

      {/* 提示文字 */}
      {!loading && !error && unlockedCount < totalCount && (
        <p className="herbarium-hint">
          💡 參與遊戲對局，解鎖更多藥草圖鑑！
        </p>
      )}

      {/* 詳情 Modal */}
      {selectedEntry && (
        <HerbDetailModal
          entry={selectedEntry}
          detail={selectedHerbDetail}
          loading={detailLoading}
          error={detailError}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}

export default HerbariumPage;
