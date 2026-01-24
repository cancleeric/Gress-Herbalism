/**
 * 後端伺服器 - Socket.io 即時通訊
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

// 載入環境變數（如果有 dotenv）
try {
  require('dotenv').config();
} catch (e) {
  // dotenv 未安裝，使用預設值
}

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

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// 遊戲房間狀態
const gameRooms = new Map();

// 玩家對應的 socket
const playerSockets = new Map();

/**
 * 產生唯一遊戲 ID
 */
function generateGameId() {
  return `game_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
}

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
        maxPlayers: state.maxPlayers || 4
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
  if (gameState) {
    io.to(gameId).emit('gameState', gameState);
  }
}

io.on('connection', (socket) => {
  console.log('玩家連線:', socket.id);

  // 發送目前房間列表
  socket.emit('roomList', getAvailableRooms());

  // 創建房間
  socket.on('createRoom', ({ player, maxPlayers }) => {
    const gameId = generateGameId();

    const roomState = {
      gameId,
      players: [{
        ...player,
        socketId: socket.id,
        hand: [],
        isActive: true,
        isCurrentTurn: false,
        isHost: true
      }],
      hiddenCards: [],
      currentPlayerIndex: 0,
      gamePhase: 'waiting',
      winner: null,
      gameHistory: [],
      maxPlayers: maxPlayers || 4
    };

    gameRooms.set(gameId, roomState);
    playerSockets.set(socket.id, { gameId, playerId: player.id });

    socket.join(gameId);
    socket.emit('roomCreated', { gameId, gameState: roomState });

    broadcastRoomList();
    console.log(`房間創建: ${gameId}, 房主: ${player.name}`);
  });

  // 加入房間
  socket.on('joinRoom', ({ gameId, player }) => {
    const gameState = gameRooms.get(gameId);

    if (!gameState) {
      socket.emit('error', { message: '房間不存在' });
      return;
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
      isHost: false
    });

    playerSockets.set(socket.id, { gameId, playerId: player.id });

    socket.join(gameId);
    socket.emit('joinedRoom', { gameId, gameState });

    broadcastGameState(gameId);
    broadcastRoomList();
    console.log(`玩家 ${player.name} 加入房間 ${gameId}`);
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

    // 更新玩家手牌
    gameState.players = gameState.players.map((player, index) => ({
      ...player,
      hand: playerHands[index],
      isActive: true,
      isCurrentTurn: index === 0
    }));

    gameState.hiddenCards = hiddenCards;
    gameState.currentPlayerIndex = 0;
    gameState.gamePhase = 'playing';

    broadcastGameState(gameId);
    broadcastRoomList();
    console.log(`遊戲開始: ${gameId}`);
  });

  // 處理遊戲動作
  socket.on('gameAction', ({ gameId, action }) => {
    const gameState = gameRooms.get(gameId);

    if (!gameState) {
      socket.emit('error', { message: '遊戲不存在' });
      return;
    }

    // 處理問牌或猜牌
    const result = processGameAction(gameState, action);

    if (result.success) {
      Object.assign(gameState, result.gameState);
      broadcastGameState(gameId);

      if (result.gameState.gamePhase === 'finished') {
        broadcastRoomList();
      }
    } else {
      socket.emit('error', { message: result.message });
    }
  });

  // 查看蓋牌
  socket.on('revealHiddenCards', ({ gameId, playerId }) => {
    const gameState = gameRooms.get(gameId);

    if (!gameState) {
      socket.emit('error', { message: '遊戲不存在' });
      return;
    }

    const playerIndex = gameState.players.findIndex(p => p.id === playerId);
    if (playerIndex === gameState.currentPlayerIndex) {
      socket.emit('hiddenCardsRevealed', {
        cards: gameState.hiddenCards.map(card => ({
          id: card.id,
          color: card.color
        }))
      });
    }
  });

  // 離開房間
  socket.on('leaveRoom', ({ gameId, playerId }) => {
    handlePlayerLeave(socket, gameId, playerId);
  });

  // 斷線處理
  socket.on('disconnect', () => {
    const playerInfo = playerSockets.get(socket.id);
    if (playerInfo) {
      handlePlayerLeave(socket, playerInfo.gameId, playerInfo.playerId);
    }
    console.log('玩家斷線:', socket.id);
  });
});

function handlePlayerLeave(socket, gameId, playerId) {
  const gameState = gameRooms.get(gameId);
  if (!gameState) return;

  const playerIndex = gameState.players.findIndex(p => p.id === playerId);
  if (playerIndex === -1) return;

  const player = gameState.players[playerIndex];

  if (gameState.gamePhase === 'waiting') {
    // 等待中，直接移除玩家
    gameState.players.splice(playerIndex, 1);

    if (gameState.players.length === 0) {
      // 房間空了，刪除房間
      gameRooms.delete(gameId);
    } else if (player.isHost) {
      // 房主離開，轉移房主
      gameState.players[0].isHost = true;
    }
  } else {
    // 遊戲中，標記為不活躍
    gameState.players[playerIndex].isActive = false;
  }

  socket.leave(gameId);
  playerSockets.delete(socket.id);

  broadcastGameState(gameId);
  broadcastRoomList();
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
        maxPlayers: state.maxPlayers || 4
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
    // 全部
    cardsToGive = target.hand.filter(c => c.color === selectedColor);
    target.hand = target.hand.filter(c => c.color !== selectedColor);
    player.hand.push(...cardsToGive);
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

  // 下一位玩家
  moveToNextPlayer(gameState);

  return { success: true, gameState };
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

  const hiddenColors = gameState.hiddenCards.map(c => c.color).sort();
  const guessedSorted = [...guessedColors].sort();

  const isCorrect = hiddenColors[0] === guessedSorted[0] && hiddenColors[1] === guessedSorted[1];

  gameState.gameHistory.push({
    type: 'guess',
    playerId,
    guessedColors,
    isCorrect,
    timestamp: Date.now()
  });

  if (isCorrect) {
    // 猜對，遊戲結束，該玩家獲勝
    gameState.winner = playerId;
    gameState.gamePhase = 'finished';
  } else {
    // 猜錯，玩家出局
    gameState.players[playerIndex].isActive = false;

    // 檢查是否還有活躍玩家
    const activePlayers = gameState.players.filter(p => p.isActive);
    if (activePlayers.length === 0) {
      // 沒有人獲勝
      gameState.winner = null;
      gameState.gamePhase = 'finished';
    } else {
      // 還有活躍玩家（包括只剩一人的情況）
      // 如果只剩一人，該玩家必須強制猜牌
      moveToNextPlayer(gameState);
    }
  }

  return { success: true, gameState };
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
