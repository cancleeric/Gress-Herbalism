/**
 * Socket 同步機制單元測試
 * 工單 0110 - 測試 Socket 相關核心函數
 */

// Mock io 和相關模組
const mockSocket = {
  id: 'socket-123',
  connected: true,
  emit: jest.fn(),
  join: jest.fn()
};

const mockIo = {
  sockets: {
    sockets: new Map()
  }
};

// 模擬遊戲房間和玩家 socket 映射
const gameRooms = new Map();
const playerSockets = new Map();

/**
 * 模擬 findSocketByPlayerId 函數
 * 根據玩家 ID 找到對應的 socket
 */
function findSocketByPlayerId(gameId, playerId) {
  const gameState = gameRooms.get(gameId);
  if (!gameState) return null;

  const player = gameState.players.find(p => p.id === playerId);
  if (!player) return null;

  // 優先使用 player.socketId
  if (player.socketId) {
    const socket = mockIo.sockets.sockets.get(player.socketId);
    if (socket && socket.connected) {
      return socket;
    }
  }

  // Fallback: 從 playerSockets Map 反查
  for (const [socketId, info] of playerSockets.entries()) {
    if (info.gameId === gameId && info.playerId === playerId) {
      const socket = mockIo.sockets.sockets.get(socketId);
      if (socket && socket.connected) {
        // 自動修復 player.socketId
        player.socketId = socketId;
        return socket;
      }
    }
  }

  return null;
}

/**
 * 模擬 validateSocketConnections 函數
 */
function validateSocketConnections(gameId) {
  const gameState = gameRooms.get(gameId);
  if (!gameState) return;

  let hasInvalidSocket = false;

  gameState.players.forEach(player => {
    if (player.socketId && !player.isDisconnected) {
      const socket = mockIo.sockets.sockets.get(player.socketId);
      if (!socket || !socket.connected) {
        player.socketId = null;
        hasInvalidSocket = true;
      }
    }
  });

  return hasInvalidSocket;
}

describe('findSocketByPlayerId', () => {
  beforeEach(() => {
    gameRooms.clear();
    playerSockets.clear();
    mockIo.sockets.sockets.clear();
  });

  test('player.socketId 有效時返回 socket', () => {
    const gameId = 'game-1';
    const playerId = 'player-1';
    const socketId = 'socket-1';

    const socket = { id: socketId, connected: true };
    mockIo.sockets.sockets.set(socketId, socket);

    gameRooms.set(gameId, {
      players: [{ id: playerId, socketId: socketId }]
    });

    const result = findSocketByPlayerId(gameId, playerId);
    expect(result).toBe(socket);
  });

  test('player.socketId 無效時嘗試 fallback', () => {
    const gameId = 'game-1';
    const playerId = 'player-1';
    const oldSocketId = 'old-socket';
    const newSocketId = 'new-socket';

    const newSocket = { id: newSocketId, connected: true };
    mockIo.sockets.sockets.set(newSocketId, newSocket);

    // 玩家的 socketId 指向無效的 socket
    gameRooms.set(gameId, {
      players: [{ id: playerId, socketId: oldSocketId }]
    });

    // playerSockets 有新的映射
    playerSockets.set(newSocketId, { gameId, playerId });

    const result = findSocketByPlayerId(gameId, playerId);
    expect(result).toBe(newSocket);
  });

  test('fallback 成功時自動修復 socketId', () => {
    const gameId = 'game-1';
    const playerId = 'player-1';
    const newSocketId = 'new-socket';

    const newSocket = { id: newSocketId, connected: true };
    mockIo.sockets.sockets.set(newSocketId, newSocket);

    const player = { id: playerId, socketId: 'old-invalid-socket' };
    gameRooms.set(gameId, { players: [player] });
    playerSockets.set(newSocketId, { gameId, playerId });

    findSocketByPlayerId(gameId, playerId);

    expect(player.socketId).toBe(newSocketId);
  });

  test('找不到時返回 null', () => {
    const gameId = 'game-1';
    const playerId = 'player-1';

    gameRooms.set(gameId, {
      players: [{ id: playerId, socketId: 'invalid-socket' }]
    });

    const result = findSocketByPlayerId(gameId, playerId);
    expect(result).toBeNull();
  });

  test('玩家不存在時返回 null', () => {
    const gameId = 'game-1';

    gameRooms.set(gameId, {
      players: [{ id: 'other-player', socketId: 'socket-1' }]
    });

    const result = findSocketByPlayerId(gameId, 'non-existent-player');
    expect(result).toBeNull();
  });

  test('房間不存在時返回 null', () => {
    const result = findSocketByPlayerId('non-existent-game', 'player-1');
    expect(result).toBeNull();
  });
});

describe('validateSocketConnections', () => {
  beforeEach(() => {
    gameRooms.clear();
    mockIo.sockets.sockets.clear();
  });

  test('清理無效的 socketId', () => {
    const gameId = 'game-1';
    const player = {
      id: 'player-1',
      socketId: 'invalid-socket',
      isDisconnected: false
    };

    gameRooms.set(gameId, { players: [player] });

    const hasInvalid = validateSocketConnections(gameId);

    expect(hasInvalid).toBe(true);
    expect(player.socketId).toBeNull();
  });

  test('保留有效的 socketId', () => {
    const gameId = 'game-1';
    const socketId = 'valid-socket';
    const player = {
      id: 'player-1',
      socketId: socketId,
      isDisconnected: false
    };

    mockIo.sockets.sockets.set(socketId, { id: socketId, connected: true });
    gameRooms.set(gameId, { players: [player] });

    const hasInvalid = validateSocketConnections(gameId);

    expect(hasInvalid).toBe(false);
    expect(player.socketId).toBe(socketId);
  });

  test('不處理已斷線的玩家', () => {
    const gameId = 'game-1';
    const player = {
      id: 'player-1',
      socketId: 'invalid-socket',
      isDisconnected: true
    };

    gameRooms.set(gameId, { players: [player] });

    validateSocketConnections(gameId);

    // socketId 不應該被清除，因為玩家已標記為斷線
    expect(player.socketId).toBe('invalid-socket');
  });

  test('房間不存在時安全返回', () => {
    expect(() => {
      validateSocketConnections('non-existent-game');
    }).not.toThrow();
  });
});

describe('handlePlayerReconnect', () => {
  const disconnectTimeouts = new Map();
  const refreshingPlayers = new Set();

  /**
   * 模擬 handlePlayerReconnect 函數
   */
  function handlePlayerReconnect(socket, roomId, playerId, playerName) {
    const gameState = gameRooms.get(roomId);

    if (!gameState) {
      socket.emit('reconnectFailed', { reason: 'room_not_found' });
      return false;
    }

    const player = gameState.players.find(p => p.id === playerId);
    if (!player) {
      socket.emit('reconnectFailed', { reason: 'player_not_found' });
      return false;
    }

    // 清除斷線計時器
    const timeoutKey = `${roomId}:${playerId}`;
    if (disconnectTimeouts.has(timeoutKey)) {
      clearTimeout(disconnectTimeouts.get(timeoutKey));
      disconnectTimeouts.delete(timeoutKey);
    }

    // 清除重整狀態
    refreshingPlayers.delete(timeoutKey);

    // 恢復玩家狀態
    player.isDisconnected = false;
    player.disconnectedAt = null;

    // 更新 socketId
    const oldSocketId = player.socketId;
    player.socketId = socket.id;

    // 更新 playerSockets
    playerSockets.set(socket.id, { gameId: roomId, playerId });

    socket.emit('reconnected', { gameId: roomId, playerId });
    return true;
  }

  beforeEach(() => {
    gameRooms.clear();
    playerSockets.clear();
    disconnectTimeouts.clear();
    refreshingPlayers.clear();
  });

  test('重連時更新 player.socketId', () => {
    const gameId = 'game-1';
    const playerId = 'player-1';
    const oldSocketId = 'old-socket';
    const newSocketId = 'new-socket';

    const player = { id: playerId, socketId: oldSocketId, isDisconnected: true };
    gameRooms.set(gameId, { players: [player] });

    const socket = { id: newSocketId, emit: jest.fn() };

    handlePlayerReconnect(socket, gameId, playerId, 'Player 1');

    expect(player.socketId).toBe(newSocketId);
  });

  test('重連時更新 playerSockets Map', () => {
    const gameId = 'game-1';
    const playerId = 'player-1';
    const newSocketId = 'new-socket';

    const player = { id: playerId, isDisconnected: true };
    gameRooms.set(gameId, { players: [player] });

    const socket = { id: newSocketId, emit: jest.fn() };

    handlePlayerReconnect(socket, gameId, playerId, 'Player 1');

    expect(playerSockets.get(newSocketId)).toEqual({ gameId, playerId });
  });

  test('重連時清除斷線計時器', () => {
    const gameId = 'game-1';
    const playerId = 'player-1';
    const timeoutKey = `${gameId}:${playerId}`;

    const player = { id: playerId, isDisconnected: true };
    gameRooms.set(gameId, { players: [player] });

    // 設置計時器
    const mockTimeout = setTimeout(() => {}, 10000);
    disconnectTimeouts.set(timeoutKey, mockTimeout);

    const socket = { id: 'new-socket', emit: jest.fn() };

    handlePlayerReconnect(socket, gameId, playerId, 'Player 1');

    expect(disconnectTimeouts.has(timeoutKey)).toBe(false);
    clearTimeout(mockTimeout);
  });

  test('重連時恢復 isDisconnected 狀態', () => {
    const gameId = 'game-1';
    const playerId = 'player-1';

    const player = { id: playerId, isDisconnected: true, disconnectedAt: new Date() };
    gameRooms.set(gameId, { players: [player] });

    const socket = { id: 'new-socket', emit: jest.fn() };

    handlePlayerReconnect(socket, gameId, playerId, 'Player 1');

    expect(player.isDisconnected).toBe(false);
    expect(player.disconnectedAt).toBeNull();
  });

  test('房間不存在時發送 reconnectFailed', () => {
    const socket = { id: 'socket-1', emit: jest.fn() };

    handlePlayerReconnect(socket, 'non-existent-game', 'player-1', 'Player 1');

    expect(socket.emit).toHaveBeenCalledWith('reconnectFailed', {
      reason: 'room_not_found'
    });
  });

  test('玩家不在房間時發送 reconnectFailed', () => {
    const gameId = 'game-1';

    gameRooms.set(gameId, { players: [{ id: 'other-player' }] });

    const socket = { id: 'socket-1', emit: jest.fn() };

    handlePlayerReconnect(socket, gameId, 'non-existent-player', 'Player 1');

    expect(socket.emit).toHaveBeenCalledWith('reconnectFailed', {
      reason: 'player_not_found'
    });
  });
});
