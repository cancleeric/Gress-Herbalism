# 工作單 0141

**日期：** 2026-01-26

**工作單標題：** Leaderboard 頁面 UI 重新設計

**工單主旨：** UI 改造 - 將排行榜頁面改為中國風草藥主題

**優先級：** 中

**依賴工單：** 無

---

## 一、目標

將 Leaderboard 頁面從現有的深色科技風格改為與 Login 頁面一致的中國風草藥主題。

---

## 二、設計規格

### 2.1 配色方案

| 元素 | 顏色 |
|------|------|
| 頁面背景 | #FFF8E1（米色） |
| 主色調 | #2E7D32（深綠色） |
| 強調色 | #FFB300（金色） |
| 表頭背景 | rgba(46, 125, 50, 0.1) |
| 前三名高亮 | rgba(255, 179, 0, 0.1) |

### 2.2 頁面結構

```
┌─────────────────────────────────┐
│  [← 返回大廳]     Herbalism     │
├─────────────────────────────────┤
│                                 │
│           🏆 排行榜             │
│                                 │
│  ┌─────────────────────────────┐│
│  │ [勝場數] [勝率] [總得分]   ││  ← 排序標籤
│  └─────────────────────────────┘│
│                                 │
│  ┌─────────────────────────────┐│
│  │ 排名 │ 玩家  │場數│勝場│勝率│總分││
│  ├─────────────────────────────┤│
│  │ 🥇  │ 玩家A │ 20 │ 15 │75%│150 ││ ← 金色背景
│  │ 🥈  │ 玩家B │ 18 │ 12 │67%│120 ││ ← 金色背景
│  │ 🥉  │ 玩家C │ 15 │ 10 │67%│100 ││ ← 金色背景
│  │  4  │ 玩家D │ 12 │  6 │50%│ 60 ││
│  │  5  │ 玩家E │ 10 │  4 │40%│ 40 ││
│  └─────────────────────────────┘│
│                                 │
└─────────────────────────────────┘
```

---

## 三、CSS 樣式重點

### 3.1 排序標籤

```css
.sort-tabs {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 24px;
}

.sort-tab {
  padding: 10px 20px;
  background: rgba(46, 125, 50, 0.1);
  border: 1px solid rgba(46, 125, 50, 0.2);
  border-radius: 8px;
  color: rgba(46, 125, 50, 0.7);
  cursor: pointer;
}

.sort-tab.active {
  background: #2E7D32;
  border-color: #2E7D32;
  color: white;
}
```

### 3.2 表格樣式

```css
.leaderboard-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0 8px;
}

.leaderboard-table th {
  background: rgba(46, 125, 50, 0.1);
  color: #2E7D32;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 12px 16px;
}

.leaderboard-table td {
  background: rgba(255, 255, 255, 0.5);
  color: rgba(46, 125, 50, 0.8);
  padding: 12px 16px;
}

.leaderboard-table tbody tr.top-rank td {
  background: rgba(255, 179, 0, 0.15);
  border-top: 1px solid rgba(255, 179, 0, 0.3);
  border-bottom: 1px solid rgba(255, 179, 0, 0.3);
}
```

### 3.3 獎牌樣式

```css
.rank-medal {
  font-size: 24px;
}

.rank-number {
  color: rgba(46, 125, 50, 0.5);
  font-weight: 600;
  font-size: 16px;
}
```

### 3.4 玩家頭像

```css
.mini-avatar-placeholder {
  background: linear-gradient(135deg, #2E7D32, #FFB300);
}

.player-name {
  color: #2E7D32;
  font-weight: 500;
}
```

---

## 四、修改檔案

| 檔案 | 修改內容 |
|------|---------|
| `frontend/src/components/Leaderboard/Leaderboard.js` | 調整 JSX 結構，加入導航欄 |
| `frontend/src/components/Leaderboard/Leaderboard.css` | 完全重寫為中國風樣式 |

---

## 五、驗收標準

- [ ] 頁面背景為米色 #FFF8E1
- [ ] 卡片使用毛玻璃效果
- [ ] 排序標籤設計美觀
- [ ] 表格設計清晰易讀
- [ ] 前三名有金色高亮效果
- [ ] 獎牌圖示顯示正確
- [ ] 玩家頭像設計美觀
- [ ] 響應式設計正常
- [ ] 與 Login 頁面風格一致
