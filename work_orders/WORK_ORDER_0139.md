# 工作單 0139

**日期：** 2026-01-26

**工作單標題：** Profile 頁面 UI 重新設計

**工單主旨：** UI 改造 - 將個人資料頁面改為中國風草藥主題

**優先級：** 中

**依賴工單：** 無

---

## 一、目標

將 Profile 頁面從現有的深色科技風格改為與 Login 頁面一致的中國風草藥主題（米色背景、綠色主色調、毛玻璃卡片效果）。

---

## 二、設計規格

### 2.1 配色方案

| 元素 | 顏色 |
|------|------|
| 頁面背景 | #FFF8E1（米色） |
| 主色調 | #2E7D32（深綠色） |
| 強調色 | #FFB300（金色） |
| 文字顏色 | rgba(46, 125, 50, 0.8) |
| 卡片背景 | rgba(255, 255, 255, 0.4) + backdrop-filter: blur(10px) |

### 2.2 頁面結構

```
┌─────────────────────────────────┐
│  [← 返回大廳]     Herbalism     │  ← 導航欄
├─────────────────────────────────┤
│                                 │
│         ┌─────────────┐         │
│         │   頭像      │         │
│         │   暱稱      │         │
│         │   Email     │         │
│         └─────────────┘         │
│                                 │
│  ┌───────────────────────────┐  │
│  │      遊戲統計卡片          │  │
│  │  ┌────┐ ┌────┐ ┌────┐    │  │
│  │  │總場│ │勝利│ │勝率│    │  │
│  │  └────┘ └────┘ └────┘    │  │
│  │  ┌────┐ ┌────┐           │  │
│  │  │總分│ │最高│           │  │
│  │  └────┘ └────┘           │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │      最近遊戲卡片          │  │
│  │  🏆 得分 X · 4人 · 3局    │  │
│  │  💔 得分 X · 3人 · 2局    │  │
│  └───────────────────────────┘  │
│                                 │
│        [登出按鈕]               │
│                                 │
└─────────────────────────────────┘
```

---

## 三、CSS 樣式重點

### 3.1 頁面容器

```css
.profile-page {
  min-height: 100vh;
  background-color: #FFF8E1;
  position: relative;
}

.profile-page::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background-image:
    radial-gradient(circle at top left, rgba(47, 127, 51, 0.05) 0%, transparent 40%),
    radial-gradient(circle at bottom right, rgba(255, 179, 0, 0.05) 0%, transparent 40%);
  pointer-events: none;
}
```

### 3.2 卡片樣式

```css
.profile-card {
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 12px;
  box-shadow: 0 25px 50px -12px rgba(46, 125, 50, 0.05);
}
```

### 3.3 統計卡片

```css
.stat-card {
  background: rgba(46, 125, 50, 0.1);
  border: 1px solid rgba(46, 125, 50, 0.2);
  border-radius: 8px;
  text-align: center;
}

.stat-value {
  color: #2E7D32;
  font-size: 24px;
  font-weight: 700;
}

.stat-label {
  color: rgba(46, 125, 50, 0.6);
  font-size: 12px;
}
```

---

## 四、修改檔案

| 檔案 | 修改內容 |
|------|---------|
| `frontend/src/components/Profile/Profile.js` | 調整 JSX 結構，加入導航欄 |
| `frontend/src/components/Profile/Profile.css` | 完全重寫為中國風樣式 |

---

## 五、驗收標準

- [ ] 頁面背景為米色 #FFF8E1
- [ ] 卡片使用毛玻璃效果
- [ ] 統計數據卡片使用綠色系
- [ ] 遊戲歷史列表風格一致
- [ ] 返回按鈕和登出按鈕風格統一
- [ ] 頭像區域設計美觀
- [ ] 響應式設計正常
- [ ] 與 Login 頁面風格一致
