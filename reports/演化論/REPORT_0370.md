# 工單 0370 完成報告

## 基本資訊

| 項目 | 內容 |
|------|------|
| 工單編號 | 0370 |
| 工單標題 | 錯誤監控整合（Sentry） |
| 完成日期 | 2026-02-07 |
| 所屬計畫 | P2-D 品質保證 |

---

## 完成內容摘要

### 1. 前端 Sentry 服務

| 功能 | 說明 |
|------|------|
| `initSentry` | 初始化 Sentry SDK |
| `setUser` | 設置使用者資訊 |
| `setGameContext` | 設置遊戲狀態 Context |
| `captureError` | 捕捉錯誤 |
| `captureMessage` | 捕捉訊息 |
| `addBreadcrumb` | 添加 Breadcrumb |
| `addGameActionBreadcrumb` | 遊戲動作 Breadcrumb |
| `handleComponentError` | React Error Boundary 處理 |

### 2. 後端 Sentry 服務

| 功能 | 說明 |
|------|------|
| `init` | 初始化（含 Express 中介軟體）|
| `errorHandler` | Express 錯誤處理 |
| `captureException` | 捕捉異常 |
| `wrapSocketHandler` | Socket.io 錯誤包裝 |
| `captureGameError` | 遊戲邏輯錯誤捕捉 |

---

## 新增檔案

```
frontend/src/services/
└── sentry.js           # 前端 Sentry 服務（180+ 行）

backend/services/
└── sentry.js           # 後端 Sentry 服務（180+ 行）
```

---

## 功能特性

### 錯誤過濾

```javascript
ignoreErrors: [
  'ResizeObserver loop',       // 前端
  'Non-Error exception',
  'ECONNRESET',                // 後端
  'ETIMEDOUT',
]
```

### 敏感資料過濾

```javascript
beforeSend(event) {
  // 移除 email、IP
  delete event.user.email;
  delete event.user.ip_address;

  // 移除密碼、token
  delete data.password;
  delete data.token;
}
```

### 遊戲 Context

```javascript
setGameContext({
  roomId: 'room-123',
  phase: 'feeding',
  round: 3,
  playerCount: 4,
});
```

---

## 使用方式

### 前端

```javascript
import sentry from './services/sentry';

// 初始化
sentry.init();

// 設置使用者
sentry.setUser({ id: 'user-1', name: 'Player' });

// 捕捉錯誤
try {
  // ...
} catch (error) {
  sentry.captureError(error, { action: 'playCard' });
}
```

### 後端

```javascript
const sentry = require('./services/sentry');

// 初始化（含 Express app）
sentry.init(app);

// 錯誤中介軟體
app.use(sentry.errorHandler());

// Socket 包裝
io.on('connection', sentry.wrapSocketHandler((socket) => {
  // ...
}));
```

---

## 環境變數

| 變數 | 說明 |
|------|------|
| `REACT_APP_SENTRY_DSN` | 前端 Sentry DSN |
| `SENTRY_DSN` | 後端 Sentry DSN |
| `REACT_APP_VERSION` | 前端版本號 |
| `APP_VERSION` | 後端版本號 |

---

## 驗收標準達成

| 項目 | 狀態 |
|------|------|
| 前端 Sentry 初始化 | ✅ 完成 |
| 後端 Sentry 初始化 | ✅ 完成 |
| 遊戲狀態 Context | ✅ 完成 |
| 敏感資料過濾 | ✅ 完成 |
| Socket 錯誤捕捉 | ✅ 完成 |

---

## 注意事項

1. **Mock 模式**：目前使用 Mock SDK，正式部署時需安裝：
   - 前端：`@sentry/react`
   - 後端：`@sentry/node`

2. **效能影響**：生產環境取樣率設為 0.1（10%）

---

**報告完成**

*撰寫者：Claude Code*
*日期：2026-02-07*
