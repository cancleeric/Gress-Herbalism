# 工作單 0376

## 基本資訊

| 項目 | 內容 |
|------|------|
| 編號 | 0376 |
| 日期 | 2026-02-07 |
| 標題 | 修復前端 Socket URL 配置 |
| 主旨 | Socket 連線問題修復 |
| 優先級 | P1 - 臨界 |
| 所屬計畫 | Socket 連線問題修復計畫書 |

---

## 問題描述

前端 `.env` 中硬編碼了特定區域網路 IP 地址 `192.168.50.132:3001`，導致：
- 更換網路環境後無法連接後端
- 其他開發者無法直接使用
- 顯示「與伺服器斷線」錯誤

---

## 工作內容

### 1. 更新前端環境變數

修改 `frontend/.env`：
```
REACT_APP_SOCKET_URL=http://localhost:3001
```

### 2. 更新環境變數範本

確認 `frontend/.env.example` 使用正確的預設值。

### 3. 可選：添加動態 URL 偵測

在 `frontend/src/config.js` 中添加備選方案：
```javascript
const getSocketUrl = () => {
  if (process.env.REACT_APP_SOCKET_URL) {
    return process.env.REACT_APP_SOCKET_URL;
  }
  // 開發環境預設
  return `${window.location.protocol}//${window.location.hostname}:3001`;
};
```

---

## 驗收標準

- [ ] `frontend/.env` 使用 `localhost:3001`
- [ ] 前端可正常連接本地後端
- [ ] 不再顯示「與伺服器斷線」錯誤
- [ ] `.env.example` 已更新

---

## 相關檔案

```
frontend/.env
frontend/.env.example
frontend/src/config.js
```
