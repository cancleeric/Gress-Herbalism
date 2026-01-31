# 工作單 0057

**日期：** 2026-01-24

**工作單標題：** LocalStorage 記住暱稱功能

**工單主旨：** 帳號系統 - 使用 LocalStorage 記住玩家上次使用的暱稱

**內容：**

## 目標

讓玩家不需要每次都重新輸入暱稱，系統自動記住並填入上次使用的名稱。

## 功能需求

### 1. 自動填入暱稱
- 進入遊戲大廳時，自動填入上次使用的暱稱
- 如果沒有儲存過，顯示空白或預設提示

### 2. 自動儲存暱稱
- 玩家建立房間或加入房間時，自動儲存暱稱
- 玩家修改暱稱時，自動更新儲存

### 3. 暱稱驗證
- 暱稱長度：2-12 個字元
- 不可為空白
- 過濾特殊字元（選填）

## 技術實作

### 1. 建立 LocalStorage 工具函數

```javascript
// frontend/src/utils/localStorage.js

const STORAGE_KEYS = {
  PLAYER_NAME: 'gress_player_name',
  PLAYER_SETTINGS: 'gress_player_settings',
};

/**
 * 儲存玩家暱稱
 * @param {string} name - 玩家暱稱
 */
export function savePlayerName(name) {
  if (name && name.trim()) {
    localStorage.setItem(STORAGE_KEYS.PLAYER_NAME, name.trim());
  }
}

/**
 * 取得儲存的玩家暱稱
 * @returns {string} 玩家暱稱，如果沒有則返回空字串
 */
export function getPlayerName() {
  return localStorage.getItem(STORAGE_KEYS.PLAYER_NAME) || '';
}

/**
 * 清除玩家暱稱
 */
export function clearPlayerName() {
  localStorage.removeItem(STORAGE_KEYS.PLAYER_NAME);
}

/**
 * 儲存玩家設定
 * @param {object} settings - 設定物件
 */
export function savePlayerSettings(settings) {
  localStorage.setItem(STORAGE_KEYS.PLAYER_SETTINGS, JSON.stringify(settings));
}

/**
 * 取得玩家設定
 * @returns {object} 設定物件
 */
export function getPlayerSettings() {
  const settings = localStorage.getItem(STORAGE_KEYS.PLAYER_SETTINGS);
  return settings ? JSON.parse(settings) : {};
}
```

### 2. 修改遊戲大廳組件

```jsx
// frontend/src/components/Lobby/Lobby.jsx

import React, { useState, useEffect } from 'react';
import { savePlayerName, getPlayerName } from '../../utils/localStorage';

function Lobby() {
  const [playerName, setPlayerName] = useState('');

  // 載入時讀取儲存的暱稱
  useEffect(() => {
    const savedName = getPlayerName();
    if (savedName) {
      setPlayerName(savedName);
    }
  }, []);

  // 暱稱變更時的處理
  const handleNameChange = (e) => {
    const name = e.target.value;
    setPlayerName(name);
  };

  // 建立房間
  const handleCreateRoom = () => {
    if (!validateName(playerName)) {
      alert('請輸入有效的暱稱（2-12 個字元）');
      return;
    }

    // 儲存暱稱
    savePlayerName(playerName);

    // 建立房間邏輯...
  };

  // 加入房間
  const handleJoinRoom = (roomId) => {
    if (!validateName(playerName)) {
      alert('請輸入有效的暱稱（2-12 個字元）');
      return;
    }

    // 儲存暱稱
    savePlayerName(playerName);

    // 加入房間邏輯...
  };

  return (
    <div className="lobby">
      <div className="name-input-section">
        <label htmlFor="playerName">你的暱稱</label>
        <input
          id="playerName"
          type="text"
          value={playerName}
          onChange={handleNameChange}
          placeholder="請輸入暱稱"
          maxLength={12}
          autoComplete="off"
        />
        {playerName && (
          <span className="name-hint">
            歡迎回來，{playerName}！
          </span>
        )}
      </div>

      {/* 房間列表... */}
    </div>
  );
}
```

### 3. 暱稱驗證函數

```javascript
// frontend/src/utils/validation.js

/**
 * 驗證暱稱是否有效
 * @param {string} name - 暱稱
 * @returns {boolean} 是否有效
 */
export function validatePlayerName(name) {
  if (!name || typeof name !== 'string') {
    return false;
  }

  const trimmedName = name.trim();

  // 長度檢查：2-12 個字元
  if (trimmedName.length < 2 || trimmedName.length > 12) {
    return false;
  }

  // 過濾危險字元（選填）
  const dangerousChars = /[<>\"\'&]/;
  if (dangerousChars.test(trimmedName)) {
    return false;
  }

  return true;
}

/**
 * 取得暱稱驗證錯誤訊息
 * @param {string} name - 暱稱
 * @returns {string|null} 錯誤訊息，如果有效則返回 null
 */
export function getPlayerNameError(name) {
  if (!name || !name.trim()) {
    return '請輸入暱稱';
  }

  const trimmedName = name.trim();

  if (trimmedName.length < 2) {
    return '暱稱至少需要 2 個字元';
  }

  if (trimmedName.length > 12) {
    return '暱稱不能超過 12 個字元';
  }

  const dangerousChars = /[<>\"\'&]/;
  if (dangerousChars.test(trimmedName)) {
    return '暱稱不能包含特殊字元';
  }

  return null;
}
```

### 4. 額外功能：記住其他設定（選填）

```javascript
// 可以擴展儲存其他設定
const defaultSettings = {
  soundEnabled: true,
  notificationsEnabled: true,
  theme: 'light',
};

// 使用範例
const settings = { ...defaultSettings, ...getPlayerSettings() };
savePlayerSettings({ ...settings, soundEnabled: false });
```

## 受影響檔案

### 新增檔案
- `frontend/src/utils/localStorage.js` - LocalStorage 工具函數
- `frontend/src/utils/validation.js` - 驗證函數（如果還沒有）

### 修改檔案
- `frontend/src/components/Lobby/Lobby.jsx` - 遊戲大廳組件
- 或其他處理玩家暱稱輸入的組件

## 測試案例

### 案例 1：首次使用
1. 清除瀏覽器 LocalStorage
2. 進入遊戲
3. 暱稱欄位應為空白
4. 輸入暱稱「小明」並建立房間
5. 暱稱應被儲存

### 案例 2：再次使用
1. 關閉瀏覽器
2. 重新開啟遊戲
3. 暱稱欄位應自動填入「小明」
4. 應顯示「歡迎回來，小明！」

### 案例 3：更換暱稱
1. 將暱稱改為「小華」
2. 加入房間
3. 關閉並重開遊戲
4. 暱稱應為「小華」

### 案例 4：暱稱驗證
1. 輸入單一字元「A」→ 顯示錯誤
2. 輸入超過 12 字元 → 顯示錯誤
3. 輸入空白 → 顯示錯誤
4. 輸入「<script>」→ 顯示錯誤（如有過濾）

## UI 設計建議

```
┌─────────────────────────────────────────┐
│  🎮 Gress 推理桌遊                       │
├─────────────────────────────────────────┤
│                                         │
│  你的暱稱                                │
│  ┌─────────────────────────────────┐   │
│  │ 小明                        ✓   │   │
│  └─────────────────────────────────┘   │
│  歡迎回來，小明！                        │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │        建立新房間                │   │
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

## 驗收標準

- [ ] 建立 `localStorage.js` 工具函數
- [ ] 建立暱稱驗證函數
- [ ] 遊戲載入時自動填入儲存的暱稱
- [ ] 建立/加入房間時自動儲存暱稱
- [ ] 暱稱驗證功能正常（長度、特殊字元）
- [ ] 顯示友善的歡迎訊息
- [ ] 通過所有測試案例
