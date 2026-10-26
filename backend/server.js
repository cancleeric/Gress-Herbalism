/**
 * 後端伺服器 - Socket.io 即時通訊
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

// 在載入任何設定使用者之前，從後端目錄載入本機設定。
// 已由 Vault／CI 注入的環境變數優先；不提供任何秘密預設值。
require('./config/loadEnvironment')();

// Supabase 資料庫
const {
  saveGameRecord,
  saveGameParticipants,
  getLeaderboard,
  getOrCreatePlayer,
  getPlayerStats,
  getPlayerHistory,
  getPlayerIdByFirebaseUid,
  updatePlayerGameStats,
} = require('./db/supabase');

// P1 安全修復：Firebase ID token 驗簽 middleware
const { verifyAuth, verifyFirebaseIdToken } = require('./middleware/verifyAuth');
const { publicGameState, installSocketSecurity } = require('./security/socketSecurity');

// 工單 0061 - 好友服務
const friendService = require('./services/friendService');
const invitationService = require('./services/invitationService');
const presenceService = require('./services/presenceService');
const { createPresenceLifecycle } = require('./security/presenceLifecycle');
const presenceLifecycle = createPresenceLifecycle({ getPlayerId: getPlayerIdByFirebaseUid, presenceService });

// 工單 0261 - 演化論遊戲房間管理（舊模組，保留但不使用）
// const evolutionRoomManager = require('./services/evolutionRoomManager');

// 工單 0313-0316 - 演化論遊戲處理（新模組）
const evolutionHandler = require('./evolutionGameHandler');

const app = express();
const server = http.createServer(app);

// 解析允許的來源網域
const getAllowedOrigins = () => {
  if (process.env.ALLOWED_ORIGINS) {
    return process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim());
  }
  // 開發環境允許所有來源
  return true;
};

const allowedOrigins = getAllowedOrigins();

// CORS 設定
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// JSON 解析
app.use(express.json());

// ==================== API 路由 ====================

// 取得排行榜
app.get('/api/leaderboard', async (req, res) => {
  try {
    const orderBy = req.query.orderBy || 'total_score';
    const limit = parseInt(req.query.limit) || 10;
    const leaderboard = await getLeaderboard(orderBy, limit);
    res.json({ success: true, data: leaderboard });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 健康檢查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ==================== 工單 0060 API ====================

// 同步玩家資料（登入時呼叫）
// P1：掛上 verifyAuth，使用 token 驗證後的 req.uid，不信任前端傳入的 firebaseUid
app.post('/api/players/sync', verifyAuth, async (req, res) => {
  try {
    const { displayName } = req.body;
    // req.uid 由 verifyAuth 從 Firebase ID token 中提取，不可被前端偽造
    const uid = req.uid;

    const player = await getOrCreatePlayer(displayName || '玩家', uid);
    if (!player) {
      return res.status(503).json({ success: false, message: '玩家同步暫時無法完成，請稍後重試' });
    }
    res.json({ success: true, data: player });
  } catch (err) {
    res.status(500).json({ success: false, message: '玩家同步失敗，請稍後重試' });
  }
});

// 取得玩家統計
// P1：掛上 verifyAuth，以 token 中的 uid 為準（URL 路徑的 :firebaseUid 僅供向下相容，不信任）
app.get('/api/players/:firebaseUid/stats', verifyAuth, async (req, res) => {
  try {
    // 使用 token 驗證後的 req.uid，不採用前端傳入的 URL param
    const uid = req.uid;
    const stats = await getPlayerStats(uid);

    if (!stats) {
      return res.status(404).json({ success: false, message: '玩家不存在' });
    }

    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 取得玩家遊戲歷史
// P1：掛上 verifyAuth，以 token 中的 uid 為準
app.get('/api/players/:firebaseUid/history', verifyAuth, async (req, res) => {
  try {
    // 使用 token 驗證後的 req.uid，不採用前端傳入的 URL param
    const uid = req.uid;
    const limit = parseInt(req.query.limit) || 20;

    // 先取得玩家 ID
    const playerId = await getPlayerIdByFirebaseUid(uid);

    if (!playerId) {
      return res.status(404).json({ success: false, message: '玩家不存在' });
    }

    const history = await getPlayerHistory(playerId, limit);
    res.json({ success: true, data: history });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==================== 工單 0061 好友 API ====================

// 搜尋玩家
// P1：掛上 verifyAuth，以 token 中的 uid 為準
app.get('/api/friends/search', verifyAuth, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.json({ success: true, data: [] });
    }

    const playerId = await getPlayerIdByFirebaseUid(req.uid);
    if (!playerId) {
      return res.status(404).json({ success: false, message: '玩家不存在' });
    }

    const results = await friendService.searchPlayers(q, playerId);
    res.json({ success: true, data: results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 取得好友列表
// P1：掛上 verifyAuth，以 token 中的 uid 為準
app.get('/api/friends', verifyAuth, async (req, res) => {
  try {
    const playerId = await getPlayerIdByFirebaseUid(req.uid);

    if (!playerId) {
      return res.status(404).json({ success: false, message: '玩家不存在' });
    }

    const friends = await friendService.getFriends(playerId);
    res.json({ success: true, data: friends });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 取得好友請求列表
// P1：掛上 verifyAuth，以 token 中的 uid 為準
app.get('/api/friends/requests', verifyAuth, async (req, res) => {
  try {
    const playerId = await getPlayerIdByFirebaseUid(req.uid);

    if (!playerId) {
      return res.status(404).json({ success: false, message: '玩家不存在' });
    }

    const requests = await friendService.getFriendRequests(playerId);
    res.json({ success: true, data: requests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 取得好友請求數量
// P1：掛上 verifyAuth，以 token 中的 uid 為準
app.get('/api/friends/requests/count', verifyAuth, async (req, res) => {
  try {
    const playerId = await getPlayerIdByFirebaseUid(req.uid);

    if (!playerId) {
      return res.json({ success: true, data: { count: 0 } });
    }

    const count = await friendService.getFriendRequestCount(playerId);
    res.json({ success: true, data: { count } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 發送好友請求
// P1：掛上 verifyAuth，以 token 中的 uid 為準
app.post('/api/friends/requests', verifyAuth, async (req, res) => {
  try {
    const { toUserId, message } = req.body;
    const playerId = await getPlayerIdByFirebaseUid(req.uid);

    if (!playerId) {
      return res.status(404).json({ success: false, message: '玩家不存在' });
    }

    const result = await friendService.sendFriendRequest(playerId, toUserId, message);
    res.json({ success: true, data: result });
  } catch (err) {
    // 工單 0213：將技術性錯誤轉換為使用者友善訊息
    let userMessage = err.message;
    if (err.message.includes('Could not find the table')) {
      userMessage = '系統維護中，請稍後再試';
    } else if (err.message.includes('duplicate key') || err.message.includes('unique_violation')) {
      userMessage = '已經發送過好友請求了';
    } else if (err.message.includes('foreign key') || err.message.includes('violates foreign key')) {
      userMessage = '找不到該玩家';
    }
    console.error('[好友請求] 處理失敗');
    res.status(400).json({ success: false, message: userMessage });
  }
});

// 回應好友請求
// P1：掛上 verifyAuth，以 token 中的 uid 為準
app.put('/api/friends/requests/:requestId', verifyAuth, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { action } = req.body;
    const playerId = await getPlayerIdByFirebaseUid(req.uid);

    if (!playerId) {
      return res.status(404).json({ success: false, message: '玩家不存在' });
    }

    let result;
    if (action === 'accept') {
      result = await friendService.acceptFriendRequest(Number(requestId), playerId);
    } else {
      result = await friendService.rejectFriendRequest(Number(requestId), playerId);
    }
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 刪除好友
// P1：掛上 verifyAuth，以 token 中的 uid 為準
app.delete('/api/friends/:friendId', verifyAuth, async (req, res) => {
  try {
    const { friendId } = req.params;
    const playerId = await getPlayerIdByFirebaseUid(req.uid);

    if (!playerId) {
      return res.status(404).json({ success: false, message: '玩家不存在' });
    }

    await friendService.removeFriend(playerId, friendId);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 發送遊戲邀請
// P1：掛上 verifyAuth，以 token 中的 uid 為準
app.post('/api/friends/invitations', verifyAuth, async (req, res) => {
  try {
    const { toUserId, roomId } = req.body;
    const playerId = await getPlayerIdByFirebaseUid(req.uid);

    if (!playerId) {
      return res.status(404).json({ success: false, message: '玩家不存在' });
    }

    const invitation = await invitationService.sendGameInvitation(playerId, toUserId, roomId);
    res.json({ success: true, data: invitation });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 取得遊戲邀請
// P1：掛上 verifyAuth，以 token 中的 uid 為準
app.get('/api/friends/invitations', verifyAuth, async (req, res) => {
  try {
    const playerId = await getPlayerIdByFirebaseUid(req.uid);

    if (!playerId) {
      return res.json({ success: true, data: [] });
    }

    const invitations = await invitationService.getPendingInvitations(playerId);
    res.json({ success: true, data: invitations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 回應遊戲邀請
// P1：掛上 verifyAuth，以 token 中的 uid 為準
app.put('/api/friends/invitations/:invitationId', verifyAuth, async (req, res) => {
  try {
    const { invitationId } = req.params;
    const { action } = req.body;
    const playerId = await getPlayerIdByFirebaseUid(req.uid);

    if (!playerId) {
      return res.status(404).json({ success: false, message: '玩家不存在' });
    }

    const result = await invitationService.respondToInvitation(Number(invitationId), playerId, action);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  },
  // Cloud Run 連線穩定性設定
  pingTimeout: 30000,      // 工單 0185：30 秒無回應視為斷線（原 60 秒）
  pingInterval: 25000,     // 每 25 秒發送心跳
  transports: ['websocket', 'polling'],
  allowUpgrades: true,
});

// 遊戲房間狀態
const gameRooms = new Map();

// 玩家對應的 socket
const playerSockets = new Map();

// 等待顏色選擇的狀態
const pendingColorChoices = new Map();

// 跟猜狀態
const followGuessStates = new Map();

// 問牌後狀態（等待結束回合）
const postQuestionStates = new Map();

// 工單 0207：猜牌結果全員確認追蹤
const guessResultConfirmations = new Map();

// 工單 0079：斷線重連計時器
const disconnectTimeouts = new Map();
const DISCONNECT_TIMEOUT = 60000; // 60 秒（遊戲中）

// 工單 0115/0209：等待階段寬限期（從 15 秒提高到 30 秒）
const WAITING_PHASE_DISCONNECT_TIMEOUT = 30000; // 30 秒（等待階段）

// 工單 0118/0209：追蹤正在重整的玩家（從 10 秒提高到 30 秒）
const refreshingPlayers = new Set();
const REFRESH_GRACE_PERIOD = 30000; // 30 秒重整寬限期

installSocketSecurity(io, verifyFirebaseIdToken, {
  gameRooms, playerSockets, pendingColorChoices, postQuestionStates, followGuessStates, guessResultConfirmations,
});

/**
 * 產生唯一遊戲 ID
 */
function generateGameId() {
  return `game_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
}

/**
 * 根據玩家 ID 找到對應的 socket
 * 工單 0105：增強容錯機制，新增 fallback 邏輯
 */
function findSocketByPlayerId(gameId, playerId) {
  const gameState = gameRooms.get(gameId);
  if (!gameState) return null;

  const player = gameState.players.find(p => p.id === playerId);
  if (!player) return null;

  // 優先使用 player.socketId
  if (player.socketId) {
    const socket = io.sockets.sockets.get(player.socketId);
    if (socket && socket.connected) {
      return socket;
    }
    // socketId 無效，記錄警告
    console.warn(`[Socket] 玩家 [玩家] (${playerId}) 的 socketId ${player.socketId} 無效或已斷線`);
  }

  // Fallback: 從 playerSockets Map 反查
  for (const [socketId, info] of playerSockets.entries()) {
    if (info.gameId === gameId && info.playerId === playerId) {
      const socket = io.sockets.sockets.get(socketId);
      if (socket && socket.connected) {
        // 自動修復 player.socketId
        player.socketId = socketId;
        console.log(`[Socket] 自動修復玩家 [玩家] 的 socketId: ${socketId}`);
        return socket;
      }
    }
  }

  console.warn(`[Socket] 找不到玩家 [玩家] (${playerId}) 的有效 socket`);
  return null;
}

/**
 * 工單 0108：驗證遊戲房間中所有玩家的 socket 連線狀態
 * @param {string} gameId - 遊戲房間 ID
 */
function validateSocketConnections(gameId) {
  const gameState = gameRooms.get(gameId);
  if (!gameState) return;

  let hasInvalidSocket = false;

  gameState.players.forEach(player => {
    if (player.socketId && !player.isDisconnected) {
      const socket = io.sockets.sockets.get(player.socketId);
      if (!socket || !socket.connected) {
        console.warn(`[心跳] 玩家 [玩家] 的 socket ${player.socketId} 已失效`);
        player.socketId = null;
        hasInvalidSocket = true;
      }
    }
  });

  if (hasInvalidSocket) {
    console.log(`[心跳] 房間 ${gameId} 有無效 socket，已清理`);
  }
}

// 工單 0108：每 30 秒檢測一次所有房間的連線狀態
setInterval(() => {
  gameRooms.forEach((_, gameId) => {
    validateSocketConnections(gameId);
  });
}, 30000);

/**
 * 廣播房間列表給所有人
 */
function broadcastRoomList() {
  const rooms = [];
  gameRooms.forEach((state, gameId) => {
    if (state.gamePhase === 'waiting') {
      const hostPlayer = state.players.find(p => p.isHost) || state.players[0];
      rooms.push({
        id: gameId,
        name: hostPlayer ? `${hostPlayer.name} 的房間` : `房間 ${gameId.slice(-6)}`,
        playerCount: state.players.length,
        maxPlayers: state.maxPlayers || 4,
        isPrivate: state.isPrivate || false,
        gameType: 'herbalism'  // 標記為本草遊戲房間
      });
    }
  });
  io.emit('roomList', rooms);
}

/**
 * 廣播遊戲狀態給房間內所有玩家
 */
function broadcastGameState(gameId) {
  const gameState = gameRooms.get(gameId);
  // 工單 0148：確保房間存在且有玩家時才廣播
  if (gameState && gameState.players && gameState.players.length > 0) {
    for (const [socketId, binding] of playerSockets.entries()) {
      if (binding.gameId !== gameId) continue;
      const recipient = io.sockets.sockets.get(socketId);
      const player = gameState.players.find(p => p.id === binding.playerId);
      if (recipient && player && player.socketId === socketId && player.ownerUid === recipient.uid) {
        recipient.emit('gameState', publicGameState(gameState, player.id));
      }
    }
  }
}

io.on('connection', (socket) => {
  // 工單 0109：連線日誌增強
  console.log(`[連線] 新連線: ${socket.id}`);

  // 發送目前房間列表
  socket.emit('roomList', getAvailableRooms());

  // 心跳回應 - 保持連線活躍
  socket.on('ping', () => {
    socket.emit('pong');
  });

  // 工單 0147：房間列表請求（確保前端訂閱後能獲取最新列表）
  socket.on('requestRoomList', () => {
    socket.emit('roomList', getAvailableRooms());
  });

  // 工單 0176：設定玩家線上狀態
  // Packet guard replaces the untrusted UID with the verified Firebase identity.
  socket.on('setPresence', async () => {
    try {
      await presenceLifecycle.online(socket);
    } catch (_) {
      console.error('[線上狀態] 無法更新連線狀態');
    }
  });

  // 創建房間
  socket.on('createRoom', ({ player, maxPlayers, password }) => {
    const gameId = generateGameId();

    const roomState = {
      gameId,
      players: [{
        ...player,
        socketId: socket.id,
        hand: [],
        isActive: true,
        isCurrentTurn: false,
        isHost: true,
        score: 0
      }],
      hiddenCards: [],
      currentPlayerIndex: 0,
      gamePhase: 'waiting',
      winner: null,
      gameHistory: [],
      maxPlayers: maxPlayers || 4,
      // 計分系統相關
      currentRound: 0,
      scores: {},
      winningScore: 7,
      roundHistory: [],
      // 房間密碼相關
      password: password || null,
      isPrivate: !!password,
      // 預測相關（工單 0071）
      predictions: []
    };

    gameRooms.set(gameId, roomState);
    playerSockets.set(socket.id, { gameId, playerId: player.id });

    socket.join(gameId);
    socket.emit('roomCreated', { gameId, gameState: publicGameState(roomState, player.id) });

    // 工單 0176：加入房間後設為遊戲中
    presenceLifecycle.inGame(socket, gameId).catch(() => {
      console.error('[線上狀態] 無法更新遊戲狀態');
    });

    broadcastRoomList();
    // 工單 0109：房間操作日誌
    console.log(`[房間] 創建: ${gameId}, 房主: [玩家] (${player.id}), socketId: ${socket.id}`);
  });

  // 加入房間
  socket.on('joinRoom', ({ gameId, player, password }) => {
    const gameState = gameRooms.get(gameId);

    if (!gameState) {
      socket.emit('error', { message: '房間不存在' });
      return;
    }

    // 密碼驗證
    if (gameState.isPrivate) {
      if (!password) {
        socket.emit('passwordRequired', { gameId });
        return;
      }

      if (gameState.password !== password) {
        socket.emit('error', { message: '密碼錯誤' });
        return;
      }
    }

    if (gameState.gamePhase !== 'waiting') {
      socket.emit('error', { message: '遊戲已開始' });
      return;
    }

    if (gameState.players.length >= gameState.maxPlayers) {
      socket.emit('error', { message: '房間已滿' });
      return;
    }

    // 添加玩家
    gameState.players.push({
      ...player,
      socketId: socket.id,
      hand: [],
      isActive: true,
      isCurrentTurn: false,
      isHost: false,
      score: 0
    });

    playerSockets.set(socket.id, { gameId, playerId: player.id });

    socket.join(gameId);
    socket.emit('joinedRoom', { gameId, gameState: publicGameState(gameState, player.id) });

    // 工單 0176：加入房間後設為遊戲中
    presenceLifecycle.inGame(socket, gameId).catch(() => {
      console.error('[線上狀態] 無法更新遊戲狀態');
    });

    broadcastGameState(gameId);
    broadcastRoomList();
    // 工單 0109：房間操作日誌
    console.log(`[房間] 加入: ${gameId}, 玩家: [玩家] (${player.id}), socketId: ${socket.id}`);
  });

  // 開始遊戲
  socket.on('startGame', ({ gameId }) => {
    const gameState = gameRooms.get(gameId);

    if (!gameState) {
      socket.emit('error', { message: '房間不存在' });
      return;
    }

    if (gameState.players.length < 3) {
      socket.emit('error', { message: '至少需要3位玩家' });
      return;
    }

    // 建立牌組
    const deck = createDeck();
    const shuffledDeck = shuffleDeck(deck);
    const { hiddenCards, playerHands } = dealCards(shuffledDeck, gameState.players.length);

    // 更新玩家手牌和初始化分數
    const scores = {};
    gameState.players = gameState.players.map((player, index) => {
      scores[player.id] = player.score || 0;
      return {
        ...player,
        hand: playerHands[index],
        isActive: true,
        isCurrentTurn: index === 0
      };
    });

    gameState.hiddenCards = hiddenCards;
    gameState.currentPlayerIndex = 0;
    gameState.gamePhase = 'playing';
    gameState.currentRound = 1;
    gameState.scores = scores;

    broadcastGameState(gameId);
    broadcastRoomList();
    console.log(`遊戲開始: ${gameId}, 第 ${gameState.currentRound} 局`);
  });

  // 處理遊戲動作
  socket.on('gameAction', ({ gameId, action }) => {
    console.log(`[gameAction] 收到動作:`, action.type, action.playerId);
    const gameState = gameRooms.get(gameId);

    if (!gameState) {
      socket.emit('error', { message: '遊戲不存在' });
      return;
    }

    // 處理問牌或猜牌
    const result = processGameAction(gameState, action);
    console.log(`[gameAction] 處理結果:`, {
      success: result.success,
      requireColorChoice: result.requireColorChoice,
      requireFollowGuess: result.requireFollowGuess,
      enterPostQuestionPhase: result.enterPostQuestionPhase
    });

    if (result.success) {
      // 檢查是否需要等待被要牌玩家選擇顏色
      if (result.requireColorChoice) {
        // 儲存等待狀態
        pendingColorChoices.set(gameId, {
          askingPlayerId: result.askingPlayerId,
          targetPlayerId: result.targetPlayerId,
          colors: result.colors,
          availableColors: result.availableColors
        });

        // 通知被要牌玩家需要選擇顏色（包含可選顏色資訊）
        const targetSocket = findSocketByPlayerId(gameId, result.targetPlayerId);
        if (targetSocket) {
          targetSocket.emit('colorChoiceRequired', {
            askingPlayerId: result.askingPlayerId,
            colors: result.colors,
            availableColors: result.availableColors, // 告訴被問牌玩家哪些可選
            message: result.availableColors.length === 0
              ? '你沒有這兩種顏色的牌'
              : '請選擇要給哪種顏色的全部牌'
          });
        }

        // 通知其他玩家正在等待選擇（不包含 availableColors，避免洩漏）
        io.to(gameId).emit('waitingForColorChoice', {
          targetPlayerId: result.targetPlayerId,
          askingPlayerId: result.askingPlayerId
          // 注意：不傳 colors 和 availableColors，避免洩漏資訊
        });
      } else if (result.requireFollowGuess) {
        // 進入跟猜階段
        gameState.gamePhase = 'followGuessing';

        // 計算決定順序：從猜牌者的下一位開始，按順位排列
        const guesserIndex = gameState.players.findIndex(p => p.id === result.guessingPlayerId);
        const playerCount = gameState.players.length;
        const decisionOrder = [];

        for (let i = 1; i < playerCount; i++) {
          const idx = (guesserIndex + i) % playerCount;
          const player = gameState.players[idx];
          if (player.isActive && player.id !== result.guessingPlayerId) {
            decisionOrder.push(player.id);
          }
        }

        // 儲存跟猜狀態（包含順序資訊）
        followGuessStates.set(gameId, {
          guessingPlayerId: result.guessingPlayerId,
          guessedColors: result.guessedColors,
          decisionOrder: decisionOrder,
          currentDeciderIndex: 0,
          currentDeciderId: decisionOrder[0] || null,
          decisions: {}, // { playerId: 'follow' | 'pass' }
          followingPlayers: [],
          declinedPlayers: []
        });

        // 廣播進入跟猜階段
        io.to(gameId).emit('followGuessStarted', {
          guessingPlayerId: result.guessingPlayerId,
          guessedColors: result.guessedColors,
          decisionOrder: decisionOrder,
          currentDeciderId: decisionOrder[0] || null,
          decisions: {}
        });

        broadcastGameState(gameId);
      } else if (result.enterPostQuestionPhase) {
        // 進入問牌後階段（工單 0071：預測功能）
        gameState.gamePhase = 'postQuestion';

        // 儲存問牌後狀態
        postQuestionStates.set(gameId, {
          playerId: result.currentPlayerId
        });

        // 工單 0072：發送給牌通知給被要牌玩家（私密）
        if (result.cardGiveNotification && result.targetPlayerId) {
          const targetSocket = findSocketByPlayerId(gameId, result.targetPlayerId);
          if (targetSocket) {
            targetSocket.emit('cardGiveNotification', result.cardGiveNotification);
          }
        }

        // 通知當前玩家進入問牌後階段
        const playerSocket = findSocketByPlayerId(gameId, result.currentPlayerId);
        if (playerSocket) {
          console.log(`[問牌] 發送 postQuestionPhase 給玩家 ${result.currentPlayerId}`);
          playerSocket.emit('postQuestionPhase', {
            playerId: result.currentPlayerId,
            message: '問牌完成！你可以選擇預測蓋牌顏色，然後按結束回合。'
          });
        } else {
          console.warn(`[問牌] 找不到玩家 ${result.currentPlayerId} 的 socket，無法發送 postQuestionPhase`);
        }

        // 通知其他玩家等待
        socket.to(gameId).emit('waitingForTurnEnd', {
          playerId: result.currentPlayerId
        });

        broadcastGameState(gameId);
      } else {
        Object.assign(gameState, result.gameState);
        broadcastGameState(gameId);

        if (result.gameState.gamePhase === 'finished' || result.gameState.gamePhase === 'roundEnd') {
          broadcastRoomList();

          // 如果是局結束，廣播結果（包含預測結算）
          if (result.isCorrect !== undefined) {
            const resultPayload = {
              isCorrect: result.isCorrect,
              scoreChanges: result.scoreChanges,
              hiddenCards: result.hiddenCards,
              guessingPlayerId: action.playerId,
              followingPlayers: [],
              predictionResults: result.predictionResults || [],
              continueGame: result.continueGame  // 工單 0149：猜錯但遊戲繼續
            };
            io.to(gameId).emit('guessResult', resultPayload);

            // 工單 0207：初始化全員確認追蹤
            const allPlayerIds = gameState.players.filter(p => p.ownerUid).map(p => p.id);
            guessResultConfirmations.set(gameId, {
              requiredPlayers: allPlayerIds,
              confirmedPlayers: [],
              isCorrect: result.isCorrect,
              continueGame: result.continueGame,
              resultPayload
            });
          }
        }
      }
    } else {
      socket.emit('error', { message: result.message });
    }
  });

  // 處理被要牌玩家的顏色選擇
  socket.on('colorChoiceSubmit', ({ gameId, chosenColor }) => {
    const gameState = gameRooms.get(gameId);
    const pendingChoice = pendingColorChoices.get(gameId);

    if (!gameState) {
      socket.emit('error', { message: '遊戲不存在' });
      return;
    }

    if (!pendingChoice) {
      socket.emit('error', { message: '沒有等待中的顏色選擇' });
      return;
    }

    // 驗證選擇的顏色是否有效
    // 'none' 是有效選擇當 availableColors 為空時（被問玩家兩種顏色都沒有）
    const isNoneChoice = chosenColor === 'none' && pendingChoice.availableColors.length === 0;
    if (!isNoneChoice && !pendingChoice.colors.includes(chosenColor)) {
      socket.emit('error', { message: '無效的顏色選擇' });
      return;
    }

    // 處理顏色選擇
    const result = processColorChoice(
      gameState,
      pendingChoice.askingPlayerId,
      pendingChoice.targetPlayerId,
      chosenColor,
      pendingChoice.colors
    );

    if (result.success) {
      // 清除等待狀態
      pendingColorChoices.delete(gameId);

      // 廣播選擇結果
      io.to(gameId).emit('colorChoiceResult', {
        targetPlayerId: pendingChoice.targetPlayerId,
        chosenColor: chosenColor,
        cardsTransferred: result.cardsTransferred
      });

      // 進入問牌後階段（工單 0071：預測功能）
      if (result.enterPostQuestionPhase) {
        gameState.gamePhase = 'postQuestion';

        // 儲存問牌後狀態
        postQuestionStates.set(gameId, {
          playerId: result.currentPlayerId
        });

        // 工單 0072：發送給牌通知給被要牌玩家（私密）
        if (result.cardGiveNotification && result.targetPlayerId) {
          const targetSocket = findSocketByPlayerId(gameId, result.targetPlayerId);
          if (targetSocket) {
            targetSocket.emit('cardGiveNotification', result.cardGiveNotification);
          }
        }

        // 通知當前玩家進入問牌後階段
        const playerSocket = findSocketByPlayerId(gameId, result.currentPlayerId);
        if (playerSocket) {
          console.log(`[顏色選擇] 發送 postQuestionPhase 給玩家 ${result.currentPlayerId}`);
          playerSocket.emit('postQuestionPhase', {
            playerId: result.currentPlayerId,
            message: '問牌完成！你可以選擇預測蓋牌顏色，然後按結束回合。'
          });
        } else {
          console.warn(`[顏色選擇] 找不到玩家 ${result.currentPlayerId} 的 socket，無法發送 postQuestionPhase`);
        }

        // 通知其他玩家等待
        socket.to(gameId).emit('waitingForTurnEnd', {
          playerId: result.currentPlayerId
        });
      }

      // 廣播更新後的遊戲狀態
      broadcastGameState(gameId);
    } else {
      socket.emit('error', { message: result.message });
    }
  });

  // 處理結束回合（工單 0071：預測功能）
  socket.on('endTurn', ({ gameId, playerId, prediction }) => {
    const gameState = gameRooms.get(gameId);
    const postQuestionState = postQuestionStates.get(gameId);

    if (!gameState) {
      socket.emit('error', { message: '遊戲不存在' });
      return;
    }

    if (!postQuestionState) {
      socket.emit('error', { message: '目前不在問牌後階段' });
      return;
    }

    // 驗證是否是當前玩家
    if (postQuestionState.playerId !== playerId) {
      socket.emit('error', { message: '不是你的回合' });
      return;
    }

    const player = gameState.players.find(p => p.id === playerId);

    // 記錄預測（如果有）
    if (prediction) {
      gameState.predictions.push({
        playerId: playerId,
        playerName: player?.name || '未知玩家',
        color: prediction,
        round: gameState.currentRound,
        isCorrect: null // 答案揭曉後填入
      });

      // 記錄到遊戲歷史
      gameState.gameHistory.push({
        type: 'prediction',
        playerId: playerId,
        color: prediction,
        timestamp: Date.now()
      });
    }

    // 清除問牌後狀態
    postQuestionStates.delete(gameId);

    // 廣播回合結束
    io.to(gameId).emit('turnEnded', {
      playerId: playerId,
      prediction: prediction,
      playerName: player?.name || '未知玩家'
    });

    // 移到下一位玩家
    moveToNextPlayer(gameState);
    gameState.gamePhase = 'playing';

    broadcastGameState(gameId);
  });

  // 處理跟猜回應
  socket.on('followGuessResponse', ({ gameId, playerId, isFollowing }) => {
    handleFollowGuessResponse(gameId, playerId, isFollowing);
  });

  // 查看蓋牌
  socket.on('revealHiddenCards', () => {
    socket.emit('error', { message: '答案只在結算時公布' });
  });

  // 開始下一局
  socket.on('startNextRound', ({ gameId }) => {
    const gameState = gameRooms.get(gameId);

    if (!gameState) {
      socket.emit('error', { message: '遊戲不存在' });
      return;
    }

    if (gameState.gamePhase !== 'roundEnd') {
      socket.emit('error', { message: '目前不在局結束階段' });
      return;
    }

    startNextRoundLogic(gameId);
  });

  // 工單 0171：猜牌者確認結果，關閉所有人的結果面板（保留向下相容）
  socket.on('dismissGuessResult', ({ gameId }) => {
    io.to(gameId).emit('guessResultDismissed');
  });

  // 工單 0207：全員確認猜牌結果
  socket.on('confirmGuessResult', ({ gameId, playerId }) => {
    const confirmation = guessResultConfirmations.get(gameId);
    if (!confirmation) {
      // 沒有確認追蹤（可能已完成），直接通知該玩家關閉面板
      socket.emit('guessResultDismissed');
      return;
    }

    // 避免重複確認
    if (confirmation.confirmedPlayers.includes(playerId)) {
      socket.emit('guessResultDismissed');
      return;
    }

    // 記錄確認
    confirmation.confirmedPlayers.push(playerId);
    console.log(`[確認] 玩家 ${playerId} 確認猜牌結果 (${confirmation.confirmedPlayers.length}/${confirmation.requiredPlayers.length})`);

    // 通知該玩家關閉面板
    socket.emit('guessResultDismissed');

    completeGuessConfirmation(gameId);
  });

  // 離開房間
  socket.on('leaveRoom', ({ gameId, playerId }) => {
    handlePlayerLeave(socket, gameId, playerId);

    // 工單 0176：離開房間後恢復為上線
    presenceLifecycle.inGame(socket, null).catch(() => {
      console.error('[線上狀態] 無法更新遊戲狀態');
    });
  });

  // 工單 0118：玩家正在重整頁面
  socket.on('playerRefreshing', ({ gameId, playerId }) => {
    const refreshKey = `${gameId}:${playerId}`;
    refreshingPlayers.add(refreshKey);
    console.log(`[重整] 玩家 ${playerId} 正在重整頁面，加入寬限列表`);

    // 工單 0209：30 秒後自動移除（避免記憶體洩漏）
    setTimeout(() => {
      refreshingPlayers.delete(refreshKey);
    }, REFRESH_GRACE_PERIOD);
  });

  // 斷線處理
  socket.on('disconnect', async (reason) => {
    // 本草遊戲斷線處理
    const playerInfo = playerSockets.get(socket.id);
    if (playerInfo) {
      handlePlayerDisconnect(socket, playerInfo.gameId, playerInfo.playerId);
    }

    // 工單 0313-0316：演化論遊戲斷線處理
    evolutionHandler.handleDisconnect(socket, io);

    // Serialize against replacement connections and retain other active tabs.
    try {
      await presenceLifecycle.disconnect(socket);
    } catch (_) {
      console.error('[線上狀態] 無法更新離線狀態');
    }

    // 工單 0109：連線日誌增強
    console.log(`[連線] 斷線: ${socket.id}, 原因: ${reason}`);
  });

  // 工單 0079：重連處理
  socket.on('reconnect', ({ roomId, playerId, playerName }) => {
    handlePlayerReconnect(socket, roomId, playerId, playerName);
  });

  // ==================== 工單 0313-0316：演化論遊戲 Socket 事件（使用新模組） ====================

  // 房間操作
  socket.on('evo:createRoom', (data) => evolutionHandler.createRoom(socket, io, data));
  socket.on('evo:joinRoom', (data) => evolutionHandler.joinRoom(socket, io, data));
  socket.on('evo:leaveRoom', (data) => evolutionHandler.leaveRoom(socket, io, data));
  socket.on('evo:setReady', (data) => evolutionHandler.setReady(socket, io, data));
  socket.on('evo:startGame', (data) => evolutionHandler.startGame(socket, io, data));
  socket.on('evo:requestRoomList', () => evolutionHandler.requestRoomList(socket));

  // 遊戲操作
  socket.on('evo:createCreature', (data) => evolutionHandler.createCreature(socket, io, data));
  socket.on('evo:addTrait', (data) => evolutionHandler.addTrait(socket, io, data));
  socket.on('evo:passEvolution', (data) => evolutionHandler.passEvolution(socket, io, data));
  socket.on('evo:feedCreature', (data) => evolutionHandler.feedCreature(socket, io, data));
  socket.on('evo:attack', (data) => evolutionHandler.attack(socket, io, data));
  socket.on('evo:respondAttack', (data) => evolutionHandler.respondAttack(socket, io, data));
  socket.on('evo:useTrait', (data) => evolutionHandler.useTrait(socket, io, data));

  // 重連操作 (工單 0377)
  socket.on('evo:reconnect', (data) => evolutionHandler.handleReconnect(socket, io, data));

  // ==================== 工單 0313-0316 結束 ====================
});

function handleFollowGuessResponse(gameId, playerId, isFollowing) {
  const gameState = gameRooms.get(gameId);
  const followState = followGuessStates.get(gameId);
  if (!gameState || !followState || followState.currentDeciderId !== playerId) return;
    // 記錄決定
    followState.decisions[playerId] = isFollowing ? 'follow' : 'pass';
    if (isFollowing) {
      followState.followingPlayers.push(playerId);
    } else {
      followState.declinedPlayers.push(playerId);
    }

    // 移到下一個決定者
    followState.currentDeciderIndex++;
    while (followState.currentDeciderIndex < followState.decisionOrder.length) {
      const nextId = followState.decisionOrder[followState.currentDeciderIndex];
      if (gameState.players.some(p => p.id === nextId && p.ownerUid)) break;
      followState.decisions[nextId] = 'pass';
      if (!followState.declinedPlayers.includes(nextId)) followState.declinedPlayers.push(nextId);
      followState.currentDeciderIndex++;
    }
    const hasMoreDeciders = followState.currentDeciderIndex < followState.decisionOrder.length;
    followState.currentDeciderId = hasMoreDeciders
      ? followState.decisionOrder[followState.currentDeciderIndex]
      : null;

    // 廣播決定結果
    io.to(gameId).emit('followGuessUpdate', {
      playerId,
      isFollowing,
      currentDeciderId: followState.currentDeciderId,
      decisions: followState.decisions,
      followingPlayers: followState.followingPlayers,
      declinedPlayers: followState.declinedPlayers
    });

    // 檢查是否所有人都已決定
    if (!hasMoreDeciders) {
      // 所有人都決定了，驗證結果
      const result = validateGuessResult(
        gameState,
        followState.guessingPlayerId,
        followState.guessedColors,
        followState.followingPlayers
      );

      // 清除跟猜狀態
      followGuessStates.delete(gameId);

      // 更新遊戲狀態
      Object.assign(gameState, result.gameState);

      // 廣播猜牌結果（包含預測結算）
      console.log('[guessResult] 發送結算結果');
      const resultPayload = {
        isCorrect: result.isCorrect,
        scoreChanges: result.scoreChanges,
        hiddenCards: result.hiddenCards,
        guessingPlayerId: followState.guessingPlayerId,
        followingPlayers: followState.followingPlayers,
        predictionResults: result.predictionResults || [],
        continueGame: result.continueGame  // 工單 0149：猜錯但遊戲繼續
      };
      io.to(gameId).emit('guessResult', resultPayload);

      // 工單 0207：初始化全員確認追蹤
      const allPlayerIds = gameState.players.filter(p => p.ownerUid).map(p => p.id);
      guessResultConfirmations.set(gameId, {
        requiredPlayers: allPlayerIds,
        confirmedPlayers: [],
        isCorrect: result.isCorrect,
        continueGame: result.continueGame,
        resultPayload
      });

      // 廣播更新後的遊戲狀態
      broadcastGameState(gameId);

      if (result.gameState.gamePhase === 'finished' || result.gameState.gamePhase === 'roundEnd') {
        broadcastRoomList();
      }
    }
}

function completeGuessConfirmation(gameId) {
  const confirmation = guessResultConfirmations.get(gameId);
  if (!confirmation || !confirmation.requiredPlayers.every(id => confirmation.confirmedPlayers.includes(id))) return;
  guessResultConfirmations.delete(gameId);
  const state = gameRooms.get(gameId);
  if (state?.gamePhase === 'roundEnd' && (confirmation.isCorrect || !confirmation.continueGame)) {
    startNextRoundLogic(gameId);
  }
}

function reconcilePlayerDeparture(gameId, playerId) {
  const state = gameRooms.get(gameId);
  if (!state) return;
  const seated = state.players.filter(player => player.ownerUid);
  const cancelledChoice = pendingColorChoices.get(gameId);
  if (cancelledChoice && (cancelledChoice.askingPlayerId === playerId || cancelledChoice.targetPlayerId === playerId)) {
    io.to(gameId).emit('colorChoiceResult', {
      cancelled: true,
      askingPlayerId: cancelledChoice.askingPlayerId,
      targetPlayerId: cancelledChoice.targetPlayerId,
      cardsTransferred: 0
    });
  }
  if (!seated.some(player => player.isHost)) {
    state.players.forEach(player => { player.isHost = false; });
    if (seated[0]) seated[0].isHost = true;
  }
  if (seated.length === 0 || (state.gamePhase !== 'roundEnd' && !seated.some(player => player.isActive))) {
    state.gamePhase = 'finished';
    state.players.forEach(player => { player.isCurrentTurn = false; });
    pendingColorChoices.delete(gameId); postQuestionStates.delete(gameId);
    followGuessStates.delete(gameId); guessResultConfirmations.delete(gameId);
    return;
  }
  const pending = pendingColorChoices.get(gameId);
  if (pending && (pending.askingPlayerId === playerId || pending.targetPlayerId === playerId)) {
    pendingColorChoices.delete(gameId);
    const asker = seated.find(player => player.id === pending.askingPlayerId && player.isActive);
    if (asker && pending.askingPlayerId !== playerId) {
      state.gamePhase = 'postQuestion';
      postQuestionStates.set(gameId, { playerId: asker.id });
      findSocketByPlayerId(gameId, asker.id)?.emit('postQuestionPhase', {
        playerId: asker.id, message: '被問玩家已離開，本次問牌取消；請結束回合。'
      });
    } else {
      postQuestionStates.delete(gameId);
      state.gamePhase = 'playing';
    }
  }
  if (postQuestionStates.get(gameId)?.playerId === playerId) {
    postQuestionStates.delete(gameId);
    state.gamePhase = 'playing';
  }
  const follow = followGuessStates.get(gameId);
  if (follow) {
    follow.followingPlayers = follow.followingPlayers.filter(id => id !== playerId);
    if (follow.guessingPlayerId === playerId) {
      followGuessStates.delete(gameId);
      state.gamePhase = 'playing';
    } else if (follow.currentDeciderId === playerId) {
      handleFollowGuessResponse(gameId, playerId, false);
    }
  }
  const confirmation = guessResultConfirmations.get(gameId);
  if (confirmation) {
    confirmation.requiredPlayers = confirmation.requiredPlayers.filter(id => id !== playerId);
    confirmation.confirmedPlayers = confirmation.confirmedPlayers.filter(id => id !== playerId);
    completeGuessConfirmation(gameId);
  }
  if (state.gamePhase === 'playing' && !state.players[state.currentPlayerIndex]?.isActive) {
    moveToNextPlayer(state);
  }
}

function handlePlayerLeave(socket, gameId, playerId) {
  // 工單 0109：房間操作日誌
  console.log(`[房間] 離開: ${gameId}, 玩家: ${playerId}`);

  const gameState = gameRooms.get(gameId);
  if (!gameState) return;

  const playerIndex = gameState.players.findIndex(p => p.id === playerId);
  if (playerIndex === -1) return;

  const player = gameState.players[playerIndex];
  const playerName = player.name;

  // 工單 0148：先離開 Socket 房間，避免收到後續廣播
  socket.leave(gameId);
  playerSockets.delete(socket.id);

  if (gameState.gamePhase === 'waiting') {
    // 等待中，直接移除玩家
    gameState.players.splice(playerIndex, 1);

    if (gameState.players.length === 0) {
      // 房間空了，刪除房間
      gameRooms.delete(gameId);
      // 房間已刪除，只更新房間列表
      broadcastRoomList();
      return;
    } else if (player.isHost) {
      // 房主離開，轉移房主
      gameState.players[0].isHost = true;
    }
  } else {
    // 遊戲中，標記為不活躍
    gameState.players[playerIndex].isActive = false;
    // Explicit departure releases the seat; retain firebaseUid for game records.
    delete gameState.players[playerIndex].ownerUid;
    gameState.players[playerIndex].socketId = null;
    reconcilePlayerDeparture(gameId, playerId);
  }

  // 工單 0148：通知房間內剩餘玩家有人離開
  io.to(gameId).emit('playerLeft', { playerId, playerName });

  broadcastGameState(gameId);
  broadcastRoomList();
}

// ==================== 工單 0079：斷線重連處理 ====================

/**
 * 處理玩家斷線（區分等待中和遊戲中）
 * 工單 0115：等待階段也新增寬限期（15 秒）
 */
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
  if (player.socketId !== socket.id) { playerSockets.delete(socket.id); return; }
  const isWaitingPhase = gameState.gamePhase === 'waiting';
  const refreshKey = `${gameId}:${playerId}`;
  const isRefreshing = refreshingPlayers.has(refreshKey);

  // 工單 0118：判斷寬限期時間
  // 如果玩家是在重整頁面，使用重整寬限期
  let timeout_duration;
  if (isRefreshing) {
    timeout_duration = REFRESH_GRACE_PERIOD;  // 重整中：10 秒
    player.isRefreshing = true;
  } else if (isWaitingPhase) {
    timeout_duration = WAITING_PHASE_DISCONNECT_TIMEOUT;  // 等待階段：15 秒
  } else {
    timeout_duration = DISCONNECT_TIMEOUT;  // 遊戲中：60 秒
  }

  // 標記為斷線狀態
  player.isDisconnected = true;
  player.disconnectedAt = Date.now();
  const stateLabel = isRefreshing ? '重整中' : (isWaitingPhase ? '等待階段' : '遊戲中');
  console.log(`[${stateLabel}] 玩家 [玩家] 斷線，保留位置 ${timeout_duration / 1000} 秒等待重連`);

  socket.leave(gameId);
  playerSockets.delete(socket.id);

  // 設定計時器
  const timeoutKey = `${gameId}:${playerId}`;

  // 清除舊的計時器（如果有）
  if (disconnectTimeouts.has(timeoutKey)) {
    clearTimeout(disconnectTimeouts.get(timeoutKey));
  }

  const disconnectTimer = setTimeout(() => {
    // 工單 0118：清理重整狀態
    refreshingPlayers.delete(refreshKey);

    const currentState = gameRooms.get(gameId);
    if (currentState) {
      const currentPlayerIndex = currentState.players.findIndex(p => p.id === playerId);
      if (currentPlayerIndex !== -1 && currentState.players[currentPlayerIndex].isDisconnected) {
        const currentPlayer = currentState.players[currentPlayerIndex];

        // 工單 0209：修復移除邏輯 — 只有等待階段才移除玩家，遊戲階段一律標記不活躍
        // 清除 isRefreshing 標記
        delete currentPlayer.isRefreshing;

        if (isWaitingPhase) {
          // 等待階段：移除玩家
          console.log(`[等待階段] 玩家 ${playerId} 重連超時，移除玩家`);
          currentState.players.splice(currentPlayerIndex, 1);

          if (currentState.players.length === 0) {
            // 房間空了，刪除房間
            console.log(`房間 ${gameId} 已空，刪除房間`);
            gameRooms.delete(gameId);
            broadcastRoomList();
          } else {
            // 如果移除的是房主，轉移房主
            if (currentPlayer.isHost && currentState.players.length > 0) {
              currentState.players[0].isHost = true;
              console.log(`房主轉移給 [玩家]`);
            }
            broadcastGameState(gameId);
            broadcastRoomList();
          }
        } else {
          // 遊戲階段（含重整中）：標記為不活躍，不移除
          const reason = isRefreshing ? '重整超時' : '斷線超時';
          console.log(`[遊戲中] 玩家 ${playerId} ${reason}，標記為不活躍`);
          currentState.players[currentPlayerIndex].isActive = false;
          currentState.players[currentPlayerIndex].isDisconnected = false;
          // Grace period has ended: release ownership, not historical DB identity.
          delete currentState.players[currentPlayerIndex].ownerUid;
          currentState.players[currentPlayerIndex].socketId = null;
          reconcilePlayerDeparture(gameId, playerId);
          broadcastGameState(gameId);
        }
      }
    }
    disconnectTimeouts.delete(timeoutKey);
  }, timeout_duration);

  disconnectTimeouts.set(timeoutKey, disconnectTimer);

  broadcastGameState(gameId);
}

/**
 * 處理玩家重連
 */
function handlePlayerReconnect(socket, roomId, playerId, playerName) {
  const gameState = gameRooms.get(roomId);

  if (!gameState) {
    console.log(`重連失敗：房間 ${roomId} 不存在`);
    socket.emit('reconnectFailed', { reason: 'room_not_found', message: '房間已不存在' });
    return;
  }

  const playerIndex = gameState.players.findIndex(p => p.id === playerId);

  if (playerIndex === -1) {
    console.log(`重連失敗：玩家 ${playerId} 不在房間中`);
    socket.emit('reconnectFailed', { reason: 'player_not_found', message: '你已不在此房間中' });
    return;
  }

  const player = gameState.players[playerIndex];

  // 清除斷線計時器
  const timeoutKey = `${roomId}:${playerId}`;
  if (disconnectTimeouts.has(timeoutKey)) {
    clearTimeout(disconnectTimeouts.get(timeoutKey));
    disconnectTimeouts.delete(timeoutKey);
  }

  // 工單 0118：清除重整狀態
  refreshingPlayers.delete(timeoutKey);

  // 恢復玩家狀態
  player.isDisconnected = false;
  player.disconnectedAt = null;
  delete player.isRefreshing;

  // 工單 0104：更新 player.socketId
  const oldSocketId = player.socketId;
  if (oldSocketId && oldSocketId !== socket.id) {
    playerSockets.delete(oldSocketId);
    const oldSocket = io.sockets.sockets.get(oldSocketId);
    if (oldSocket) {
      oldSocket.leave(roomId);
      oldSocket.firebasePlayerId = null;
    }
  }
  player.socketId = socket.id;
  console.log(`[重連] 玩家 [玩家] socketId 更新: ${oldSocketId} → ${socket.id}`);

  // 更新 socket 對應
  playerSockets.set(socket.id, { gameId: roomId, playerId });
  socket.join(roomId);

  console.log(`玩家 [玩家] 重連成功`);

  // 發送重連成功事件
  socket.emit('reconnected', {
    gameId: roomId,
    playerId: playerId,
    gameState: publicGameState(gameState, playerId)
  });

  const confirmation = guessResultConfirmations.get(roomId);
  if (confirmation?.resultPayload && confirmation.requiredPlayers.includes(playerId) &&
      !confirmation.confirmedPlayers.includes(playerId)) {
    socket.emit('guessResult', confirmation.resultPayload);
  }

  // Restore an interrupted type-2 question without exposing the target's colors.
  const pendingChoice = pendingColorChoices.get(roomId);
  if (pendingChoice && gameState.gamePhase === 'playing' &&
      gameState.players[gameState.currentPlayerIndex]?.id === pendingChoice.askingPlayerId) {
    if (pendingChoice.targetPlayerId === playerId) {
      socket.emit('colorChoiceRequired', {
        askingPlayerId: pendingChoice.askingPlayerId,
        colors: pendingChoice.colors,
        availableColors: pendingChoice.availableColors,
        message: pendingChoice.availableColors.length === 0
          ? '你沒有這兩種顏色的牌' : '請選擇要給哪種顏色的全部牌'
      });
    } else {
      socket.emit('waitingForColorChoice', {
        targetPlayerId: pendingChoice.targetPlayerId,
        askingPlayerId: pendingChoice.askingPlayerId
      });
    }
  }

  // 工單 0093：如果玩家在預測階段，重新發送 postQuestionPhase 事件
  const postQuestionState = postQuestionStates.get(roomId);
  if (postQuestionState && postQuestionState.playerId === playerId) {
    socket.emit('postQuestionPhase', {
      playerId: playerId,
      message: '問牌完成！你可以選擇預測蓋牌顏色，然後按結束回合。'
    });
    console.log(`[重連] 恢復玩家 [玩家] 的預測階段`);
  }

  // 工單 0197：如果遊戲在跟猜階段，重新發送 followGuessStarted 事件
  const followState = followGuessStates.get(roomId);
  if (followState && followState.decisionOrder.includes(playerId)) {
    socket.emit('followGuessStarted', {
      guessingPlayerId: followState.guessingPlayerId,
      guessedColors: followState.guessedColors,
      decisionOrder: followState.decisionOrder,
      currentDeciderId: followState.currentDeciderId,
      decisions: followState.decisions
    });
    console.log(`[重連] 恢復玩家 [玩家] 的跟猜階段`);
  }

  // 廣播狀態更新
  broadcastGameState(roomId);
}

function getAvailableRooms() {
  const rooms = [];
  gameRooms.forEach((state, gameId) => {
    if (state.gamePhase === 'waiting') {
      const hostPlayer = state.players.find(p => p.isHost) || state.players[0];
      rooms.push({
        id: gameId,
        name: hostPlayer ? `${hostPlayer.name} 的房間` : `房間 ${gameId.slice(-6)}`,
        playerCount: state.players.length,
        maxPlayers: state.maxPlayers || 4,
        isPrivate: state.isPrivate || false,
        gameType: 'herbalism'  // 標記為本草遊戲房間
      });
    }
  });
  return rooms;
}

// ==================== 牌組相關函數 ====================

const CARD_COLORS = ['red', 'yellow', 'green', 'blue'];
const CARD_COUNTS = { red: 2, yellow: 3, green: 4, blue: 5 };

function createDeck() {
  const deck = [];
  let cardId = 1;

  for (const color of CARD_COLORS) {
    const count = CARD_COUNTS[color];
    for (let i = 0; i < count; i++) {
      deck.push({ id: `card_${cardId++}`, color });
    }
  }

  return deck;
}

function shuffleDeck(deck) {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function dealCards(deck, playerCount) {
  const hiddenCards = [deck[0], deck[1]];
  const remainingDeck = deck.slice(2);

  const playerHands = Array.from({ length: playerCount }, () => []);

  remainingDeck.forEach((card, index) => {
    playerHands[index % playerCount].push(card);
  });

  return { hiddenCards, playerHands };
}

// ==================== 遊戲動作處理 ====================

function processGameAction(gameState, action) {
  if (action.type === 'question') {
    return processQuestionAction(gameState, action);
  } else if (action.type === 'guess') {
    return processGuessAction(gameState, action);
  }

  return { success: false, message: '未知的動作類型' };
}

function processQuestionAction(gameState, action) {
  const { playerId, targetPlayerId, colors, questionType, selectedColor, giveColor, getColor } = action;

  const playerIndex = gameState.players.findIndex(p => p.id === playerId);
  const targetIndex = gameState.players.findIndex(p => p.id === targetPlayerId);

  if (playerIndex === -1 || targetIndex === -1) {
    return { success: false, message: '玩家不存在' };
  }

  if (gameState.currentPlayerIndex !== playerIndex) {
    return { success: false, message: '不是你的回合' };
  }

  const player = gameState.players[playerIndex];
  const target = gameState.players[targetIndex];

  let cardsToGive = [];
  let cardsToReceive = [];

  if (questionType === 1) {
    // 各一張
    for (const color of colors) {
      const cardIndex = target.hand.findIndex(c => c.color === color);
      if (cardIndex !== -1) {
        cardsToGive.push(target.hand.splice(cardIndex, 1)[0]);
      }
    }
    player.hand.push(...cardsToGive);
  } else if (questionType === 2) {
    // 其中一種顏色全部
    // 檢查被要牌玩家有哪些顏色
    const hasColor0 = target.hand.some(c => c.color === colors[0]);
    const hasColor1 = target.hand.some(c => c.color === colors[1]);

    // 計算可選的顏色
    const availableColors = [];
    if (hasColor0) availableColors.push(colors[0]);
    if (hasColor1) availableColors.push(colors[1]);

    // 無論有幾種顏色，都觸發選擇流程（避免洩漏手牌資訊）
    return {
      success: true,
      requireColorChoice: true,
      askingPlayerId: playerId,
      targetPlayerId: targetPlayerId,
      colors: colors,
      availableColors: availableColors, // 告訴前端哪些顏色可選
      message: '等待被要牌玩家選擇要給哪種顏色'
    };
  } else if (questionType === 3) {
    // 給一張要全部
    const giveCardIndex = player.hand.findIndex(c => c.color === giveColor);
    if (giveCardIndex !== -1) {
      const givenCard = player.hand.splice(giveCardIndex, 1)[0];
      target.hand.push(givenCard);
    }

    cardsToReceive = target.hand.filter(c => c.color === getColor);
    target.hand = target.hand.filter(c => c.color !== getColor);
    player.hand.push(...cardsToReceive);
  }

  // 記錄歷史
  gameState.gameHistory.push({
    type: 'question',
    playerId,
    targetPlayerId,
    colors,
    questionType,
    cardsTransferred: cardsToGive.length || cardsToReceive.length,
    timestamp: Date.now()
  });

  // 檢查玩家是否出局（手牌為空）
  if (player.hand.length === 0) {
    player.isActive = false;
  }

  // 工單 0072：建立給牌通知資料
  let cardGiveNotification = null;
  if (questionType === 1) {
    // 各一張
    const cardCounts = {};
    cardsToGive.forEach(card => {
      cardCounts[card.color] = (cardCounts[card.color] || 0) + 1;
    });
    cardGiveNotification = {
      fromPlayer: player.name,
      askType: 'oneEach',
      selectedColors: colors,
      chosenColor: null,
      cardsGiven: Object.entries(cardCounts).map(([color, count]) => ({ color, count })),
      totalCount: cardsToGive.length
    };
  } else if (questionType === 3) {
    // 給一張要全部
    const cardCounts = {};
    cardsToReceive.forEach(card => {
      cardCounts[card.color] = (cardCounts[card.color] || 0) + 1;
    });
    cardGiveNotification = {
      fromPlayer: player.name,
      askType: 'oneColorAll', // 從被要牌者角度看，是給出一種顏色全部
      selectedColors: [getColor],
      chosenColor: null,
      cardsGiven: Object.entries(cardCounts).map(([color, count]) => ({ color, count })),
      totalCount: cardsToReceive.length
    };
  }

  // 進入問牌後階段（工單 0071：預測功能）
  // 不再直接換人，而是等待玩家按「結束回合」
  return {
    success: true,
    gameState,
    enterPostQuestionPhase: true,
    currentPlayerId: playerId,
    // 工單 0072
    cardGiveNotification,
    targetPlayerId
  };
}

/**
 * 處理被要牌玩家選擇顏色後的給牌動作
 */
function processColorChoice(gameState, askingPlayerId, targetPlayerId, chosenColor, originalColors) {
  const askingPlayerIndex = gameState.players.findIndex(p => p.id === askingPlayerId);
  const targetIndex = gameState.players.findIndex(p => p.id === targetPlayerId);

  if (askingPlayerIndex === -1 || targetIndex === -1) {
    return { success: false, message: '玩家不存在' };
  }

  const askingPlayer = gameState.players[askingPlayerIndex];
  const target = gameState.players[targetIndex];

  let cardsToGive = [];

  // 處理無牌可給的情況
  if (chosenColor === 'none' || chosenColor === null) {
    // 無牌可給，cardsToGive 保持為空
  } else {
    // 給出選擇的顏色全部
    cardsToGive = target.hand.filter(c => c.color === chosenColor);
    target.hand = target.hand.filter(c => c.color !== chosenColor);
    askingPlayer.hand.push(...cardsToGive);
  }

  // 記錄歷史
  gameState.gameHistory.push({
    type: 'question',
    playerId: askingPlayerId,
    targetPlayerId,
    colors: originalColors,
    questionType: 2,
    chosenColor: chosenColor,
    cardsTransferred: cardsToGive.length,
    timestamp: Date.now()
  });

  // 檢查玩家是否出局（手牌為空）
  if (askingPlayer.hand.length === 0) {
    askingPlayer.isActive = false;
  }

  // 工單 0072：建立給牌通知資料
  const cardCounts = {};
  cardsToGive.forEach(card => {
    cardCounts[card.color] = (cardCounts[card.color] || 0) + 1;
  });
  const cardGiveNotification = {
    fromPlayer: askingPlayer.name,
    askType: 'oneColorAll',
    selectedColors: originalColors,
    chosenColor: chosenColor,
    cardsGiven: Object.entries(cardCounts).map(([color, count]) => ({ color, count })),
    totalCount: cardsToGive.length
  };

  // 進入問牌後階段（工單 0071：預測功能）
  // 不再直接換人，而是等待玩家按「結束回合」
  return {
    success: true,
    gameState,
    cardsTransferred: cardsToGive.length,
    enterPostQuestionPhase: true,
    currentPlayerId: askingPlayerId,
    // 工單 0072
    cardGiveNotification,
    targetPlayerId
  };
}

function processGuessAction(gameState, action) {
  const { playerId, guessedColors } = action;

  const playerIndex = gameState.players.findIndex(p => p.id === playerId);

  if (playerIndex === -1) {
    return { success: false, message: '玩家不存在' };
  }

  if (gameState.currentPlayerIndex !== playerIndex) {
    return { success: false, message: '不是你的回合' };
  }

  // 檢查是否有其他活躍玩家可以跟猜
  const otherActivePlayers = gameState.players.filter(p => p.isActive && p.id !== playerId);

  if (otherActivePlayers.length > 0) {
    // 有其他玩家，進入跟猜階段
    return {
      success: true,
      requireFollowGuess: true,
      guessingPlayerId: playerId,
      guessedColors: guessedColors,
      pendingPlayers: otherActivePlayers.map(p => p.id),
      message: '等待其他玩家決定是否跟猜'
    };
  }

  // 只剩猜牌者，直接驗證結果
  return validateGuessResult(gameState, playerId, guessedColors, []);
}

/**
 * 驗證猜測結果並計算分數
 */
function validateGuessResult(gameState, guessingPlayerId, guessedColors, followingPlayers) {
  const hiddenColors = gameState.hiddenCards.map(c => c.color).sort();
  const guessedSorted = [...guessedColors].sort();
  const isCorrect = hiddenColors[0] === guessedSorted[0] && hiddenColors[1] === guessedSorted[1];

  const playerIndex = gameState.players.findIndex(p => p.id === guessingPlayerId);
  const scoreChanges = {};

  // 記錄歷史
  gameState.gameHistory.push({
    type: 'guess',
    playerId: guessingPlayerId,
    guessedColors,
    isCorrect,
    followingPlayers,
    timestamp: Date.now()
  });

  if (isCorrect) {
    // 猜對：猜牌者 +3 分，跟猜者 +1 分
    scoreChanges[guessingPlayerId] = 3;
    gameState.scores[guessingPlayerId] = (gameState.scores[guessingPlayerId] || 0) + 3;
    gameState.players[playerIndex].score = gameState.scores[guessingPlayerId];

    followingPlayers.forEach(fpId => {
      scoreChanges[fpId] = 1;
      gameState.scores[fpId] = (gameState.scores[fpId] || 0) + 1;
      const fpIndex = gameState.players.findIndex(p => p.id === fpId);
      if (fpIndex !== -1) {
        gameState.players[fpIndex].score = gameState.scores[fpId];
      }
    });

    // 檢查是否有人達到勝利分數
    const winner = checkWinCondition(gameState.scores);
    if (winner) {
      gameState.winner = winner;
      gameState.gamePhase = 'finished';

      // 保存遊戲記錄到 Supabase
      const winnerPlayer = gameState.players.find(p => p.id === winner);
      saveGameToDatabase(gameState, winnerPlayer);
    } else {
      // 進入局結束，準備下一局
      gameState.gamePhase = 'roundEnd';
    }
  } else {
    // 猜錯：猜牌者不扣分但退出，跟猜者 -1 分並退出
    scoreChanges[guessingPlayerId] = 0;
    gameState.players[playerIndex].isActive = false;

    followingPlayers.forEach(fpId => {
      const currentScore = gameState.scores[fpId] || 0;
      const newScore = Math.max(0, currentScore - 1);
      scoreChanges[fpId] = newScore - currentScore;
      gameState.scores[fpId] = newScore;
      const fpIndex = gameState.players.findIndex(p => p.id === fpId);
      if (fpIndex !== -1) {
        gameState.players[fpIndex].score = newScore;
        gameState.players[fpIndex].isActive = false;
      }
    });

    // 檢查是否還有活躍玩家
    const activePlayers = gameState.players.filter(p => p.isActive);
    if (activePlayers.length === 0) {
      // 所有人都退出，局結束
      gameState.gamePhase = 'roundEnd';
    } else {
      // 還有活躍玩家，繼續遊戲（工單 0173：恢復正常遊戲階段）
      gameState.gamePhase = 'playing';
      moveToNextPlayer(gameState);
    }
  }

  // 工單 0149：判斷猜錯後是否繼續遊戲
  const activePlayers = gameState.players.filter(p => p.isActive);
  const continueGame = !isCorrect && activePlayers.length > 0;

  // 工單 0071、0113：預測結算（只在局結束時結算）
  let predictionResults = [];
  if (isCorrect || gameState.gamePhase === 'roundEnd' || gameState.gamePhase === 'finished') {
    predictionResults = settlePredictions(gameState, scoreChanges);
  }

  return {
    success: true,
    gameState,
    isCorrect,
    scoreChanges,
    hiddenCards: isCorrect ? gameState.hiddenCards : null,  // 工單 0171：猜錯時不洩露蓋牌
    predictionResults,
    continueGame  // 工單 0149：猜錯但遊戲繼續
  };
}

/**
 * 結算本局所有預測（工單 0071）
 */
function settlePredictions(gameState, scoreChanges) {
  const predictions = gameState.predictions || [];
  const currentRound = gameState.currentRound;
  const hiddenColors = gameState.hiddenCards.map(c => c.color);
  const results = [];

  console.log(`[預測結算] 開始結算，當前回合: ${currentRound}`);
  console.log(`[預測結算] 蓋牌顏色: ${hiddenColors.join(', ')}`);
  console.log('[預測結算] 已取得預測資料');

  // 只結算當局尚未結算的預測（工單 0092：防重複結算）
  const roundPredictions = predictions.filter(
    p => p.round === currentRound && p.isCorrect === null
  );

  console.log(`[預測結算] 本局待結算預測數: ${roundPredictions.length}`);

  for (const pred of roundPredictions) {
    // 檢查預測是否正確
    const isPredictionCorrect = hiddenColors.includes(pred.color);
    pred.isCorrect = isPredictionCorrect;

    // 計算分數變化
    const change = isPredictionCorrect ? 1 : -1;
    const playerId = pred.playerId;
    const currentScore = gameState.scores[playerId] || 0;
    const newScore = Math.max(0, currentScore + change);
    const actualChange = newScore - currentScore;

    console.log(`[預測結算] 玩家: [玩家], 預測: ${pred.color}, 正確: ${isPredictionCorrect}`);
    console.log(`[預測結算] 分數: ${currentScore} + (${change}) = ${newScore}, 實際變化: ${actualChange}`);

    // 更新分數
    gameState.scores[playerId] = newScore;
    const playerIndex = gameState.players.findIndex(p => p.id === playerId);
    if (playerIndex !== -1) {
      gameState.players[playerIndex].score = newScore;
      console.log(`[預測結算] 已更新 players[${playerIndex}].score = ${newScore}`);
    }

    // 累計到 scoreChanges（可能已有猜牌/跟猜的分數）
    scoreChanges[playerId] = (scoreChanges[playerId] || 0) + actualChange;

    results.push({
      playerId: playerId,
      playerName: pred.playerName,
      color: pred.color,
      isCorrect: isPredictionCorrect,
      scoreChange: actualChange
    });
  }

  console.log('[預測結算] 結算完成');
  return results;
}

/**
 * 保存遊戲記錄到資料庫
 */
async function saveGameToDatabase(gameState, winnerPlayer) {
  try {
    // 工單 0174：查詢每位玩家的 Supabase player_id
    const playerIdMap = {};
    for (const player of gameState.players) {
      if (player.firebaseUid) {
        const dbPlayerId = await getPlayerIdByFirebaseUid(player.firebaseUid);
        if (dbPlayerId) {
          playerIdMap[player.id] = dbPlayerId;
        }
      }
    }

    // 計算遊戲時長（如果有記錄開始時間）
    const durationSeconds = gameState.startTime
      ? Math.floor((Date.now() - gameState.startTime) / 1000)
      : null;

    // 工單 0174：取得勝利者的 Supabase player_id
    const winnerId = winnerPlayer ? (playerIdMap[winnerPlayer.id] || null) : null;

    // 保存遊戲記錄（含 winner_id）
    const gameHistoryId = await saveGameRecord({
      gameId: gameState.gameId,
      winnerName: winnerPlayer ? winnerPlayer.name : null,
      winnerId,
      playerCount: gameState.players.length,
      roundsPlayed: gameState.currentRound || 1,
      durationSeconds,
    });

    if (gameHistoryId) {
      // 工單 0174：保存參與者記錄（含 player_id）
      const participants = gameState.players.map(p => ({
        name: p.name,
        score: gameState.scores[p.id] || 0,
        isWinner: p.id === gameState.winner,
        playerId: playerIdMap[p.id] || null,
      }));

      await saveGameParticipants(gameHistoryId, participants);

      // 工單 0174：更新每位 Google 登入玩家的統計
      for (const player of gameState.players) {
        const dbPlayerId = playerIdMap[player.id];
        if (dbPlayerId) {
          await updatePlayerGameStats(dbPlayerId, {
            score: gameState.scores[player.id] || 0,
            isWinner: player.id === gameState.winner,
          });
        }
      }

      console.log(`遊戲記錄已保存: ${gameState.gameId}`);
    }
  } catch (err) {
    console.error('保存遊戲記錄失敗');
  }
}

/**
 * 檢查是否有人達到勝利分數
 */
function checkWinCondition(scores, winningScore = 7) {
  for (const [playerId, score] of Object.entries(scores)) {
    if (score >= winningScore) {
      return playerId;
    }
  }
  return null;
}

/**
 * 工單 0207：開始下一局邏輯（提取自 startNextRound 事件處理）
 */
function startNextRoundLogic(gameId) {
  const gameState = gameRooms.get(gameId);
  if (!gameState) return;

  if (gameState.gamePhase !== 'roundEnd') return;

  // Retain historical participants, but deal and rotate only through owned seats.
  const seatedPlayers = gameState.players.filter(player => player.ownerUid);
  if (seatedPlayers.length === 0) { gameState.gamePhase = 'finished'; return; }
  const lastActionPlayer = gameState.currentPlayerIndex;
  let nextStartPlayer = (lastActionPlayer + 1) % gameState.players.length;
  while (!gameState.players[nextStartPlayer].ownerUid) {
    nextStartPlayer = (nextStartPlayer + 1) % gameState.players.length;
  }

  // 準備下一局
  gameState.currentRound += 1;

  // 重新洗牌和發牌
  const deck = createDeck();
  const shuffledDeck = shuffleDeck(deck);
  const { hiddenCards, playerHands } = dealCards(shuffledDeck, seatedPlayers.length);

  // 更新玩家狀態
  gameState.players = gameState.players.map((player, index) => ({
    ...player,
    hand: player.ownerUid ? playerHands[seatedPlayers.findIndex(p => p.id === player.id)] : [],
    isActive: !!player.ownerUid,
    isCurrentTurn: index === nextStartPlayer
  }));

  gameState.hiddenCards = hiddenCards;
  gameState.currentPlayerIndex = nextStartPlayer;
  gameState.gamePhase = 'playing';
  gameState.gameHistory = [];
  gameState.predictions = [];
  gameState.winner = null;

  // 廣播下一局開始
  io.to(gameId).emit('roundStarted', {
    round: gameState.currentRound,
    startPlayerIndex: nextStartPlayer
  });

  broadcastGameState(gameId);
  console.log(`第 ${gameState.currentRound} 局開始: ${gameId}`);
}

function moveToNextPlayer(gameState) {
  const playerCount = gameState.players.length;
  let nextIndex = (gameState.currentPlayerIndex + 1) % playerCount;
  let attempts = 0;

  while (!gameState.players[nextIndex].isActive && attempts < playerCount) {
    nextIndex = (nextIndex + 1) % playerCount;
    attempts++;
  }

  gameState.currentPlayerIndex = nextIndex;
  gameState.players.forEach((p, i) => {
    p.isCurrentTurn = i === nextIndex;
  });
}

// 啟動伺服器
const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`伺服器運行在 port ${PORT}`);
  console.log(`區域網路玩家請連線到: http://<你的IP>:${PORT}`);
});
