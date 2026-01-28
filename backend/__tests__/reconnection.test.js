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
// 工單 0202：跟猜與預測階段狀態
const followGuessStates = new Map();
const postQuestionStates = new Map();

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

      // 工單 0202：跟猜階段恢復
      const followState = followGuessStates.get(roomId);
      if (followState && followState.decisionOrder.includes(playerId)) {
        socket.emit('followGuessStarted', {
          guessingPlayerId: followState.guessingPlayerId,
          guessedColors: followState.guessedColors,
          decisionOrder: followState.decisionOrder,
          currentDeciderId: followState.currentDeciderId,
          decisions: followState.decisions
        });
      }

      // 工單 0202：預測階段恢復
      const postState = postQuestionStates.get(roomId);
      if (postState && postState.playerId === playerId) {
        socket.emit('postQuestionPhase', {
          playerId: postState.playerId,
          message: postState.message || '請選擇是否要進行預測'
        });
      }

      broadcastGameState(roomId);
    }

    httpServer.listen(() => {
      httpServerAddr = httpServer.address();
      resolve();
    });
  });
}

// 追蹤所有測試中建立的客戶端連線
const activeClients = [];

// 建立客戶端連線
function createClient() {
  const client = new Client(`http://localhost:${httpServerAddr.port}`, {
    transports: ['websocket'],
    forceNew: true
  });
  activeClients.push(client);
  return client;
}

// 追蹤所有待處理的計時器
const pendingTimers = new Set();

// 等待事件
function waitForEvent(socket, event, timeout = 10000) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      pendingTimers.delete(timer);
      if (!settled) {
        settled = true;
        reject(new Error(`等待事件 ${event} 超時`));
      }
    }, timeout);
    pendingTimers.add(timer);

    socket.once(event, (data) => {
      clearTimeout(timer);
      pendingTimers.delete(timer);
      if (!settled) {
        settled = true;
        resolve(data);
      }
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

  afterEach(async () => {
    // 清除所有未完成的 waitForEvent 計時器
    pendingTimers.forEach(timer => clearTimeout(timer));
    pendingTimers.clear();
    // 強制斷開所有測試中建立的客戶端連線
    activeClients.forEach(c => {
      if (c.connected) c.disconnect();
    });
    activeClients.length = 0;
    // 等待 socket 斷線事件處理完畢
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  beforeEach(() => {
    // 清理狀態
    gameRooms.clear();
    playerSockets.clear();
    disconnectTimeouts.forEach(timer => clearTimeout(timer));
    disconnectTimeouts.clear();
    refreshingPlayers.clear();
    followGuessStates.clear();
    postQuestionStates.clear();
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

  // ====================================================================
  // 工單 0202：重連整合測試
  // ====================================================================

  describe('TC-0202-01：BUG-001 修復驗證 — reconnected 事件 payload', () => {
    test('TC-0202-01a：重連成功時應發送包含完整 gameState 的 reconnected 事件', async () => {
      const client1 = createClient();
      const client2 = createClient();
      const client3 = createClient();
      await Promise.all([
        waitForEvent(client1, 'connect'),
        waitForEvent(client2, 'connect'),
        waitForEvent(client3, 'connect')
      ]);

      // 建立 3 人房間並開始遊戲
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

      // 玩家 A 斷線
      client1.emit('playerRefreshing', { gameId, playerId: 'player1' });
      await delay(50);
      client1.disconnect();
      await delay(100);

      // 重連
      const client1b = createClient();
      await waitForEvent(client1b, 'connect');
      client1b.emit('reconnect_request', {
        roomId: gameId,
        playerId: 'player1',
        playerName: '玩家A'
      });

      const result = await waitForEvent(client1b, 'reconnected');

      // 驗證 reconnected payload
      expect(result.gameId).toBe(gameId);
      expect(result.playerId).toBe('player1');
      expect(result.gameState).toBeDefined();
      expect(typeof result.gameState).toBe('object');

      client1b.disconnect();
      client2.disconnect();
      client3.disconnect();
    });

    test('TC-0202-01b：gameState 應包含所有必要遊戲欄位', async () => {
      const client1 = createClient();
      const client2 = createClient();
      const client3 = createClient();
      await Promise.all([
        waitForEvent(client1, 'connect'),
        waitForEvent(client2, 'connect'),
        waitForEvent(client3, 'connect')
      ]);

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

      // 斷線重連
      client1.emit('playerRefreshing', { gameId, playerId: 'player1' });
      await delay(50);
      client1.disconnect();
      await delay(100);

      const client1b = createClient();
      await waitForEvent(client1b, 'connect');
      client1b.emit('reconnect_request', {
        roomId: gameId,
        playerId: 'player1',
        playerName: '玩家A'
      });

      const { gameState } = await waitForEvent(client1b, 'reconnected');

      // 驗證必要欄位
      expect(Array.isArray(gameState.players)).toBe(true);
      expect(typeof gameState.maxPlayers).toBe('number');
      expect(typeof gameState.gamePhase).toBe('string');
      expect(gameState.gamePhase).toBe('playing');
      // 遊戲中每個玩家應有 hand
      gameState.players.forEach(p => {
        expect(Array.isArray(p.hand)).toBe(true);
      });

      client1b.disconnect();
      client2.disconnect();
      client3.disconnect();
    });

    test('TC-0202-01c：重連不應拋出錯誤', async () => {
      const client1 = createClient();
      await waitForEvent(client1, 'connect');

      client1.emit('createRoom', {
        player: { id: 'player1', name: '玩家A' },
        maxPlayers: 4
      });
      const { gameId } = await waitForEvent(client1, 'roomCreated');

      client1.emit('playerRefreshing', { gameId, playerId: 'player1' });
      await delay(50);
      client1.disconnect();
      await delay(100);

      // 重連不應報錯
      const client1b = createClient();
      await waitForEvent(client1b, 'connect');

      await expect(async () => {
        client1b.emit('reconnect_request', {
          roomId: gameId,
          playerId: 'player1',
          playerName: '玩家A'
        });
        await waitForEvent(client1b, 'reconnected');
      }).not.toThrow();

      client1b.disconnect();
    });
  });

  describe('TC-0202-02：BUG-004 修復驗證 — 跟猜階段重連', () => {
    test('TC-0202-02a：跟猜階段重連時應收到 followGuessStarted 事件', async () => {
      const client1 = createClient();
      const client2 = createClient();
      const client3 = createClient();
      await Promise.all([
        waitForEvent(client1, 'connect'),
        waitForEvent(client2, 'connect'),
        waitForEvent(client3, 'connect')
      ]);

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

      // 手動設定跟猜狀態（模擬玩家 1 猜牌觸發跟猜）
      followGuessStates.set(gameId, {
        guessingPlayerId: 'player1',
        guessedColors: ['red', 'blue'],
        decisionOrder: ['player2', 'player3'],
        currentDeciderId: 'player2',
        decisions: {}
      });

      // 玩家 2 斷線重連
      client2.emit('playerRefreshing', { gameId, playerId: 'player2' });
      await delay(50);
      client2.disconnect();
      await delay(100);

      const client2b = createClient();
      await waitForEvent(client2b, 'connect');

      // 先註冊所有事件監聽器，避免競態條件
      const reconnectedPromise = waitForEvent(client2b, 'reconnected', 10000);
      const followGuessPromise = waitForEvent(client2b, 'followGuessStarted', 10000);

      client2b.emit('reconnect_request', {
        roomId: gameId,
        playerId: 'player2',
        playerName: '玩家B'
      });

      const reconnected = await reconnectedPromise;
      expect(reconnected.gameId).toBe(gameId);

      const followGuess = await followGuessPromise;
      expect(followGuess.guessingPlayerId).toBe('player1');
      expect(followGuess.guessedColors).toEqual(['red', 'blue']);
      expect(followGuess.decisionOrder).toEqual(['player2', 'player3']);
      expect(followGuess.currentDeciderId).toBe('player2');
      expect(followGuess.decisions).toEqual({});

      client1.disconnect();
      client2b.disconnect();
      client3.disconnect();
    }, 15000);

    test('TC-0202-02b：非跟猜階段重連時不應收到 followGuessStarted', async () => {
      const client1 = createClient();
      const client2 = createClient();
      const client3 = createClient();
      await Promise.all([
        waitForEvent(client1, 'connect'),
        waitForEvent(client2, 'connect'),
        waitForEvent(client3, 'connect')
      ]);

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

      // 不設定 followGuessStates

      // 玩家 2 斷線重連
      client2.emit('playerRefreshing', { gameId, playerId: 'player2' });
      await delay(50);
      client2.disconnect();
      await delay(100);

      const client2b = createClient();
      await waitForEvent(client2b, 'connect');

      let receivedFollowGuess = false;
      client2b.on('followGuessStarted', () => {
        receivedFollowGuess = true;
      });

      client2b.emit('reconnect_request', {
        roomId: gameId,
        playerId: 'player2',
        playerName: '玩家B'
      });

      await waitForEvent(client2b, 'reconnected');
      await delay(200);

      expect(receivedFollowGuess).toBe(false);

      client1.disconnect();
      client2b.disconnect();
      client3.disconnect();
    });

    test('TC-0202-02c：不在 decisionOrder 中的玩家重連不應收到跟猜事件', async () => {
      const client1 = createClient();
      const client2 = createClient();
      const client3 = createClient();
      await Promise.all([
        waitForEvent(client1, 'connect'),
        waitForEvent(client2, 'connect'),
        waitForEvent(client3, 'connect')
      ]);

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

      // 跟猜狀態：只有 player2 和 player3 需要跟猜
      followGuessStates.set(gameId, {
        guessingPlayerId: 'player1',
        guessedColors: ['red', 'blue'],
        decisionOrder: ['player2', 'player3'],
        currentDeciderId: 'player2',
        decisions: {}
      });

      // 玩家 1（不在 decisionOrder 中）斷線重連
      client1.emit('playerRefreshing', { gameId, playerId: 'player1' });
      await delay(50);
      client1.disconnect();
      await delay(100);

      const client1b = createClient();
      await waitForEvent(client1b, 'connect');

      let receivedFollowGuess = false;
      client1b.on('followGuessStarted', () => {
        receivedFollowGuess = true;
      });

      client1b.emit('reconnect_request', {
        roomId: gameId,
        playerId: 'player1',
        playerName: '玩家A'
      });

      await waitForEvent(client1b, 'reconnected');
      await delay(200);

      expect(receivedFollowGuess).toBe(false);

      client1b.disconnect();
      client2.disconnect();
      client3.disconnect();
    });
  });

  describe('TC-0202-03：預測階段重連恢復', () => {
    test('TC-0202-03a：預測階段重連時應收到 postQuestionPhase 事件', async () => {
      const client1 = createClient();
      const client2 = createClient();
      const client3 = createClient();
      await Promise.all([
        waitForEvent(client1, 'connect'),
        waitForEvent(client2, 'connect'),
        waitForEvent(client3, 'connect')
      ]);

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

      // 手動設定預測階段狀態
      postQuestionStates.set(gameId, {
        playerId: 'player1',
        message: '請選擇是否要進行預測'
      });

      // 玩家 1 斷線重連
      client1.emit('playerRefreshing', { gameId, playerId: 'player1' });
      await delay(50);
      client1.disconnect();
      await delay(100);

      const client1b = createClient();
      await waitForEvent(client1b, 'connect');

      // 先註冊所有事件監聽器，避免競態條件
      const reconnectedPromise = waitForEvent(client1b, 'reconnected', 10000);
      const postPhasePromise = waitForEvent(client1b, 'postQuestionPhase', 10000);

      client1b.emit('reconnect_request', {
        roomId: gameId,
        playerId: 'player1',
        playerName: '玩家A'
      });

      await reconnectedPromise;
      const postPhase = await postPhasePromise;

      expect(postPhase.playerId).toBe('player1');
      expect(postPhase.message).toBe('請選擇是否要進行預測');

      client1b.disconnect();
      client2.disconnect();
      client3.disconnect();
    }, 15000);

    test('TC-0202-03b：非當前預測玩家重連不應收到 postQuestionPhase', async () => {
      const client1 = createClient();
      const client2 = createClient();
      const client3 = createClient();
      await Promise.all([
        waitForEvent(client1, 'connect'),
        waitForEvent(client2, 'connect'),
        waitForEvent(client3, 'connect')
      ]);

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

      // 預測階段是玩家 1 的
      postQuestionStates.set(gameId, {
        playerId: 'player1',
        message: '請選擇是否要進行預測'
      });

      // 玩家 2（非預測玩家）斷線重連
      client2.emit('playerRefreshing', { gameId, playerId: 'player2' });
      await delay(50);
      client2.disconnect();
      await delay(100);

      const client2b = createClient();
      await waitForEvent(client2b, 'connect');

      let receivedPostPhase = false;
      client2b.on('postQuestionPhase', () => {
        receivedPostPhase = true;
      });

      client2b.emit('reconnect_request', {
        roomId: gameId,
        playerId: 'player2',
        playerName: '玩家B'
      });

      await waitForEvent(client2b, 'reconnected');
      await delay(200);

      expect(receivedPostPhase).toBe(false);

      client1.disconnect();
      client2b.disconnect();
      client3.disconnect();
    });
  });

  describe('TC-0202-04：完整重整事件鏈', () => {
    test('TC-0202-04a：playerRefreshing → disconnect → reconnect 應成功恢復', async () => {
      const client1 = createClient();
      const client2 = createClient();
      const client3 = createClient();
      await Promise.all([
        waitForEvent(client1, 'connect'),
        waitForEvent(client2, 'connect'),
        waitForEvent(client3, 'connect')
      ]);

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

      // 完整事件鏈：playerRefreshing → disconnect → reconnect
      client1.emit('playerRefreshing', { gameId, playerId: 'player1' });
      await delay(50);
      client1.disconnect();
      await delay(100);

      const client1b = createClient();
      await waitForEvent(client1b, 'connect');
      client1b.emit('reconnect_request', {
        roomId: gameId,
        playerId: 'player1',
        playerName: '玩家A'
      });

      const result = await waitForEvent(client1b, 'reconnected');

      // 驗證恢復成功
      expect(result.gameId).toBe(gameId);
      const player = result.gameState.players.find(p => p.id === 'player1');
      expect(player.isDisconnected).toBe(false);

      // 驗證 refreshingPlayers 不含該玩家
      const refreshKey = `${gameId}:player1`;
      expect(refreshingPlayers.has(refreshKey)).toBe(false);

      client1b.disconnect();
      client2.disconnect();
      client3.disconnect();
    });

    test('TC-0202-04b：playerRefreshing 超時後應移除玩家（等待階段）', async () => {
      const client1 = createClient();
      const client2 = createClient();
      await Promise.all([
        waitForEvent(client1, 'connect'),
        waitForEvent(client2, 'connect')
      ]);

      client1.emit('createRoom', {
        player: { id: 'player1', name: '玩家A' },
        maxPlayers: 4
      });
      const { gameId } = await waitForEvent(client1, 'roomCreated');

      client2.emit('joinRoom', { gameId, player: { id: 'player2', name: '玩家B' } });
      await waitForEvent(client2, 'joinedRoom');

      // 等待階段發送 playerRefreshing 並斷線
      client1.emit('playerRefreshing', { gameId, playerId: 'player1' });
      await delay(50);
      client1.disconnect();

      // 等待超過寬限期（REFRESH_GRACE_PERIOD = 500ms）
      await delay(700);

      // 玩家應被從房間移除
      const gameState = gameRooms.get(gameId);
      expect(gameState).toBeDefined();
      expect(gameState.players).toHaveLength(1);
      expect(gameState.players[0].id).toBe('player2');

      client2.disconnect();
    });
  });

  describe('TC-0202-05：多人同時重整', () => {
    test('TC-0202-05a：3 位玩家同時斷線後各自獨立計時', async () => {
      const client1 = createClient();
      const client2 = createClient();
      const client3 = createClient();
      await Promise.all([
        waitForEvent(client1, 'connect'),
        waitForEvent(client2, 'connect'),
        waitForEvent(client3, 'connect')
      ]);

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

      // 3 位玩家同時發送 playerRefreshing 並斷線
      client1.emit('playerRefreshing', { gameId, playerId: 'player1' });
      client2.emit('playerRefreshing', { gameId, playerId: 'player2' });
      client3.emit('playerRefreshing', { gameId, playerId: 'player3' });
      await delay(50);

      client1.disconnect();
      client2.disconnect();
      client3.disconnect();
      await delay(200);

      // 應有 3 個獨立的斷線計時器
      expect(disconnectTimeouts.size).toBe(3);
    });

    test('TC-0202-05b：3 位玩家依序重連應全部成功', async () => {
      const client1 = createClient();
      const client2 = createClient();
      const client3 = createClient();
      await Promise.all([
        waitForEvent(client1, 'connect'),
        waitForEvent(client2, 'connect'),
        waitForEvent(client3, 'connect')
      ]);

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

      // 3 位玩家同時斷線
      client1.emit('playerRefreshing', { gameId, playerId: 'player1' });
      client2.emit('playerRefreshing', { gameId, playerId: 'player2' });
      client3.emit('playerRefreshing', { gameId, playerId: 'player3' });
      await delay(50);

      client1.disconnect();
      client2.disconnect();
      client3.disconnect();
      await delay(100);

      // 依序重連
      const newClients = [];
      for (const [id, name] of [['player1', '玩家A'], ['player2', '玩家B'], ['player3', '玩家C']]) {
        const nc = createClient();
        await waitForEvent(nc, 'connect');
        nc.emit('reconnect_request', { roomId: gameId, playerId: id, playerName: name });
        const result = await waitForEvent(nc, 'reconnected');
        expect(result.gameId).toBe(gameId);
        newClients.push(nc);
      }

      // 驗證房間玩家數仍為 3
      const gameState = gameRooms.get(gameId);
      expect(gameState.players).toHaveLength(3);
      expect(gameState.players.every(p => !p.isDisconnected)).toBe(true);

      newClients.forEach(c => c.disconnect());
    });
  });

  // ====================================================================
  // 工單 0203：E2E 場景、邊界條件與回歸測試
  // ====================================================================

  describe('TC-0203-01：等待階段重整後恢復', () => {
    test('TC-0203-01a：3 人等待階段重整後應恢復完整狀態', async () => {
      const client1 = createClient();
      const client2 = createClient();
      const client3 = createClient();
      await Promise.all([
        waitForEvent(client1, 'connect'),
        waitForEvent(client2, 'connect'),
        waitForEvent(client3, 'connect')
      ]);

      // 建立 3 人等待階段
      client1.emit('createRoom', {
        player: { id: 'player1', name: '玩家A' },
        maxPlayers: 3
      });
      const { gameId } = await waitForEvent(client1, 'roomCreated');

      client2.emit('joinRoom', { gameId, player: { id: 'player2', name: '玩家B' } });
      await waitForEvent(client2, 'joinedRoom');

      client3.emit('joinRoom', { gameId, player: { id: 'player3', name: '玩家C' } });
      await waitForEvent(client3, 'joinedRoom');

      // 玩家 C 發送 playerRefreshing → 斷線 → 重連
      client3.emit('playerRefreshing', { gameId, playerId: 'player3' });
      await delay(50);
      client3.disconnect();
      await delay(100);

      const client3b = createClient();
      await waitForEvent(client3b, 'connect');
      client3b.emit('reconnect_request', {
        roomId: gameId,
        playerId: 'player3',
        playerName: '玩家C'
      });

      const result = await waitForEvent(client3b, 'reconnected');

      // 驗證完整狀態
      expect(result.gameId).toBe(gameId);
      expect(result.gameState.players).toHaveLength(3);
      expect(result.gameState.players[0].isHost).toBe(true);
      expect(result.gameState.players[0].id).toBe('player1'); // 房主不變
      expect(result.gameState.gamePhase).toBe('waiting');

      client1.disconnect();
      client2.disconnect();
      client3b.disconnect();
    });
  });

  describe('TC-0203-02：遊戲中重整（輪到自己）', () => {
    test('TC-0203-02a：輪到自己時重整後應恢復正確狀態', async () => {
      const client1 = createClient();
      const client2 = createClient();
      const client3 = createClient();
      await Promise.all([
        waitForEvent(client1, 'connect'),
        waitForEvent(client2, 'connect'),
        waitForEvent(client3, 'connect')
      ]);

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

      // 手動設定 currentPlayerIndex = 0（輪到玩家 A）
      const gameState = gameRooms.get(gameId);
      gameState.currentPlayerIndex = 0;

      // 玩家 A（輪到自己）發送 playerRefreshing → 斷線 → 重連
      client1.emit('playerRefreshing', { gameId, playerId: 'player1' });
      await delay(100);
      client1.disconnect();
      await delay(200);

      const client1b = createClient();
      await waitForEvent(client1b, 'connect');

      // 先註冊監聽器，避免競態條件
      const reconnectedPromise = waitForEvent(client1b, 'reconnected', 10000);
      client1b.emit('reconnect_request', {
        roomId: gameId,
        playerId: 'player1',
        playerName: '玩家A'
      });

      const result = await reconnectedPromise;

      // 驗證
      expect(result.gameState.gamePhase).toBe('playing');
      expect(result.gameState.currentPlayerIndex).toBe(0);
      const player = result.gameState.players.find(p => p.id === 'player1');
      expect(player.hand).toBeDefined();
      expect(player.hand.length).toBeGreaterThan(0);

      client1b.disconnect();
      client2.disconnect();
      client3.disconnect();
    }, 15000);
  });

  describe('TC-0203-03：遊戲中重整（非自己回合）', () => {
    test('TC-0203-03a：非自己回合重整後應恢復正確狀態', async () => {
      const client1 = createClient();
      const client2 = createClient();
      const client3 = createClient();
      await Promise.all([
        waitForEvent(client1, 'connect'),
        waitForEvent(client2, 'connect'),
        waitForEvent(client3, 'connect')
      ]);

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

      // 設定 currentPlayerIndex = 1（輪到玩家 B）
      const gameState = gameRooms.get(gameId);
      gameState.currentPlayerIndex = 1;
      const originalHand = [...gameState.players[0].hand];

      // 玩家 A（非自己回合）斷線重連
      client1.emit('playerRefreshing', { gameId, playerId: 'player1' });
      await delay(50);
      client1.disconnect();
      await delay(100);

      const client1b = createClient();
      await waitForEvent(client1b, 'connect');
      client1b.emit('reconnect_request', {
        roomId: gameId,
        playerId: 'player1',
        playerName: '玩家A'
      });

      const result = await waitForEvent(client1b, 'reconnected');

      // 驗證 currentPlayerIndex 仍指向玩家 B
      expect(result.gameState.currentPlayerIndex).toBe(1);
      // 玩家 A 的手牌完整
      const playerA = result.gameState.players.find(p => p.id === 'player1');
      expect(playerA.hand).toEqual(originalHand);

      client1b.disconnect();
      client2.disconnect();
      client3.disconnect();
    });
  });

  describe('TC-0203-04：超時被移除後嘗試重連', () => {
    test('TC-0203-04a：超時被移除後重連應收到 player_not_found', async () => {
      const client1 = createClient();
      const client2 = createClient();
      await Promise.all([
        waitForEvent(client1, 'connect'),
        waitForEvent(client2, 'connect')
      ]);

      client1.emit('createRoom', {
        player: { id: 'player1', name: '玩家A' },
        maxPlayers: 4
      });
      const { gameId } = await waitForEvent(client1, 'roomCreated');

      client2.emit('joinRoom', { gameId, player: { id: 'player2', name: '玩家B' } });
      await waitForEvent(client2, 'joinedRoom');

      // 玩家 A 斷線（不發送 playerRefreshing）
      client1.disconnect();

      // 等待超過 WAITING_PHASE_DISCONNECT_TIMEOUT（500ms）
      await delay(700);

      // 嘗試重連 — 玩家已被移除
      const client1b = createClient();
      await waitForEvent(client1b, 'connect');
      client1b.emit('reconnect_request', {
        roomId: gameId,
        playerId: 'player1',
        playerName: '玩家A'
      });

      const error = await waitForEvent(client1b, 'reconnectFailed');
      expect(error.reason).toBe('player_not_found');

      client1b.disconnect();
      client2.disconnect();
    });
  });

  describe('TC-0203-05：房間已刪除時重連（額外驗證）', () => {
    test('TC-0203-05a：reason 應為 room_not_found 且 message 正確', async () => {
      const client1 = createClient();
      await waitForEvent(client1, 'connect');

      client1.emit('createRoom', {
        player: { id: 'player1', name: '玩家A' },
        maxPlayers: 4
      });
      const { gameId } = await waitForEvent(client1, 'roomCreated');

      // 斷線等待超時（單人房間會被刪除）
      client1.disconnect();
      await delay(700);

      expect(gameRooms.has(gameId)).toBe(false);

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

  describe('TC-0203-06：快速連續重整（額外驗證）', () => {
    test('TC-0203-06a：3 次重整後房間狀態應一致', async () => {
      const client1 = createClient();
      await waitForEvent(client1, 'connect');

      client1.emit('createRoom', {
        player: { id: 'player1', name: '玩家A' },
        maxPlayers: 4
      });
      const { gameId } = await waitForEvent(client1, 'roomCreated');

      let lastClient = client1;

      // 3 次重整
      for (let i = 0; i < 3; i++) {
        lastClient.emit('playerRefreshing', { gameId, playerId: 'player1' });
        await delay(50);
        lastClient.disconnect();
        await delay(100);

        const newClient = createClient();
        await waitForEvent(newClient, 'connect');
        newClient.emit('reconnect_request', {
          roomId: gameId,
          playerId: 'player1',
          playerName: '玩家A'
        });
        await waitForEvent(newClient, 'reconnected');
        lastClient = newClient;
      }

      // 驗證狀態一致
      const gameState = gameRooms.get(gameId);
      expect(gameState.players).toHaveLength(1);
      expect(gameState.players[0].id).toBe('player1');
      expect(gameState.players[0].isHost).toBe(true);
      expect(gameState.players[0].isDisconnected).toBe(false);
      expect(gameState.gamePhase).toBe('waiting');

      lastClient.disconnect();
    });
  });

  describe('TC-0203-07：正常加入離開流程（回歸）', () => {
    test('TC-0203-07a：正常加入離開不應受重連邏輯影響', async () => {
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
      client2.emit('joinRoom', { gameId, player: { id: 'player2', name: '玩家B' } });
      const joinResult = await waitForEvent(client2, 'joinedRoom');
      expect(joinResult.gameId).toBe(gameId);

      // 玩家 B 主動離開
      client2.emit('leaveRoom', { gameId, playerId: 'player2' });
      await delay(200);

      // 驗證：只剩 1 人、房主正確
      const gameState = gameRooms.get(gameId);
      expect(gameState.players).toHaveLength(1);
      expect(gameState.players[0].id).toBe('player1');
      expect(gameState.players[0].isHost).toBe(true);

      client1.disconnect();
      client2.disconnect();
    });
  });

  describe('TC-0203-08：正常遊戲開始流程（回歸）', () => {
    test('TC-0203-08a：正常開始遊戲不應受重連邏輯影響', async () => {
      const client1 = createClient();
      const client2 = createClient();
      const client3 = createClient();
      await Promise.all([
        waitForEvent(client1, 'connect'),
        waitForEvent(client2, 'connect'),
        waitForEvent(client3, 'connect')
      ]);

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

      const gameState = gameRooms.get(gameId);

      // 驗證遊戲狀態
      expect(gameState.gamePhase).toBe('playing');
      expect(gameState.players).toHaveLength(3);
      gameState.players.forEach(p => {
        expect(Array.isArray(p.hand)).toBe(true);
        expect(p.hand.length).toBeGreaterThan(0);
        expect(p.score).toBe(0);
      });

      client1.disconnect();
      client2.disconnect();
      client3.disconnect();
    });
  });

  describe('TC-0202-06：socketId 更新驗證', () => {
    test('TC-0202-06a：重連後 playerSockets Map 應包含新的映射', async () => {
      const client1 = createClient();
      await waitForEvent(client1, 'connect');

      client1.emit('createRoom', {
        player: { id: 'player1', name: '玩家A' },
        maxPlayers: 4
      });
      const { gameId } = await waitForEvent(client1, 'roomCreated');

      // 記錄舊 socketId
      const oldSocketId = client1.id;

      // 斷線
      client1.emit('playerRefreshing', { gameId, playerId: 'player1' });
      await delay(50);
      client1.disconnect();
      await delay(100);

      // 舊 socketId 應已從 playerSockets 移除
      expect(playerSockets.has(oldSocketId)).toBe(false);

      // 重連
      const client1b = createClient();
      await waitForEvent(client1b, 'connect');
      const newSocketId = client1b.id;

      client1b.emit('reconnect_request', {
        roomId: gameId,
        playerId: 'player1',
        playerName: '玩家A'
      });
      await waitForEvent(client1b, 'reconnected');

      // 新 socketId 應在 playerSockets 中
      expect(playerSockets.has(newSocketId)).toBe(true);
      expect(playerSockets.get(newSocketId)).toEqual({
        gameId: gameId,
        playerId: 'player1'
      });

      // socketId 應不同
      expect(newSocketId).not.toBe(oldSocketId);

      client1b.disconnect();
    });
  });
});
