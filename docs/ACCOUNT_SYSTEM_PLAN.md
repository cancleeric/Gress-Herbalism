# 帳號密碼登入系統 計畫書

**專案名稱：** Gress 推理桌遊 - 帳號系統
**日期：** 2026-01-24
**目標：** 建立完整的使用者帳號系統，包含登入、分數保存、好友功能

---

## 一、系統架構總覽

```
┌─────────────────────────────────────────────────────────────────┐
│                         使用者介面                               │
├─────────────┬─────────────┬─────────────┬─────────────────────────┤
│  登入頁面   │  個人資料   │  好友列表   │      遊戲大廳           │
└─────────────┴─────────────┴─────────────┴─────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Firebase Auth                               │
│         (Google 登入 / Email 登入 / 匿名登入)                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Supabase (PostgreSQL)                          │
│      使用者資料 │ 分數記錄 │ 好友關係 │ 遊戲歷史                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 二、功能模組

### 模組 A：簡易暱稱 + LocalStorage（最簡單）

**目的：** 記住上次使用的暱稱，不需要帳號

**實作方式：**
```javascript
// 儲存暱稱
localStorage.setItem('playerName', '小明');

// 讀取暱稱
const savedName = localStorage.getItem('playerName') || '';
```

**功能：**
- [x] 自動填入上次使用的暱稱
- [x] 可隨時更改暱稱
- [ ] 無法跨裝置同步
- [ ] 無法保存分數記錄

**優點：** 零成本、立即實作
**缺點：** 換裝置就要重新輸入

---

### 模組 B：房間密碼系統

**目的：** 讓房主可以設定密碼，只有知道密碼的人才能加入

**資料結構：**
```javascript
// 房間狀態新增欄位
const roomState = {
  gameId: 'game_123',
  password: 'abc123',      // 房間密碼（可為空）
  isPrivate: true,         // 是否為私人房間
  // ... 其他欄位
};
```

**流程：**
```
建立房間時：
┌─────────────────────────────┐
│  房間名稱：[小明的房間    ]  │
│  設定密碼：[____] (選填)    │
│  [x] 私人房間               │
│           [建立房間]        │
└─────────────────────────────┘

加入房間時：
┌─────────────────────────────┐
│  此房間需要密碼             │
│  請輸入密碼：[____]         │
│           [加入]            │
└─────────────────────────────┘
```

**後端處理：**
```javascript
// 建立房間
socket.on('createRoom', ({ player, maxPlayers, password }) => {
  const roomState = {
    // ...
    password: password || null,
    isPrivate: !!password,
  };
});

// 加入房間
socket.on('joinRoom', ({ gameId, player, password }) => {
  const room = gameRooms.get(gameId);

  if (room.password && room.password !== password) {
    socket.emit('error', { message: '密碼錯誤' });
    return;
  }
  // 正常加入流程
});
```

**優點：** 簡單實作、不需要資料庫
**缺點：** 密碼在房間結束後就消失

---

### 模組 C：Firebase Auth 登入系統

**目的：** 提供多種登入方式，包含 Google 登入

#### 支援的登入方式

| 方式 | 難度 | 說明 |
|------|------|------|
| **Google 登入** | 簡單 | 一鍵登入，最多人用 |
| **Email/密碼** | 簡單 | 傳統註冊方式 |
| **匿名登入** | 最簡單 | 不想註冊的訪客 |
| Facebook 登入 | 中等 | 需要 FB 開發者帳號 |
| GitHub 登入 | 中等 | 適合工程師 |

#### 設置步驟

**1. 建立 Firebase 專案**
1. 前往 [Firebase Console](https://console.firebase.google.com)
2. 建立新專案
3. 啟用 Authentication
4. 啟用想要的登入方式（Google、Email/密碼、匿名）

**2. 安裝 Firebase SDK**
```bash
cd frontend
npm install firebase
```

**3. 初始化 Firebase**
```javascript
// frontend/src/firebase/config.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "gress-game.firebaseapp.com",
  projectId: "gress-game",
  // ... 其他設定
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
```

**4. 實作登入功能**
```javascript
// frontend/src/services/authService.js
import {
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut
} from 'firebase/auth';
import { auth } from '../firebase/config';

// Google 登入
export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

// Email 登入
export async function signInWithEmail(email, password) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

// Email 註冊
export async function registerWithEmail(email, password) {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  return result.user;
}

// 匿名登入
export async function signInAsGuest() {
  const result = await signInAnonymously(auth);
  return result.user;
}

// 登出
export async function logout() {
  await signOut(auth);
}

// 監聽登入狀態
export function onAuthStateChange(callback) {
  return auth.onAuthStateChanged(callback);
}
```

**5. 登入頁面 UI**
```jsx
// frontend/src/components/Auth/LoginPage.jsx
import React, { useState } from 'react';
import { signInWithGoogle, signInWithEmail, signInAsGuest } from '../../services/authService';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="login-page">
      <h1>Gress 推理桌遊</h1>

      {/* Google 登入 */}
      <button onClick={signInWithGoogle} className="google-btn">
        <img src="/google-icon.svg" alt="Google" />
        使用 Google 登入
      </button>

      <div className="divider">或</div>

      {/* Email 登入 */}
      <form onSubmit={(e) => { e.preventDefault(); signInWithEmail(email, password); }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="密碼"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">登入</button>
      </form>

      <div className="divider">或</div>

      {/* 訪客登入 */}
      <button onClick={signInAsGuest} className="guest-btn">
        以訪客身份進入
      </button>
    </div>
  );
}
```

---

### 模組 D：分數保存系統

**目的：** 永久保存玩家的遊戲分數和統計

#### 資料表設計

```sql
-- 玩家資料（連結 Firebase Auth）
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_uid VARCHAR(128) UNIQUE NOT NULL,  -- Firebase 使用者 ID
  email VARCHAR(255),
  display_name VARCHAR(50) NOT NULL,
  avatar_url TEXT,

  -- 統計數據
  total_games INTEGER DEFAULT 0,
  total_wins INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  highest_score INTEGER DEFAULT 0,
  win_rate DECIMAL(5,2) DEFAULT 0,

  -- 時間戳
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP DEFAULT NOW()
);

-- 遊戲記錄
CREATE TABLE game_records (
  id SERIAL PRIMARY KEY,
  game_id VARCHAR(100) NOT NULL,

  -- 遊戲資訊
  player_count INTEGER,
  rounds_played INTEGER,
  duration_seconds INTEGER,
  winner_id UUID REFERENCES players(id),

  created_at TIMESTAMP DEFAULT NOW()
);

-- 玩家遊戲參與記錄
CREATE TABLE game_participants (
  id SERIAL PRIMARY KEY,
  game_record_id INTEGER REFERENCES game_records(id),
  player_id UUID REFERENCES players(id),

  -- 該場遊戲數據
  final_score INTEGER,
  is_winner BOOLEAN DEFAULT FALSE,
  correct_guesses INTEGER DEFAULT 0,
  wrong_guesses INTEGER DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW()
);
```

#### API 設計

```javascript
// 後端 API

// 取得玩家資料
GET /api/players/:firebaseUid

// 更新玩家資料
PUT /api/players/:firebaseUid
Body: { displayName, avatarUrl }

// 取得玩家統計
GET /api/players/:firebaseUid/stats

// 取得排行榜
GET /api/leaderboard?limit=10&sortBy=totalWins

// 記錄遊戲結果
POST /api/games
Body: { gameId, players: [{ id, score, isWinner }] }

// 取得玩家遊戲歷史
GET /api/players/:firebaseUid/history?limit=20
```

#### 前端整合

```javascript
// 遊戲結束時儲存記錄
async function saveGameResult(gameState) {
  const participants = gameState.players.map(p => ({
    id: p.id,
    score: p.score,
    isWinner: p.id === gameState.winner
  }));

  await fetch('/api/games', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${await auth.currentUser.getIdToken()}`
    },
    body: JSON.stringify({
      gameId: gameState.gameId,
      players: participants
    })
  });
}
```

---

### 模組 E：好友系統

**目的：** 讓玩家可以加好友、邀請好友一起玩

#### 資料表設計

```sql
-- 好友關係
CREATE TABLE friendships (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES players(id),
  friend_id UUID REFERENCES players(id),
  status VARCHAR(20) DEFAULT 'pending',  -- pending, accepted, blocked
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, friend_id)
);

-- 好友邀請通知
CREATE TABLE friend_requests (
  id SERIAL PRIMARY KEY,
  from_user_id UUID REFERENCES players(id),
  to_user_id UUID REFERENCES players(id),
  message TEXT,
  status VARCHAR(20) DEFAULT 'pending',  -- pending, accepted, rejected
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 功能流程

```
┌─────────────────────────────────────────────────────────────┐
│                      好友列表頁面                            │
├─────────────────────────────────────────────────────────────┤
│  搜尋玩家：[輸入暱稱或 ID    ] [搜尋]                        │
├─────────────────────────────────────────────────────────────┤
│  好友請求 (2)                                    [展開 ▼]   │
│  ├─ 小明 想加你好友                    [接受] [拒絕]        │
│  └─ 小華 想加你好友                    [接受] [拒絕]        │
├─────────────────────────────────────────────────────────────┤
│  我的好友 (5)                                               │
│  ├─ 🟢 小王 (線上)              [邀請遊戲] [查看資料]       │
│  ├─ 🟢 小李 (遊戲中)            [觀戰] [查看資料]           │
│  ├─ ⚫ 小張 (離線)                       [查看資料]         │
│  └─ ...                                                     │
└─────────────────────────────────────────────────────────────┘
```

#### API 設計

```javascript
// 搜尋玩家
GET /api/players/search?q=小明

// 發送好友請求
POST /api/friends/request
Body: { toUserId: 'xxx' }

// 接受/拒絕好友請求
PUT /api/friends/request/:requestId
Body: { action: 'accept' | 'reject' }

// 取得好友列表
GET /api/friends

// 取得好友請求列表
GET /api/friends/requests

// 刪除好友
DELETE /api/friends/:friendId

// 邀請好友加入房間
POST /api/invitations
Body: { friendId: 'xxx', roomId: 'xxx' }
```

#### 即時通知（Socket.io）

```javascript
// 後端
socket.on('friendRequest', ({ fromUserId, toUserId }) => {
  const targetSocket = findSocketByUserId(toUserId);
  if (targetSocket) {
    targetSocket.emit('newFriendRequest', { fromUserId, fromUserName });
  }
});

socket.on('gameInvitation', ({ fromUserId, toUserId, roomId }) => {
  const targetSocket = findSocketByUserId(toUserId);
  if (targetSocket) {
    targetSocket.emit('gameInvitation', { fromUserName, roomId });
  }
});

// 前端
socket.on('newFriendRequest', ({ fromUserName }) => {
  showNotification(`${fromUserName} 想加你好友！`);
});

socket.on('gameInvitation', ({ fromUserName, roomId }) => {
  showNotification(`${fromUserName} 邀請你加入遊戲！`, {
    actions: [
      { label: '加入', onClick: () => joinRoom(roomId) },
      { label: '拒絕', onClick: () => {} }
    ]
  });
});
```

---

## 三、實作階段建議

### 階段 1：基礎（1-2 天）
- [x] LocalStorage 記住暱稱
- [ ] 房間密碼功能

### 階段 2：登入系統（2-3 天）
- [ ] Firebase 設置
- [ ] Google 登入
- [ ] Email 登入/註冊
- [ ] 匿名登入
- [ ] 登入狀態管理

### 階段 3：分數保存（2-3 天）
- [ ] 資料表建立
- [ ] API 開發
- [ ] 遊戲結束時自動儲存
- [ ] 個人資料頁面
- [ ] 排行榜

### 階段 4：好友系統（3-4 天）
- [ ] 好友資料表建立
- [ ] 搜尋玩家功能
- [ ] 好友請求功能
- [ ] 好友列表頁面
- [ ] 邀請好友功能
- [ ] 即時通知

---

## 四、費用估算

| 服務 | 免費額度 | 預估用量 | 月費用 |
|------|---------|---------|--------|
| Firebase Auth | 無限（大部分功能） | - | $0 |
| Supabase | 500 MB / 50,000 列 | < 100 MB | $0 |
| **總計** | | | **$0** |

---

## 五、安全性考量

### 密碼安全
- Firebase 處理密碼加密，無需自行處理
- 不在前端儲存敏感資訊

### API 安全
- 所有 API 需驗證 Firebase Token
- 後端驗證使用者權限

```javascript
// 後端 middleware
async function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split('Bearer ')[1];
  if (!token) {
    return res.status(401).json({ error: '未授權' });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token 無效' });
  }
}
```

### 資料驗證
- 前端和後端都要驗證輸入
- 防止 SQL Injection（使用 Supabase SDK 已內建防護）

---

## 六、相關工作單

根據此計畫書，建議建立以下工作單：

| 工單編號 | 標題 |
|---------|------|
| 0057 | LocalStorage 記住暱稱功能 |
| 0058 | 房間密碼功能 |
| 0059 | Firebase Auth 整合 |
| 0060 | 分數保存與排行榜 |
| 0061 | 好友系統 |
