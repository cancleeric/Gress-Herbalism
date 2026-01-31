# 工作單 0112

**日期：** 2026-01-25

**工作單標題：** 新增遊戲版本編號顯示

**工單主旨：** 功能開發 - 在遊戲畫面顯示版本編號

**優先級：** 中

---

## 功能描述

在遊戲畫面顯示版本編號，遵循語義化版本規範（Semantic Versioning）。

### 版本編號規則

```
MAJOR.MINOR.PATCH

範例：1.0.0、1.2.3、2.0.0-beta
```

| 版本類型 | 說明 | 更新時機 |
|---------|------|----------|
| MAJOR | 主版本 | 重大變更、不向後相容 |
| MINOR | 次版本 | 新增功能、向後相容 |
| PATCH | 修訂版 | Bug 修復、小改動 |

### 版本歷程範例

```
0.1.0 - 初始開發版本
0.2.0 - 新增計分系統
0.2.1 - 修復計分 Bug
0.3.0 - 新增預測功能
1.0.0 - 正式發布版本
```

## 修改內容

### 1. 新增版本配置檔

**檔案：** `frontend/src/config/version.js`（新增）

```javascript
/**
 * 遊戲版本資訊
 *
 * 版本規則（語義化版本 Semantic Versioning）：
 * - MAJOR: 重大變更，不向後相容
 * - MINOR: 新增功能，向後相容
 * - PATCH: Bug 修復，小改動
 *
 * 更新時機：
 * - 每次發布新版本時更新
 * - 重大功能完成時更新 MINOR
 * - Bug 修復時更新 PATCH
 */

export const VERSION = {
  major: 0,
  minor: 4,
  patch: 0,
  // 可選：預發布標籤 (alpha, beta, rc)
  prerelease: null,
  // 建置日期
  buildDate: '2026-01-25'
};

/**
 * 取得完整版本字串
 * @returns {string} 例如 "0.4.0" 或 "1.0.0-beta"
 */
export function getVersionString() {
  const { major, minor, patch, prerelease } = VERSION;
  let version = `${major}.${minor}.${patch}`;
  if (prerelease) {
    version += `-${prerelease}`;
  }
  return version;
}

/**
 * 取得完整版本資訊
 * @returns {string} 例如 "v0.4.0 (2026-01-25)"
 */
export function getFullVersionInfo() {
  return `v${getVersionString()} (${VERSION.buildDate})`;
}
```

### 2. 新增版本顯示組件

**檔案：** `frontend/src/components/VersionInfo/VersionInfo.js`（新增）

```javascript
import React from 'react';
import { getVersionString, getFullVersionInfo } from '../../config/version';
import './VersionInfo.css';

/**
 * 版本資訊組件
 * @param {Object} props
 * @param {boolean} props.showFull - 是否顯示完整資訊（含日期）
 */
function VersionInfo({ showFull = false }) {
  return (
    <div className="version-info">
      {showFull ? getFullVersionInfo() : `v${getVersionString()}`}
    </div>
  );
}

export default VersionInfo;
```

**檔案：** `frontend/src/components/VersionInfo/VersionInfo.css`（新增）

```css
.version-info {
  position: fixed;
  bottom: 8px;
  right: 8px;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  background: rgba(0, 0, 0, 0.2);
  padding: 2px 8px;
  border-radius: 4px;
  z-index: 1000;
  pointer-events: none;
  user-select: none;
}
```

### 3. 整合到遊戲畫面

**檔案：** `frontend/src/components/GameRoom/GameRoom.js`

在 JSX 最外層加入：
```jsx
<VersionInfo />
```

**檔案：** `frontend/src/components/Lobby/Lobby.js`

在 JSX 最外層加入：
```jsx
<VersionInfo showFull />
```

### 4. 後端版本 API（可選）

**檔案：** `backend/server.js`

```javascript
// 版本資訊
const VERSION = '0.4.0';

// 提供版本 API
app.get('/api/version', (req, res) => {
  res.json({
    version: VERSION,
    buildDate: '2026-01-25'
  });
});
```

## 版本更新流程

1. 完成功能開發或 Bug 修復
2. 更新 `frontend/src/config/version.js`
3. 更新 `buildDate` 為當天日期
4. 提交並標註版本號

## 初始版本

考慮目前專案進度，建議初始版本設為：

```
0.4.0 - 預測功能完成版本
```

## 測試項目

- [ ] 版本編號正確顯示在畫面右下角
- [ ] Lobby 頁面顯示完整版本資訊
- [ ] GameRoom 頁面顯示簡短版本
- [ ] 版本樣式不干擾遊戲操作

## 驗收標準

- [ ] 版本編號正確顯示
- [ ] 版本格式符合語義化版本規範
- [ ] 版本資訊易於維護
