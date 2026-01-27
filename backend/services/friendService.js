/**
 * 好友服務
 * 工單 0061
 */

const { supabase } = require('../db/supabase');

/**
 * 搜尋玩家
 * 工單 0178：過濾匿名玩家、已加好友、已發送請求的玩家
 * @param {string} query - 搜尋關鍵字
 * @param {string} currentPlayerId - 當前使用者 ID（排除自己及相關玩家）
 */
async function searchPlayers(query, currentPlayerId) {
  try {
    // 工單 0178：收集需要排除的玩家 ID
    const excludeIds = [currentPlayerId];

    // 排除已加好友
    const { data: friendships } = await supabase
      .from('friendships')
      .select('friend_id')
      .eq('user_id', currentPlayerId);
    if (friendships) {
      friendships.forEach(f => excludeIds.push(f.friend_id));
    }

    // 排除已發送 pending 請求的對象
    const { data: pendingRequests } = await supabase
      .from('friend_requests')
      .select('to_user_id')
      .eq('from_user_id', currentPlayerId)
      .eq('status', 'pending');
    if (pendingRequests) {
      pendingRequests.forEach(r => excludeIds.push(r.to_user_id));
    }

    // 搜尋玩家：排除匿名玩家 + 排除已有關係的 ID
    const { data, error } = await supabase
      .from('players')
      .select('id, display_name, avatar_url, games_played, games_won, win_rate')
      .not('firebase_uid', 'is', null)
      .not('id', 'in', `(${excludeIds.join(',')})`)
      .ilike('display_name', `%${query}%`)
      .limit(20);

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('searchPlayers 錯誤:', err.message);
    return [];
  }
}

/**
 * 發送好友請求
 */
async function sendFriendRequest(fromUserId, toUserId, message = '') {
  try {
    // 檢查是否已經是好友
    const { data: existing } = await supabase
      .from('friendships')
      .select('id')
      .or(`and(user_id.eq.${fromUserId},friend_id.eq.${toUserId}),and(user_id.eq.${toUserId},friend_id.eq.${fromUserId})`)
      .eq('status', 'accepted')
      .maybeSingle();

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
      .maybeSingle();

    if (existingRequest) {
      throw new Error('已經發送過好友請求了');
    }

    // 檢查對方是否已經發送請求給我
    const { data: reverseRequest } = await supabase
      .from('friend_requests')
      .select('id')
      .eq('from_user_id', toUserId)
      .eq('to_user_id', fromUserId)
      .eq('status', 'pending')
      .maybeSingle();

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
  } catch (err) {
    throw err;
  }
}

/**
 * 接受好友請求
 */
async function acceptFriendRequest(requestId, userId) {
  try {
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
  } catch (err) {
    throw err;
  }
}

/**
 * 拒絕好友請求
 */
async function rejectFriendRequest(requestId, userId) {
  try {
    const { error } = await supabase
      .from('friend_requests')
      .update({ status: 'rejected', responded_at: new Date().toISOString() })
      .eq('id', requestId)
      .eq('to_user_id', userId)
      .eq('status', 'pending');

    if (error) throw error;
    return { success: true };
  } catch (err) {
    throw err;
  }
}

/**
 * 取得好友請求列表
 */
async function getFriendRequests(userId) {
  try {
    const { data, error } = await supabase
      .from('friend_requests')
      .select(`
        id,
        message,
        created_at,
        from_user_id
      `)
      .eq('to_user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // 取得發送者資訊
    if (data && data.length > 0) {
      const fromUserIds = data.map(r => r.from_user_id);
      const { data: users } = await supabase
        .from('players')
        .select('id, display_name, avatar_url')
        .in('id', fromUserIds);

      const userMap = new Map(users?.map(u => [u.id, u]) || []);

      return data.map(r => ({
        ...r,
        from_user: userMap.get(r.from_user_id) || null,
      }));
    }

    return data || [];
  } catch (err) {
    console.error('getFriendRequests 錯誤:', err.message);
    return [];
  }
}

/**
 * 取得好友列表
 */
async function getFriends(userId) {
  try {
    const { data, error } = await supabase
      .from('friendships')
      .select('id, friend_id, created_at')
      .eq('user_id', userId)
      .eq('status', 'accepted');

    if (error) throw error;

    if (!data || data.length === 0) {
      return [];
    }

    // 取得好友詳細資訊
    const friendIds = data.map(f => f.friend_id);
    const { data: friends } = await supabase
      .from('players')
      .select('id, display_name, avatar_url, games_played, games_won, win_rate')
      .in('id', friendIds);

    // 取得線上狀態
    const { data: presenceData } = await supabase
      .from('user_presence')
      .select('user_id, status, current_room_id')
      .in('user_id', friendIds);

    const friendMap = new Map(friends?.map(f => [f.id, f]) || []);
    const presenceMap = new Map(presenceData?.map(p => [p.user_id, p]) || []);

    return data.map(f => ({
      id: f.id,
      created_at: f.created_at,
      friend: {
        ...friendMap.get(f.friend_id),
        presence: presenceMap.get(f.friend_id) || { status: 'offline' },
      },
    }));
  } catch (err) {
    console.error('getFriends 錯誤:', err.message);
    return [];
  }
}

/**
 * 刪除好友
 */
async function removeFriend(userId, friendId) {
  try {
    // 刪除雙向關係
    const { error } = await supabase
      .from('friendships')
      .delete()
      .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    throw err;
  }
}

/**
 * 取得好友請求數量
 */
async function getFriendRequestCount(userId) {
  try {
    const { count, error } = await supabase
      .from('friend_requests')
      .select('id', { count: 'exact', head: true })
      .eq('to_user_id', userId)
      .eq('status', 'pending');

    if (error) throw error;
    return count || 0;
  } catch (err) {
    console.error('getFriendRequestCount 錯誤:', err.message);
    return 0;
  }
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
