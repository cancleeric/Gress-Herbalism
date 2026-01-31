# 工作單 0058

**日期：** 2026-01-24

**工作單標題：** 房間密碼功能

**工單主旨：** 帳號系統 - 讓房主可以設定密碼保護房間

**內容：**

## 目標

讓房主可以設定房間密碼，只有知道密碼的玩家才能加入，實現私人房間功能。

## 功能需求

### 1. 建立房間時設定密碼
- 房主可以選擇是否設定密碼（選填）
- 密碼長度：4-16 個字元
- 設定密碼後房間顯示為「私人房間」

### 2. 加入房間時輸入密碼
- 私人房間顯示鎖頭圖示
- 點擊加入時彈出密碼輸入框
- 密碼錯誤顯示錯誤訊息

### 3. 房間列表顯示
- 公開房間：正常顯示
- 私人房間：顯示鎖頭圖示 🔒

## 技術實作

### 1. 後端：修改房間資料結構

```javascript
// backend/server.js

// 建立房間事件
socket.on('createRoom', ({ player, maxPlayers, password }) => {
  const gameId = generateGameId();

  const roomState = {
    gameId,
    players: [{
      ...player,
      socketId: socket.id,
      hand: [],
      isActive: true,
      isCurrentTurn: false,
      isHost: true
    }],
    hiddenCards: [],
    currentPlayerIndex: 0,
    gamePhase: 'waiting',
    winner: null,
    gameHistory: [],
    maxPlayers: maxPlayers || 4,

    // 新增：密碼相關欄位
    password: password || null,        // 房間密碼（null 表示公開）
    isPrivate: !!password,             // 是否為私人房間
  };

  gameRooms.set(gameId, roomState);
  // ... 其餘邏輯
});
```

### 2. 後端：修改加入房間邏輯

```javascript
// backend/server.js

socket.on('joinRoom', ({ gameId, player, password }) => {
  const gameState = gameRooms.get(gameId);

  if (!gameState) {
    socket.emit('error', { message: '房間不存在' });
    return;
  }

  // 新增：密碼驗證
  if (gameState.isPrivate) {
    if (!password) {
      socket.emit('passwordRequired', { gameId });
      return;
    }

    if (gameState.password !== password) {
      socket.emit('error', { message: '密碼錯誤' });
      return;
    }
  }

  if (gameState.gamePhase !== 'waiting') {
    socket.emit('error', { message: '遊戲已開始' });
    return;
  }

  if (gameState.players.length >= gameState.maxPlayers) {
    socket.emit('error', { message: '房間已滿' });
    return;
  }

  // 正常加入流程...
  gameState.players.push({
    ...player,
    socketId: socket.id,
    hand: [],
    isActive: true,
    isCurrentTurn: false,
    isHost: false
  });

  // ... 其餘邏輯
});
```

### 3. 後端：修改房間列表回傳

```javascript
// backend/server.js

function getAvailableRooms() {
  const rooms = [];
  gameRooms.forEach((state, gameId) => {
    if (state.gamePhase === 'waiting') {
      const hostPlayer = state.players.find(p => p.isHost) || state.players[0];
      rooms.push({
        id: gameId,
        name: hostPlayer ? `${hostPlayer.name} 的房間` : `房間 ${gameId.slice(-6)}`,
        playerCount: state.players.length,
        maxPlayers: state.maxPlayers || 4,

        // 新增：私人房間標記（不回傳密碼本身）
        isPrivate: state.isPrivate || false,
      });
    }
  });
  return rooms;
}
```

### 4. 前端：修改建立房間組件

```jsx
// frontend/src/components/CreateRoom/CreateRoom.jsx

import React, { useState } from 'react';

function CreateRoom({ onCreateRoom }) {
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    // 驗證密碼
    if (isPrivate && password) {
      if (password.length < 4) {
        alert('密碼至少需要 4 個字元');
        return;
      }
      if (password.length > 16) {
        alert('密碼不能超過 16 個字元');
        return;
      }
    }

    onCreateRoom({
      maxPlayers,
      password: isPrivate ? password : null,
    });
  };

  return (
    <div className="create-room-modal">
      <h2>建立新房間</h2>

      <form onSubmit={handleSubmit}>
        {/* 最大玩家數 */}
        <div className="form-group">
          <label>最大玩家數</label>
          <select
            value={maxPlayers}
            onChange={(e) => setMaxPlayers(Number(e.target.value))}
          >
            <option value={3}>3 人</option>
            <option value={4}>4 人</option>
          </select>
        </div>

        {/* 私人房間開關 */}
        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => {
                setIsPrivate(e.target.checked);
                if (!e.target.checked) {
                  setPassword('');
                }
              }}
            />
            <span>設為私人房間</span>
          </label>
        </div>

        {/* 密碼輸入（私人房間時顯示） */}
        {isPrivate && (
          <div className="form-group">
            <label>房間密碼</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="輸入 4-16 位密碼"
                maxLength={16}
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            <span className="hint">密碼長度：4-16 個字元</span>
          </div>
        )}

        <button type="submit" className="create-btn">
          建立房間
        </button>
      </form>
    </div>
  );
}

export default CreateRoom;
```

### 5. 前端：修改房間列表組件

```jsx
// frontend/src/components/RoomList/RoomList.jsx

import React, { useState } from 'react';

function RoomList({ rooms, onJoinRoom }) {
  const [passwordModal, setPasswordModal] = useState({
    show: false,
    roomId: null,
    roomName: '',
  });
  const [inputPassword, setInputPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleJoinClick = (room) => {
    if (room.isPrivate) {
      // 私人房間：顯示密碼輸入框
      setPasswordModal({
        show: true,
        roomId: room.id,
        roomName: room.name,
      });
      setInputPassword('');
      setPasswordError('');
    } else {
      // 公開房間：直接加入
      onJoinRoom(room.id, null);
    }
  };

  const handlePasswordSubmit = () => {
    if (!inputPassword) {
      setPasswordError('請輸入密碼');
      return;
    }

    onJoinRoom(passwordModal.roomId, inputPassword);
    setPasswordModal({ show: false, roomId: null, roomName: '' });
  };

  return (
    <div className="room-list">
      <h3>可加入的房間</h3>

      {rooms.length === 0 ? (
        <p className="no-rooms">目前沒有可加入的房間</p>
      ) : (
        <ul>
          {rooms.map((room) => (
            <li key={room.id} className="room-item">
              <div className="room-info">
                <span className="room-name">
                  {room.isPrivate && <span className="lock-icon">🔒</span>}
                  {room.name}
                </span>
                <span className="player-count">
                  {room.playerCount}/{room.maxPlayers} 人
                </span>
              </div>
              <button
                onClick={() => handleJoinClick(room)}
                disabled={room.playerCount >= room.maxPlayers}
              >
                {room.playerCount >= room.maxPlayers ? '已滿' : '加入'}
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* 密碼輸入 Modal */}
      {passwordModal.show && (
        <div className="modal-overlay">
          <div className="modal password-modal">
            <h3>🔒 私人房間</h3>
            <p>「{passwordModal.roomName}」需要密碼才能加入</p>

            <input
              type="password"
              value={inputPassword}
              onChange={(e) => {
                setInputPassword(e.target.value);
                setPasswordError('');
              }}
              placeholder="請輸入房間密碼"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handlePasswordSubmit();
                }
              }}
            />

            {passwordError && (
              <p className="error-message">{passwordError}</p>
            )}

            <div className="modal-actions">
              <button
                className="cancel-btn"
                onClick={() => setPasswordModal({ show: false, roomId: null, roomName: '' })}
              >
                取消
              </button>
              <button
                className="submit-btn"
                onClick={handlePasswordSubmit}
              >
                加入
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RoomList;
```

### 6. 前端：Socket 事件處理

```javascript
// frontend/src/services/socketService.js

// 監聽密碼驗證失敗
socket.on('error', (data) => {
  if (data.message === '密碼錯誤') {
    // 顯示密碼錯誤提示
    showPasswordError('密碼錯誤，請重新輸入');
  } else {
    // 其他錯誤
    showError(data.message);
  }
});

// 監聽需要密碼
socket.on('passwordRequired', ({ gameId }) => {
  // 顯示密碼輸入框
  showPasswordModal(gameId);
});
```

### 7. CSS 樣式

```css
/* frontend/src/styles/RoomList.css */

.room-item .lock-icon {
  margin-right: 8px;
}

.password-modal {
  background: white;
  padding: 24px;
  border-radius: 12px;
  max-width: 400px;
  width: 90%;
}

.password-modal h3 {
  margin-bottom: 12px;
}

.password-modal input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
  margin: 16px 0;
}

.password-modal .error-message {
  color: #e74c3c;
  font-size: 14px;
  margin-top: -8px;
  margin-bottom: 16px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.toggle-password {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
}

.password-input-wrapper {
  position: relative;
}
```

## 受影響檔案

### 後端
- `backend/server.js`
  - `createRoom` 事件處理
  - `joinRoom` 事件處理
  - `getAvailableRooms` 函數

### 前端
- `frontend/src/components/CreateRoom/CreateRoom.jsx`（新增或修改）
- `frontend/src/components/RoomList/RoomList.jsx`（修改）
- `frontend/src/services/socketService.js`（修改）
- `frontend/src/styles/RoomList.css`（修改）

## 測試案例

### 案例 1：建立公開房間
1. 不勾選「私人房間」
2. 建立房間
3. 房間列表顯示時不顯示鎖頭
4. 其他玩家可直接加入

### 案例 2：建立私人房間
1. 勾選「私人房間」
2. 輸入密碼「1234」
3. 建立房間
4. 房間列表顯示鎖頭圖示 🔒

### 案例 3：加入私人房間 - 密碼正確
1. 點擊私人房間的「加入」按鈕
2. 彈出密碼輸入框
3. 輸入正確密碼「1234」
4. 成功加入房間

### 案例 4：加入私人房間 - 密碼錯誤
1. 點擊私人房間的「加入」按鈕
2. 輸入錯誤密碼「0000」
3. 顯示「密碼錯誤」錯誤訊息
4. 可重新輸入密碼

### 案例 5：密碼驗證
1. 輸入 3 位密碼 → 顯示錯誤
2. 輸入 17 位密碼 → 限制輸入
3. 不輸入密碼直接送出 → 顯示錯誤

## UI 設計

### 建立房間
```
┌─────────────────────────────────────┐
│         建立新房間                   │
├─────────────────────────────────────┤
│  最大玩家數                          │
│  ┌─────────────────────────────┐   │
│  │ 4 人                      ▼ │   │
│  └─────────────────────────────┘   │
│                                     │
│  [✓] 設為私人房間                    │
│                                     │
│  房間密碼                            │
│  ┌─────────────────────────────┐   │
│  │ ●●●●●●          👁️         │   │
│  └─────────────────────────────┘   │
│  密碼長度：4-16 個字元               │
│                                     │
│  ┌─────────────────────────────┐   │
│  │          建立房間            │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

### 房間列表
```
┌─────────────────────────────────────┐
│  可加入的房間                        │
├─────────────────────────────────────┤
│  小明的房間              2/4  [加入] │
│  🔒 小華的房間           1/4  [加入] │
│  小王的房間              3/4  [加入] │
│  🔒 小李的房間           4/4  [已滿] │
└─────────────────────────────────────┘
```

### 密碼輸入框
```
┌─────────────────────────────────────┐
│  🔒 私人房間                         │
├─────────────────────────────────────┤
│  「小華的房間」需要密碼才能加入       │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 請輸入房間密碼               │   │
│  └─────────────────────────────┘   │
│  ❌ 密碼錯誤，請重新輸入             │
│                                     │
│              [取消]  [加入]          │
└─────────────────────────────────────┘
```

## 驗收標準

- [ ] 後端：`createRoom` 支援 password 參數
- [ ] 後端：`joinRoom` 驗證密碼
- [ ] 後端：房間列表包含 `isPrivate` 欄位
- [ ] 前端：建立房間可設定密碼
- [ ] 前端：房間列表顯示鎖頭圖示
- [ ] 前端：加入私人房間時顯示密碼輸入框
- [ ] 前端：密碼錯誤時顯示錯誤訊息
- [ ] 通過所有測試案例
