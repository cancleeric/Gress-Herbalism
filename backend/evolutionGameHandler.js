/**
 * 演化論遊戲處理模組
 *
 * 參考本草遊戲的房間處理方式，直接管理演化論遊戲的房間和遊戲狀態。
 * 工單 0313-0316
 *
 * @module evolutionGameHandler
 */

const gameLogic = require('./logic/evolution/gameLogic');
const { GAME_PHASES } = require('../shared/constants/evolution');
const { replayService, EVENT_TYPES } = require('./services/evolution/replayService');

// ==================== 狀態管理 ====================

// 演化論房間狀態
const evoRooms = new Map();

// 玩家 Socket 對應 (socketId -> { roomId, playerId })
const evoPlayerSockets = new Map();

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
      firebaseUid: player.firebaseUid || null,
      isHost: true,
      isReady: false,
    }],

    gameState: null,
    createdAt: Date.now(),
  };

  evoRooms.set(roomId, roomState);
  evoPlayerSockets.set(socket.id, { roomId, playerId: player.id });

  socket.join(roomId);
  socket.emit('evo:roomCreated', roomState);

  broadcastRoomList(io);
  console.log(`[演化論] 創建房間: ${roomId}, 房主: ${player.name}`);
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
    socket.emit('evo:error', { message: '房間不存在' });
    return;
  }

  if (room.phase !== 'waiting') {
    socket.emit('evo:error', { message: '遊戲已開始' });
    return;
  }

  if (room.players.length >= room.maxPlayers) {
    socket.emit('evo:error', { message: '房間已滿' });
    return;
  }

  // 檢查是否已在房間中（重連）
  const existingIndex = room.players.findIndex(
    p => p.id === player.id || p.firebaseUid === player.firebaseUid
  );

  if (existingIndex !== -1) {
    // 更新 socketId（重連）
    room.players[existingIndex].socketId = socket.id;
    evoPlayerSockets.set(socket.id, { roomId, playerId: room.players[existingIndex].id });
    socket.join(roomId);
    socket.emit('evo:joinedRoom', { roomId, room });
    io.to(roomId).emit('evo:playerJoined', { player: room.players[existingIndex], room });
    console.log(`[演化論] 玩家重連: ${player.name} -> ${roomId}`);
    return;
  }

  const newPlayer = {
    id: player.id,
    visitorId: player.visitorId || player.id,
    name: player.name,
    socketId: socket.id,
    firebaseUid: player.firebaseUid || null,
    isHost: false,
    isReady: false,
  };

  room.players.push(newPlayer);
  evoPlayerSockets.set(socket.id, { roomId, playerId: player.id });

  socket.join(roomId);
  socket.emit('evo:joinedRoom', { roomId, room });
  io.to(roomId).emit('evo:playerJoined', { player: newPlayer, room });

  broadcastRoomList(io);
  console.log(`[演化論] 玩家加入: ${player.name} -> ${roomId}`);
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

  io.to(roomId).emit('evo:playerLeft', { playerId, room });
  broadcastRoomList(io);
  console.log(`[演化論] 玩家離開: ${player.name} <- ${roomId}`);
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

  if (!room) return;

  const player = room.players.find(
    p => p.id === playerId || p.firebaseUid === playerId
  );

  if (!player) return;

  player.isReady = isReady;
  io.to(roomId).emit('evo:playerReady', { playerId, isReady, room });
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

  if (!room) {
    socket.emit('evo:error', { message: '房間不存在' });
    return;
  }

  // 驗證是否為房主
  const hostPlayer = room.players.find(
    p => p.id === playerId || p.firebaseUid === playerId
  );

  if (!hostPlayer || !hostPlayer.isHost) {
    socket.emit('evo:error', { message: '只有房主可以開始遊戲' });
    return;
  }

  // 檢查玩家數量
  if (room.players.length < 2) {
    socket.emit('evo:error', { message: '至少需要 2 位玩家' });
    return;
  }

  // 初始化遊戲狀態
  const gamePlayers = room.players.map(p => ({
    id: p.id,
    name: p.name,
  }));

  const initResult = gameLogic.initGame(gamePlayers);

  if (!initResult.success) {
    socket.emit('evo:error', { message: initResult.error || '遊戲初始化失敗' });
    return;
  }

  room.gameState = initResult.gameState;

  // 開始遊戲（從 waiting 進入 evolution）
  room.gameState = gameLogic.startGame(room.gameState);
  room.phase = 'playing';

  // 開始記錄回放
  replayService.startRecording(roomId, {
    config: room.gameState.config,
    turnOrder: room.gameState.playerOrder,
  });

  // 廣播遊戲開始
  io.to(roomId).emit('evo:gameStarted', { room });
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

  if (!room || !room.gameState) {
    socket.emit('evo:error', { message: '遊戲不存在' });
    return;
  }

  const player = room.players.find(p => p.id === playerId || p.firebaseUid === playerId);
  const actualPlayerId = player ? player.id : playerId;

  const result = gameLogic.processAction(room.gameState, actualPlayerId, {
    type: 'playCardAsCreature',
    payload: { cardId }
  });

  if (result.success) {
    room.gameState = result.gameState;
    // 記錄回放事件
    const newCreature = Object.values(result.gameState.players[actualPlayerId]?.creatures || []).at(-1);
    replayService.recordCreateCreature(roomId, actualPlayerId, newCreature?.id || '', cardId);
    io.to(roomId).emit('evo:creatureCreated', result.events);
    broadcastGameState(io, roomId);
  } else {
    socket.emit('evo:error', { message: result.error });
  }
}

/**
 * 賦予性狀
 */
function addTrait(socket, io, data) {
  const { roomId, playerId, cardId, creatureId, targetCreatureId } = data;
  const room = evoRooms.get(roomId);

  if (!room || !room.gameState) {
    socket.emit('evo:error', { message: '遊戲不存在' });
    return;
  }

  const player = room.players.find(p => p.id === playerId || p.firebaseUid === playerId);
  const actualPlayerId = player ? player.id : playerId;

  const result = gameLogic.processAction(room.gameState, actualPlayerId, {
    type: 'playCardAsTrait',
    payload: { cardId, creatureId, linkedCreatureId: targetCreatureId }
  });

  if (result.success) {
    room.gameState = result.gameState;
    // 記錄回放事件：取得剛加上的性狀類型
    const creature = Object.values(result.gameState.players).flatMap(p => p.creatures || []).find(c => c.id === creatureId);
    const addedTrait = creature?.traits?.at(-1);
    replayService.recordAddTrait(roomId, actualPlayerId, creatureId, addedTrait?.type || '', cardId, targetCreatureId || null);
    io.to(roomId).emit('evo:traitAdded', result.events);
    broadcastGameState(io, roomId);
  } else {
    socket.emit('evo:error', { message: result.error });
  }
}

/**
 * 跳過演化
 */
function passEvolution(socket, io, data) {
  const { roomId, playerId } = data;
  const room = evoRooms.get(roomId);

  if (!room || !room.gameState) {
    socket.emit('evo:error', { message: '遊戲不存在' });
    return;
  }

  const player = room.players.find(p => p.id === playerId || p.firebaseUid === playerId);
  const actualPlayerId = player ? player.id : playerId;

  const result = gameLogic.processAction(room.gameState, actualPlayerId, {
    type: 'pass'
  });

  if (result.success) {
    room.gameState = result.gameState;
    io.to(roomId).emit('evo:playerPassed', { playerId });
    broadcastGameState(io, roomId);
  } else {
    socket.emit('evo:error', { message: result.error });
  }
}

/**
 * 進食
 */
function feedCreature(socket, io, data) {
  const { roomId, playerId, creatureId } = data;
  const room = evoRooms.get(roomId);

  if (!room || !room.gameState) {
    socket.emit('evo:error', { message: '遊戲不存在' });
    return;
  }

  const player = room.players.find(p => p.id === playerId || p.firebaseUid === playerId);
  const actualPlayerId = player ? player.id : playerId;

  const result = gameLogic.processAction(room.gameState, actualPlayerId, {
    type: 'feed',
    payload: { creatureId }
  });

  if (result.success) {
    room.gameState = result.gameState;
    // 記錄回放事件
    replayService.recordFeeding(roomId, actualPlayerId, creatureId, 'food');
    io.to(roomId).emit('evo:creatureFed', result.events);
    if (result.chainEffects) {
      io.to(roomId).emit('evo:chainTriggered', result.chainEffects);
    }
    broadcastGameState(io, roomId);
  } else {
    socket.emit('evo:error', { message: result.error });
  }
}

/**
 * 攻擊
 */
function attack(socket, io, data) {
  const { roomId, playerId, attackerId, defenderId } = data;
  const room = evoRooms.get(roomId);

  if (!room || !room.gameState) {
    socket.emit('evo:error', { message: '遊戲不存在' });
    return;
  }

  const player = room.players.find(p => p.id === playerId || p.firebaseUid === playerId);
  const actualPlayerId = player ? player.id : playerId;

  const result = gameLogic.processAction(room.gameState, actualPlayerId, {
    type: 'attack',
    payload: { attackerId, defenderId }
  });

  if (result.success) {
    room.gameState = result.gameState;
    // 記錄攻擊事件（success 以是否有 pendingResponse 判斷是否成功發動）
    const attackSuccess = !result.gameState.pendingResponse;
    replayService.recordAttack(roomId, actualPlayerId, attackerId, playerId, defenderId, attackSuccess);

    if (room.gameState.pendingResponse) {
      // 需要防守方回應
      io.to(roomId).emit('evo:attackPending', {
        attackerId,
        defenderId,
        options: room.gameState.pendingResponse.options
      });
    } else {
      io.to(roomId).emit('evo:attackResolved', result.events);
    }
    broadcastGameState(io, roomId);
  } else {
    socket.emit('evo:error', { message: result.error });
  }
}

/**
 * 回應攻擊
 */
function respondAttack(socket, io, data) {
  const { roomId, playerId, response } = data;
  const room = evoRooms.get(roomId);

  if (!room || !room.gameState) {
    socket.emit('evo:error', { message: '遊戲不存在' });
    return;
  }

  const player = room.players.find(p => p.id === playerId || p.firebaseUid === playerId);
  const actualPlayerId = player ? player.id : playerId;

  const result = gameLogic.processAction(room.gameState, actualPlayerId, {
    type: 'defenseResponse',
    payload: response
  });

  if (result.success) {
    room.gameState = result.gameState;
    io.to(roomId).emit('evo:attackResolved', result.events);
    broadcastGameState(io, roomId);
  } else {
    socket.emit('evo:error', { message: result.error });
  }
}

/**
 * 使用性狀能力
 */
function useTrait(socket, io, data) {
  const { roomId, playerId, creatureId, traitType, targetId } = data;
  const room = evoRooms.get(roomId);

  if (!room || !room.gameState) {
    socket.emit('evo:error', { message: '遊戲不存在' });
    return;
  }

  const player = room.players.find(p => p.id === playerId || p.firebaseUid === playerId);
  const actualPlayerId = player ? player.id : playerId;

  const result = gameLogic.processAction(room.gameState, actualPlayerId, {
    type: 'useAbility',
    payload: { abilityType: traitType, creatureId, targetId }
  });

  if (result.success) {
    room.gameState = result.gameState;
    io.to(roomId).emit('evo:traitUsed', result.events);
    broadcastGameState(io, roomId);
  } else {
    socket.emit('evo:error', { message: result.error });
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

  // 偵測遊戲結束，結束回放記錄並廣播結果
  if (room.gameState.phase === GAME_PHASES.GAME_END && !room._replayEnded) {
    room._replayEnded = true;
    const result = gameLogic.getGameResult(room.gameState);
    const finalState = {
      winner: result?.winner?.id || null,
      scores: result?.scores || {},
      round: room.gameState.round,
    };
    replayService.endRecording(roomId, finalState).catch(err => {
      console.error(`[演化論] 回放儲存失敗: ${roomId}`, err);
    });
    // 通知所有玩家遊戲結束及回放 ID
    io.to(roomId).emit('evo:gameEnded', {
      winner: finalState.winner,
      scores: finalState.scores,
      replayId: roomId,
    });
  }

  // 為每個玩家發送個人化狀態（隱藏其他玩家手牌）
  room.players.forEach(player => {
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

  console.log(`[演化論] 玩家斷線: ${player.name} in ${roomId}`);

  if (room.phase === 'waiting') {
    // 等待中直接移除
    const playerIndex = room.players.findIndex(p => p.id === playerId);
    if (playerIndex !== -1) {
      room.players.splice(playerIndex, 1);

      if (room.players.length === 0) {
        evoRooms.delete(roomId);
        console.log(`[演化論] 房間已刪除: ${roomId}`);
      } else if (player.isHost) {
        room.players[0].isHost = true;
        room.hostId = room.players[0].socketId;
        io.to(roomId).emit('evo:playerLeft', { playerId, room });
      } else {
        io.to(roomId).emit('evo:playerLeft', { playerId, room });
      }
    }
    broadcastRoomList(io);
  } else {
    // 遊戲中標記斷線
    player.isDisconnected = true;
    player.disconnectedAt = Date.now();
    broadcastGameState(io, roomId);
  }

  evoPlayerSockets.delete(socket.id);
}

/**
 * 處理玩家重連 (工單 0377)
 * @param {Socket} socket - Socket 實例
 * @param {Server} io - Socket.io Server 實例
 * @param {Object} data - { roomId, playerId }
 */
function handleReconnect(socket, io, data) {
  const { roomId, playerId } = data;

  if (!roomId || !playerId) {
    socket.emit('evo:error', { message: '重連參數錯誤' });
    return;
  }

  const room = evoRooms.get(roomId);
  if (!room) {
    socket.emit('evo:error', { message: '房間不存在或已結束' });
    return;
  }

  const player = room.players.find(p => p.id === playerId);
  if (!player) {
    socket.emit('evo:error', { message: '找不到玩家資料' });
    return;
  }

  console.log(`[演化論] 玩家重連: ${player.name} in ${roomId}`);

  // 更新 socket 資訊
  const oldSocketId = player.socketId;
  player.socketId = socket.id;
  player.isDisconnected = false;
  player.disconnectedAt = null;

  // 更新 socket 映射
  evoPlayerSockets.delete(oldSocketId);
  evoPlayerSockets.set(socket.id, { roomId, playerId });

  // 加入 socket 房間
  socket.join(roomId);

  // 準備客戶端遊戲狀態（隱藏其他玩家手牌）
  let clientGameState = null;
  if (room.gameState) {
    clientGameState = {
      ...room.gameState,
      players: room.gameState.players.map(p => ({
        ...p,
        hand: p.id === playerId
          ? (p.hand || [])
          : (p.hand || []).map(() => ({ hidden: true })),
      })),
    };
  }

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
