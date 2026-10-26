/**
 * Socket.io 連線服務
 * 加強版 - 改善 Cloud Run 連線穩定性
 */

import { io } from 'socket.io-client';
import { onIdTokenChanged } from 'firebase/auth';
import config from '../config';
import { getCurrentRoom, clearCurrentRoom } from '../utils/common/localStorage';

// 從設定檔取得後端 URL 與 Socket.io 路徑
const SOCKET_URL = config.socketUrl;
const SOCKET_PATH = config.socketPath;

/**
 * 連線狀態枚舉（工單 0383）
 */
export const ConnectionState = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
};

let socket = null;
let connectionCallbacks = [];
let heartbeatInterval = null;
let connectionState = ConnectionState.DISCONNECTED;
let authenticatedUid = null;
let unsubscribeAuth = null;
let handshakeRetryTimer = null;
let handshakeRetryAttempt = 0;
let evolutionSession = null;
let presenceUid = null;
let internalEvolutionJoins = new WeakSet();

function clearHandshakeRetry() {
  if (handshakeRetryTimer !== null) clearTimeout(handshakeRetryTimer);
  handshakeRetryTimer = null;
}

function clearIdentityRoom() {
  internalEvolutionJoins = new WeakSet();
  evolutionSession = null;
  presenceUid = null;
  clearCurrentRoom();
  ['lastRoomId', 'lastPlayerId', 'lastPlayerName'].forEach(key => localStorage.removeItem(key));
  // Never replay a previous user's buffered actions under a new identity.
  if (socket) socket.sendBuffer = [];
}

function restoreRoom() {
  const saved = getCurrentRoom();
  const roomId = saved?.roomId || localStorage.getItem('lastRoomId');
  const playerId = saved?.playerId || localStorage.getItem('lastPlayerId');
  const playerName = saved?.playerName || localStorage.getItem('lastPlayerName');
  if (roomId && playerId && playerName) {
    // Stored values are hints only; the server verifies the room owner UID.
    socket.emit('reconnect', { roomId, playerId, playerName });
  }
}

/**
 * 初始化 Socket 連線
 */
export function initSocket() {
  if (socket) return socket;
  // Defer configuration initialization until a real connection is requested.
  const { auth } = require('../firebase/config');

  // 工單 0383：標記為正在連線
  connectionState = ConnectionState.CONNECTING;

  socket = io(SOCKET_URL, {
    autoConnect: false,
    auth: async (done) => {
      try {
        await auth.authStateReady();
        const user = auth.currentUser;
        if (!user) return done({ token: '' });
        const token = await user.getIdToken(false);
        if (auth.currentUser?.uid !== user.uid) return done({ token: '' });
        done({ token });
      } catch {
        done({ token: '' });
      }
    },
    path: SOCKET_PATH,
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,  // 無限重連
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,      // 最大重連延遲 5 秒
    timeout: 20000,                   // 連線超時 20 秒
    pingInterval: 25000,              // 心跳間隔 25 秒
    pingTimeout: 30000,               // 心跳超時 30 秒（與後端一致）
  });
  const ownedSocket = socket;

  socket.on('connect', () => {
    if (socket !== ownedSocket) return;
    clearHandshakeRetry();
    handshakeRetryAttempt = 0;
    console.log('已連線到伺服器');
    connectionState = ConnectionState.CONNECTED;
    connectionCallbacks.forEach(cb => cb(true));
    startHeartbeat();
    const uid = auth.currentUser?.uid;
    if (uid && uid === authenticatedUid && presenceUid === uid) {
      ownedSocket.emit('setPresence', { firebaseUid: uid });
    }
    if (uid && uid === authenticatedUid && evolutionSession?.uid === uid) {
      const { roomId, playerId } = evolutionSession;
      ownedSocket.emit('evo:reconnect', { roomId, playerId });
    } else {
      restoreRoom();
    }
  });

  const rememberEvolutionSession = data => {
    if (socket !== ownedSocket) return;
    const uid = auth.currentUser?.uid;
    if (!uid || uid !== authenticatedUid || !data?.roomId || !Array.isArray(data.room?.players)) return;
    const player = data.room.players.find(candidate => candidate?.firebaseUid === uid);
    if (player?.id) {
      const leaving = evolutionSession?.uid === uid && evolutionSession.roomId === data.roomId && evolutionSession.leaving;
      evolutionSession = { uid, roomId: data.roomId, playerId: player.id };
      if (leaving) {
        internalEvolutionJoins.add(data);
        // The replacement socket now owns the seat; an earlier buffered leave would not.
        ownedSocket.emit('evo:leaveRoom', { roomId: data.roomId, playerId: player.id });
        evolutionSession = null;
      }
    }
  };
  ownedSocket.on('evo:roomCreated', room => rememberEvolutionSession({ roomId: room?.id, room }));
  ownedSocket.on('evo:joinedRoom', rememberEvolutionSession);

  socket.on('disconnect', (reason) => {
    if (socket !== ownedSocket) return;
    console.log('與伺服器斷線，原因:', reason);
    connectionState = ConnectionState.DISCONNECTED;
    connectionCallbacks.forEach(cb => cb(false));
    stopHeartbeat();

    // 如果是伺服器斷開，嘗試重連
    if (reason === 'io server disconnect' && auth.currentUser) {
      socket.connect();
    }
  });

  socket.on('connect_error', (error) => {
    console.error('連線錯誤');
    // Middleware denials stop Socket.IO's own retries (active === false).
    // Transport errors with active === true remain the manager's responsibility.
    const uid = auth.currentUser?.uid;
    if (socket !== ownedSocket || ownedSocket.active !== false || !uid ||
        uid !== authenticatedUid || handshakeRetryTimer !== null) return;
    const delay = Math.min(1000 * (2 ** Math.min(handshakeRetryAttempt++, 3)), 5000);
    handshakeRetryTimer = setTimeout(() => {
      handshakeRetryTimer = null;
      if (socket === ownedSocket && !ownedSocket.connected && ownedSocket.active === false &&
          authenticatedUid === uid && auth.currentUser?.uid === uid) ownedSocket.connect();
    }, delay);
  });

  // 工單 0106, 0184：Socket.io 自動重連時觸發遊戲重連邏輯
  socket.io.on('reconnect_attempt', (attemptNumber) => {
    console.log('嘗試重新連線，第', attemptNumber, '次');
  });

  // 接收伺服器心跳回應
  socket.on('pong', () => {
    // 心跳正常
  });

  unsubscribeAuth = onIdTokenChanged(auth, (user) => {
    if (socket !== ownedSocket) return;
    clearHandshakeRetry();
    handshakeRetryAttempt = 0;
    const nextUid = user?.uid || null;
    if (authenticatedUid && authenticatedUid !== nextUid) clearIdentityRoom();
    authenticatedUid = nextUid;
    // Re-handshake on token refresh as well as identity changes. Anonymous
    // Firebase users follow exactly the same verification path.
    socket.disconnect();
    if (user) socket.connect();
  });

  return socket;
}

/**
 * 啟動心跳機制
 */
function startHeartbeat() {
  stopHeartbeat();
  heartbeatInterval = setInterval(() => {
    if (socket && socket.connected) {
      socket.emit('ping');
    }
  }, 15000); // 工單 0185：每 15 秒發送心跳（原 30 秒）
}

/**
 * 停止心跳機制
 */
function stopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}

/**
 * 取得 Socket 實例
 */
export function getSocket() {
  if (!socket) {
    return initSocket();
  }
  return socket;
}

/**
 * 監聽連線狀態變化
 */
export function onConnectionChange(callback) {
  connectionCallbacks.push(callback);
  // 工單 0381：只在 socket 已連線時才立即通知 true
  // 避免連線過程中誤報斷線狀態
  if (socket && socket.connected) {
    callback(true);
  }
  // 不主動調用 callback(false)，讓 disconnect 事件來處理
  return () => {
    connectionCallbacks = connectionCallbacks.filter(cb => cb !== callback);
  };
}

/**
 * 安全地建立事件監聽（工單 0159）
 * 確保在任何情況下都返回有效的取消訂閱函數
 * @param {string} eventName - 事件名稱
 * @param {Function} callback - 回調函數
 * @returns {Function} 取消訂閱函數
 */
function safeOn(eventName, callback) {
  try {
    const s = getSocket();
    if (!s) {
      return () => {};
    }
    s.on(eventName, callback);
    return () => s.off(eventName, callback);
  } catch (error) {
    console.warn(`[socketService] 無法監聽事件 ${eventName}`);
    return () => {};
  }
}

/**
 * 監聽房間列表更新
 */
export function onRoomList(callback) {
  return safeOn('roomList', callback);
}

/**
 * 工單 0147：主動請求房間列表
 * 確保前端訂閱完成後能獲取最新房間列表
 */
export function requestRoomList() {
  const s = getSocket();
  s.emit('requestRoomList');
}

/**
 * 監聯遊戲狀態更新
 */
export function onGameState(callback) {
  return safeOn('gameState', callback);
}

/**
 * 工單 0148：監聽玩家離開事件
 */
export function onPlayerLeft(callback) {
  return safeOn('playerLeft', callback);
}

// ==================== 工單 0079：重連功能 ====================

/**
 * 嘗試重新連線到房間
 * @param {string} roomId - 房間 ID
 * @param {string} playerId - 玩家 ID
 * @param {string} playerName - 玩家名稱
 */
export function attemptReconnect(roomId, playerId, playerName) {
  const s = getSocket();
  s.emit('reconnect', { roomId, playerId, playerName });
}

/**
 * 監聽重連成功
 */
export function onReconnected(callback) {
  return safeOn('reconnected', callback);
}

/**
 * 監聽重連失敗
 */
export function onReconnectFailed(callback) {
  return safeOn('reconnectFailed', callback);
}

/**
 * 監聽錯誤訊息
 */
export function onError(callback) {
  return safeOn('error', callback);
}

/**
 * 監聽房間創建成功
 */
export function onRoomCreated(callback) {
  return safeOn('roomCreated', callback);
}

/**
 * 監聽加入房間成功
 */
export function onJoinedRoom(callback) {
  return safeOn('joinedRoom', callback);
}

/**
 * 監聽蓋牌揭示
 */
export function onHiddenCardsRevealed(callback) {
  return safeOn('hiddenCardsRevealed', callback);
}

/**
 * 監聽顏色選擇請求（被要牌玩家需要選擇給哪種顏色）
 */
export function onColorChoiceRequired(callback) {
  return safeOn('colorChoiceRequired', callback);
}

/**
 * 監聽等待顏色選擇（通知其他玩家正在等待選擇）
 */
export function onWaitingForColorChoice(callback) {
  return safeOn('waitingForColorChoice', callback);
}

/**
 * 監聽顏色選擇結果
 */
export function onColorChoiceResult(callback) {
  return safeOn('colorChoiceResult', callback);
}

/**
 * 創建房間
 * 工單 0106：保存玩家資訊以便重連
 */
export function createRoom(player, maxPlayers, password = null) {
  const s = getSocket();
  s.emit('createRoom', { player, maxPlayers, password });

  // 保存玩家資訊以便重連
  localStorage.setItem('lastPlayerId', player.id);
  localStorage.setItem('lastPlayerName', player.name);
}

/**
 * 加入房間
 * 工單 0106：保存房間資訊以便重連
 */
export function joinRoom(gameId, player, password = null) {
  const s = getSocket();
  s.emit('joinRoom', { gameId, player, password });

  // 保存房間資訊以便重連
  localStorage.setItem('lastRoomId', gameId);
  localStorage.setItem('lastPlayerId', player.id);
  localStorage.setItem('lastPlayerName', player.name);
}

/**
 * 監聽需要密碼
 */
export function onPasswordRequired(callback) {
  return safeOn('passwordRequired', callback);
}

/**
 * 開始遊戲
 */
export function startGame(gameId) {
  const s = getSocket();
  s.emit('startGame', { gameId });
}

/**
 * 發送遊戲動作
 */
export function sendGameAction(gameId, action) {
  const s = getSocket();
  s.emit('gameAction', { gameId, action });
}

/**
 * 請求查看蓋牌
 */
export function requestRevealHiddenCards(gameId, playerId) {
  const s = getSocket();
  s.emit('revealHiddenCards', { gameId, playerId });
}

/**
 * 離開房間
 * 工單 0106：清除重連資訊
 */
export function leaveRoom(gameId, playerId) {
  const s = getSocket();
  s.emit('leaveRoom', { gameId, playerId });

  // 工單 0184：清除重連資訊（兩組 key 都清除）
  clearCurrentRoom();
  localStorage.removeItem('lastRoomId');
  localStorage.removeItem('lastPlayerId');
  localStorage.removeItem('lastPlayerName');
}

/**
 * 提交顏色選擇（被要牌玩家選擇給哪種顏色）
 */
export function submitColorChoice(gameId, chosenColor) {
  const s = getSocket();
  s.emit('colorChoiceSubmit', { gameId, chosenColor });
}

// ==================== 跟猜相關 ====================

/**
 * 監聽跟猜開始
 */
export function onFollowGuessStarted(callback) {
  return safeOn('followGuessStarted', callback);
}

/**
 * 監聽跟猜狀態更新
 */
export function onFollowGuessUpdate(callback) {
  return safeOn('followGuessUpdate', callback);
}

/**
 * 監聽猜牌結果
 */
export function onGuessResult(callback) {
  return safeOn('guessResult', callback);
}

/**
 * 監聽局開始
 */
export function onRoundStarted(callback) {
  return safeOn('roundStarted', callback);
}

/**
 * 提交跟猜決定
 */
export function submitFollowGuessResponse(gameId, playerId, isFollowing) {
  const s = getSocket();
  s.emit('followGuessResponse', { gameId, playerId, isFollowing });
}

/**
 * 開始下一局
 */
export function startNextRound(gameId) {
  const s = getSocket();
  s.emit('startNextRound', { gameId });
}

/**
 * 工單 0172：發送關閉猜牌結果面板
 */
export function dismissGuessResult(gameId) {
  const s = getSocket();
  s.emit('dismissGuessResult', { gameId });
}

/**
 * 工單 0207：確認猜牌結果（全員確認機制）
 */
export function confirmGuessResult(gameId, playerId) {
  const s = getSocket();
  s.emit('confirmGuessResult', { gameId, playerId });
}

/**
 * 工單 0172：監聽猜牌結果面板關閉
 */
export function onGuessResultDismissed(callback) {
  return safeOn('guessResultDismissed', callback);
}

// ==================== 工單 0176：線上狀態 ====================

/**
 * 發送線上狀態給後端
 * @param {string} firebaseUid - Firebase UID
 */
export function setPresence(firebaseUid) {
  const s = getSocket();
  const { auth } = require('../firebase/config');
  if (!firebaseUid || auth.currentUser?.uid !== firebaseUid || auth.currentUser.isAnonymous) return;
  presenceUid = firebaseUid;
  // Disconnected emits would also be replayed by Socket.IO's send buffer.
  if (s?.connected) s.emit('setPresence', { firebaseUid });
}

// ==================== 預測相關（工單 0071）====================

/**
 * 監聽進入問牌後階段（顯示預測選項）
 */
export function onPostQuestionPhase(callback) {
  return safeOn('postQuestionPhase', callback);
}

/**
 * 監聽回合結束（玩家結束回合並可能有預測）
 */
export function onTurnEnded(callback) {
  return safeOn('turnEnded', callback);
}

/**
 * 結束回合（可附帶預測）
 * @param {string} gameId - 遊戲 ID
 * @param {string} playerId - 玩家 ID
 * @param {string|null} prediction - 預測的顏色，null 表示不預測
 */
export function endTurn(gameId, playerId, prediction) {
  const s = getSocket();
  s.emit('endTurn', { gameId, playerId, prediction });
}

// ==================== 給牌通知相關（工單 0072）====================

/**
 * 監聽給牌通知（私密訊息給被要牌玩家）
 */
export function onCardGiveNotification(callback) {
  return safeOn('cardGiveNotification', callback);
}

// ==================== 工單 0118：重連時序優化 ====================

/**
 * 通知後端玩家正在重整頁面
 * @param {string} gameId - 遊戲 ID
 * @param {string} playerId - 玩家 ID
 */
export function emitPlayerRefreshing(gameId, playerId) {
  const s = getSocket();
  if (s && s.connected) {
    s.emit('playerRefreshing', { gameId, playerId });
  }
}

/**
 * 斷開連線
 */
export function disconnect() {
  clearHandshakeRetry();
  handshakeRetryAttempt = 0;
  if (unsubscribeAuth) {
    unsubscribeAuth();
    unsubscribeAuth = null;
  }
  stopHeartbeat();
  authenticatedUid = null;
  internalEvolutionJoins = new WeakSet();
  evolutionSession = null;
  presenceUid = null;
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

// ==================== 工單 0272：演化論遊戲 Socket 服務 ====================

/**
 * 創建演化論房間
 * @param {string} roomName - 房間名稱
 * @param {number} maxPlayers - 最大玩家數
 * @param {Object} player - 玩家資訊 { id, name }
 */
export function evoCreateRoom(roomName, maxPlayers, player) {
  const s = getSocket();
  console.log('[socketService] evoCreateRoom - socket:', s ? 'exists' : 'null');
  console.log('[socketService] evoCreateRoom - connected:', s?.connected);
  s.emit('evo:createRoom', { roomName, maxPlayers, player });
  console.log('[socketService] evoCreateRoom - emit 完成');
}

/**
 * 加入演化論房間
 * @param {string} roomId - 房間 ID
 * @param {Object} player - 玩家資訊 { id, name }
 */
export function evoJoinRoom(roomId, player) {
  const s = getSocket();
  s.emit('evo:joinRoom', { roomId, player });
}

/**
 * 離開演化論房間
 * @param {string} roomId - 房間 ID
 * @param {string} playerId - 玩家 ID
 */
export function evoLeaveRoom(roomId, playerId) {
  const s = getSocket();
  if (!s.connected) {
    if (evolutionSession?.roomId === roomId) evolutionSession.leaving = true;
    return;
  }
  if (evolutionSession?.roomId === roomId) evolutionSession = null;
  s.emit('evo:leaveRoom', { roomId, playerId });
}

/**
 * 設定準備狀態
 * @param {string} roomId - 房間 ID
 * @param {string} playerId - 玩家 ID
 * @param {boolean} isReady - 是否準備
 */
export function evoSetReady(roomId, playerId, isReady) {
  const s = getSocket();
  s.emit('evo:setReady', { roomId, playerId, isReady });
}

/**
 * 開始演化論遊戲
 * @param {string} roomId - 房間 ID
 * @param {string} playerId - 玩家 ID
 */
export function evoStartGame(roomId, playerId) {
  const s = getSocket();
  s.emit('evo:startGame', { roomId, playerId });
}

/**
 * 創造生物
 * @param {string} roomId - 房間 ID
 * @param {string} playerId - 玩家 ID
 * @param {string} cardId - 卡牌 ID
 */
export function evoCreateCreature(roomId, playerId, cardId) {
  const s = getSocket();
  s.emit('evo:createCreature', { roomId, playerId, cardId });
}

/**
 * 賦予性狀
 * @param {string} roomId - 房間 ID
 * @param {string} playerId - 玩家 ID
 * @param {string} cardId - 卡牌 ID
 * @param {string} creatureId - 生物 ID
 * @param {string|null} targetCreatureId - 互動性狀目標生物 ID
 */
export function evoAddTrait(roomId, playerId, cardId, creatureId, targetCreatureId = null) {
  const s = getSocket();
  s.emit('evo:addTrait', { roomId, playerId, cardId, creatureId, targetCreatureId });
}

/**
 * 跳過演化
 * @param {string} roomId - 房間 ID
 * @param {string} playerId - 玩家 ID
 */
export function evoPassEvolution(roomId, playerId) {
  const s = getSocket();
  s.emit('evo:passEvolution', { roomId, playerId });
}

/**
 * 進食
 * @param {string} roomId - 房間 ID
 * @param {string} playerId - 玩家 ID
 * @param {string} creatureId - 生物 ID
 */
export function evoFeedCreature(roomId, playerId, creatureId) {
  const s = getSocket();
  s.emit('evo:feedCreature', { roomId, playerId, creatureId });
}

/**
 * 肉食攻擊
 * @param {string} roomId - 房間 ID
 * @param {string} playerId - 玩家 ID
 * @param {string} attackerId - 攻擊者生物 ID
 * @param {string} defenderId - 防禦者生物 ID
 */
export function evoAttack(roomId, playerId, attackerId, defenderId) {
  const s = getSocket();
  s.emit('evo:attack', { roomId, playerId, attackerId, defenderId });
}

/**
 * 回應攻擊（斷尾、擬態、敏捷等）
 * @param {string} roomId - 房間 ID
 * @param {string} playerId - 玩家 ID
 * @param {Object} response - 回應內容 { type, traitId, targetId }
 */
export function evoRespondAttack(roomId, playerId, response) {
  const s = getSocket();
  s.emit('evo:respondAttack', { roomId, playerId, response });
}

/**
 * 使用性狀能力（掠奪、踐踏等）
 * @param {string} roomId - 房間 ID
 * @param {string} playerId - 玩家 ID
 * @param {string} creatureId - 生物 ID
 * @param {string} traitType - 性狀類型
 * @param {string|null} targetId - 目標 ID
 */
export function evoUseTrait(roomId, playerId, creatureId, traitType, targetId = null) {
  const s = getSocket();
  s.emit('evo:useTrait', { roomId, playerId, creatureId, traitType, targetId });
}

/**
 * 請求演化論房間列表
 */
export function evoRequestRoomList() {
  const s = getSocket();
  s.emit('evo:requestRoomList');
}

// ========== 演化論事件監聽 ==========

/**
 * 監聽房間創建成功
 */
export function onEvoRoomCreated(callback) {
  return safeOn('evo:roomCreated', callback);
}

/**
 * 監聽加入房間成功
 */
export function onEvoJoinedRoom(callback) {
  return safeOn('evo:joinedRoom', data => {
    // An internal restore-and-leave acknowledgement must not navigate back in.
    if (!internalEvolutionJoins.has(data)) callback(data);
  });
}

/**
 * 監聽玩家加入
 */
export function onEvoPlayerJoined(callback) {
  return safeOn('evo:playerJoined', callback);
}

/**
 * 監聽玩家離開
 */
export function onEvoPlayerLeft(callback) {
  return safeOn('evo:playerLeft', callback);
}

/** Waiting-room metadata only; state/private hands use their existing events. */
export function onEvoPlayerConnectionChanged(callback) {
  return safeOn('evo:playerConnectionChanged', callback);
}

/**
 * 監聽玩家準備狀態變更
 */
export function onEvoPlayerReady(callback) {
  return safeOn('evo:playerReady', callback);
}

/**
 * 監聽遊戲開始
 */
export function onEvoGameStarted(callback) {
  return safeOn('evo:gameStarted', callback);
}

/**
 * 監聽遊戲狀態更新
 */
export function onEvoGameState(callback) {
  return safeOn('evo:gameState', callback);
}

/**
 * 監聽生物創建
 */
export function onEvoCreatureCreated(callback) {
  return safeOn('evo:creatureCreated', callback);
}

/**
 * 監聽性狀添加
 */
export function onEvoTraitAdded(callback) {
  return safeOn('evo:traitAdded', callback);
}

/**
 * 監聽玩家跳過
 */
export function onEvoPlayerPassed(callback) {
  return safeOn('evo:playerPassed', callback);
}

/**
 * 監聽生物進食
 */
export function onEvoCreatureFed(callback) {
  return safeOn('evo:creatureFed', callback);
}

/**
 * 監聽連鎖效應（溝通、合作等）
 */
export function onEvoChainTriggered(callback) {
  return safeOn('evo:chainTriggered', callback);
}

/**
 * 監聽攻擊待處理（需要防禦回應）
 */
export function onEvoAttackPending(callback) {
  return safeOn('evo:attackPending', callback);
}

/**
 * 監聽攻擊結果
 */
export function onEvoAttackResolved(callback) {
  return safeOn('evo:attackResolved', callback);
}

/**
 * 監聽性狀使用
 */
export function onEvoTraitUsed(callback) {
  return safeOn('evo:traitUsed', callback);
}

/**
 * 監聽房間列表更新
 */
export function onEvoRoomListUpdated(callback) {
  return safeOn('evo:roomListUpdated', callback);
}

/**
 * 監聽錯誤訊息
 */
export function onEvoError(callback) {
  return safeOn('evo:error', callback);
}

// ==================== 工單 0272 結束 ====================

// ==================== 工單 0379：連線診斷功能 ====================

/**
 * 檢查 localStorage 是否可用
 * @returns {boolean}
 */
function isLocalStorageAvailable() {
  try {
    localStorage.setItem('__socket_test__', 'test');
    localStorage.removeItem('__socket_test__');
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * 取得當前連線狀態（工單 0383）
 * @returns {string} ConnectionState
 */
export function getConnectionState() {
  return connectionState;
}

/**
 * 診斷連線狀態
 * @returns {Object} 連線診斷資訊
 */
export function diagnoseConnection() {
  const s = socket;
  const savedRoom = getCurrentRoom();

  return {
    socketUrl: SOCKET_URL,
    socketPath: SOCKET_PATH,
    connectionState: connectionState,
    isConnected: s?.connected ?? false,
    transport: s?.io?.engine?.transport?.name ?? 'unknown',
    reconnectAttempts: s?.io?._reconnectionAttempts ?? 0,
    hasLocalStorage: isLocalStorageAvailable(),
    savedRoom: savedRoom ? {
      roomId: savedRoom.roomId,
      playerId: savedRoom.playerId,
      gameType: savedRoom.gameType,
    } : null,
    timestamp: new Date().toISOString(),
  };
}

// 開發模式下將診斷函數掛載到 window
if (process.env.NODE_ENV === 'development') {
  window.diagnoseSocket = diagnoseConnection;
}

// ==================== 工單 0379 結束 ====================
