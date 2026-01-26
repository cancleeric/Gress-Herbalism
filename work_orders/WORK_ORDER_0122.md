# 工作單 0122

**日期：** 2026-01-26

**工作單標題：** 分離玩家名稱與暱稱概念

**工單主旨：** BUG 修復 / 功能改進

**優先級：** 高

---

## 問題描述

目前系統中「玩家名稱」和「暱稱」的概念混淆，需要明確區分：

### 1. 玩家名稱（Player Name）

用於顯示登入身份，**不可編輯**：

| 登入方式 | 顯示內容 |
|---------|---------|
| 訪客登入 | 訪客 |
| Google 登入 | Google 帳號名稱 |

### 2. 暱稱（Nickname）

用於遊戲中顯示，**可編輯**：

- 玩家進入遊戲前可以自訂
- 儲存在 localStorage
- 顯示在遊戲房間中

## 修改範圍

### Lobby 頁面

```
┌─────────────────────────────────────────┐
│  [頭像] 玩家名稱（訪客 / Google 名稱）    │  ← 顯示登入身份
├─────────────────────────────────────────┤
│  暱稱輸入框：[請輸入遊戲暱稱]            │  ← 可編輯的遊戲名稱
│  創建房間按鈕                            │
│  ...                                     │
└─────────────────────────────────────────┘
```

### 需要修改的檔案

- `frontend/src/components/Lobby/Lobby.js`
- `frontend/src/components/Lobby/Lobby.css`
- `frontend/src/components/Lobby/Lobby.test.js`
- `frontend/src/utils/localStorage.js`（可能需要新增）

## 實作細節

### 狀態管理

```javascript
// 玩家名稱（來自登入）
const [playerName, setPlayerName] = useState('訪客'); // 或 Google 名稱

// 暱稱（用於遊戲）
const [nickname, setNickname] = useState('');
```

### UI 標籤變更

| 原本 | 修改後 |
|------|--------|
| 玩家名稱輸入框 | 遊戲暱稱輸入框 |
| Header 顯示暱稱 | Header 顯示玩家名稱（登入身份） |

### localStorage Key

| Key | 用途 |
|-----|------|
| `gress_player_name` | 保留（但現在存暱稱） |
| `gress_nickname` | 新增（遊戲暱稱） |

## 驗收標準

- [ ] 訪客登入時，Header 顯示「訪客」
- [ ] Google 登入時，Header 顯示 Google 名稱
- [ ] 暱稱輸入框標籤改為「遊戲暱稱」
- [ ] 暱稱可以編輯並儲存
- [ ] 進入遊戲時使用暱稱
- [ ] 測試全部通過

## 備註

目前系統尚未實作 Google 登入，此工單先處理：
1. 將 Header 玩家名稱固定顯示「訪客」
2. 將輸入框改為「遊戲暱稱」
3. 區分兩個概念的程式邏輯

Google 登入整合將在後續工單處理。
