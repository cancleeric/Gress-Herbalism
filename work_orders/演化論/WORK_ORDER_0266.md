# 工作單 0266

## 編號
0266

## 日期
2026-01-31

## 工作單標題
實作演化論排行榜

## 工單主旨
實作演化論遊戲的排行榜 API 與前端頁面

## 內容

### 任務描述

建立演化論遊戲的排行榜系統，顯示勝場、總分、最高分等排名。

### 後端 API

```javascript
// backend/routes/evolution.js

// 勝場排行榜
router.get('/leaderboard/wins', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('evolution_player_stats')
      .select(`
        player_id,
        games_won,
        games_played,
        player:players(nickname, avatar_url)
      `)
      .order('games_won', { ascending: false })
      .limit(50);

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 總分排行榜
router.get('/leaderboard/score', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('evolution_player_stats')
      .select(`
        player_id,
        total_score,
        games_played,
        player:players(nickname, avatar_url)
      `)
      .order('total_score', { ascending: false })
      .limit(50);

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 最高單場分數排行榜
router.get('/leaderboard/highest', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('evolution_player_stats')
      .select(`
        player_id,
        highest_score,
        games_played,
        player:players(nickname, avatar_url)
      `)
      .order('highest_score', { ascending: false })
      .limit(50);

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 勝率排行榜（至少 10 場）
router.get('/leaderboard/winrate', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('evolution_player_stats')
      .select(`
        player_id,
        games_won,
        games_played,
        player:players(nickname, avatar_url)
      `)
      .gte('games_played', 10)
      .order('games_won', { ascending: false });

    if (error) throw error;

    // 計算勝率並排序
    const sorted = data
      .map(item => ({
        ...item,
        winRate: (item.games_won / item.games_played * 100).toFixed(1)
      }))
      .sort((a, b) => b.winRate - a.winRate)
      .slice(0, 50);

    res.json(sorted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 前端組件

```jsx
// frontend/src/components/games/evolution/Leaderboard/Leaderboard.js
import { useState, useEffect } from 'react';
import './Leaderboard.css';

function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [type, setType] = useState('wins');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [type]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/evolution/leaderboard/${type}`);
      const data = await response.json();
      setLeaderboard(data);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getValueDisplay = (item) => {
    switch (type) {
      case 'wins':
        return `${item.games_won} 勝 / ${item.games_played} 場`;
      case 'score':
        return `${item.total_score} 分`;
      case 'highest':
        return `${item.highest_score} 分`;
      case 'winrate':
        return `${item.winRate}% (${item.games_played}場)`;
      default:
        return '';
    }
  };

  return (
    <div className="evolution-leaderboard">
      <h2>🦎 演化論排行榜</h2>

      <div className="leaderboard-tabs">
        <button
          className={type === 'wins' ? 'active' : ''}
          onClick={() => setType('wins')}
        >
          勝場
        </button>
        <button
          className={type === 'score' ? 'active' : ''}
          onClick={() => setType('score')}
        >
          總分
        </button>
        <button
          className={type === 'highest' ? 'active' : ''}
          onClick={() => setType('highest')}
        >
          最高分
        </button>
        <button
          className={type === 'winrate' ? 'active' : ''}
          onClick={() => setType('winrate')}
        >
          勝率
        </button>
      </div>

      {loading ? (
        <div className="loading">載入中...</div>
      ) : (
        <div className="leaderboard-list">
          {leaderboard.map((item, index) => (
            <div key={item.player_id} className={`leaderboard-item rank-${index + 1}`}>
              <span className="rank">
                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
              </span>
              <img
                className="avatar"
                src={item.player?.avatar_url || '/default-avatar.png'}
                alt=""
              />
              <span className="name">{item.player?.nickname || '未知玩家'}</span>
              <span className="value">{getValueDisplay(item)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Leaderboard;
```

### CSS 樣式

```css
.evolution-leaderboard {
  max-width: 600px;
  margin: 0 auto;
  padding: 1rem;
}

.leaderboard-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.leaderboard-tabs button {
  flex: 1;
  padding: 0.5rem;
  border: none;
  background: #333;
  color: #fff;
  cursor: pointer;
  border-radius: 4px;
}

.leaderboard-tabs button.active {
  background: #4caf50;
}

.leaderboard-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  margin-bottom: 0.5rem;
}

.leaderboard-item.rank-1 {
  background: linear-gradient(90deg, rgba(255, 215, 0, 0.3), transparent);
}

.leaderboard-item .avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
}
```

### 前置條件
- 工單 0264-0265 已完成（資料庫與紀錄服務）

### 驗收標準
- [ ] 四種排行榜正確顯示
- [ ] 資料排序正確
- [ ] 前端頁面載入正常
- [ ] 響應式設計
- [ ] 測試覆蓋率 ≥ 70%

### 相關檔案
- `backend/routes/evolution.js` — 修改
- `frontend/src/components/games/evolution/Leaderboard/` — 新建

### 參考計畫書
`docs/演化論/PLAN_EVOLUTION_DEVELOPMENT.md` 第二章 2.1.3 節
