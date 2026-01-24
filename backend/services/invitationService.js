/**
 * 遊戲邀請服務
 * 工單 0061
 */

const { supabase } = require('../db/supabase');

/**
 * 發送遊戲邀請
 */
async function sendGameInvitation(fromUserId, toUserId, roomId) {
  try {
    // 檢查是否為好友
    const { data: friendship } = await supabase
      .from('friendships')
      .select('id')
      .eq('user_id', fromUserId)
      .eq('friend_id', toUserId)
      .eq('status', 'accepted')
      .maybeSingle();

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
      .maybeSingle();

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
      .select()
      .single();

    if (error) throw error;

    // 取得發送者資訊
    const { data: fromUser } = await supabase
      .from('players')
      .select('display_name, avatar_url')
      .eq('id', fromUserId)
      .single();

    return {
      ...data,
      from_user: fromUser,
    };
  } catch (err) {
    throw err;
  }
}

/**
 * 回應遊戲邀請
 */
async function respondToInvitation(invitationId, userId, action) {
  try {
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
  } catch (err) {
    throw err;
  }
}

/**
 * 取得待處理的遊戲邀請
 */
async function getPendingInvitations(userId) {
  try {
    const { data, error } = await supabase
      .from('game_invitations')
      .select('id, room_id, created_at, expires_at, from_user_id')
      .eq('to_user_id', userId)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (data && data.length > 0) {
      const fromUserIds = data.map(i => i.from_user_id);
      const { data: users } = await supabase
        .from('players')
        .select('id, display_name, avatar_url')
        .in('id', fromUserIds);

      const userMap = new Map(users?.map(u => [u.id, u]) || []);

      return data.map(i => ({
        ...i,
        from_user: userMap.get(i.from_user_id) || null,
      }));
    }

    return data || [];
  } catch (err) {
    console.error('getPendingInvitations 錯誤:', err.message);
    return [];
  }
}

module.exports = {
  sendGameInvitation,
  respondToInvitation,
  getPendingInvitations,
};
