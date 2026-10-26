/**
 * 演化論遊戲處理模組
 *
 * 參考本草遊戲的房間處理方式，直接管理演化論遊戲的房間和遊戲狀態。
 * 工單 0313-0316
 *
 * @module evolutionGameHandler
 */

const gameLogic = require('./logic/evolution/gameLogic');

// ==================== 狀態管理 ====================

// 演化論房間狀態
const evoRooms = new Map();

// 玩家 Socket 對應 (socketId -> { roomId, playerId })
const evoPlayerSockets = new Map();
// Ownership is server-only; never trust caller-provided firebaseUid.
const seatOwners = new WeakMap();
const disconnectTimers = new WeakMap();
const DISCONNECT_GRACE_MS = 30000;

function cancelDisconnect(player) {
  const timer = disconnectTimers.get(player);
  if (timer) clearTimeout(timer);
  disconnectTimers.delete(player);
}

function ownsSeat(socket, player) {
  return typeof socket.uid === 'string' && socket.uid.length > 0 &&
    seatOwners.get(player) === socket.uid;
}

function rejectRecovery(socket, roomId) {
  socket.emit('evo:error', { gameId: roomId, message: '無法恢復房間，請重新加入' });
}

// Resolve authority from the active server mapping, not a requested target id.
function activeSeat(socket, room, playerId) {
  const binding = evoPlayerSockets.get(socket.id);
  if (!room || !binding || binding.roomId !== room.id) return null;
  const player = room.players.find(p => p.id === binding.playerId);
  if (!player || player.socketId !== socket.id || player.isDisconnected || !ownsSeat(socket, player)) return null;
  if (playerId !== player.id && playerId !== player.firebaseUid) return null;
  return player;
}

// Explicit room metadata projection prevents accidental full-state broadcasts.
function publicRoom(room) {
  return {
    id: room.id, name: room.name, maxPlayers: room.maxPlayers,
    hostId: room.hostId, gameType: room.gameType, phase: room.phase,
    createdAt: room.createdAt, gameState: null,
    players: room.players.map(p => ({
      id: p.id, visitorId: p.visitorId, name: p.name, socketId: p.socketId,
      firebaseUid: p.firebaseUid, isHost: p.isHost, isReady: p.isReady,
      isDisconnected: Boolean(p.isDisconnected),
    })),
  };
}

// Side events keep their established object/array shape while carrying room identity.
function roomEvent(roomId, payload) {
  if (Array.isArray(payload)) return payload.map(event => ({ ...event, gameId: roomId }));
  return { ...payload, gameId: roomId };
}

// ==================== 房間操作 ====================

/**
 * 產生唯一房間 ID
 */
function generateRoomId() {
  return `evo_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
}

/**
 * 創建房間
 * @param {Socket} socket - Socket 實例
 * @param {Server} io - Socket.io Server 實例
 * @param {Object} data - { roomName, maxPlayers, player }
 */
function createRoom(socket, io, data) {
  if (typeof socket.uid !== 'string' || !socket.uid) return rejectRecovery(socket, data?.roomId);
  const { roomName, maxPlayers, player } = data;
  const roomId = generateRoomId();

  const roomState = {
    id: roomId,
    name: roomName || `${player.name}的房間`,
    maxPlayers: Math.min(Math.max(maxPlayers || 4, 2), 4),
    hostId: socket.id,
    gameType: 'evolution',
    phase: 'waiting',

    players: [{
      id: player.id,
      visitorId: player.visitorId || player.id,
      name: player.name,
      socketId: socket.id,
      firebaseUid: socket.uid,
      isHost: true,
      isReady: false,
    }],

    gameState: null,
    createdAt: Date.now(),
  };

  seatOwners.set(roomState.players[0], socket.uid);
  evoRooms.set(roomId, roomState);
  evoPlayerSockets.set(socket.id, { roomId, playerId: player.id });

  socket.join(roomId);
  socket.emit('evo:roomCreated', publicRoom(roomState));

  broadcastRoomList(io);
}

/**
 * 加入房間
 * @param {Socket} socket - Socket 實例
 * @param {Server} io - Socket.io Server 實例
 * @param {Object} data - { roomId, player }
 */
function joinRoom(socket, io, data) {
  const { roomId, player } = data;
  const room = evoRooms.get(roomId);

  if (!room) {
    socket.emit('evo:error', { gameId: roomId, message: '房間不存在' });
    return;
  }

  if (room.phase !== 'waiting') {
    socket.emit('evo:error', { gameId: roomId, message: '遊戲已開始' });
    return;
  }

  // Existing seats are recovered before capacity checks, including full rooms.
  // A claimed id or Firebase UID never grants ownership.
  const existingPlayer = room.players.find(p =>
    p.id === player.id || seatOwners.get(p) === socket.uid ||
    (player.firebaseUid && p.firebaseUid === player.firebaseUid));
  if (existingPlayer) {
    if (!ownsSeat(socket, existingPlayer)) return rejectRecovery(socket, data?.roomId);
    return handleReconnect(socket, io, { roomId, playerId: existingPlayer.id });
  }
  if (typeof socket.uid !== 'string' || !socket.uid) return rejectRecovery(socket, data?.roomId);
  if (room.players.length >= room.maxPlayers) {
    socket.emit('evo:error', { gameId: roomId, message: '房間已滿' });
    return;
  }

  const newPlayer = {
    id: player.id,
    visitorId: player.visitorId || player.id,
    name: player.name,
    socketId: socket.id,
    firebaseUid: socket.uid,
    isHost: false,
    isReady: false,
  };

  seatOwners.set(newPlayer, socket.uid);
  room.players.push(newPlayer);
  evoPlayerSockets.set(socket.id, { roomId, playerId: player.id });

  socket.join(roomId);
  socket.emit('evo:joinedRoom', { roomId, room: publicRoom(room) });
  io.to(roomId).emit('evo:playerJoined', { player: publicRoom(room).players.find(p => p.id === newPlayer.id), room: publicRoom(room) });

  broadcastRoomList(io);
}

/**
 * 離開房間
 * @param {Socket} socket - Socket 實例
 * @param {Server} io - Socket.io Server 實例
 * @param {Object} data - { roomId, playerId }
 */
function leaveRoom(socket, io, data) {
  const { roomId, playerId } = data;
  const room = evoRooms.get(roomId);

  if (!room) return;

  const playerIndex = room.players.findIndex(
    p => p.id === playerId || p.firebaseUid === playerId
  );

  if (playerIndex === -1) return;

  const player = room.players[playerIndex];
  if (!ownsSeat(socket, player) || player.socketId !== socket.id) return rejectRecovery(socket, data?.roomId);
  cancelDisconnect(player);
  room.players.splice(playerIndex, 1);
  evoPlayerSockets.delete(socket.id);

  socket.leave(roomId);

  // 房間空了，刪除房間
  if (room.players.length === 0) {
    evoRooms.delete(roomId);
    broadcastRoomList(io);
    console.log(`[演化論] 房間已刪除: ${roomId}`);
    return;
  }

  // 房主離開，轉移房主
  if (player.isHost && room.players.length > 0) {
    room.players[0].isHost = true;
    room.hostId = room.players[0].socketId;
  }

  io.to(roomId).emit('evo:playerLeft', { playerId, room: publicRoom(room) });
  broadcastRoomList(io);
}

/**
 * 設定準備狀態
 * @param {Socket} socket - Socket 實例
 * @param {Server} io - Socket.io Server 實例
 * @param {Object} data - { roomId, playerId, isReady }
 */
function setReady(socket, io, data) {
  const { roomId, playerId, isReady } = data;
  const room = evoRooms.get(roomId);
  const authorizedPlayer = activeSeat(socket, room, playerId);
  if (!authorizedPlayer) return rejectRecovery(socket, data?.roomId);

  if (!room) return;

  const player = authorizedPlayer;

  if (!player) return;

  player.isReady = isReady;
  io.to(roomId).emit('evo:playerReady', { playerId, isReady, room: publicRoom(room) });
}

/**
 * 請求房間列表
 * @param {Socket} socket - Socket 實例
 */
function requestRoomList(socket) {
  socket.emit('evo:roomListUpdated', getRoomList());
}

// ==================== 遊戲操作 ====================

/**
 * 開始遊戲
 * @param {Socket} socket - Socket 實例
 * @param {Server} io - Socket.io Server 實例
 * @param {Object} data - { roomId, playerId }
 */
function startGame(socket, io, data) {
  const { roomId, playerId } = data;
  const room = evoRooms.get(roomId);
  const authorizedPlayer = activeSeat(socket, room, playerId);
  if (!authorizedPlayer) return rejectRecovery(socket, data?.roomId);

  if (!room) {
    socket.emit('evo:error', { gameId: roomId, message: '房間不存在' });
    return;
  }

  // 驗證是否為房主
  const hostPlayer = authorizedPlayer;

  if (!hostPlayer || !hostPlayer.isHost) {
    socket.emit('evo:error', { gameId: roomId, message: '只有房主可以開始遊戲' });
    return;
  }

  // 檢查玩家數量
  if (room.players.length < 2) {
    socket.emit('evo:error', { gameId: roomId, message: '至少需要 2 位玩家' });
    return;
  }

  // Grace-period seats remain recoverable, but must reconnect before play starts.
  // Validate every participant before initialization mutates game state/turn order.
  const allPlayersConnected = room.players.every(player => {
    const binding = evoPlayerSockets.get(player.socketId);
    return !player.isDisconnected && binding?.roomId === roomId &&
      binding.playerId === player.id && Boolean(seatOwners.get(player));
  });
  if (!allPlayersConnected) {
    socket.emit('evo:error', { gameId: roomId, message: '請等待所有玩家重新連線後再開始遊戲' });
    return;
  }

  // 初始化遊戲狀態
  const gamePlayers = room.players.map(p => ({
    id: p.id,
    name: p.name,
  }));

  const initResult = gameLogic.initGame(gamePlayers);

  if (!initResult.success) {
    socket.emit('evo:error', { gameId: roomId, message: initResult.error || '遊戲初始化失敗' });
    return;
  }

  room.gameState = initResult.gameState;

  // 開始遊戲（從 waiting 進入 evolution）
  room.gameState = gameLogic.startGame(room.gameState);
  room.phase = 'playing';

  // 廣播遊戲開始
  room.players.forEach(player => {
    const binding = evoPlayerSockets.get(player.socketId);
    if (binding?.roomId === roomId && binding.playerId === player.id && !player.isDisconnected) {
      io.to(player.socketId).emit('evo:gameStarted', getClientGameState(room, player.id));
    }
  });
  broadcastGameState(io, roomId);
  broadcastRoomList(io);

  console.log(`[演化論] 遊戲開始: ${roomId}, 玩家數: ${room.players.length}`);
}

/**
 * 創造生物
 */
function createCreature(socket, io, data) {
  const { roomId, playerId, cardId } = data;
  const room = evoRooms.get(roomId);
  const authorizedPlayer = activeSeat(socket, room, playerId);
  if (!authorizedPlayer) return rejectRecovery(socket, data?.roomId);

  if (!room || !room.gameState) {
    socket.emit('evo:error', { gameId: roomId, message: '遊戲不存在' });
    return;
  }

  const player = authorizedPlayer;
  const actualPlayerId = player ? player.id : playerId;

  const result = gameLogic.processAction(room.gameState, actualPlayerId, {
    type: 'playCardAsCreature',
    payload: { cardId }
  });

  if (result.success) {
    room.gameState = result.gameState;
    io.to(roomId).emit('evo:creatureCreated', roomEvent(roomId, result.events));
    broadcastGameState(io, roomId);
  } else {
    socket.emit('evo:error', { gameId: roomId, message: result.error });
  }
}

/**
 * 賦予性狀
 */
function addTrait(socket, io, data) {
  const { roomId, playerId, cardId, creatureId, targetCreatureId } = data;
  const room = evoRooms.get(roomId);
  const authorizedPlayer = activeSeat(socket, room, playerId);
  if (!authorizedPlayer) return rejectRecovery(socket, data?.roomId);

  if (!room || !room.gameState) {
    socket.emit('evo:error', { gameId: roomId, message: '遊戲不存在' });
    return;
  }

  const player = authorizedPlayer;
  const actualPlayerId = player ? player.id : playerId;

  const result = gameLogic.processAction(room.gameState, actualPlayerId, {
    type: 'playCardAsTrait',
    payload: { cardId, creatureId, linkedCreatureId: targetCreatureId }
  });

  if (result.success) {
    room.gameState = result.gameState;
    io.to(roomId).emit('evo:traitAdded', roomEvent(roomId, result.events));
    broadcastGameState(io, roomId);
  } else {
    socket.emit('evo:error', { gameId: roomId, message: result.error });
  }
}

/**
 * 跳過演化
 */
function passEvolution(socket, io, data) {
  const { roomId, playerId } = data;
  const room = evoRooms.get(roomId);
  const authorizedPlayer = activeSeat(socket, room, playerId);
  if (!authorizedPlayer) return rejectRecovery(socket, data?.roomId);

  if (!room || !room.gameState) {
    socket.emit('evo:error', { gameId: roomId, message: '遊戲不存在' });
    return;
  }

  const player = authorizedPlayer;
  const actualPlayerId = player ? player.id : playerId;

  const result = gameLogic.processAction(room.gameState, actualPlayerId, {
    type: 'pass'
  });

  if (result.success) {
    room.gameState = result.gameState;
    io.to(roomId).emit('evo:playerPassed', { gameId: roomId, playerId });
    broadcastGameState(io, roomId);
  } else {
    socket.emit('evo:error', { gameId: roomId, message: result.error });
  }
}

/**
 * 進食
 */
function feedCreature(socket, io, data) {
  const { roomId, playerId, creatureId } = data;
  const room = evoRooms.get(roomId);
  const authorizedPlayer = activeSeat(socket, room, playerId);
  if (!authorizedPlayer) return rejectRecovery(socket, data?.roomId);

  if (!room || !room.gameState) {
    socket.emit('evo:error', { gameId: roomId, message: '遊戲不存在' });
    return;
  }

  const player = authorizedPlayer;
  const actualPlayerId = player ? player.id : playerId;

  const result = gameLogic.processAction(room.gameState, actualPlayerId, {
    type: 'feed',
    payload: { creatureId }
  });

  if (result.success) {
    room.gameState = result.gameState;
    io.to(roomId).emit('evo:creatureFed', roomEvent(roomId, result.events));
    if (result.chainEffects) {
      io.to(roomId).emit('evo:chainTriggered', roomEvent(roomId, result.chainEffects));
    }
    broadcastGameState(io, roomId);
  } else {
    socket.emit('evo:error', { gameId: roomId, message: result.error });
  }
}

/**
 * 攻擊
 */
function attack(socket, io, data) {
  const { roomId, playerId, attackerId, defenderId } = data;
  const room = evoRooms.get(roomId);
  const authorizedPlayer = activeSeat(socket, room, playerId);
  if (!authorizedPlayer) return rejectRecovery(socket, data?.roomId);

  if (!room || !room.gameState) {
    socket.emit('evo:error', { gameId: roomId, message: '遊戲不存在' });
    return;
  }

  const player = authorizedPlayer;
  const actualPlayerId = player ? player.id : playerId;

  const result = gameLogic.processAction(room.gameState, actualPlayerId, {
    type: 'attack',
    payload: { attackerId, defenderId }
  });

  if (result.success) {
    room.gameState = result.gameState;

    if (room.gameState.pendingResponse) {
      // 需要防守方回應
      io.to(roomId).emit('evo:attackPending', {
        gameId: roomId,
        attackerId,
        defenderId,
        options: room.gameState.pendingResponse.options
      });
    } else {
      io.to(roomId).emit('evo:attackResolved', roomEvent(roomId, result.events));
    }
    broadcastGameState(io, roomId);
  } else {
    socket.emit('evo:error', { gameId: roomId, message: result.error });
  }
}

/**
 * 回應攻擊
 */
function respondAttack(socket, io, data) {
  const { roomId, playerId, response } = data;
  const room = evoRooms.get(roomId);
  const authorizedPlayer = activeSeat(socket, room, playerId);
  if (!authorizedPlayer) return rejectRecovery(socket, data?.roomId);

  if (!room || !room.gameState) {
    socket.emit('evo:error', { gameId: roomId, message: '遊戲不存在' });
    return;
  }

  const player = authorizedPlayer;
  const actualPlayerId = player ? player.id : playerId;

  const result = gameLogic.processAction(room.gameState, actualPlayerId, {
    type: 'defenseResponse',
    payload: response
  });

  if (result.success) {
    room.gameState = result.gameState;
    io.to(roomId).emit('evo:attackResolved', roomEvent(roomId, result.events));
    broadcastGameState(io, roomId);
  } else {
    socket.emit('evo:error', { gameId: roomId, message: result.error });
  }
}

/**
 * 使用性狀能力
 */
function useTrait(socket, io, data) {
  const { roomId, playerId, creatureId, traitType, targetId } = data;
  const room = evoRooms.get(roomId);
  const authorizedPlayer = activeSeat(socket, room, playerId);
  if (!authorizedPlayer) return rejectRecovery(socket, data?.roomId);

  if (!room || !room.gameState) {
    socket.emit('evo:error', { gameId: roomId, message: '遊戲不存在' });
    return;
  }

  const player = authorizedPlayer;
  const actualPlayerId = player ? player.id : playerId;

  const result = gameLogic.processAction(room.gameState, actualPlayerId, {
    type: 'useAbility',
    payload: { abilityType: traitType, creatureId, targetId }
  });

  if (result.success) {
    room.gameState = result.gameState;
    io.to(roomId).emit('evo:traitUsed', roomEvent(roomId, result.events));
    broadcastGameState(io, roomId);
  } else {
    socket.emit('evo:error', { gameId: roomId, message: result.error });
  }
}

// ==================== 輔助函數 ====================

/**
 * 取得房間列表
 */
function getRoomList() {
  const rooms = [];
  evoRooms.forEach((room, roomId) => {
    if (room.phase === 'waiting') {
      const hostPlayer = room.players.find(p => p.isHost);
      rooms.push({
        id: roomId,
        name: room.name,
        playerCount: room.players.length,
        maxPlayers: room.maxPlayers,
        gameType: 'evolution',
        hostName: hostPlayer?.name || '未知'
      });
    }
  });
  return rooms;
}

/**
 * 廣播房間列表
 */
function broadcastRoomList(io) {
  io.emit('evo:roomListUpdated', getRoomList());
}

/**
 * 廣播遊戲狀態
 */
function broadcastGameState(io, roomId) {
  const room = evoRooms.get(roomId);
  if (!room || !room.gameState) return;

  // 為每個玩家發送個人化狀態（隱藏其他玩家手牌）
  room.players.forEach(player => {
    const binding = evoPlayerSockets.get(player.socketId);
    if (player.isDisconnected || binding?.roomId !== roomId || binding.playerId !== player.id) return;
    const clientState = getClientGameState(room, player.id);
    io.to(player.socketId).emit('evo:gameState', clientState);
  });
}

/**
 * 取得客戶端遊戲狀態（個人化，包含自己手牌）
 */
function getClientGameState(room, playerId) {
  const state = room.gameState;
  if (!state) return null;

  const sanitizedPlayers = {};

  for (const [id, playerData] of Object.entries(state.players)) {
    if (id === playerId) {
      // 自己可以看到完整手牌
      sanitizedPlayers[id] = {
        id: playerData.id,
        name: playerData.name,
        hand: playerData.hand,
        creatures: playerData.creatures,
        hasPassedEvolution: playerData.hasPassedEvolution,
        hasPassedFeeding: playerData.hasPassedFeeding,
      };
    } else {
      // 其他玩家只能看到手牌數量
      sanitizedPlayers[id] = {
        id: playerData.id,
        name: playerData.name,
        hand: playerData.hand.length,
        creatures: playerData.creatures,
        hasPassedEvolution: playerData.hasPassedEvolution,
        hasPassedFeeding: playerData.hasPassedFeeding,
      };
    }
  }

  return {
    gameId: room.id,
    phase: state.phase,
    round: state.round,
    playerOrder: state.playerOrder,
    currentPlayerIndex: state.currentPlayerIndex,
    currentPlayerId: state.currentPlayerId,
    foodPool: state.foodPool,
    diceResult: state.diceResult,
    deckCount: state.deck?.length || 0,
    discardCount: state.discardPile?.length || 0,
    isLastRound: state.isLastRound,
    pendingResponse: state.pendingResponse,
    players: sanitizedPlayers,
  };
}

/**
 * 處理斷線
 */
function handleDisconnect(socket, io) {
  const playerInfo = evoPlayerSockets.get(socket.id);
  if (!playerInfo) return;

  const { roomId, playerId } = playerInfo;
  const room = evoRooms.get(roomId);

  if (!room) {
    evoPlayerSockets.delete(socket.id);
    return;
  }

  const player = room.players.find(p => p.id === playerId);
  if (!player) {
    evoPlayerSockets.delete(socket.id);
    return;
  }

  // Late disconnects from replaced sockets cannot remove the current seat.
  if (player.socketId !== socket.id) {
    evoPlayerSockets.delete(socket.id);
    return;
  }
  if (disconnectTimers.has(player)) return;
  player.isDisconnected = true;
  player.disconnectedAt = Date.now();
  if (room.phase === 'waiting') io.to(roomId).emit('evo:playerConnectionChanged', { room: publicRoom(room) });
  if (room.phase !== 'waiting') broadcastGameState(io, roomId);

  const timer = setTimeout(() => {
    disconnectTimers.delete(player);
    if (evoRooms.get(roomId) !== room || player.socketId !== socket.id ||
        !player.isDisconnected || !room.players.includes(player)) return;
    evoPlayerSockets.delete(socket.id);
    if (room.phase !== 'waiting') return; // Preserve in-game seat, as before.
    room.players.splice(room.players.indexOf(player), 1);
    if (!room.players.length) {
      evoRooms.delete(roomId);
    } else {
      if (player.isHost) {
        room.players[0].isHost = true;
        room.hostId = room.players[0].socketId;
      }
      io.to(roomId).emit('evo:playerLeft', { playerId, room: publicRoom(room) });
    }
    broadcastRoomList(io);
  }, DISCONNECT_GRACE_MS);
  timer.unref?.();
  disconnectTimers.set(player, timer);
}

/**
 * 處理玩家重連 (工單 0377)
 * @param {Socket} socket - Socket 實例
 * @param {Server} io - Socket.io Server 實例
 * @param {Object} data - { roomId, playerId }
 */
function handleReconnect(socket, io, data = {}) {
  const { roomId, playerId } = data;

  if (!roomId || !playerId) {
    socket.emit('evo:error', { gameId: roomId, message: '重連參數錯誤' });
    return;
  }

  const room = evoRooms.get(roomId);
  if (!room) {
    socket.emit('evo:error', { gameId: roomId, message: '房間不存在或已結束' });
    return;
  }

  const player = room.players.find(p => p.id === playerId);
  if (!player) {
    socket.emit('evo:error', { gameId: roomId, message: '找不到玩家資料' });
    return;
  }

  if (!ownsSeat(socket, player)) return rejectRecovery(socket, data?.roomId);
  cancelDisconnect(player);

  // 更新 socket 資訊
  const oldSocketId = player.socketId;
  player.socketId = socket.id;
  if (player.isHost) room.hostId = socket.id;
  player.isDisconnected = false;
  player.disconnectedAt = null;

  // 更新 socket 映射
  evoPlayerSockets.delete(oldSocketId);
  if (oldSocketId !== socket.id) io.sockets?.sockets?.get(oldSocketId)?.leave(roomId);
  evoPlayerSockets.set(socket.id, { roomId, playerId });

  // 加入 socket 房間
  socket.join(roomId);

  // 準備客戶端遊戲狀態（隱藏其他玩家手牌）
  const clientGameState = getClientGameState(room, playerId);
  const recoveredRoom = publicRoom(room);

  // 發送重連成功
  socket.emit('evo:reconnected', {
    roomId,
    playerId,
    room: {
      id: room.id,
      name: room.name,
      phase: room.phase,
      players: room.players.map(p => ({
        id: p.id,
        name: p.name,
        isHost: p.isHost,
        isReady: p.isReady,
        isDisconnected: p.isDisconnected,
      })),
    },
    gameState: clientGameState,
  });

  socket.emit('evo:joinedRoom', { roomId, room: recoveredRoom });
  if (room.phase === 'waiting') io.to(roomId).emit('evo:playerConnectionChanged', { room: recoveredRoom });

  // 通知其他玩家
  socket.to(roomId).emit('evo:playerReconnected', {
    playerId,
    playerName: player.name,
  });

  broadcastGameState(io, roomId);
}

// ==================== 模組導出 ====================

module.exports = {
  // 房間操作
  createRoom,
  joinRoom,
  leaveRoom,
  setReady,
  requestRoomList,

  // 遊戲操作
  startGame,
  createCreature,
  addTrait,
  passEvolution,
  feedCreature,
  attack,
  respondAttack,
  useTrait,

  // 輔助函數
  getRoomList,
  broadcastRoomList,
  broadcastGameState,
  handleDisconnect,
  handleReconnect,

  // 內部狀態（供測試使用）
  _evoRooms: evoRooms,
  _evoPlayerSockets: evoPlayerSockets,
};
