/**
 * 好友頁面組件
 * 工單 0061
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../firebase';
import {
  searchPlayers,
  getFriends,
  getFriendRequests,
  sendFriendRequest,
  respondToFriendRequest,
  removeFriend,
} from '../../services/friendService';
import './Friends.css';

function Friends() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('friends');
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadFriends = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const data = await getFriends(user.uid);
      setFriends(data);
    } catch (err) {
      console.error('載入好友失敗:', err);
    }
  }, [user?.uid]);

  const loadRequests = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const data = await getFriendRequests(user.uid);
      setRequests(data);
    } catch (err) {
      console.error('載入請求失敗:', err);
    }
  }, [user?.uid]);

  useEffect(() => {
    loadFriends();
    loadRequests();
  }, [loadFriends, loadRequests]);

  const handleSearch = async () => {
    if (!user?.uid || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const results = await searchPlayers(searchQuery, user.uid);
      setSearchResults(results);
    } catch (err) {
      setError('搜尋失敗');
      console.error('搜尋失敗:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (toUserId) => {
    if (!user?.uid) return;

    try {
      const result = await sendFriendRequest(user.uid, toUserId);
      if (result.autoAccepted) {
        alert('你們互相發送了好友請求，已自動成為好友！');
        loadFriends();
      } else {
        alert('好友請求已發送！');
      }
      // 從搜尋結果中移除已發送請求的玩家
      setSearchResults(prev => prev.filter(p => p.id !== toUserId));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRespondRequest = async (requestId, action) => {
    if (!user?.uid) return;

    try {
      await respondToFriendRequest(requestId, user.uid, action);
      setRequests(prev => prev.filter(r => r.id !== requestId));
      if (action === 'accept') {
        loadFriends();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRemoveFriend = async (friendId) => {
    if (!user?.uid) return;
    if (!window.confirm('確定要刪除這位好友嗎？')) return;

    try {
      await removeFriend(friendId, user.uid);
      setFriends(prev => prev.filter(f => f.friend.id !== friendId));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'online':
        return <span className="status-dot online" title="線上"></span>;
      case 'in_game':
        return <span className="status-dot in-game" title="遊戲中"></span>;
      default:
        return <span className="status-dot offline" title="離線"></span>;
    }
  };

  return (
    <div className="friends-page">
      <div className="friends-container">
        <button className="back-btn" onClick={handleBack}>
          ← 返回大廳
        </button>

        <h1 className="friends-title">好友</h1>

        {/* 標籤頁 */}
        <div className="friends-tabs">
          <button
            className={`tab-btn ${activeTab === 'friends' ? 'active' : ''}`}
            onClick={() => setActiveTab('friends')}
          >
            好友 ({friends.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
            onClick={() => setActiveTab('requests')}
          >
            請求
            {requests.length > 0 && (
              <span className="badge">{requests.length}</span>
            )}
          </button>
          <button
            className={`tab-btn ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => setActiveTab('search')}
          >
            搜尋
          </button>
        </div>

        {error && <div className="friends-error">{error}</div>}

        {/* 好友列表 */}
        {activeTab === 'friends' && (
          <div className="friends-list">
            {friends.length === 0 ? (
              <div className="empty-state">
                <p>還沒有好友</p>
                <p className="hint">去搜尋頁面找玩家加好友吧！</p>
              </div>
            ) : (
              friends.map(({ friend }) => (
                <div key={friend.id} className="friend-item">
                  <div className="friend-avatar">
                    {friend.avatar_url ? (
                      <img src={friend.avatar_url} alt="" />
                    ) : (
                      <div className="avatar-placeholder">
                        {(friend.display_name || '?')[0]}
                      </div>
                    )}
                    {getStatusIcon(friend.presence?.status)}
                  </div>
                  <div className="friend-info">
                    <span className="friend-name">{friend.display_name}</span>
                    <span className="friend-stats">
                      {friend.games_won} 勝 / {friend.games_played} 場
                    </span>
                  </div>
                  <div className="friend-actions">
                    <button
                      className="remove-btn"
                      onClick={() => handleRemoveFriend(friend.id)}
                    >
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
              <div className="empty-state">
                <p>沒有待處理的好友請求</p>
              </div>
            ) : (
              requests.map((request) => (
                <div key={request.id} className="request-item">
                  <div className="request-avatar">
                    {request.from_user?.avatar_url ? (
                      <img src={request.from_user.avatar_url} alt="" />
                    ) : (
                      <div className="avatar-placeholder">
                        {(request.from_user?.display_name || '?')[0]}
                      </div>
                    )}
                  </div>
                  <div className="request-info">
                    <span className="request-name">
                      {request.from_user?.display_name || '未知玩家'}
                    </span>
                    {request.message && (
                      <span className="request-message">{request.message}</span>
                    )}
                  </div>
                  <div className="request-actions">
                    <button
                      className="accept-btn"
                      onClick={() => handleRespondRequest(request.id, 'accept')}
                    >
                      接受
                    </button>
                    <button
                      className="reject-btn"
                      onClick={() => handleRespondRequest(request.id, 'reject')}
                    >
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
                placeholder="輸入玩家暱稱搜尋..."
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button
                className="search-btn"
                onClick={handleSearch}
                disabled={loading || searchQuery.length < 2}
              >
                {loading ? '搜尋中...' : '搜尋'}
              </button>
            </div>

            <div className="search-results">
              {searchResults.length === 0 && searchQuery.length >= 2 && !loading && (
                <div className="empty-state">
                  <p>找不到符合的玩家</p>
                </div>
              )}
              {searchResults.map((player) => (
                <div key={player.id} className="player-item">
                  <div className="player-avatar">
                    {player.avatar_url ? (
                      <img src={player.avatar_url} alt="" />
                    ) : (
                      <div className="avatar-placeholder">
                        {(player.display_name || '?')[0]}
                      </div>
                    )}
                  </div>
                  <div className="player-info">
                    <span className="player-name">{player.display_name}</span>
                    <span className="player-stats">
                      {player.games_won} 勝 · {player.win_rate}% 勝率
                    </span>
                  </div>
                  <button
                    className="add-btn"
                    onClick={() => handleSendRequest(player.id)}
                  >
                    加好友
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Friends;
