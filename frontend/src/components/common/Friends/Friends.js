/**
 * 好友頁面組件
 * 工單 0061, 0140
 * 中國風草藥主題設計
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../firebase';
import {
  searchPlayers,
  getFriends,
  getFriendRequests,
  sendFriendRequest,
  respondToFriendRequest,
  removeFriend,
} from '../../../services/friendService';
import './Friends.css';

function Friends() {
  const navigate = useNavigate();
  const { t } = useTranslation();
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
    // 返回上一頁（可能是本草大廳或演化論大廳）
    navigate(-1);
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
      {/* Background Decorations */}
      <div className="bg-decoration bg-decoration-top"></div>
      <div className="bg-decoration bg-decoration-bottom"></div>

      <div className="friends-layout">
        {/* 導航欄 */}
        <header className="friends-nav">
          <button className="back-btn" onClick={handleBack}>
            {t('friends.backToLobby')}
          </button>
          <div className="nav-brand">
            <svg className="nav-icon" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path d="M36.7273 44C33.9891 44 31.6043 39.8386 30.3636 33.69C29.123 39.8386 26.7382 44 24 44C21.2618 44 18.877 39.8386 17.6364 33.69C16.3957 39.8386 14.0109 44 11.2727 44C7.25611 44 4 35.0457 4 24C4 12.9543 7.25611 4 11.2727 4C14.0109 4 16.3957 8.16144 17.6364 14.31C18.877 8.16144 21.2618 4 24 4C26.7382 4 29.123 8.16144 30.3636 14.31C31.6043 8.16144 33.9891 4 36.7273 4C40.7439 4 44 12.9543 44 24C44 35.0457 40.7439 44 36.7273 44Z" fill="currentColor"></path>
            </svg>
            <span className="nav-title">Herbalism</span>
          </div>
        </header>

        <main className="friends-main">
          <div className="friends-card">
            <h1 className="friends-title">{t('friends.title')}</h1>

            {/* 標籤頁 */}
            <div className="friends-tabs">
              <button
                className={`tab-btn ${activeTab === 'friends' ? 'active' : ''}`}
                onClick={() => setActiveTab('friends')}
              >
                {t('friends.tab.friends', { count: friends.length })}
              </button>
              <button
                className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
                onClick={() => setActiveTab('requests')}
              >
                {t('friends.tab.requests')}
                {requests.length > 0 && (
                  <span className="badge">{requests.length}</span>
                )}
              </button>
              <button
                className={`tab-btn ${activeTab === 'search' ? 'active' : ''}`}
                onClick={() => setActiveTab('search')}
              >
                {t('friends.tab.search')}
              </button>
            </div>

            {error && <div className="friends-error">{error}</div>}

            {/* 好友列表 */}
            {activeTab === 'friends' && (
              <div className="friends-list">
                {friends.length === 0 ? (
                  <div className="empty-state">
                    <p>{t('friends.empty.title')}</p>
                    <p className="hint">{t('friends.empty.hint')}</p>
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
                          {t('friends.button.remove')}
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
                    <p>{t('friends.requests.empty')}</p>
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
                          {t('friends.button.accept')}
                        </button>
                        <button
                          className="reject-btn"
                          onClick={() => handleRespondRequest(request.id, 'reject')}
                        >
                          {t('friends.button.reject')}
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
                    placeholder={t('friends.searchPlaceholder')}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <button
                    className="search-btn"
                    onClick={handleSearch}
                    disabled={loading || searchQuery.length < 2}
                  >
                    {loading ? t('friends.searching') : t('friends.searchBtn')}
                  </button>
                </div>

                <div className="search-results">
                  {searchResults.length === 0 && searchQuery.length >= 2 && !loading && (
                    <div className="empty-state">
                      <p>{t('friends.noResults')}</p>
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
                        {t('friends.button.addFriend')}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>

        <footer className="friends-footer">
          <p>{t('common.copyright')}</p>
        </footer>
      </div>
    </div>
  );
}

export default Friends;
