/**
 * 斷線重連整合測試
 * 工單 0120 - 測試工單 0115-0119 的功能
 */

const http = require('http');
const { Server } = require('socket.io');
const Client = require('socket.io-client');

// 測試用伺服器設定
let io, httpServer, httpServerAddr;
const gameRooms = new Map();
const playerSockets = new Map();
const disconnectTimeouts = new Map();
const refreshingPlayers = new Set();

// 常數（測試用縮短版本，加速測試執行）
const DISCONNECT_TIMEOUT = 1000;
const WAITING_PHASE_DISCONNECT_TIMEOUT = 500;
const REFRESH_GRACE_PERIOD = 500;

// 輔助函數
function generateGameId() {
  return `game_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
}

function broadcastGameState(gameId) {
  const gameState = gameRooms.get(gameId);
  if (gameState) {
    io.to(gameId).emit('gameState', gameState);
  }
}

function broadcastRoomList() {
  const rooms = [];
  gameRooms.forEach((state, gameId) => {
    if (state.gamePhase === 'waiting') {
      rooms.push({
        id: gameId,
        playerCount: state.players.length,
        maxPlayers: state.maxPlayers
      });
    }
  });
  io.emit('roomList', rooms);
}

// 設置測試伺服器
function setupServer() {
  return new Promise((resolve) => {
    httpServer = http.createServer();
    io = new Server(httpServer);

    io.on('connection', (socket) => {
      // 創建房間
      socket.on('createRoom', ({ player, maxPlayers }) => {
        const gameId = generateGameId();
        const roomState = {
          gameId,
          players: [{
            ...player,
            isHost: true,
            isDisconnected: false
          }],
          maxPlayers: maxPlayers || 4,
          gamePhase: 'waiting'
        };

        gameRooms.set(gameId, roomState);
        playerSockets.set(socket.id, { gameId, playerId: player.id });
        socket.join(gameId);

        socket.emit('roomCreated', { gameId, gameState: roomState });
        broadcastRoomList();
      });

      // 加入房間
      socket.on('joinRoom', ({ gameId, player }) => {
        const gameState = gameRooms.get(gameId);
        if (!gameState) {
          socket.emit('error', { message: '房間不存在' });
          return;
        }

        gameState.players.push({
          ...player,
          isHost: false,
          isDisconnected: false
        });

        playerSockets.set(socket.id, { gameId, playerId: player.id });
        socket.join(gameId);

        socket.emit('joinedRoom', { gameId, gameState });
        broadcastGameState(gameId);
        broadcastRoomList();
      });

      // 開始遊戲
      socket.on('startGame', ({ gameId }) => {
        const gameState = gameRooms.get(gameId);
        if (gameState) {
          gameState.gamePhase = 'playing';
          gameState.players.forEach((p, i) => {
            p.hand = [`card_${i}_1`, `card_${i}_2`, `card_${i}_3`];
            p.score = 0;
          });
          broadcastGameState(gameId);
        }
      });

      // 玩家正在重整
      socket.on('playerRefreshing', ({ gameId, playerId }) => {
        const refreshKey = `${gameId}:${playerId}`;
        refreshingPlayers.add(refreshKey);

        setTimeout(() => {
          refreshingPlayers.delete(refreshKey);
        }, REFRESH_GRACE_PERIOD);
      });

      // 斷線處理
      socket.on('disconnect', () => {
        const playerInfo = playerSockets.get(socket.id);
        if (playerInfo) {
          handlePlayerDisconnect(socket, playerInfo.gameId, playerInfo.playerId);
        }
      });

      // 重連處理
      socket.on('reconnect_request', ({ roomId, playerId, playerName }) => {
        handlePlayerReconnect(socket, roomId, playerId, playerName);
      });

      // 離開房間
      socket.on('leaveRoom', ({ gameId, playerId }) => {
        const gameState = gameRooms.get(gameId);
        if (!gameState) return;

        const playerIndex = gameState.players.findIndex(p => p.id === playerId);
        if (playerIndex === -1) return;

        const player = gameState.players[playerIndex];

        if (gameState.gamePhase === 'waiting') {
          gameState.players.splice(playerIndex, 1);

          if (gameState.players.length === 0) {
            gameRooms.delete(gameId);
          } else if (player.isHost) {
            gameState.players[0].isHost = true;
          }
        }

        socket.leave(gameId);
        playerSockets.delete(socket.id);
        broadcastGameState(gameId);
        broadcastRoomList();
      });
    });

    function handlePlayerDisconnect(socket, gameId, playerId) {
      const gameState = gameRooms.get(gameId);
      if (!gameState) {
        playerSockets.delete(socket.id);
        return;
      }

      const playerIndex = gameState.players.findIndex(p => p.id === playerId);
      if (playerIndex === -1) {
        playerSockets.delete(socket.id);
        return;
      }

      const player = gameState.players[playerIndex];
      const isWaitingPhase = gameState.gamePhase === 'waiting';
      const refreshKey = `${gameId}:${playerId}`;
      const isRefreshing = refreshingPlayers.has(refreshKey);

      let timeout_duration;
      if (isRefreshing) {
        timeout_duration = REFRESH_GRACE_PERIOD;
        player.isRefreshing = true;
      } else if (isWaitingPhase) {
        timeout_duration = WAITING_PHASE_DISCONNECT_TIMEOUT;
      } else {
        timeout_duration = DISCONNECT_TIMEOUT;
      }

      player.isDisconnected = true;
      player.disconnectedAt = Date.now();

      socket.leave(gameId);
      playerSockets.delete(socket.id);

      const timeoutKey = `${gameId}:${playerId}`;

      if (disconnectTimeouts.has(timeoutKey)) {
        clearTimeout(disconnectTimeouts.get(timeoutKey));
      }

      const disconnectTimer = setTimeout(() => {
        refreshingPlayers.delete(refreshKey);

        const currentState = gameRooms.get(gameId);
        if (currentState) {
          const currentPlayerIndex = currentState.players.findIndex(p => p.id === playerId);
          if (currentPlayerIndex !== -1 && currentState.players[currentPlayerIndex].isDisconnected) {
            const currentPlayer = currentState.players[currentPlayerIndex];

            if (isWaitingPhase || isRefreshing) {
              currentState.players.splice(currentPlayerIndex, 1);
              delete currentPlayer.isRefreshing;

              if (currentState.players.length === 0) {
                gameRooms.delete(gameId);
                broadcastRoomList();
              } else {
                if (currentPlayer.isHost && currentState.players.length > 0) {
                  currentState.players[0].isHost = true;
                }
                broadcastGameState(gameId);
                broadcastRoomList();
              }
            } else {
              currentState.players[currentPlayerIndex].isActive = false;
              currentState.players[currentPlayerIndex].isDisconnected = false;
              broadcastGameState(gameId);
            }
          }
        }
        disconnectTimeouts.delete(timeoutKey);
      }, timeout_duration);

      disconnectTimeouts.set(timeoutKey, disconnectTimer);
      broadcastGameState(gameId);
    }

    function handlePlayerReconnect(socket, roomId, playerId, playerName) {
      const gameState = gameRooms.get(roomId);

      if (!gameState) {
        socket.emit('reconnectFailed', { reason: 'room_not_found', message: '房間已不存在' });
        return;
      }

      const playerIndex = gameState.players.findIndex(p => p.id === playerId);

      if (playerIndex === -1) {
        socket.emit('reconnectFailed', { reason: 'player_not_found', message: '你已不在此房間中' });
        return;
      }

      const player = gameState.players[playerIndex];

      const timeoutKey = `${roomId}:${playerId}`;
      if (disconnectTimeouts.has(timeoutKey)) {
        clearTimeout(disconnectTimeouts.get(timeoutKey));
        disconnectTimeouts.delete(timeoutKey);
      }

      refreshingPlayers.delete(timeoutKey);

      player.isDisconnected = false;
      player.disconnectedAt = null;
      delete player.isRefreshing;

      playerSockets.set(socket.id, { gameId: roomId, playerId });
      socket.join(roomId);

      socket.emit('reconnected', {
        gameId: roomId,
        playerId: playerId,
        gameState: gameState
      });

      broadcastGameState(roomId);
    }

    httpServer.listen(() => {
      httpServerAddr = httpServer.address();
      resolve();
    });
  });
}

// 建立客戶端連線
function createClient() {
  return new Client(`http://localhost:${httpServerAddr.port}`, {
    transports: ['websocket'],
    forceNew: true
  });
}

// 等待事件
function waitForEvent(socket, event, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`等待事件 ${event} 超時`));
    }, timeout);

    socket.once(event, (data) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
}

// 延遲
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

describe('斷線重連整合測試', () => {
  beforeAll(async () => {
    await setupServer();
  });

  afterAll(() => {
    io.close();
    httpServer.close();
  });

  beforeEach(() => {
    // 清理狀態
    gameRooms.clear();
    playerSockets.clear();
    disconnectTimeouts.forEach(timer => clearTimeout(timer));
    disconnectTimeouts.clear();
    refreshingPlayers.clear();
  });

  describe('WA-01: 等待階段單人重整', () => {
    test('玩家重整後應能在 15 秒內重連成功', async () => {
      const client1 = createClient();
      await waitForEvent(client1, 'connect');

      // 建立房間
      client1.emit('createRoom', {
        player: { id: 'player1', name: '玩家A' },
        maxPlayers: 4
      });
      const { gameId, gameState } = await waitForEvent(client1, 'roomCreated');

      expect(gameState.players).toHaveLength(1);
      expect(gameState.players[0].isHost).toBe(true);

      // 發送重整通知並斷線
      client1.emit('playerRefreshing', { gameId, playerId: 'player1' });
      await delay(50);
      client1.disconnect();

      // 等待一下讓伺服器處理（在寬限期內重連）
      await delay(100);

      // 重新連線
      const client2 = createClient();
      await waitForEvent(client2, 'connect');

      // 嘗試重連
      client2.emit('reconnect_request', {
        roomId: gameId,
        playerId: 'player1',
        playerName: '玩家A'
      });

      const reconnectResult = await waitForEvent(client2, 'reconnected');
      expect(reconnectResult.gameId).toBe(gameId);
      expect(reconnectResult.gameState.players[0].isDisconnected).toBe(false);

      client2.disconnect();
    });
  });

  describe('WA-02: 等待階段多人重整', () => {
    test('房主重整時其他玩家應看到斷線狀態然後恢復', async () => {
      const client1 = createClient();
      const client2 = createClient();
      await Promise.all([
        waitForEvent(client1, 'connect'),
        waitForEvent(client2, 'connect')
      ]);

      // 玩家 A 建立房間
      client1.emit('createRoom', {
        player: { id: 'player1', name: '玩家A' },
        maxPlayers: 4
      });
      const { gameId } = await waitForEvent(client1, 'roomCreated');

      // 玩家 B 加入房間
      client2.emit('joinRoom', {
        gameId,
        player: { id: 'player2', name: '玩家B' }
      });
      await waitForEvent(client2, 'joinedRoom');

      // 監聽玩家 B 收到的狀態更新
      const stateUpdates = [];
      client2.on('gameState', (state) => {
        stateUpdates.push(state);
      });

      // 玩家 A 發送重整通知並斷線
      client1.emit('playerRefreshing', { gameId, playerId: 'player1' });
      await delay(50);
      client1.disconnect();

      // 等待狀態更新（在寬限期內）
      await delay(100);

      // 玩家 B 應看到玩家 A 斷線
      const disconnectedState = stateUpdates.find(s =>
        s.players.find(p => p.id === 'player1' && p.isDisconnected)
      );
      expect(disconnectedState).toBeDefined();

      // 玩家 A 重連（在寬限期內）
      const client1b = createClient();
      await waitForEvent(client1b, 'connect');
      client1b.emit('reconnect_request', {
        roomId: gameId,
        playerId: 'player1',
        playerName: '玩家A'
      });
      await waitForEvent(client1b, 'reconnected');

      // 等待狀態更新
      await delay(100);

      // 玩家 B 應看到玩家 A 恢復
      const reconnectedState = stateUpdates.find(s =>
        s.players.find(p => p.id === 'player1' && !p.isDisconnected)
      );
      expect(reconnectedState).toBeDefined();

      client1b.disconnect();
      client2.disconnect();
    });
  });

  describe('WA-03: 等待階段房主超時', () => {
    test('房主斷線超過 15 秒應被移除，房主轉移', async () => {
      // 使用較短的超時進行測試
      const originalTimeout = WAITING_PHASE_DISCONNECT_TIMEOUT;

      const client1 = createClient();
      const client2 = createClient();
      await Promise.all([
        waitForEvent(client1, 'connect'),
        waitForEvent(client2, 'connect')
      ]);

      // 玩家 A 建立房間
      client1.emit('createRoom', {
        player: { id: 'player1', name: '玩家A' },
        maxPlayers: 4
      });
      const { gameId } = await waitForEvent(client1, 'roomCreated');

      // 玩家 B 加入
      client2.emit('joinRoom', {
        gameId,
        player: { id: 'player2', name: '玩家B' }
      });
      await waitForEvent(client2, 'joinedRoom');

      // 監聽玩家 B 收到的狀態更新
      let latestState = null;
      client2.on('gameState', (state) => {
        latestState = state;
      });

      // 玩家 A 斷線（不發送 playerRefreshing）
      client1.disconnect();

      // 等待超時（WAITING_PHASE_DISCONNECT_TIMEOUT = 500ms）
      await delay(700);

      // 驗證玩家 A 被移除，玩家 B 成為房主
      expect(latestState).not.toBeNull();
      expect(latestState.players).toHaveLength(1);
      expect(latestState.players[0].id).toBe('player2');
      expect(latestState.players[0].isHost).toBe(true);

      client2.disconnect();
    });
  });

  describe('GP-01: 遊戲中重整', () => {
    test('遊戲中重整後應恢復手牌和狀態', async () => {
      const client1 = createClient();
      const client2 = createClient();
      const client3 = createClient();
      await Promise.all([
        waitForEvent(client1, 'connect'),
        waitForEvent(client2, 'connect'),
        waitForEvent(client3, 'connect')
      ]);

      // 建立房間並加入
      client1.emit('createRoom', {
        player: { id: 'player1', name: '玩家A' },
        maxPlayers: 3
      });
      const { gameId } = await waitForEvent(client1, 'roomCreated');

      client2.emit('joinRoom', { gameId, player: { id: 'player2', name: '玩家B' } });
      await waitForEvent(client2, 'joinedRoom');

      client3.emit('joinRoom', { gameId, player: { id: 'player3', name: '玩家C' } });
      await waitForEvent(client3, 'joinedRoom');

      // 開始遊戲
      client1.emit('startGame', { gameId });
      await delay(200);

      // 取得遊戲狀態
      const gameState = gameRooms.get(gameId);
      expect(gameState.gamePhase).toBe('playing');
      const originalHand = gameState.players[0].hand;

      // 玩家 A 發送重整通知並斷線
      client1.emit('playerRefreshing', { gameId, playerId: 'player1' });
      await delay(100);
      client1.disconnect();
      await delay(300);

      // 重連
      const client1b = createClient();
      await waitForEvent(client1b, 'connect');
      client1b.emit('reconnect_request', {
        roomId: gameId,
        playerId: 'player1',
        playerName: '玩家A'
      });

      const { gameState: reconnectedState } = await waitForEvent(client1b, 'reconnected');

      // 驗證手牌恢復
      const player = reconnectedState.players.find(p => p.id === 'player1');
      expect(player.hand).toEqual(originalHand);
      expect(player.isDisconnected).toBe(false);

      client1b.disconnect();
      client2.disconnect();
      client3.disconnect();
    });
  });

  describe('GP-03: 遊戲中長時間斷線', () => {
    test('斷線超過 60 秒應標記為不活躍', async () => {
      const client1 = createClient();
      const client2 = createClient();
      const client3 = createClient();
      await Promise.all([
        waitForEvent(client1, 'connect'),
        waitForEvent(client2, 'connect'),
        waitForEvent(client3, 'connect')
      ]);

      // 建立房間並開始遊戲
      client1.emit('createRoom', {
        player: { id: 'player1', name: '玩家A' },
        maxPlayers: 3
      });
      const { gameId } = await waitForEvent(client1, 'roomCreated');

      client2.emit('joinRoom', { gameId, player: { id: 'player2', name: '玩家B' } });
      await waitForEvent(client2, 'joinedRoom');

      client3.emit('joinRoom', { gameId, player: { id: 'player3', name: '玩家C' } });
      await waitForEvent(client3, 'joinedRoom');

      client1.emit('startGame', { gameId });
      await delay(200);

      // 監聽狀態更新
      let latestState = null;
      client2.on('gameState', (state) => {
        latestState = state;
      });

      // 玩家 A 斷線（不是重整）
      client1.disconnect();

      // 等待斷線超時（DISCONNECT_TIMEOUT = 1000ms）
      await delay(1200);

      // 驗證玩家 A 標記為不活躍
      expect(latestState).not.toBeNull();
      const player1 = latestState.players.find(p => p.id === 'player1');
      expect(player1.isActive).toBe(false);
      expect(player1.isDisconnected).toBe(false);

      client2.disconnect();
      client3.disconnect();
    });
  });

  describe('EC-01: 重連時房間已被刪除', () => {
    test('單人房間超時後重連應收到錯誤', async () => {
      const client1 = createClient();
      await waitForEvent(client1, 'connect');

      // 建立房間
      client1.emit('createRoom', {
        player: { id: 'player1', name: '玩家A' },
        maxPlayers: 4
      });
      const { gameId } = await waitForEvent(client1, 'roomCreated');

      // 斷線
      client1.disconnect();

      // 等待超時（WAITING_PHASE_DISCONNECT_TIMEOUT = 500ms）
      await delay(700);

      // 確認房間已刪除
      expect(gameRooms.has(gameId)).toBe(false);

      // 嘗試重連
      const client2 = createClient();
      await waitForEvent(client2, 'connect');
      client2.emit('reconnect_request', {
        roomId: gameId,
        playerId: 'player1',
        playerName: '玩家A'
      });

      const error = await waitForEvent(client2, 'reconnectFailed');
      expect(error.reason).toBe('room_not_found');
      expect(error.message).toBe('房間已不存在');

      client2.disconnect();
    });
  });

  describe('PF-01: 快速連續重整', () => {
    test('快速重整不應產生多個玩家副本', async () => {
      const client1 = createClient();
      await waitForEvent(client1, 'connect');

      // 建立房間
      client1.emit('createRoom', {
        player: { id: 'player1', name: '玩家A' },
        maxPlayers: 4
      });
      const { gameId } = await waitForEvent(client1, 'roomCreated');

      // 模擬快速重整三次
      for (let i = 0; i < 3; i++) {
        client1.emit('playerRefreshing', { gameId, playerId: 'player1' });
        await delay(50);
        client1.disconnect();
        await delay(100);

        const newClient = createClient();
        await waitForEvent(newClient, 'connect');
        newClient.emit('reconnect_request', {
          roomId: gameId,
          playerId: 'player1',
          playerName: '玩家A'
        });
        await waitForEvent(newClient, 'reconnected');

        // 驗證只有一個玩家
        const gameState = gameRooms.get(gameId);
        expect(gameState.players).toHaveLength(1);
        expect(gameState.players[0].id).toBe('player1');

        if (i < 2) {
          newClient.disconnect();
          await delay(100);
        } else {
          newClient.disconnect();
        }
      }
    });
  });

  describe('RP-02: 主動離開時清除', () => {
    test('主動離開房間後應從房間移除', async () => {
      const client1 = createClient();
      const client2 = createClient();
      await Promise.all([
        waitForEvent(client1, 'connect'),
        waitForEvent(client2, 'connect')
      ]);

      // 建立房間
      client1.emit('createRoom', {
        player: { id: 'player1', name: '玩家A' },
        maxPlayers: 4
      });
      const { gameId } = await waitForEvent(client1, 'roomCreated');

      // 玩家 B 加入
      client2.emit('joinRoom', {
        gameId,
        player: { id: 'player2', name: '玩家B' }
      });
      await waitForEvent(client2, 'joinedRoom');

      // 玩家 A 主動離開
      client1.emit('leaveRoom', { gameId, playerId: 'player1' });
      await delay(200);

      // 驗證
      const gameState = gameRooms.get(gameId);
      expect(gameState.players).toHaveLength(1);
      expect(gameState.players[0].id).toBe('player2');
      expect(gameState.players[0].isHost).toBe(true); // 房主轉移

      client1.disconnect();
      client2.disconnect();
    });
  });

  describe('重整寬限期測試', () => {
    test('發送 playerRefreshing 後應使用較短的超時時間', async () => {
      const client1 = createClient();
      await waitForEvent(client1, 'connect');

      // 建立房間
      client1.emit('createRoom', {
        player: { id: 'player1', name: '玩家A' },
        maxPlayers: 4
      });
      const { gameId } = await waitForEvent(client1, 'roomCreated');

      // 發送重整通知
      client1.emit('playerRefreshing', { gameId, playerId: 'player1' });
      await delay(100);

      // 驗證在 refreshingPlayers 中
      expect(refreshingPlayers.has(`${gameId}:player1`)).toBe(true);

      // 斷線
      client1.disconnect();
      await delay(100);

      // 在寬限期內重連應該成功（REFRESH_GRACE_PERIOD = 500ms）
      await delay(200);

      const client2 = createClient();
      await waitForEvent(client2, 'connect');
      client2.emit('reconnect_request', {
        roomId: gameId,
        playerId: 'player1',
        playerName: '玩家A'
      });

      const result = await waitForEvent(client2, 'reconnected');
      expect(result.gameId).toBe(gameId);

      client2.disconnect();
    });
  });
});
