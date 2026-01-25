# 工作單 0088

**日期：** 2026-01-25

**工作單標題：** 排行榜頁面實作

**工單主旨：** 功能開發 - 實作全服玩家排行榜，支援多種排序方式

**相關工單：** 0060

**依賴工單：** 0060（分數保存系統）

---

## 一、功能概述

### 1.1 頁面目標

顯示全服玩家排行，支援三種排序方式：
- 勝場數排行
- 勝率排行
- 總分排行

### 1.2 頁面設計稿

```
┌─────────────────────────────────────────────────────────────────┐
│                        🏆 排行榜                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐         │
│  │    勝場數     │ │     勝率      │ │    總分       │         │
│  │   (選中)      │ │               │ │               │         │
│  └───────────────┘ └───────────────┘ └───────────────┘         │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ 排名 │      玩家       │ 場數 │ 勝場 │ 勝率  │ 總分            │
├──────┼─────────────────┼──────┼──────┼───────┼─────────────────┤
│  🥇  │ 👤 小明         │  50  │  42  │ 84.0% │  215            │
│  🥈  │ 👤 小華         │  45  │  35  │ 77.8% │  189            │
│  🥉  │ 👤 小李         │  60  │  38  │ 63.3% │  176            │
│   4  │ 👤 小王         │  30  │  18  │ 60.0% │  95             │
│   5  │ 👤 小張         │  25  │  12  │ 48.0% │  72             │
│  ... │ ...             │ ...  │ ...  │ ...   │ ...             │
│                                                                 │
│            ─── 第 1 頁，共 5 頁 ───                             │
│              [上一頁]  [下一頁]                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 二、前端實作

### 2.1 組件結構

```
frontend/src/components/Leaderboard/
├── index.js
├── LeaderboardPage.js      // 主頁面
├── LeaderboardPage.css     // 樣式
├── SortTabs.js            // 排序標籤
└── LeaderboardTable.js    // 排行表格
```

### 2.2 LeaderboardPage.js

```jsx
/**
 * 排行榜頁面
 */

import React, { useState, useEffect, useCallback } from 'react';
import { getLeaderboard } from '../../services/apiService';
import SortTabs from './SortTabs';
import LeaderboardTable from './LeaderboardTable';
import './LeaderboardPage.css';

// 排序選項
const SORT_OPTIONS = [
  { key: 'wins', label: '勝場數' },
  { key: 'winRate', label: '勝率' },
  { key: 'score', label: '總分' },
];

const PAGE_SIZE = 20;

function LeaderboardPage({ onBack }) {
  // 狀態
  const [sortBy, setSortBy] = useState('wins');
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // 載入資料
  useEffect(() => {
    loadLeaderboard();
  }, [sortBy, currentPage]);

  const loadLeaderboard = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getLeaderboard({
        sortBy,
        page: currentPage,
        limit: PAGE_SIZE,
      });

      setLeaderboard(data.players || []);
      setTotalPages(Math.ceil((data.total || 0) / PAGE_SIZE));
    } catch (err) {
      console.error('載入排行榜失敗:', err);
      setError('載入排行榜失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  // 切換排序
  const handleSortChange = useCallback((newSort) => {
    setSortBy(newSort);
    setCurrentPage(1); // 重置頁碼
  }, []);

  // 上一頁
  const handlePrevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage]);

  // 下一頁
  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  }, [currentPage, totalPages]);

  return (
    <div className="leaderboard-page">
      {/* 返回按鈕 */}
      <button className="back-btn" onClick={onBack}>
        ← 返回
      </button>

      {/* 標題 */}
      <h1 className="page-title">
        <span className="trophy-icon">🏆</span>
        排行榜
      </h1>

      {/* 排序標籤 */}
      <SortTabs
        options={SORT_OPTIONS}
        current={sortBy}
        onChange={handleSortChange}
      />

      {/* 錯誤訊息 */}
      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={loadLeaderboard}>重試</button>
        </div>
      )}

      {/* 載入中 */}
      {loading && (
        <div className="loading">載入中...</div>
      )}

      {/* 排行表格 */}
      {!loading && !error && (
        <>
          <LeaderboardTable
            players={leaderboard}
            sortBy={sortBy}
            startRank={(currentPage - 1) * PAGE_SIZE + 1}
          />

          {/* 分頁 */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="page-btn"
                onClick={handlePrevPage}
                disabled={currentPage === 1}
              >
                上一頁
              </button>
              <span className="page-info">
                第 {currentPage} 頁，共 {totalPages} 頁
              </span>
              <button
                className="page-btn"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
              >
                下一頁
              </button>
            </div>
          )}
        </>
      )}

      {/* 無資料 */}
      {!loading && !error && leaderboard.length === 0 && (
        <div className="no-data">
          <p>暫無排行資料</p>
          <p className="hint">快去玩一場吧！</p>
        </div>
      )}
    </div>
  );
}

export default LeaderboardPage;
```

### 2.3 SortTabs.js

```jsx
/**
 * 排序標籤組件
 */

import React from 'react';
import PropTypes from 'prop-types';
import './SortTabs.css';

function SortTabs({ options, current, onChange }) {
  return (
    <div className="sort-tabs">
      {options.map(option => (
        <button
          key={option.key}
          className={`sort-tab ${current === option.key ? 'active' : ''}`}
          onClick={() => onChange(option.key)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

SortTabs.propTypes = {
  options: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
  })).isRequired,
  current: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};

export default SortTabs;
```

### 2.4 LeaderboardTable.js

```jsx
/**
 * 排行表格組件
 */

import React from 'react';
import PropTypes from 'prop-types';
import './LeaderboardTable.css';

// 排名圖示
const RANK_ICONS = {
  1: '🥇',
  2: '🥈',
  3: '🥉',
};

function LeaderboardTable({ players, sortBy, startRank = 1 }) {
  // 取得排名顯示
  const getRankDisplay = (index) => {
    const rank = startRank + index;
    return RANK_ICONS[rank] || rank;
  };

  // 取得高亮欄位
  const getHighlightClass = (column) => {
    const mapping = {
      wins: 'total_wins',
      winRate: 'win_rate',
      score: 'total_score',
    };
    return column === mapping[sortBy] ? 'highlight' : '';
  };

  return (
    <table className="leaderboard-table">
      <thead>
        <tr>
          <th className="col-rank">排名</th>
          <th className="col-player">玩家</th>
          <th className="col-games">場數</th>
          <th className={`col-wins ${getHighlightClass('total_wins')}`}>勝場</th>
          <th className={`col-rate ${getHighlightClass('win_rate')}`}>勝率</th>
          <th className={`col-score ${getHighlightClass('total_score')}`}>總分</th>
        </tr>
      </thead>
      <tbody>
        {players.map((player, index) => {
          const rank = startRank + index;
          const isTopThree = rank <= 3;

          return (
            <tr
              key={player.id}
              className={`${isTopThree ? 'top-rank' : ''} rank-${rank}`}
            >
              <td className="col-rank">
                <span className={`rank-badge ${isTopThree ? 'medal' : ''}`}>
                  {getRankDisplay(index)}
                </span>
              </td>
              <td className="col-player">
                <div className="player-cell">
                  <img
                    src={player.avatar_url || '/images/default-avatar.png'}
                    alt=""
                    className="player-avatar"
                  />
                  <span className="player-name">{player.display_name}</span>
                </div>
              </td>
              <td className="col-games">{player.total_games}</td>
              <td className={`col-wins ${getHighlightClass('total_wins')}`}>
                {player.total_wins}
              </td>
              <td className={`col-rate ${getHighlightClass('win_rate')}`}>
                {player.win_rate}%
              </td>
              <td className={`col-score ${getHighlightClass('total_score')}`}>
                {player.total_score}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

LeaderboardTable.propTypes = {
  players: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    display_name: PropTypes.string.isRequired,
    avatar_url: PropTypes.string,
    total_games: PropTypes.number.isRequired,
    total_wins: PropTypes.number.isRequired,
    win_rate: PropTypes.number.isRequired,
    total_score: PropTypes.number.isRequired,
  })).isRequired,
  sortBy: PropTypes.string.isRequired,
  startRank: PropTypes.number,
};

export default LeaderboardTable;
```

---

## 三、後端 API

### 3.1 API 端點

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/api/leaderboard` | 取得排行榜 |

### 3.2 查詢參數

| 參數 | 類型 | 預設值 | 說明 |
|------|------|--------|------|
| sortBy | string | 'wins' | 排序方式：wins/winRate/score |
| page | number | 1 | 頁碼 |
| limit | number | 20 | 每頁筆數 |

### 3.3 回應格式

```json
{
  "players": [
    {
      "id": "uuid-1",
      "display_name": "小明",
      "avatar_url": "https://...",
      "total_games": 50,
      "total_wins": 42,
      "win_rate": 84.0,
      "total_score": 215
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 20
}
```

### 3.4 後端實作

```javascript
// backend/routes/api.js

/**
 * 取得排行榜
 */
router.get('/leaderboard', async (req, res) => {
  try {
    const {
      sortBy = 'wins',
      page = 1,
      limit = 20,
    } = req.query;

    // 驗證參數
    const validSortBy = ['wins', 'winRate', 'score'];
    if (!validSortBy.includes(sortBy)) {
      return res.status(400).json({ error: '無效的排序方式' });
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    // 對應資料庫欄位
    const orderColumn = {
      wins: 'total_wins',
      winRate: 'win_rate',
      score: 'total_score',
    }[sortBy];

    // 查詢排行榜
    const { data: players, error, count } = await supabase
      .from('players')
      .select('id, display_name, avatar_url, total_games, total_wins, win_rate, total_score', { count: 'exact' })
      .gt('total_games', 0) // 至少玩過一場
      .order(orderColumn, { ascending: false })
      .range(offset, offset + limitNum - 1);

    if (error) throw error;

    res.json({
      players,
      total: count || 0,
      page: pageNum,
      limit: limitNum,
    });
  } catch (error) {
    console.error('取得排行榜失敗:', error);
    res.status(500).json({ error: error.message });
  }
});
```

---

## 四、樣式設計

### 4.1 LeaderboardPage.css

```css
.leaderboard-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.page-title {
  text-align: center;
  font-size: 28px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.trophy-icon {
  font-size: 36px;
}

/* 排序標籤 */
.sort-tabs {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 24px;
}

.sort-tab {
  padding: 10px 24px;
  border: 2px solid #ddd;
  border-radius: 20px;
  background: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.sort-tab:hover {
  border-color: #667eea;
}

.sort-tab.active {
  background: #667eea;
  border-color: #667eea;
  color: white;
}

/* 表格 */
.leaderboard-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.leaderboard-table th,
.leaderboard-table td {
  padding: 14px 12px;
  text-align: center;
}

.leaderboard-table th {
  background: #f8f9fa;
  font-weight: 600;
  color: #333;
  border-bottom: 2px solid #eee;
}

.leaderboard-table th.highlight {
  background: #667eea;
  color: white;
}

.leaderboard-table td {
  border-bottom: 1px solid #eee;
}

.leaderboard-table td.highlight {
  font-weight: 600;
  color: #667eea;
}

/* 前三名 */
.leaderboard-table tr.top-rank {
  background: #fffbeb;
}

.leaderboard-table tr.rank-1 {
  background: linear-gradient(90deg, #fef9c3 0%, white 100%);
}

/* 排名徽章 */
.rank-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  font-weight: 600;
}

.rank-badge.medal {
  font-size: 24px;
}

/* 玩家欄位 */
.player-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.player-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
}

.player-name {
  font-weight: 500;
}

/* 分頁 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 24px;
}

.page-btn {
  padding: 10px 20px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
}

.page-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.page-info {
  color: #666;
}

/* 響應式 */
@media (max-width: 600px) {
  .leaderboard-table {
    font-size: 13px;
  }

  .leaderboard-table th,
  .leaderboard-table td {
    padding: 10px 6px;
  }

  .player-avatar {
    width: 28px;
    height: 28px;
  }

  .col-games,
  .col-rate {
    display: none;
  }
}
```

---

## 五、驗收標準

### 介面顯示
- [ ] 顯示排行榜標題
- [ ] 顯示三個排序標籤
- [ ] 顯示玩家排行表格
- [ ] 前三名顯示獎牌圖示
- [ ] 顯示分頁控制

### 排序功能
- [ ] 點擊標籤切換排序
- [ ] 勝場數排序正確
- [ ] 勝率排序正確
- [ ] 總分排序正確
- [ ] 當前排序欄位高亮

### 分頁功能
- [ ] 分頁按鈕正常運作
- [ ] 第一頁禁用「上一頁」
- [ ] 最後一頁禁用「下一頁」
- [ ] 顯示當前頁碼資訊

### 響應式
- [ ] 手機版正常顯示
- [ ] 手機版隱藏部分欄位

