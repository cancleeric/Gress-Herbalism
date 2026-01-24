# 工作單 0061

**日期：** 2026-01-24

**工作單標題：** 好友系統

**工單主旨：** 帳號系統 - 實現好友功能、邀請遊戲

**內容：**

## 目標

建立完整的好友系統，讓玩家可以加好友、查看好友狀態、邀請好友一起遊戲。

## 依賴

- 工單 0055（Supabase 資料庫設置）完成
- 工單 0059（Firebase Auth 整合）完成
- 工單 0060（分數保存與排行榜）完成

## 功能需求

### 1. 搜尋玩家
- 依暱稱搜尋
- 依玩家 ID 搜尋
- 顯示搜尋結果（頭像、暱稱、統計）

### 2. 好友請求
- 發送好友請求
- 接受/拒絕好友請求
- 好友請求通知

### 3. 好友列表
- 顯示所有好友
- 顯示好友線上狀態（線上/離線/遊戲中）
- 刪除好友

### 4. 邀請遊戲
- 邀請好友加入房間
- 接受/拒絕遊戲邀請
- 遊戲邀請通知

## 技術實作

### 階段 1：資料表設計

```sql
-- 在 Supabase 執行以下 SQL

-- 好友關係表
CREATE TABLE friendships (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES players(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES players(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending',  -- pending, accepted, blocked
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- 確保不會有重複的好友關係
  UNIQUE(user_id, friend_id),
  -- 確保不能加自己為好友
  CONSTRAINT no_self_friendship CHECK (user_id != friend_id)
);

-- 好友請求表（用於追蹤誰發起的請求）
CREATE TABLE friend_requests (
  id SERIAL PRIMARY KEY,
  from_user_id UUID REFERENCES players(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES players(id) ON DELETE CASCADE,
  message TEXT,
  status VARCHAR(20) DEFAULT 'pending',  -- pending, accepted, rejected
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE,

  UNIQUE(from_user_id, to_user_id)
);

-- 遊戲邀請表
CREATE TABLE game_invitations (
  id SERIAL PRIMARY KEY,
  from_user_id UUID REFERENCES players(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES players(id) ON DELETE CASCADE,
  room_id VARCHAR(100) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',  -- pending, accepted, rejected, expired
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '5 minutes')
);

-- 線上狀態表（可選，也可用 Redis）
CREATE TABLE user_presence (
  user_id UUID PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'offline',  -- online, offline, in_game
  current_room_id VARCHAR(100),
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 建立索引
CREATE INDEX idx_friendships_user ON friendships(user_id);
CREATE INDEX idx_friendships_friend ON friendships(friend_id);
CREATE INDEX idx_friendships_status ON friendships(status);
CREATE INDEX idx_friend_requests_to ON friend_requests(to_user_id, status);
CREATE INDEX idx_friend_requests_from ON friend_requests(from_user_id);
CREATE INDEX idx_game_invitations_to ON game_invitations(to_user_id, status);
CREATE INDEX idx_players_display_name ON players(display_name);

-- 自動清理過期邀請的函數（可選）
CREATE OR REPLACE FUNCTION cleanup_expired_invitations()
RETURNS void AS $$
BEGIN
  UPDATE game_invitations
  SET status = 'expired'
  WHERE status = 'pending' AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
```

### 階段 2：後端服務

#### 2.1 好友服務

```javascript
// backend/services/friendService.js

const supabase = require('../db/supabase');

/**
 * 搜尋玩家
 * @param {string} query - 搜尋關鍵字
 * @param {string} excludeUserId - 排除的使用者 ID（自己）
 */
async function searchPlayers(query, excludeUserId) {
  const { data, error } = await supabase
    .from('players')
    .select('id, display_name, avatar_url, total_games, total_wins, win_rate')
    .neq('id', excludeUserId)
    .ilike('display_name', `%${query}%`)
    .limit(20);

  if (error) throw error;
  return data;
}

/**
 * 發送好友請求
 * @param {string} fromUserId - 發送者 ID
 * @param {string} toUserId - 接收者 ID
 * @param {string} message - 附加訊息（選填）
 */
async function sendFriendRequest(fromUserId, toUserId, message = '') {
  // 檢查是否已經是好友
  const { data: existing } = await supabase
    .from('friendships')
    .select('id')
    .or(`and(user_id.eq.${fromUserId},friend_id.eq.${toUserId}),and(user_id.eq.${toUserId},friend_id.eq.${fromUserId})`)
    .eq('status', 'accepted')
    .single();

  if (existing) {
    throw new Error('已經是好友了');
  }

  // 檢查是否已經發送過請求
  const { data: existingRequest } = await supabase
    .from('friend_requests')
    .select('id, status')
    .eq('from_user_id', fromUserId)
    .eq('to_user_id', toUserId)
    .eq('status', 'pending')
    .single();

  if (existingRequest) {
    throw new Error('已經發送過好友請求了');
  }

  // 檢查對方是否已經發送請求給我（自動接受）
  const { data: reverseRequest } = await supabase
    .from('friend_requests')
    .select('id')
    .eq('from_user_id', toUserId)
    .eq('to_user_id', fromUserId)
    .eq('status', 'pending')
    .single();

  if (reverseRequest) {
    // 自動接受
    await acceptFriendRequest(reverseRequest.id, fromUserId);
    return { autoAccepted: true };
  }

  // 發送新請求
  const { data, error } = await supabase
    .from('friend_requests')
    .insert({
      from_user_id: fromUserId,
      to_user_id: toUserId,
      message,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * 接受好友請求
 * @param {number} requestId - 請求 ID
 * @param {string} userId - 接受者 ID（用於驗證）
 */
async function acceptFriendRequest(requestId, userId) {
  // 取得請求資訊
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

  // 更新請求狀態
  await supabase
    .from('friend_requests')
    .update({ status: 'accepted', responded_at: new Date().toISOString() })
    .eq('id', requestId);

  // 建立雙向好友關係
  const { error: friendshipError } = await supabase
    .from('friendships')
    .insert([
      { user_id: request.from_user_id, friend_id: request.to_user_id, status: 'accepted' },
      { user_id: request.to_user_id, friend_id: request.from_user_id, status: 'accepted' },
    ]);

  if (friendshipError) throw friendshipError;

  return { success: true };
}

/**
 * 拒絕好友請求
 * @param {number} requestId - 請求 ID
 * @param {string} userId - 拒絕者 ID（用於驗證）
 */
async function rejectFriendRequest(requestId, userId) {
  const { error } = await supabase
    .from('friend_requests')
    .update({ status: 'rejected', responded_at: new Date().toISOString() })
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
  return data;
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
  const friendIds = data.map(f => f.friend.id);
  const { data: presenceData } = await supabase
    .from('user_presence')
    .select('user_id, status, current_room_id')
    .in('user_id', friendIds);

  const presenceMap = new Map(presenceData?.map(p => [p.user_id, p]) || []);

  return data.map(f => ({
    ...f,
    friend: {
      ...f.friend,
      presence: presenceMap.get(f.friend.id) || { status: 'offline' },
    },
  }));
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
 * 取得好友請求數量（用於通知 badge）
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

#### 2.2 遊戲邀請服務

```javascript
// backend/services/invitationService.js

const supabase = require('../db/supabase');

/**
 * 發送遊戲邀請
 * @param {string} fromUserId - 發送者 ID
 * @param {string} toUserId - 接收者 ID
 * @param {string} roomId - 房間 ID
 */
async function sendGameInvitation(fromUserId, toUserId, roomId) {
  // 檢查是否為好友
  const { data: friendship } = await supabase
    .from('friendships')
    .select('id')
    .eq('user_id', fromUserId)
    .eq('friend_id', toUserId)
    .eq('status', 'accepted')
    .single();

  if (!friendship) {
    throw new Error('只能邀請好友');
  }

  // 檢查是否已經有待處理的邀請
  const { data: existing } = await supabase
    .from('game_invitations')
    .select('id')
    .eq('from_user_id', fromUserId)
    .eq('to_user_id', toUserId)
    .eq('room_id', roomId)
    .eq('status', 'pending')
    .single();

  if (existing) {
    throw new Error('已經發送過邀請了');
  }

  // 建立邀請
  const { data, error } = await supabase
    .from('game_invitations')
    .insert({
      from_user_id: fromUserId,
      to_user_id: toUserId,
      room_id: roomId,
    })
    .select(`
      id,
      room_id,
      created_at,
      expires_at,
      from_user:from_user_id (
        display_name,
        avatar_url
      )
    `)
    .single();

  if (error) throw error;
  return data;
}

/**
 * 回應遊戲邀請
 * @param {number} invitationId - 邀請 ID
 * @param {string} userId - 使用者 ID
 * @param {string} action - 'accept' | 'reject'
 */
async function respondToInvitation(invitationId, userId, action) {
  const status = action === 'accept' ? 'accepted' : 'rejected';

  const { data, error } = await supabase
    .from('game_invitations')
    .update({ status })
    .eq('id', invitationId)
    .eq('to_user_id', userId)
    .eq('status', 'pending')
    .select('room_id')
    .single();

  if (error) throw error;
  return data;
}

/**
 * 取得待處理的遊戲邀請
 * @param {string} userId - 使用者 ID
 */
async function getPendingInvitations(userId) {
  const { data, error } = await supabase
    .from('game_invitations')
    .select(`
      id,
      room_id,
      created_at,
      expires_at,
      from_user:from_user_id (
        display_name,
        avatar_url
      )
    `)
    .eq('to_user_id', userId)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

module.exports = {
  sendGameInvitation,
  respondToInvitation,
  getPendingInvitations,
};
```

#### 2.3 線上狀態服務

```javascript
// backend/services/presenceService.js

const supabase = require('../db/supabase');

/**
 * 更新使用者線上狀態
 * @param {string} userId - 使用者 ID
 * @param {string} status - 'online' | 'offline' | 'in_game'
 * @param {string} roomId - 房間 ID（遊戲中時）
 */
async function updatePresence(userId, status, roomId = null) {
  const { error } = await supabase
    .from('user_presence')
    .upsert({
      user_id: userId,
      status,
      current_room_id: roomId,
      last_seen_at: new Date().toISOString(),
    });

  if (error) throw error;
}

/**
 * 設為離線
 * @param {string} userId - 使用者 ID
 */
async function setOffline(userId) {
  await updatePresence(userId, 'offline', null);
}

/**
 * 取得好友的線上狀態
 * @param {string[]} friendIds - 好友 ID 列表
 */
async function getFriendsPresence(friendIds) {
  const { data, error } = await supabase
    .from('user_presence')
    .select('user_id, status, current_room_id, last_seen_at')
    .in('user_id', friendIds);

  if (error) throw error;
  return data;
}

module.exports = {
  updatePresence,
  setOffline,
  getFriendsPresence,
};
```

#### 2.4 API 路由

```javascript
// backend/routes/friendRoutes.js

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const friendService = require('../services/friendService');
const invitationService = require('../services/invitationService');
const playerService = require('../services/playerService');

// 搜尋玩家
router.get('/search', verifyToken, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.json([]);
    }
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
    const { action } = req.body; // 'accept' or 'reject'
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

// 發送遊戲邀請
router.post('/invitations', verifyToken, async (req, res) => {
  try {
    const { toUserId, roomId } = req.body;
    const player = await playerService.getOrCreatePlayer(req.user.uid, {});
    const invitation = await invitationService.sendGameInvitation(player.id, toUserId, roomId);
    res.json(invitation);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 取得遊戲邀請
router.get('/invitations', verifyToken, async (req, res) => {
  try {
    const player = await playerService.getOrCreatePlayer(req.user.uid, {});
    const invitations = await invitationService.getPendingInvitations(player.id);
    res.json(invitations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 回應遊戲邀請
router.put('/invitations/:invitationId', verifyToken, async (req, res) => {
  try {
    const { invitationId } = req.params;
    const { action } = req.body;
    const player = await playerService.getOrCreatePlayer(req.user.uid, {});
    const result = await invitationService.respondToInvitation(Number(invitationId), player.id, action);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
```

### 階段 3：Socket.io 即時通知

```javascript
// backend/server.js - 新增好友相關 Socket 事件

// 儲存使用者 socket 對應
const userSockets = new Map(); // Map<playerId, socketId>

io.on('connection', (socket) => {
  // 使用者上線
  socket.on('userOnline', async ({ playerId }) => {
    userSockets.set(playerId, socket.id);
    socket.playerId = playerId;

    // 更新線上狀態
    await presenceService.updatePresence(playerId, 'online');

    // 通知好友上線
    const friends = await friendService.getFriends(playerId);
    friends.forEach(f => {
      const friendSocketId = userSockets.get(f.friend.id);
      if (friendSocketId) {
        io.to(friendSocketId).emit('friendOnline', { friendId: playerId });
      }
    });
  });

  // 發送好友請求即時通知
  socket.on('sendFriendRequest', async ({ toUserId }) => {
    const toSocketId = userSockets.get(toUserId);
    if (toSocketId) {
      // 取得發送者資訊
      const fromPlayer = await playerService.getPlayerById(socket.playerId);
      io.to(toSocketId).emit('newFriendRequest', {
        fromUser: {
          id: fromPlayer.id,
          displayName: fromPlayer.display_name,
          avatarUrl: fromPlayer.avatar_url,
        },
      });
    }
  });

  // 發送遊戲邀請即時通知
  socket.on('sendGameInvitation', async ({ toUserId, roomId, roomName }) => {
    const toSocketId = userSockets.get(toUserId);
    if (toSocketId) {
      const fromPlayer = await playerService.getPlayerById(socket.playerId);
      io.to(toSocketId).emit('gameInvitation', {
        fromUser: {
          id: fromPlayer.id,
          displayName: fromPlayer.display_name,
          avatarUrl: fromPlayer.avatar_url,
        },
        roomId,
        roomName,
      });
    }
  });

  // 斷線處理
  socket.on('disconnect', async () => {
    if (socket.playerId) {
      userSockets.delete(socket.playerId);
      await presenceService.setOffline(socket.playerId);

      // 通知好友離線
      const friends = await friendService.getFriends(socket.playerId);
      friends.forEach(f => {
        const friendSocketId = userSockets.get(f.friend.id);
        if (friendSocketId) {
          io.to(friendSocketId).emit('friendOffline', { friendId: socket.playerId });
        }
      });
    }
  });
});
```

### 階段 4：前端組件

#### 4.1 好友列表頁面

```jsx
// frontend/src/components/Friends/FriendsPage.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  searchPlayers,
  getFriends,
  getFriendRequests,
  sendFriendRequest,
  respondToFriendRequest,
  removeFriend,
  sendGameInvitation,
} from '../../services/friendService';
import { useSocket } from '../../contexts/SocketContext';
import './FriendsPage.css';

function FriendsPage({ currentRoomId }) {
  const { user } = useAuth();
  const socket = useSocket();
  const [activeTab, setActiveTab] = useState('friends'); // 'friends' | 'requests' | 'search'
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadFriends();
    loadRequests();

    // 監聽即時通知
    socket.on('newFriendRequest', handleNewRequest);
    socket.on('friendOnline', handleFriendOnline);
    socket.on('friendOffline', handleFriendOffline);

    return () => {
      socket.off('newFriendRequest', handleNewRequest);
      socket.off('friendOnline', handleFriendOnline);
      socket.off('friendOffline', handleFriendOffline);
    };
  }, []);

  const loadFriends = async () => {
    try {
      const data = await getFriends();
      setFriends(data);
    } catch (error) {
      console.error('載入好友失敗:', error);
    }
  };

  const loadRequests = async () => {
    try {
      const data = await getFriendRequests();
      setRequests(data);
    } catch (error) {
      console.error('載入請求失敗:', error);
    }
  };

  const handleSearch = async () => {
    if (searchQuery.length < 2) return;
    setLoading(true);
    try {
      const results = await searchPlayers(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('搜尋失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (toUserId) => {
    try {
      await sendFriendRequest(toUserId);
      socket.emit('sendFriendRequest', { toUserId });
      alert('好友請求已發送！');
    } catch (error) {
      alert(error.message);
    }
  };

  const handleRespondRequest = async (requestId, action) => {
    try {
      await respondToFriendRequest(requestId, action);
      setRequests(requests.filter(r => r.id !== requestId));
      if (action === 'accept') {
        loadFriends();
      }
    } catch (error) {
      alert(error.message);
    }
  };

  const handleRemoveFriend = async (friendId) => {
    if (!confirm('確定要刪除這位好友嗎？')) return;
    try {
      await removeFriend(friendId);
      setFriends(friends.filter(f => f.friend.id !== friendId));
    } catch (error) {
      alert(error.message);
    }
  };

  const handleInvite = async (friendId) => {
    if (!currentRoomId) {
      alert('請先建立或加入房間');
      return;
    }
    try {
      await sendGameInvitation(friendId, currentRoomId);
      socket.emit('sendGameInvitation', { toUserId: friendId, roomId: currentRoomId });
      alert('邀請已發送！');
    } catch (error) {
      alert(error.message);
    }
  };

  const handleNewRequest = () => {
    loadRequests();
  };

  const handleFriendOnline = ({ friendId }) => {
    setFriends(prev =>
      prev.map(f =>
        f.friend.id === friendId
          ? { ...f, friend: { ...f.friend, presence: { status: 'online' } } }
          : f
      )
    );
  };

  const handleFriendOffline = ({ friendId }) => {
    setFriends(prev =>
      prev.map(f =>
        f.friend.id === friendId
          ? { ...f, friend: { ...f.friend, presence: { status: 'offline' } } }
          : f
      )
    );
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'online': return '🟢';
      case 'in_game': return '🎮';
      default: return '⚫';
    }
  };

  return (
    <div className="friends-page">
      {/* 標籤頁 */}
      <div className="tabs">
        <button
          className={activeTab === 'friends' ? 'active' : ''}
          onClick={() => setActiveTab('friends')}
        >
          好友 ({friends.length})
        </button>
        <button
          className={activeTab === 'requests' ? 'active' : ''}
          onClick={() => setActiveTab('requests')}
        >
          請求 {requests.length > 0 && <span className="badge">{requests.length}</span>}
        </button>
        <button
          className={activeTab === 'search' ? 'active' : ''}
          onClick={() => setActiveTab('search')}
        >
          搜尋
        </button>
      </div>

      {/* 好友列表 */}
      {activeTab === 'friends' && (
        <div className="friends-list">
          {friends.length === 0 ? (
            <p className="empty">還沒有好友，去搜尋玩家加好友吧！</p>
          ) : (
            friends.map(({ friend }) => (
              <div key={friend.id} className="friend-item">
                <img src={friend.avatar_url || '/images/default-avatar.png'} alt="" className="avatar" />
                <div className="friend-info">
                  <span className="name">
                    {getStatusIcon(friend.presence?.status)} {friend.display_name}
                  </span>
                  <span className="stats">
                    {friend.total_wins} 勝 / {friend.total_games} 場
                  </span>
                </div>
                <div className="actions">
                  {friend.presence?.status === 'online' && currentRoomId && (
                    <button onClick={() => handleInvite(friend.id)} className="invite-btn">
                      邀請
                    </button>
                  )}
                  <button onClick={() => handleRemoveFriend(friend.id)} className="remove-btn">
                    刪除
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 好友請求 */}
      {activeTab === 'requests' && (
        <div className="requests-list">
          {requests.length === 0 ? (
            <p className="empty">沒有待處理的好友請求</p>
          ) : (
            requests.map((request) => (
              <div key={request.id} className="request-item">
                <img src={request.from_user.avatar_url || '/images/default-avatar.png'} alt="" className="avatar" />
                <div className="request-info">
                  <span className="name">{request.from_user.display_name}</span>
                  {request.message && <span className="message">{request.message}</span>}
                </div>
                <div className="actions">
                  <button onClick={() => handleRespondRequest(request.id, 'accept')} className="accept-btn">
                    接受
                  </button>
                  <button onClick={() => handleRespondRequest(request.id, 'reject')} className="reject-btn">
                    拒絕
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 搜尋玩家 */}
      {activeTab === 'search' && (
        <div className="search-section">
          <div className="search-bar">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="輸入玩家暱稱..."
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button onClick={handleSearch} disabled={loading}>
              {loading ? '搜尋中...' : '搜尋'}
            </button>
          </div>

          <div className="search-results">
            {searchResults.map((player) => (
              <div key={player.id} className="player-item">
                <img src={player.avatar_url || '/images/default-avatar.png'} alt="" className="avatar" />
                <div className="player-info">
                  <span className="name">{player.display_name}</span>
                  <span className="stats">
                    {player.total_wins} 勝 • {player.win_rate}% 勝率
                  </span>
                </div>
                <button onClick={() => handleSendRequest(player.id)} className="add-btn">
                  加好友
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default FriendsPage;
```

#### 4.2 遊戲邀請通知組件

```jsx
// frontend/src/components/Notifications/GameInvitationNotification.jsx

import React, { useState, useEffect } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { getPendingInvitations, respondToInvitation } from '../../services/friendService';
import './Notifications.css';

function GameInvitationNotification({ onJoinRoom }) {
  const socket = useSocket();
  const [invitations, setInvitations] = useState([]);

  useEffect(() => {
    loadInvitations();

    socket.on('gameInvitation', handleNewInvitation);

    return () => {
      socket.off('gameInvitation', handleNewInvitation);
    };
  }, []);

  const loadInvitations = async () => {
    try {
      const data = await getPendingInvitations();
      setInvitations(data);
    } catch (error) {
      console.error('載入邀請失敗:', error);
    }
  };

  const handleNewInvitation = (invitation) => {
    setInvitations(prev => [invitation, ...prev]);

    // 播放通知音效
    playNotificationSound();

    // 顯示瀏覽器通知
    if (Notification.permission === 'granted') {
      new Notification(`${invitation.fromUser.displayName} 邀請你加入遊戲！`);
    }
  };

  const handleRespond = async (invitationId, action, roomId) => {
    try {
      await respondToInvitation(invitationId, action);
      setInvitations(prev => prev.filter(i => i.id !== invitationId));

      if (action === 'accept') {
        onJoinRoom(roomId);
      }
    } catch (error) {
      alert(error.message);
    }
  };

  const playNotificationSound = () => {
    const audio = new Audio('/sounds/notification.mp3');
    audio.play().catch(() => {});
  };

  if (invitations.length === 0) return null;

  return (
    <div className="invitation-notifications">
      {invitations.map((invitation) => (
        <div key={invitation.id} className="invitation-toast">
          <img
            src={invitation.from_user?.avatar_url || '/images/default-avatar.png'}
            alt=""
            className="avatar"
          />
          <div className="invitation-content">
            <p>
              <strong>{invitation.from_user?.display_name}</strong> 邀請你加入遊戲！
            </p>
            <div className="invitation-actions">
              <button
                onClick={() => handleRespond(invitation.id, 'accept', invitation.room_id)}
                className="accept-btn"
              >
                加入
              </button>
              <button
                onClick={() => handleRespond(invitation.id, 'reject')}
                className="reject-btn"
              >
                拒絕
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default GameInvitationNotification;
```

## 受影響檔案

### 新增檔案
- `backend/services/friendService.js`
- `backend/services/invitationService.js`
- `backend/services/presenceService.js`
- `backend/routes/friendRoutes.js`
- `frontend/src/services/friendService.js`
- `frontend/src/components/Friends/FriendsPage.jsx`
- `frontend/src/components/Friends/FriendsPage.css`
- `frontend/src/components/Notifications/GameInvitationNotification.jsx`
- `frontend/src/components/Notifications/Notifications.css`

### 修改檔案
- `backend/server.js` - 新增 Socket 事件
- `backend/routes/api.js` - 引入好友路由
- `frontend/src/App.jsx` - 引入通知組件

## 測試案例

### 案例 1：搜尋並加好友
1. 搜尋玩家「小明」
2. 點擊「加好友」
3. 小明收到好友請求通知
4. 小明接受請求
5. 雙方好友列表顯示對方

### 案例 2：好友線上狀態
1. 好友登入時顯示綠點
2. 好友進入遊戲時顯示遊戲中
3. 好友離線時顯示灰點

### 案例 3：邀請好友
1. 建立房間
2. 點擊線上好友的「邀請」按鈕
3. 好友收到邀請通知
4. 好友點擊「加入」
5. 好友成功加入房間

### 案例 4：刪除好友
1. 點擊好友的「刪除」按鈕
2. 確認刪除
3. 好友從列表中移除
4. 對方的好友列表也移除自己

## 驗收標準

- [ ] 資料表建立完成
- [ ] 搜尋玩家功能正常
- [ ] 發送好友請求功能正常
- [ ] 接受/拒絕好友請求功能正常
- [ ] 好友列表顯示正確
- [ ] 好友線上狀態顯示正確
- [ ] 刪除好友功能正常
- [ ] 發送遊戲邀請功能正常
- [ ] 遊戲邀請通知顯示正確
- [ ] 接受邀請後成功加入房間
- [ ] 即時通知（Socket）正常運作
