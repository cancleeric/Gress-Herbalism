/**
 * Socket.io 連線服務
 * 加強版 - 改善 Cloud Run 連線穩定性
 */

import { io } from 'socket.io-client';
import config from '../config';

// 從設定檔取得後端 URL
const SOCKET_URL = config.socketUrl;

let socket = null;
let connectionCallbacks = [];
let heartbeatInterval = null;

/**
 * 初始化 Socket 連線
 */
export function initSocket() {
  if (socket) return socket;

  socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,  // 無限重連
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,      // 最大重連延遲 5 秒
    timeout: 20000,                   // 連線超時 20 秒
    pingInterval: 25000,              // 心跳間隔 25 秒
    pingTimeout: 20000,               // 心跳超時 20 秒
  });

  socket.on('connect', () => {
    console.log('已連線到伺服器');
    connectionCallbacks.forEach(cb => cb(true));
    startHeartbeat();
  });

  socket.on('disconnect', (reason) => {
    console.log('與伺服器斷線，原因:', reason);
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

  socket.on('reconnect', (attemptNumber) => {
    console.log('重新連線成功，嘗試次數:', attemptNumber);
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
  }, 30000); // 每 30 秒發送心跳
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
  // 立即通知目前狀態
  if (socket) {
    callback(socket.connected);
  }
  return () => {
    connectionCallbacks = connectionCallbacks.filter(cb => cb !== callback);
  };
}

/**
 * 監聽房間列表更新
 */
export function onRoomList(callback) {
  const s = getSocket();
  s.on('roomList', callback);
  return () => s.off('roomList', callback);
}

/**
 * 監聯遊戲狀態更新
 */
export function onGameState(callback) {
  const s = getSocket();
  s.on('gameState', callback);
  return () => s.off('gameState', callback);
}

/**
 * 監聽錯誤訊息
 */
export function onError(callback) {
  const s = getSocket();
  s.on('error', callback);
  return () => s.off('error', callback);
}

/**
 * 監聽房間創建成功
 */
export function onRoomCreated(callback) {
  const s = getSocket();
  s.on('roomCreated', callback);
  return () => s.off('roomCreated', callback);
}

/**
 * 監聽加入房間成功
 */
export function onJoinedRoom(callback) {
  const s = getSocket();
  s.on('joinedRoom', callback);
  return () => s.off('joinedRoom', callback);
}

/**
 * 監聽蓋牌揭示
 */
export function onHiddenCardsRevealed(callback) {
  const s = getSocket();
  s.on('hiddenCardsRevealed', callback);
  return () => s.off('hiddenCardsRevealed', callback);
}

/**
 * 監聽顏色選擇請求（被要牌玩家需要選擇給哪種顏色）
 */
export function onColorChoiceRequired(callback) {
  const s = getSocket();
  s.on('colorChoiceRequired', callback);
  return () => s.off('colorChoiceRequired', callback);
}

/**
 * 監聽等待顏色選擇（通知其他玩家正在等待選擇）
 */
export function onWaitingForColorChoice(callback) {
  const s = getSocket();
  s.on('waitingForColorChoice', callback);
  return () => s.off('waitingForColorChoice', callback);
}

/**
 * 監聽顏色選擇結果
 */
export function onColorChoiceResult(callback) {
  const s = getSocket();
  s.on('colorChoiceResult', callback);
  return () => s.off('colorChoiceResult', callback);
}

/**
 * 創建房間
 */
export function createRoom(player, maxPlayers, password = null) {
  const s = getSocket();
  s.emit('createRoom', { player, maxPlayers, password });
}

/**
 * 加入房間
 */
export function joinRoom(gameId, player, password = null) {
  const s = getSocket();
  s.emit('joinRoom', { gameId, player, password });
}

/**
 * 監聽需要密碼
 */
export function onPasswordRequired(callback) {
  const s = getSocket();
  s.on('passwordRequired', callback);
  return () => s.off('passwordRequired', callback);
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
 */
export function leaveRoom(gameId, playerId) {
  const s = getSocket();
  s.emit('leaveRoom', { gameId, playerId });
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
  const s = getSocket();
  s.on('followGuessStarted', callback);
  return () => s.off('followGuessStarted', callback);
}

/**
 * 監聽跟猜狀態更新
 */
export function onFollowGuessUpdate(callback) {
  const s = getSocket();
  s.on('followGuessUpdate', callback);
  return () => s.off('followGuessUpdate', callback);
}

/**
 * 監聽猜牌結果
 */
export function onGuessResult(callback) {
  const s = getSocket();
  s.on('guessResult', callback);
  return () => s.off('guessResult', callback);
}

/**
 * 監聽局開始
 */
export function onRoundStarted(callback) {
  const s = getSocket();
  s.on('roundStarted', callback);
  return () => s.off('roundStarted', callback);
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
 * 斷開連線
 */
export function disconnect() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
