/**
 * 好友邀請面板組件
 * Issue #4：顯示線上好友，支援發送遊戲邀請與接收邀請通知
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../firebase/AuthContext';
import {
  getFriends,
  sendGameInvitation,
  getGameInvitations,
  respondToGameInvitation,
} from '../../../services/friendService';
import './FriendInvitePanel.css';

/**
 * 好友邀請面板
 * @param {Object} props
 * @param {string|null} props.currentRoomId - 目前所在的房間 ID（若有，才能邀請）
 * @param {string} props.gameType - 目前大廳的遊戲類型
 * @param {Function} props.onJoinRoom - 點擊接受邀請後的回呼（帶 roomId）
 */
function FriendInvitePanel({ currentRoomId, gameType, onJoinRoom }) {
  const { user } = useAuth();
  const [friends, setFriends] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sendingTo, setSendingTo] = useState(null);

  const loadFriends = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const data = await getFriends(user.uid);
      setFriends(data);
    } catch (err) {
      console.error('[FriendInvitePanel] 載入好友失敗:', err);
    }
  }, [user?.uid]);

  const loadInvitations = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const data = await getGameInvitations(user.uid);
      setInvitations(data || []);
    } catch (err) {
      console.error('[FriendInvitePanel] 載入邀請失敗:', err);
    }
  }, [user?.uid]);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadFriends(), loadInvitations()]).finally(() => setLoading(false));

    const timer = setInterval(() => {
      loadFriends();
      loadInvitations();
    }, 15000);

    return () => clearInterval(timer);
  }, [loadFriends, loadInvitations]);

  const handleSendInvite = async (friendId) => {
    if (!currentRoomId || !user?.uid) return;
    setSendingTo(friendId);
    try {
      await sendGameInvitation(user.uid, friendId, currentRoomId);
      alert('邀請已發送！');
    } catch (err) {
      alert(err.message || '邀請發送失敗');
    } finally {
      setSendingTo(null);
    }
  };

  const handleRespondInvite = async (invitationId, action, roomId) => {
    if (!user?.uid) return;
    try {
      const result = await respondToGameInvitation(invitationId, user.uid, action);
      setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
      if (action === 'accept' && (result?.roomId || roomId)) {
        onJoinRoom && onJoinRoom(result?.roomId || roomId);
      }
    } catch (err) {
      alert(err.message || '操作失敗');
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'online': return 'status-online';
      case 'in_game': return 'status-in-game';
      default: return 'status-offline';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'online': return '線上';
      case 'in_game': return '遊戲中';
      default: return '離線';
    }
  };

  const getInitial = (name) => (name ? name.charAt(0).toUpperCase() : '?');

  if (loading && friends.length === 0) {
    return <div className="fip-loading">載入好友中...</div>;
  }

  return (
    <div className="friend-invite-panel">
      {/* 待處理邀請 */}
      {invitations.length > 0 && (
        <div className="fip-invitations">
          <div className="fip-section-title">
            <span className="material-symbols-outlined">mail</span>
            遊戲邀請 ({invitations.length})
          </div>
          {invitations.map((inv) => (
            <div key={inv.id} className="fip-invitation-item">
              <div className="fip-inv-info">
                <span className="fip-inv-sender">{inv.from_user?.display_name || '玩家'}</span>
                <span className="fip-inv-label">邀請你加入遊戲</span>
              </div>
              <div className="fip-inv-actions">
                <button
                  className="fip-accept-btn"
                  onClick={() => handleRespondInvite(inv.id, 'accept', inv.room_id)}
                >
                  接受
                </button>
                <button
                  className="fip-reject-btn"
                  onClick={() => handleRespondInvite(inv.id, 'reject', null)}
                >
                  拒絕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 好友列表 */}
      <div className="fip-section-title">
        <span className="material-symbols-outlined">group</span>
        好友 ({friends.length})
      </div>

      {friends.length === 0 ? (
        <div className="fip-empty">還沒有好友</div>
      ) : (
        <div className="fip-friends-list">
          {friends.map(({ friend }) => (
            <div key={friend.id} className="fip-friend-item">
              <div className="fip-friend-avatar">
                {friend.avatar_url ? (
                  <img src={friend.avatar_url} alt={friend.display_name} referrerPolicy="no-referrer" />
                ) : (
                  <div className="fip-avatar-placeholder">{getInitial(friend.display_name)}</div>
                )}
                <span
                  className={`fip-status-dot ${getStatusClass(friend.presence?.status)}`}
                  title={getStatusLabel(friend.presence?.status)}
                />
              </div>
              <div className="fip-friend-info">
                <span className="fip-friend-name">{friend.display_name}</span>
                <span className={`fip-friend-status ${getStatusClass(friend.presence?.status)}`}>
                  {getStatusLabel(friend.presence?.status)}
                </span>
              </div>
              {currentRoomId && friend.presence?.status === 'online' && (
                <button
                  className="fip-invite-btn"
                  onClick={() => handleSendInvite(friend.id)}
                  disabled={sendingTo === friend.id}
                  title="邀請加入"
                >
                  {sendingTo === friend.id ? (
                    <span className="material-symbols-outlined fip-sending">schedule</span>
                  ) : (
                    <span className="material-symbols-outlined">person_add</span>
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FriendInvitePanel;
