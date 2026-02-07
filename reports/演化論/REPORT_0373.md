# 工單 0373 完成報告

## 基本資訊

| 項目 | 內容 |
|------|------|
| 工單編號 | 0373 |
| 工單標題 | 安全性強化 |
| 完成日期 | 2026-02-07 |
| 所屬計畫 | P2-D 品質保證 |

---

## 完成內容摘要

### 1. 安全性中介軟體 (`security.js`)

| 功能 | 說明 |
|------|------|
| `securityHeaders` | HTTP 安全 Headers |
| `corsMiddleware` | CORS 配置 |
| `SocketMessageValidator` | Socket 訊息驗證 |
| `ActionDeduplicator` | 動作防重複 |
| `sanitizeData` | 敏感資料過濾 |
| `escapeHtml` | XSS 防護 |
| `validateInput` | 輸入驗證 |

### 2. 速率限制 (`rateLimit.js`)

| 類別 | 說明 |
|------|------|
| `RateLimiter` | HTTP 請求限制 |
| `SocketRateLimiter` | Socket 動作限制 |

---

## 新增檔案

```
backend/middleware/
├── security.js     # 安全性中介軟體（280+ 行）
└── rateLimit.js    # 速率限制（230+ 行）
```

---

## 安全性 Headers

| Header | 值 |
|--------|-----|
| X-Frame-Options | SAMEORIGIN |
| X-Content-Type-Options | nosniff |
| X-XSS-Protection | 1; mode=block |
| Strict-Transport-Security | max-age=31536000 |
| Content-Security-Policy | (詳見程式碼) |
| Referrer-Policy | strict-origin-when-cross-origin |

---

## 速率限制配置

| 類型 | 時間窗口 | 最大請求 |
|------|----------|----------|
| API | 1 分鐘 | 100 |
| 登入 | 5 分鐘 | 5 |
| 遊戲動作 | 1 秒 | 20 |

---

## 使用方式

### 安全性 Headers

```javascript
const { securityHeaders, corsMiddleware } = require('./middleware/security');

app.use(securityHeaders());
app.use(corsMiddleware({ allowedOrigins: ['http://localhost:3000'] }));
```

### Socket 訊息驗證

```javascript
const { SocketMessageValidator } = require('./middleware/security');

const validator = new SocketMessageValidator();
validator.addSchema('playCard', {
  required: ['cardId'],
  properties: {
    cardId: { type: 'string' },
  },
});

// 在事件處理前驗證
if (!validator.validate('playCard', data).valid) {
  socket.emit('error', { message: '無效的動作' });
  return;
}
```

### 速率限制

```javascript
const { defaultLimiters, SocketRateLimiter } = require('./middleware/rateLimit');

// HTTP API
app.use('/api', defaultLimiters.api.middleware());

// Socket
const socketLimiter = new SocketRateLimiter();
socket.on('playCard', socketLimiter.wrap('playCard', handler));
```

---

## 驗收標準達成

| 項目 | 狀態 |
|------|------|
| Socket 訊息驗證 | ✅ SocketMessageValidator |
| 動作頻率限制 | ✅ RateLimiter |
| XSS/CSRF 防護 | ✅ CSP, escapeHtml |
| 敏感資料過濾 | ✅ sanitizeData |

---

**報告完成**

*撰寫者：Claude Code*
*日期：2026-02-07*
