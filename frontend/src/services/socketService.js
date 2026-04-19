/**
 * Socket.io 連線服務
 * 加強版 - 改善 Cloud Run 連線穩定性
 */

import { io } from 'socket.io-client';
import config from '../config';
import { getCurrentRoom, clearCurrentRoom } from '../utils/common/localStorage';

// 從設定檔取得後端 URL
const SOCKET_URL = config.socketUrl;

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

/**
 * 初始化 Socket 連線
 */
export function initSocket() {
  if (socket) return socket;

  // 工單 0383：標記為正在連線
  connectionState = ConnectionState.CONNECTING;

  socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,  // 無限重連
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,      // 最大重連延遲 5 秒
    timeout: 20000,                   // 連線超時 20 秒
    pingInterval: 25000,              // 心跳間隔 25 秒
    pingTimeout: 30000,               // 心跳超時 30 秒（與後端一致）
  });

  socket.on('connect', () => {
    console.log('已連線到伺服器');
    connectionState = ConnectionState.CONNECTED;
    connectionCallbacks.forEach(cb => cb(true));
    startHeartbeat();
  });

  socket.on('disconnect', (reason) => {
    console.log('與伺服器斷線，原因:', reason);
    connectionState = ConnectionState.DISCONNECTED;
    connectionCallbacks.forEach(cb => cb(false));
    stopHeartbeat();

    // 如果是伺服器斷開，嘗試重連
    if (reason === 'io server disconnect') {
      socket.connect();
    }
  });

  socket.on('connect_error', (error) => {
    console.error('連線錯誤:', error.message);
    // 連線錯誤時會自動重試
  });

  // 工單 0106, 0184：Socket.io 自動重連時觸發遊戲重連邏輯
  socket.on('reconnect', (attemptNumber) => {
    console.log(`[Socket] 自動重連成功 (第 ${attemptNumber} 次嘗試)`);

    // 工單 0184：統一使用 getCurrentRoom() 讀取房間資訊
    const savedRoom = getCurrentRoom();
    // 也嘗試舊的 key（向後相容）
    const legacyRoomId = localStorage.getItem('lastRoomId');
    const legacyPlayerId = localStorage.getItem('lastPlayerId');
    const legacyPlayerName = localStorage.getItem('lastPlayerName');

    const roomId = savedRoom?.roomId || legacyRoomId;
    const playerId = savedRoom?.playerId || legacyPlayerId;
    const playerName = savedRoom?.playerName || legacyPlayerName;

    if (roomId && playerId && playerName) {
      console.log(`[Socket] 自動觸發遊戲重連: 房間 ${roomId}`);
      socket.emit('reconnect', {
        roomId,
        playerId,
        playerName
      });
    }
  });

  socket.on('reconnect_attempt', (attemptNumber) => {
    console.log('嘗試重新連線，第', attemptNumber, '次');
  });

  // 接收伺服器心跳回應
  socket.on('pong', () => {
    // 心跳正常
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
    console.warn(`[socketService] 無法監聽事件 ${eventName}:`, error.message);
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
  if (s && firebaseUid) {
    s.emit('setPresence', { firebaseUid });
  }
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
  console.log('[socketService] evoCreateRoom - params:', { roomName, maxPlayers, player });
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
  return safeOn('evo:joinedRoom', callback);
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

// ==================== 工單 0062：觀戰模式 ====================

/**
 * 發送加入觀戰請求
 * @param {string} gameId - 遊戲 ID
 * @param {string} spectatorId - 觀戰者 ID
 * @param {string} spectatorName - 觀戰者名稱
 */
export function joinSpectate(gameId, spectatorId, spectatorName) {
  const s = getSocket();
  if (!s) return;
  s.emit('spectator:join', { gameId, spectatorId, spectatorName });
}

/**
 * 發送離開觀戰請求
 * @param {string} gameId - 遊戲 ID
 * @param {string} spectatorId - 觀戰者 ID
 */
export function leaveSpectate(gameId, spectatorId) {
  const s = getSocket();
  if (!s) return;
  s.emit('spectator:leave', { gameId, spectatorId });
}

/**
 * 監聽觀戰加入成功事件
 * @param {Function} callback - ({ gameId, gameState, spectatorCount }) => void
 * @returns {Function} 取消監聽函數
 */
export function onSpectatorJoined(callback) {
  const s = getSocket();
  if (!s) return () => {};
  s.on('spectator:joined', callback);
  return () => s.off('spectator:joined', callback);
}

/**
 * 監聽觀戰同步事件（遊戲狀態更新）
 * @param {Function} callback - ({ gameState }) => void
 * @returns {Function} 取消監聽函數
 */
export function onSpectatorSync(callback) {
  const s = getSocket();
  if (!s) return () => {};
  s.on('spectator:sync', callback);
  return () => s.off('spectator:sync', callback);
}

/**
 * 監聽觀戰人數更新事件
 * @param {Function} callback - ({ count }) => void
 * @returns {Function} 取消監聽函數
 */
export function onSpectatorCount(callback) {
  const s = getSocket();
  if (!s) return () => {};
  s.on('spectator:count', callback);
  return () => s.off('spectator:count', callback);
}

/**
 * 監聽遊戲結束通知（觀戰版）
 * @param {Function} callback - ({ winner, scores }) => void
 * @returns {Function} 取消監聽函數
 */
export function onSpectatorGameEnded(callback) {
  const s = getSocket();
  if (!s) return () => {};
  s.on('spectator:gameEnded', callback);
  return () => s.off('spectator:gameEnded', callback);
}

/**
 * 監聽觀戰錯誤事件
 * @param {Function} callback - ({ message }) => void
 * @returns {Function} 取消監聽函數
 */
export function onSpectatorError(callback) {
  const s = getSocket();
  if (!s) return () => {};
  s.on('spectator:error', callback);
  return () => s.off('spectator:error', callback);
}
