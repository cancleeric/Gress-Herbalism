# 工作單 0087

**日期：** 2026-01-25

**工作單標題：** 個人資料頁面實作

**工單主旨：** 功能開發 - 實作玩家個人資料頁面，顯示統計數據與遊戲歷史

**相關工單：** 0059, 0060

**依賴工單：** 0059（Firebase Auth）, 0060（分數保存系統）

---

## 一、功能概述

### 1.1 頁面目標

讓登入的玩家查看自己的：
- 基本資料（頭像、暱稱、Email）
- 遊戲統計（總場數、勝場、勝率、總分、最高分）
- 最近遊戲記錄

### 1.2 頁面設計稿

```
┌─────────────────────────────────────────────────────────────────┐
│                        個人資料                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│     ┌─────────┐                                                 │
│     │  頭像   │    小明                                         │
│     │ (80px)  │    ming@example.com                            │
│     └─────────┘    [編輯資料]                                   │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                      遊戲統計                                    │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │   42    │ │   28    │ │  66.7%  │ │   156   │ │   12    │   │
│  │ 總場數  │ │  勝場   │ │  勝率   │ │  總分   │ │ 最高分  │   │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘   │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                     最近遊戲記錄                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🏆  2026-01-25 14:30   4人遊戲   3局   得分: 7          │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 💔  2026-01-25 13:00   3人遊戲   5局   得分: 4          │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🏆  2026-01-24 20:15   4人遊戲   2局   得分: 7          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│                    [載入更多]                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 二、前端實作

### 2.1 組件結構

```
frontend/src/components/Profile/
├── index.js
├── ProfilePage.js          // 主頁面
├── ProfilePage.css         // 樣式
├── ProfileHeader.js        // 頭像與基本資料
├── StatsCard.js           // 統計卡片
├── GameHistoryList.js     // 遊戲歷史列表
└── EditProfileModal.js    // 編輯資料彈窗
```

### 2.2 ProfilePage.js

```jsx
/**
 * 個人資料頁面
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getMyStats, getMyHistory, updateProfile } from '../../services/apiService';
import ProfileHeader from './ProfileHeader';
import StatsCard from './StatsCard';
import GameHistoryList from './GameHistoryList';
import EditProfileModal from './EditProfileModal';
import './ProfilePage.css';

function ProfilePage({ onBack }) {
  const { user } = useAuth();

  // 狀態
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);

  // 載入資料
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [statsData, historyData] = await Promise.all([
        getMyStats(),
        getMyHistory(1, 10),
      ]);

      setStats(statsData);
      setHistory(historyData.records || []);
      setHasMoreHistory(historyData.hasMore || false);
    } catch (err) {
      console.error('載入資料失敗:', err);
      setError('載入資料失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  // 載入更多歷史
  const loadMoreHistory = async () => {
    try {
      const nextPage = historyPage + 1;
      const historyData = await getMyHistory(nextPage, 10);

      setHistory(prev => [...prev, ...(historyData.records || [])]);
      setHistoryPage(nextPage);
      setHasMoreHistory(historyData.hasMore || false);
    } catch (err) {
      console.error('載入更多失敗:', err);
    }
  };

  // 處理編輯
  const handleEditSubmit = async (newData) => {
    try {
      await updateProfile(newData);
      setShowEditModal(false);
      // 重新載入資料
      loadData();
    } catch (err) {
      console.error('更新失敗:', err);
      throw err;
    }
  };

  // 錯誤狀態
  if (error) {
    return (
      <div className="profile-page error">
        <p>{error}</p>
        <button onClick={loadData}>重試</button>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {/* 返回按鈕 */}
      <button className="back-btn" onClick={onBack}>
        ← 返回
      </button>

      {/* 標題 */}
      <h1 className="page-title">個人資料</h1>

      {loading ? (
        <div className="loading">載入中...</div>
      ) : (
        <>
          {/* 頭像與基本資料 */}
          <ProfileHeader
            user={user}
            onEdit={() => setShowEditModal(true)}
          />

          {/* 遊戲統計 */}
          <section className="stats-section">
            <h2>遊戲統計</h2>
            <div className="stats-grid">
              <StatsCard
                label="總場數"
                value={stats?.total_games || 0}
              />
              <StatsCard
                label="勝場"
                value={stats?.total_wins || 0}
                highlight={stats?.total_wins > 0}
              />
              <StatsCard
                label="勝率"
                value={`${stats?.win_rate || 0}%`}
                highlight={stats?.win_rate >= 50}
              />
              <StatsCard
                label="總分"
                value={stats?.total_score || 0}
              />
              <StatsCard
                label="最高分"
                value={stats?.highest_score || 0}
                highlight
              />
            </div>
          </section>

          {/* 遊戲歷史 */}
          <section className="history-section">
            <h2>最近遊戲記錄</h2>
            <GameHistoryList
              records={history}
              onLoadMore={hasMoreHistory ? loadMoreHistory : null}
            />
          </section>
        </>
      )}

      {/* 編輯資料彈窗 */}
      <EditProfileModal
        isOpen={showEditModal}
        user={user}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleEditSubmit}
      />
    </div>
  );
}

export default ProfilePage;
```

### 2.3 ProfileHeader.js

```jsx
/**
 * 個人資料頭部 - 頭像與基本資訊
 */

import React from 'react';
import PropTypes from 'prop-types';
import './ProfileHeader.css';

function ProfileHeader({ user, onEdit }) {
  return (
    <div className="profile-header">
      <div className="avatar-container">
        <img
          src={user?.photoURL || '/images/default-avatar.png'}
          alt="頭像"
          className="avatar"
        />
        {user?.isAnonymous && (
          <span className="guest-badge">訪客</span>
        )}
      </div>

      <div className="user-info">
        <h2 className="display-name">
          {user?.displayName || '玩家'}
        </h2>
        {user?.email && (
          <p className="email">{user.email}</p>
        )}
        {user?.isAnonymous && (
          <p className="anonymous-hint">
            訪客帳號無法保存遊戲記錄
          </p>
        )}
      </div>

      {!user?.isAnonymous && (
        <button
          className="edit-btn"
          onClick={onEdit}
        >
          編輯資料
        </button>
      )}
    </div>
  );
}

ProfileHeader.propTypes = {
  user: PropTypes.object,
  onEdit: PropTypes.func,
};

export default ProfileHeader;
```

### 2.4 StatsCard.js

```jsx
/**
 * 統計卡片組件
 */

import React from 'react';
import PropTypes from 'prop-types';
import './StatsCard.css';

function StatsCard({ label, value, highlight = false }) {
  return (
    <div className={`stats-card ${highlight ? 'highlight' : ''}`}>
      <span className="stats-value">{value}</span>
      <span className="stats-label">{label}</span>
    </div>
  );
}

StatsCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  highlight: PropTypes.bool,
};

export default StatsCard;
```

### 2.5 GameHistoryList.js

```jsx
/**
 * 遊戲歷史列表
 */

import React from 'react';
import PropTypes from 'prop-types';
import './GameHistoryList.css';

function GameHistoryList({ records, onLoadMore }) {
  if (records.length === 0) {
    return (
      <div className="no-history">
        <p>還沒有遊戲記錄</p>
        <p className="hint">快去玩一場吧！</p>
      </div>
    );
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="history-list">
      {records.map((record, index) => (
        <div
          key={record.id || index}
          className={`history-item ${record.is_winner ? 'win' : 'lose'}`}
        >
          <span className="result-icon">
            {record.is_winner ? '🏆' : '💔'}
          </span>

          <div className="record-info">
            <span className="record-date">
              {formatDate(record.created_at)}
            </span>
            <span className="record-details">
              {record.game_records?.player_count || '?'}人遊戲 ·
              {record.game_records?.rounds_played || '?'}局
            </span>
          </div>

          <div className="record-score">
            <span className="score-label">得分</span>
            <span className="score-value">{record.final_score}</span>
          </div>
        </div>
      ))}

      {onLoadMore && (
        <button className="load-more-btn" onClick={onLoadMore}>
          載入更多
        </button>
      )}
    </div>
  );
}

GameHistoryList.propTypes = {
  records: PropTypes.array.isRequired,
  onLoadMore: PropTypes.func,
};

export default GameHistoryList;
```

---

## 三、後端 API

### 3.1 API 端點

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/api/players/me/stats` | 取得當前玩家統計 |
| GET | `/api/players/me/history` | 取得遊戲歷史 |
| PUT | `/api/players/me` | 更新玩家資料 |

### 3.2 API 回應格式

**GET /api/players/me/stats**

```json
{
  "total_games": 42,
  "total_wins": 28,
  "win_rate": 66.67,
  "total_score": 156,
  "highest_score": 12
}
```

**GET /api/players/me/history?page=1&limit=10**

```json
{
  "records": [
    {
      "id": 123,
      "final_score": 7,
      "is_winner": true,
      "created_at": "2026-01-25T14:30:00Z",
      "game_records": {
        "player_count": 4,
        "rounds_played": 3
      }
    }
  ],
  "hasMore": true,
  "total": 42
}
```

---

## 四、測試案例

### 4.1 頁面載入

```javascript
describe('ProfilePage 載入', () => {
  test('成功載入統計資料', async () => {
    render(<ProfilePage />);
    await waitFor(() => {
      expect(screen.getByText('遊戲統計')).toBeInTheDocument();
    });
  });

  test('成功載入遊戲歷史', async () => {
    render(<ProfilePage />);
    await waitFor(() => {
      expect(screen.getByText('最近遊戲記錄')).toBeInTheDocument();
    });
  });

  test('載入失敗時顯示錯誤', async () => {
    mockApi.getMyStats.mockRejectedValue(new Error('Network error'));
    render(<ProfilePage />);
    await waitFor(() => {
      expect(screen.getByText(/載入資料失敗/)).toBeInTheDocument();
    });
  });
});
```

### 4.2 統計顯示

```javascript
describe('統計卡片', () => {
  test('正確顯示統計數據', () => {
    render(<StatsCard label="總場數" value={42} />);
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('總場數')).toBeInTheDocument();
  });

  test('勝率正確格式化', () => {
    render(<StatsCard label="勝率" value="66.7%" />);
    expect(screen.getByText('66.7%')).toBeInTheDocument();
  });
});
```

---

## 五、驗收標準

### 介面顯示
- [ ] 顯示玩家頭像
- [ ] 顯示玩家暱稱
- [ ] 顯示玩家 Email
- [ ] 顯示五個統計數據
- [ ] 顯示遊戲歷史列表

### 功能驗證
- [ ] 可載入更多遊戲歷史
- [ ] 可編輯玩家資料
- [ ] 可返回上一頁

### 錯誤處理
- [ ] 載入失敗時顯示錯誤訊息
- [ ] 可重試載入

### 訪客處理
- [ ] 訪客顯示「訪客」標籤
- [ ] 訪客不顯示編輯按鈕
- [ ] 訪客顯示無法保存記錄提示

