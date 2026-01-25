# 工作單 0090

**日期：** 2026-01-25

**工作單標題：** 好友系統 - 前端頁面與即時通知實作

**工單主旨：** 功能開發 - 實作好友頁面 UI 與 Socket.io 即時通知

**相關工單：** 0061, 0089

**依賴工單：** 0089（後端 API）

---

## 一、功能概述

### 1.1 頁面功能

- 好友列表（顯示線上狀態）
- 好友請求管理（接受/拒絕）
- 搜尋玩家並加好友
- 邀請好友加入遊戲

### 1.2 即時通知

- 新好友請求通知
- 好友上線/離線通知
- 遊戲邀請通知

---

## 二、前端實作

### 2.1 組件結構

```
frontend/src/components/Friends/
├── index.js
├── FriendsPage.js          // 主頁面
├── FriendsPage.css         // 樣式
├── FriendsList.js          // 好友列表
├── FriendRequestList.js    // 好友請求列表
├── PlayerSearch.js         // 玩家搜尋
└── InviteButton.js         // 邀請按鈕
```

### 2.2 FriendsPage.js

```jsx
/**
 * 好友頁面
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import {
  getFriends,
  getFriendRequests,
  sendFriendRequest,
  respondToFriendRequest,
  removeFriend,
  searchPlayers,
} from '../../services/friendService';
import FriendsList from './FriendsList';
import FriendRequestList from './FriendRequestList';
import PlayerSearch from './PlayerSearch';
import './FriendsPage.css';

// 標籤頁類型
const TABS = {
  FRIENDS: 'friends',
  REQUESTS: 'requests',
  SEARCH: 'search',
};

function FriendsPage({ currentRoomId, onBack }) {
  const { user } = useAuth();
  const socket = useSocket();

  // 狀態
  const [activeTab, setActiveTab] = useState(TABS.FRIENDS);
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 初始載入
  useEffect(() => {
    loadFriendsData();
    setupSocketListeners();

    return () => {
      cleanupSocketListeners();
    };
  }, []);

  // 載入好友資料
  const loadFriendsData = async () => {
    setLoading(true);
    try {
      const [friendsData, requestsData] = await Promise.all([
        getFriends(),
        getFriendRequests(),
      ]);
      setFriends(friendsData);
      setRequests(requestsData);
    } catch (err) {
      setError('載入失敗');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Socket 事件監聽
  const setupSocketListeners = () => {
    if (!socket) return;

    // 新好友請求
    socket.on('newFriendRequest', (data) => {
      console.log('收到新好友請求:', data);
      setRequests(prev => [data, ...prev]);
      showNotification(`${data.fromUser.displayName} 想加你好友！`);
    });

    // 好友上線
    socket.on('friendOnline', ({ friendId }) => {
      setFriends(prev => prev.map(f =>
        f.friend.id === friendId
          ? { ...f, friend: { ...f.friend, presence: { status: 'online' } } }
          : f
      ));
    });

    // 好友離線
    socket.on('friendOffline', ({ friendId }) => {
      setFriends(prev => prev.map(f =>
        f.friend.id === friendId
          ? { ...f, friend: { ...f.friend, presence: { status: 'offline' } } }
          : f
      ));
    });

    // 好友進入遊戲
    socket.on('friendInGame', ({ friendId, roomId }) => {
      setFriends(prev => prev.map(f =>
        f.friend.id === friendId
          ? { ...f, friend: { ...f.friend, presence: { status: 'in_game', current_room_id: roomId } } }
          : f
      ));
    });
  };

  const cleanupSocketListeners = () => {
    if (!socket) return;
    socket.off('newFriendRequest');
    socket.off('friendOnline');
    socket.off('friendOffline');
    socket.off('friendInGame');
  };

  // 顯示通知
  const showNotification = (message) => {
    // 瀏覽器通知
    if (Notification.permission === 'granted') {
      new Notification('Gress 推理桌遊', { body: message });
    }
    // 可加入 toast 通知
  };

  // 搜尋玩家
  const handleSearch = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const results = await searchPlayers(query);
      setSearchResults(results);
    } catch (err) {
      console.error('搜尋失敗:', err);
    }
  };

  // 發送好友請求
  const handleSendRequest = async (toUserId) => {
    try {
      const result = await sendFriendRequest(toUserId);

      if (result.autoAccepted) {
        // 自動互加，重新載入好友列表
        loadFriendsData();
        alert('已成為好友！');
      } else {
        // 通知對方
        socket.emit('sendFriendRequest', { toUserId });
        alert('好友請求已發送！');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // 回應好友請求
  const handleRespondRequest = async (requestId, action) => {
    try {
      await respondToFriendRequest(requestId, action);
      setRequests(prev => prev.filter(r => r.id !== requestId));

      if (action === 'accept') {
        loadFriendsData();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // 刪除好友
  const handleRemoveFriend = async (friendId) => {
    if (!window.confirm('確定要刪除這位好友嗎？')) return;

    try {
      await removeFriend(friendId);
      setFriends(prev => prev.filter(f => f.friend.id !== friendId));
    } catch (err) {
      alert(err.message);
    }
  };

  // 邀請好友
  const handleInviteFriend = (friendId) => {
    if (!currentRoomId) {
      alert('請先建立或加入房間');
      return;
    }

    socket.emit('sendGameInvitation', {
      toUserId: friendId,
      roomId: currentRoomId,
    });

    alert('邀請已發送！');
  };

  return (
    <div className="friends-page">
      {/* 返回按鈕 */}
      <button className="back-btn" onClick={onBack}>
        ← 返回
      </button>

      {/* 標題 */}
      <h1 className="page-title">好友</h1>

      {/* 標籤頁 */}
      <div className="tab-bar">
        <button
          className={`tab ${activeTab === TABS.FRIENDS ? 'active' : ''}`}
          onClick={() => setActiveTab(TABS.FRIENDS)}
        >
          好友 ({friends.length})
        </button>
        <button
          className={`tab ${activeTab === TABS.REQUESTS ? 'active' : ''}`}
          onClick={() => setActiveTab(TABS.REQUESTS)}
        >
          請求
          {requests.length > 0 && (
            <span className="badge">{requests.length}</span>
          )}
        </button>
        <button
          className={`tab ${activeTab === TABS.SEARCH ? 'active' : ''}`}
          onClick={() => setActiveTab(TABS.SEARCH)}
        >
          搜尋
        </button>
      </div>

      {/* 內容區 */}
      <div className="tab-content">
        {loading && <div className="loading">載入中...</div>}

        {error && (
          <div className="error">
            <p>{error}</p>
            <button onClick={loadFriendsData}>重試</button>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* 好友列表 */}
            {activeTab === TABS.FRIENDS && (
              <FriendsList
                friends={friends}
                currentRoomId={currentRoomId}
                onInvite={handleInviteFriend}
                onRemove={handleRemoveFriend}
              />
            )}

            {/* 好友請求 */}
            {activeTab === TABS.REQUESTS && (
              <FriendRequestList
                requests={requests}
                onAccept={(id) => handleRespondRequest(id, 'accept')}
                onReject={(id) => handleRespondRequest(id, 'reject')}
              />
            )}

            {/* 搜尋玩家 */}
            {activeTab === TABS.SEARCH && (
              <PlayerSearch
                results={searchResults}
                onSearch={handleSearch}
                onAddFriend={handleSendRequest}
                existingFriendIds={friends.map(f => f.friend.id)}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default FriendsPage;
```

### 2.3 FriendsList.js

```jsx
/**
 * 好友列表組件
 */

import React from 'react';
import PropTypes from 'prop-types';
import './FriendsList.css';

// 狀態圖示
const STATUS_ICONS = {
  online: '🟢',
  in_game: '🎮',
  offline: '⚫',
};

const STATUS_TEXT = {
  online: '線上',
  in_game: '遊戲中',
  offline: '離線',
};

function FriendsList({ friends, currentRoomId, onInvite, onRemove }) {
  if (friends.length === 0) {
    return (
      <div className="empty-list">
        <p>還沒有好友</p>
        <p className="hint">去「搜尋」頁籤加好友吧！</p>
      </div>
    );
  }

  // 排序：線上 > 遊戲中 > 離線
  const sortedFriends = [...friends].sort((a, b) => {
    const order = { online: 0, in_game: 1, offline: 2 };
    const statusA = a.friend.presence?.status || 'offline';
    const statusB = b.friend.presence?.status || 'offline';
    return order[statusA] - order[statusB];
  });

  return (
    <div className="friends-list">
      {sortedFriends.map(({ friend }) => {
        const status = friend.presence?.status || 'offline';
        const isOnline = status === 'online';
        const canInvite = isOnline && currentRoomId;

        return (
          <div key={friend.id} className={`friend-item status-${status}`}>
            {/* 頭像 */}
            <div className="avatar-container">
              <img
                src={friend.avatar_url || '/images/default-avatar.png'}
                alt=""
                className="avatar"
              />
              <span className="status-dot" title={STATUS_TEXT[status]}>
                {STATUS_ICONS[status]}
              </span>
            </div>

            {/* 資訊 */}
            <div className="friend-info">
              <span className="friend-name">{friend.display_name}</span>
              <span className="friend-stats">
                {friend.total_wins} 勝 / {friend.total_games} 場
              </span>
            </div>

            {/* 操作按鈕 */}
            <div className="friend-actions">
              {canInvite && (
                <button
                  className="invite-btn"
                  onClick={() => onInvite(friend.id)}
                >
                  邀請
                </button>
              )}
              <button
                className="remove-btn"
                onClick={() => onRemove(friend.id)}
              >
                刪除
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

FriendsList.propTypes = {
  friends: PropTypes.array.isRequired,
  currentRoomId: PropTypes.string,
  onInvite: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
};

export default FriendsList;
```

### 2.4 遊戲邀請通知組件

```jsx
/**
 * 遊戲邀請通知組件
 * 放在 App 層級，全域顯示
 */

import React, { useState, useEffect } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import './GameInvitationToast.css';

function GameInvitationToast({ onJoinRoom }) {
  const socket = useSocket();
  const [invitations, setInvitations] = useState([]);

  useEffect(() => {
    if (!socket) return;

    socket.on('gameInvitation', (data) => {
      console.log('收到遊戲邀請:', data);
      setInvitations(prev => [...prev, { ...data, id: Date.now() }]);

      // 播放音效
      playSound('/sounds/notification.mp3');
    });

    return () => {
      socket.off('gameInvitation');
    };
  }, [socket]);

  const playSound = (src) => {
    const audio = new Audio(src);
    audio.play().catch(() => {});
  };

  const handleAccept = (invitation) => {
    setInvitations(prev => prev.filter(i => i.id !== invitation.id));
    if (onJoinRoom) {
      onJoinRoom(invitation.roomId);
    }
  };

  const handleReject = (invitationId) => {
    setInvitations(prev => prev.filter(i => i.id !== invitationId));
  };

  if (invitations.length === 0) return null;

  return (
    <div className="invitation-toast-container">
      {invitations.map((inv) => (
        <div key={inv.id} className="invitation-toast">
          <img
            src={inv.fromUser?.avatarUrl || '/images/default-avatar.png'}
            alt=""
            className="inviter-avatar"
          />
          <div className="invitation-content">
            <p className="invitation-text">
              <strong>{inv.fromUser?.displayName}</strong>
              <br />
              邀請你加入遊戲！
            </p>
            <div className="invitation-actions">
              <button
                className="accept-btn"
                onClick={() => handleAccept(inv)}
              >
                加入
              </button>
              <button
                className="reject-btn"
                onClick={() => handleReject(inv.id)}
              >
                拒絕
              </button>
            </div>
          </div>
          <button
            className="close-btn"
            onClick={() => handleReject(inv.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

export default GameInvitationToast;
```

---

## 三、Socket.io 即時通知

### 3.1 後端 Socket 事件

**修改：** `backend/server.js`

```javascript
// 使用者 Socket 對應表
const userSockets = new Map(); // playerId -> socketId

io.on('connection', (socket) => {
  // === 使用者上線 ===
  socket.on('userOnline', async ({ playerId }) => {
    userSockets.set(playerId, socket.id);
    socket.playerId = playerId;

    // 更新線上狀態
    await presenceService.updatePresence(playerId, 'online');

    // 通知好友
    const friends = await friendService.getFriends(playerId);
    friends.forEach(f => {
      const friendSocketId = userSockets.get(f.friend.id);
      if (friendSocketId) {
        io.to(friendSocketId).emit('friendOnline', { friendId: playerId });
      }
    });
  });

  // === 發送好友請求通知 ===
  socket.on('sendFriendRequest', async ({ toUserId }) => {
    const toSocketId = userSockets.get(toUserId);
    if (toSocketId) {
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

  // === 發送遊戲邀請 ===
  socket.on('sendGameInvitation', async ({ toUserId, roomId }) => {
    const toSocketId = userSockets.get(toUserId);
    if (toSocketId) {
      const fromPlayer = await playerService.getPlayerById(socket.playerId);
      const room = gameRooms.get(roomId);

      io.to(toSocketId).emit('gameInvitation', {
        fromUser: {
          id: fromPlayer.id,
          displayName: fromPlayer.display_name,
          avatarUrl: fromPlayer.avatar_url,
        },
        roomId,
        roomName: room?.name || '遊戲房間',
      });
    }
  });

  // === 斷線處理 ===
  socket.on('disconnect', async () => {
    const playerId = socket.playerId;
    if (playerId) {
      userSockets.delete(playerId);
      await presenceService.setOffline(playerId);

      // 通知好友
      const friends = await friendService.getFriends(playerId);
      friends.forEach(f => {
        const friendSocketId = userSockets.get(f.friend.id);
        if (friendSocketId) {
          io.to(friendSocketId).emit('friendOffline', { friendId: playerId });
        }
      });
    }
  });
});
```

---

## 四、樣式設計

### 4.1 FriendsPage.css

```css
.friends-page {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

/* 標籤頁 */
.tab-bar {
  display: flex;
  border-bottom: 2px solid #eee;
  margin-bottom: 20px;
}

.tab {
  flex: 1;
  padding: 12px;
  background: none;
  border: none;
  font-size: 15px;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  position: relative;
}

.tab.active {
  color: #667eea;
}

.tab.active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 2px;
  background: #667eea;
}

.tab .badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  background: #e74c3c;
  color: white;
  border-radius: 10px;
  font-size: 12px;
  margin-left: 6px;
}

/* 好友列表 */
.friends-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.friend-item {
  display: flex;
  align-items: center;
  padding: 14px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.friend-item.status-offline {
  opacity: 0.7;
}

.avatar-container {
  position: relative;
  margin-right: 14px;
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.status-dot {
  position: absolute;
  bottom: 0;
  right: 0;
  font-size: 14px;
}

.friend-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.friend-name {
  font-weight: 600;
  font-size: 16px;
  color: #333;
}

.friend-stats {
  font-size: 13px;
  color: #888;
}

.friend-actions {
  display: flex;
  gap: 8px;
}

.invite-btn,
.remove-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.invite-btn {
  background: #667eea;
  color: white;
}

.remove-btn {
  background: #f5f5f5;
  color: #666;
}

/* 邀請 Toast */
.invitation-toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.invitation-toast {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  animation: slideIn 0.3s ease;
  max-width: 320px;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(100px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
```

---

## 五、驗收標準

### 介面功能
- [ ] 好友列表正確顯示
- [ ] 線上狀態正確更新
- [ ] 好友請求列表正確
- [ ] 玩家搜尋正常

### 互動功能
- [ ] 發送好友請求正常
- [ ] 接受/拒絕請求正常
- [ ] 刪除好友正常
- [ ] 邀請好友正常

### 即時通知
- [ ] 新好友請求即時通知
- [ ] 好友上線/離線即時更新
- [ ] 遊戲邀請 Toast 正常顯示

### 響應式
- [ ] 手機版正常顯示

