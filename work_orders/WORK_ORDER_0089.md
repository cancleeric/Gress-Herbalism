# 工作單 0089

**日期：** 2026-01-25

**工作單標題：** 好友系統 - 資料庫與後端 API 實作

**工單主旨：** 功能開發 - 實作好友系統的資料表結構與 API

**相關工單：** 0061

**依賴工單：** 0055（Supabase 設置）, 0059（Firebase Auth）

---

## 一、功能概述

### 1.1 系統目標

建立完整的好友系統，包含：
- 玩家搜尋
- 好友請求（發送、接受、拒絕）
- 好友列表管理
- 線上狀態追蹤
- 遊戲邀請

### 1.2 功能流程

```
┌─────────────────────────────────────────────────────────────┐
│                       好友系統流程                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  搜尋玩家 ─────────► 發送好友請求 ─────────► 等待對方回應   │
│                                                   │         │
│                                          ┌───────┴───────┐  │
│                                          ▼               ▼  │
│                                       接受            拒絕   │
│                                          │               │  │
│                                          ▼               ▼  │
│                                    成為好友      請求結束   │
│                                          │                  │
│                           ┌──────────────┼──────────────┐   │
│                           ▼              ▼              ▼   │
│                      查看好友列表   邀請遊戲      刪除好友   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 二、資料庫設計

### 2.1 資料表結構

#### 2.1.1 好友請求表 (friend_requests)

```sql
CREATE TABLE friend_requests (
  id SERIAL PRIMARY KEY,

  -- 請求雙方
  from_user_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,

  -- 請求資訊
  message TEXT,                           -- 附加訊息（選填）
  status VARCHAR(20) DEFAULT 'pending',   -- pending, accepted, rejected

  -- 時間戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE,

  -- 約束
  UNIQUE(from_user_id, to_user_id),
  CONSTRAINT no_self_request CHECK (from_user_id != to_user_id)
);

-- 索引
CREATE INDEX idx_friend_requests_to_user ON friend_requests(to_user_id, status);
CREATE INDEX idx_friend_requests_from_user ON friend_requests(from_user_id);
CREATE INDEX idx_friend_requests_created ON friend_requests(created_at DESC);
```

#### 2.1.2 好友關係表 (friendships)

```sql
CREATE TABLE friendships (
  id SERIAL PRIMARY KEY,

  -- 好友雙方（雙向記錄）
  user_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,

  -- 關係狀態
  status VARCHAR(20) DEFAULT 'accepted',  -- accepted, blocked

  -- 時間戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- 約束
  UNIQUE(user_id, friend_id),
  CONSTRAINT no_self_friendship CHECK (user_id != friend_id)
);

-- 索引
CREATE INDEX idx_friendships_user ON friendships(user_id, status);
CREATE INDEX idx_friendships_friend ON friendships(friend_id);
```

#### 2.1.3 遊戲邀請表 (game_invitations)

```sql
CREATE TABLE game_invitations (
  id SERIAL PRIMARY KEY,

  -- 邀請雙方
  from_user_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,

  -- 房間資訊
  room_id VARCHAR(100) NOT NULL,
  room_name VARCHAR(100),

  -- 狀態
  status VARCHAR(20) DEFAULT 'pending',  -- pending, accepted, rejected, expired

  -- 時間戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '5 minutes'),

  -- 約束
  CONSTRAINT valid_expiry CHECK (expires_at > created_at)
);

-- 索引
CREATE INDEX idx_game_invitations_to_user ON game_invitations(to_user_id, status);
CREATE INDEX idx_game_invitations_expires ON game_invitations(expires_at);
```

#### 2.1.4 線上狀態表 (user_presence)

```sql
CREATE TABLE user_presence (
  user_id UUID PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,

  -- 狀態
  status VARCHAR(20) DEFAULT 'offline',  -- online, offline, in_game
  current_room_id VARCHAR(100),

  -- 時間戳
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_user_presence_status ON user_presence(status);
```

### 2.2 Migration 檔案

**檔案：** `backend/db/migration_0089.sql`

```sql
-- Migration: 好友系統資料表
-- 日期: 2026-01-25

BEGIN;

-- 1. 建立好友請求表
CREATE TABLE IF NOT EXISTS friend_requests (
  id SERIAL PRIMARY KEY,
  from_user_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  message TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(from_user_id, to_user_id),
  CONSTRAINT no_self_request CHECK (from_user_id != to_user_id)
);

CREATE INDEX IF NOT EXISTS idx_friend_requests_to_user ON friend_requests(to_user_id, status);
CREATE INDEX IF NOT EXISTS idx_friend_requests_from_user ON friend_requests(from_user_id);

-- 2. 建立好友關係表
CREATE TABLE IF NOT EXISTS friendships (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'accepted',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, friend_id),
  CONSTRAINT no_self_friendship CHECK (user_id != friend_id)
);

CREATE INDEX IF NOT EXISTS idx_friendships_user ON friendships(user_id, status);
CREATE INDEX IF NOT EXISTS idx_friendships_friend ON friendships(friend_id);

-- 3. 建立遊戲邀請表
CREATE TABLE IF NOT EXISTS game_invitations (
  id SERIAL PRIMARY KEY,
  from_user_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  room_id VARCHAR(100) NOT NULL,
  room_name VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '5 minutes')
);

CREATE INDEX IF NOT EXISTS idx_game_invitations_to_user ON game_invitations(to_user_id, status);
CREATE INDEX IF NOT EXISTS idx_game_invitations_expires ON game_invitations(expires_at);

-- 4. 建立線上狀態表
CREATE TABLE IF NOT EXISTS user_presence (
  user_id UUID PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'offline',
  current_room_id VARCHAR(100),
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_presence_status ON user_presence(status);

-- 5. 自動清理過期邀請的函數
CREATE OR REPLACE FUNCTION cleanup_expired_invitations()
RETURNS void AS $$
BEGIN
  UPDATE game_invitations
  SET status = 'expired'
  WHERE status = 'pending' AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

COMMIT;
```

---

## 三、後端 API 實作

### 3.1 好友服務

**檔案：** `backend/services/friendService.js`

```javascript
/**
 * 好友系統服務
 */

const supabase = require('../db/supabase');

/**
 * 搜尋玩家
 * @param {string} query - 搜尋關鍵字
 * @param {string} excludeUserId - 排除的使用者 ID
 * @param {number} limit - 結果數量限制
 */
async function searchPlayers(query, excludeUserId, limit = 20) {
  if (!query || query.length < 2) {
    return [];
  }

  const { data, error } = await supabase
    .from('players')
    .select('id, display_name, avatar_url, total_games, total_wins, win_rate')
    .neq('id', excludeUserId)
    .ilike('display_name', `%${query}%`)
    .limit(limit);

  if (error) throw error;
  return data || [];
}

/**
 * 發送好友請求
 * @param {string} fromUserId - 發送者 ID
 * @param {string} toUserId - 接收者 ID
 * @param {string} message - 附加訊息
 */
async function sendFriendRequest(fromUserId, toUserId, message = '') {
  // 1. 檢查是否已是好友
  const { data: existingFriend } = await supabase
    .from('friendships')
    .select('id')
    .eq('user_id', fromUserId)
    .eq('friend_id', toUserId)
    .eq('status', 'accepted')
    .single();

  if (existingFriend) {
    throw new Error('已經是好友了');
  }

  // 2. 檢查是否已發送過待處理的請求
  const { data: existingRequest } = await supabase
    .from('friend_requests')
    .select('id')
    .eq('from_user_id', fromUserId)
    .eq('to_user_id', toUserId)
    .eq('status', 'pending')
    .single();

  if (existingRequest) {
    throw new Error('已發送過好友請求');
  }

  // 3. 檢查對方是否已發送請求（自動互加）
  const { data: reverseRequest } = await supabase
    .from('friend_requests')
    .select('id')
    .eq('from_user_id', toUserId)
    .eq('to_user_id', fromUserId)
    .eq('status', 'pending')
    .single();

  if (reverseRequest) {
    // 自動接受對方的請求
    await acceptFriendRequest(reverseRequest.id, fromUserId);
    return { autoAccepted: true };
  }

  // 4. 發送新請求
  const { data, error } = await supabase
    .from('friend_requests')
    .insert({
      from_user_id: fromUserId,
      to_user_id: toUserId,
      message: message || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * 接受好友請求
 * @param {number} requestId - 請求 ID
 * @param {string} userId - 接受者 ID
 */
async function acceptFriendRequest(requestId, userId) {
  // 1. 取得並驗證請求
  const { data: request, error: fetchError } = await supabase
    .from('friend_requests')
    .select('*')
    .eq('id', requestId)
    .eq('to_user_id', userId)
    .eq('status', 'pending')
    .single();

  if (fetchError || !request) {
    throw new Error('找不到此好友請求');
  }

  // 2. 更新請求狀態
  const { error: updateError } = await supabase
    .from('friend_requests')
    .update({
      status: 'accepted',
      responded_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  if (updateError) throw updateError;

  // 3. 建立雙向好友關係
  const { error: friendshipError } = await supabase
    .from('friendships')
    .insert([
      { user_id: request.from_user_id, friend_id: request.to_user_id },
      { user_id: request.to_user_id, friend_id: request.from_user_id },
    ]);

  if (friendshipError) throw friendshipError;

  return { success: true };
}

/**
 * 拒絕好友請求
 * @param {number} requestId - 請求 ID
 * @param {string} userId - 拒絕者 ID
 */
async function rejectFriendRequest(requestId, userId) {
  const { error } = await supabase
    .from('friend_requests')
    .update({
      status: 'rejected',
      responded_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .eq('to_user_id', userId)
    .eq('status', 'pending');

  if (error) throw error;
  return { success: true };
}

/**
 * 取得好友請求列表
 * @param {string} userId - 使用者 ID
 */
async function getFriendRequests(userId) {
  const { data, error } = await supabase
    .from('friend_requests')
    .select(`
      id,
      message,
      created_at,
      from_user:from_user_id (
        id,
        display_name,
        avatar_url
      )
    `)
    .eq('to_user_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * 取得好友列表
 * @param {string} userId - 使用者 ID
 */
async function getFriends(userId) {
  const { data, error } = await supabase
    .from('friendships')
    .select(`
      id,
      created_at,
      friend:friend_id (
        id,
        display_name,
        avatar_url,
        total_games,
        total_wins,
        win_rate
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'accepted');

  if (error) throw error;

  // 取得線上狀態
  if (data && data.length > 0) {
    const friendIds = data.map(f => f.friend.id);

    const { data: presenceData } = await supabase
      .from('user_presence')
      .select('user_id, status, current_room_id')
      .in('user_id', friendIds);

    const presenceMap = new Map(
      (presenceData || []).map(p => [p.user_id, p])
    );

    // 合併線上狀態
    return data.map(f => ({
      ...f,
      friend: {
        ...f.friend,
        presence: presenceMap.get(f.friend.id) || { status: 'offline' },
      },
    }));
  }

  return data || [];
}

/**
 * 刪除好友
 * @param {string} userId - 使用者 ID
 * @param {string} friendId - 好友 ID
 */
async function removeFriend(userId, friendId) {
  // 刪除雙向關係
  const { error } = await supabase
    .from('friendships')
    .delete()
    .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`);

  if (error) throw error;
  return { success: true };
}

/**
 * 取得好友請求數量
 * @param {string} userId - 使用者 ID
 */
async function getFriendRequestCount(userId) {
  const { count, error } = await supabase
    .from('friend_requests')
    .select('id', { count: 'exact', head: true })
    .eq('to_user_id', userId)
    .eq('status', 'pending');

  if (error) throw error;
  return count || 0;
}

module.exports = {
  searchPlayers,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriendRequests,
  getFriends,
  removeFriend,
  getFriendRequestCount,
};
```

### 3.2 API 路由

**檔案：** `backend/routes/friendRoutes.js`

```javascript
/**
 * 好友系統 API 路由
 */

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const friendService = require('../services/friendService');
const playerService = require('../services/playerService');

// 搜尋玩家
router.get('/search', verifyToken, async (req, res) => {
  try {
    const { q } = req.query;
    const player = await playerService.getOrCreatePlayer(req.user.uid, {});
    const results = await friendService.searchPlayers(q, player.id);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 取得好友列表
router.get('/', verifyToken, async (req, res) => {
  try {
    const player = await playerService.getOrCreatePlayer(req.user.uid, {});
    const friends = await friendService.getFriends(player.id);
    res.json(friends);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 取得好友請求
router.get('/requests', verifyToken, async (req, res) => {
  try {
    const player = await playerService.getOrCreatePlayer(req.user.uid, {});
    const requests = await friendService.getFriendRequests(player.id);
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 取得好友請求數量
router.get('/requests/count', verifyToken, async (req, res) => {
  try {
    const player = await playerService.getOrCreatePlayer(req.user.uid, {});
    const count = await friendService.getFriendRequestCount(player.id);
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 發送好友請求
router.post('/requests', verifyToken, async (req, res) => {
  try {
    const { toUserId, message } = req.body;

    if (!toUserId) {
      return res.status(400).json({ error: '缺少目標使用者 ID' });
    }

    const player = await playerService.getOrCreatePlayer(req.user.uid, {});
    const result = await friendService.sendFriendRequest(player.id, toUserId, message);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 回應好友請求
router.put('/requests/:requestId', verifyToken, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { action } = req.body;

    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ error: '無效的操作' });
    }

    const player = await playerService.getOrCreatePlayer(req.user.uid, {});

    let result;
    if (action === 'accept') {
      result = await friendService.acceptFriendRequest(Number(requestId), player.id);
    } else {
      result = await friendService.rejectFriendRequest(Number(requestId), player.id);
    }

    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 刪除好友
router.delete('/:friendId', verifyToken, async (req, res) => {
  try {
    const { friendId } = req.params;
    const player = await playerService.getOrCreatePlayer(req.user.uid, {});
    await friendService.removeFriend(player.id, friendId);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
```

---

## 四、API 總覽

| 方法 | 路徑 | 說明 | 需登入 |
|------|------|------|--------|
| GET | `/api/friends/search?q=xxx` | 搜尋玩家 | ✓ |
| GET | `/api/friends` | 取得好友列表 | ✓ |
| GET | `/api/friends/requests` | 取得好友請求 | ✓ |
| GET | `/api/friends/requests/count` | 取得請求數量 | ✓ |
| POST | `/api/friends/requests` | 發送好友請求 | ✓ |
| PUT | `/api/friends/requests/:id` | 回應好友請求 | ✓ |
| DELETE | `/api/friends/:id` | 刪除好友 | ✓ |

---

## 五、測試案例

### 5.1 好友請求流程

```javascript
describe('好友請求', () => {
  test('發送好友請求', async () => {
    const result = await friendService.sendFriendRequest(userA, userB);
    expect(result.id).toBeDefined();
  });

  test('不能重複發送請求', async () => {
    await friendService.sendFriendRequest(userA, userB);
    await expect(friendService.sendFriendRequest(userA, userB))
      .rejects.toThrow('已發送過好友請求');
  });

  test('不能向自己發送請求', async () => {
    await expect(friendService.sendFriendRequest(userA, userA))
      .rejects.toThrow();
  });

  test('接受請求建立好友關係', async () => {
    const request = await friendService.sendFriendRequest(userA, userB);
    await friendService.acceptFriendRequest(request.id, userB);

    const friendsA = await friendService.getFriends(userA);
    const friendsB = await friendService.getFriends(userB);

    expect(friendsA.some(f => f.friend.id === userB)).toBe(true);
    expect(friendsB.some(f => f.friend.id === userA)).toBe(true);
  });
});
```

---

## 六、驗收標準

### 資料庫
- [ ] friend_requests 表建立成功
- [ ] friendships 表建立成功
- [ ] game_invitations 表建立成功
- [ ] user_presence 表建立成功
- [ ] 所有索引建立成功

### API 功能
- [ ] 搜尋玩家正常
- [ ] 發送好友請求正常
- [ ] 接受/拒絕請求正常
- [ ] 取得好友列表正常
- [ ] 刪除好友正常

### 錯誤處理
- [ ] 不能加自己為好友
- [ ] 不能重複發送請求
- [ ] 不能對非好友請求回應

