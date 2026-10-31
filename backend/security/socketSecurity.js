/** Server-owned identity, room authorization and recipient-only state. No DB access. */
const COLORS = new Set(['red', 'yellow', 'green', 'blue']);
const ROOM_EVENTS = new Set(['startGame', 'gameAction', 'colorChoiceSubmit', 'endTurn',
  'followGuessResponse', 'revealHiddenCards', 'startNextRound', 'dismissGuessResult',
  'confirmGuessResult', 'leaveRoom', 'playerRefreshing']);
const validId = value => typeof value === 'string' && value.length > 0 && value.length <= 200;

function publicGameState(state, viewerId) {
  // Explicit public fields avoid accidentally publishing newly added internal state.
  const fields = ['gameId', 'currentPlayerIndex', 'gamePhase', 'winner', 'gameHistory',
    'maxPlayers', 'currentRound', 'scores', 'winningScore', 'roundHistory', 'isPrivate', 'predictions'];
  const result = {};
  for (const field of fields) if (state[field] !== undefined) result[field] = structuredClone(state[field]);
  result.hiddenCards = (state.hiddenCards || []).map(() => ({ hidden: true }));
  result.players = state.players.map(player => {
    const output = {};
    for (const field of ['id', 'name', 'avatar', 'avatarUrl', 'isActive', 'isCurrentTurn', 'isHost',
      'score', 'isDisconnected', 'disconnectedAt', 'isRefreshing']) {
      if (player[field] !== undefined) output[field] = player[field];
    }
    output.hand = player.id === viewerId
      ? structuredClone(player.hand || []) : (player.hand || []).map(() => ({ hidden: true }));
    return output;
  });
  return result;
}

function normalizePlayer(player, uid) {
  if (!player || !validId(player.id) || Object.prototype.hasOwnProperty.call(Object.prototype, player.id) || !validId(uid)) throw new Error('玩家資料無效');
  return { id: player.id, name: typeof player.name === 'string' ? player.name.slice(0, 80) : '玩家',
    ownerUid: uid, firebaseUid: uid };
}

function authorizePacket(socket, packet, context) {
  const [event, raw] = packet;
  if (!validId(socket.uid) || !Number.isFinite(socket.authExpiresAt) || socket.authExpiresAt <= Date.now()) {
    socket.disconnect(true);
    throw new Error('登入已過期，請重新連線');
  }
  if (!ROOM_EVENTS.has(event) && !['createRoom', 'joinRoom', 'reconnect', 'setPresence'].includes(event)) return;
  const data = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  packet[1] = data;
  const { gameRooms, playerSockets, pendingColorChoices, postQuestionStates, followGuessStates, guessResultConfirmations } = context;
  if (event === 'setPresence') { data.firebaseUid = socket.uid; return; }
  if (event === 'createRoom' || event === 'joinRoom') {
    if (playerSockets.has(socket.id)) throw new Error('請先離開目前房間');
    const player = normalizePlayer(data.player, socket.uid);
    // A UID belongs to only one live seat, including disconnected seats awaiting reconnect.
    for (const state of gameRooms.values()) {
      if (state.players.some(p => p.ownerUid === socket.uid)) throw new Error('請重連既有房間或先離開');
    }
    if (event === 'joinRoom') {
      const state = gameRooms.get(data.gameId);
      if (state && state.players.some(p => p.id === player.id)) throw new Error('玩家 ID 已存在');
    }
    if (event === 'createRoom' && data.maxPlayers !== undefined && ![3,4].includes(data.maxPlayers)) throw new Error('房間人數無效');
    if (data.password !== undefined && data.password !== null && (typeof data.password !== 'string' || data.password.length > 128)) throw new Error('房間密碼無效');
    data.player = player;
    return;
  }
  if (event === 'reconnect') {
    const state = gameRooms.get(data.roomId);
    const player = state?.players.find(p => p.id === data.playerId);
    if (!player || player.ownerUid !== socket.uid) throw new Error('無權重連此玩家');
    const old = playerSockets.get(socket.id);
    if (old && (old.gameId !== data.roomId || old.playerId !== player.id)) throw new Error('請先離開目前房間');
    return;
  }
  const state = gameRooms.get(data.gameId);
  const binding = playerSockets.get(socket.id);
  const player = state?.players.find(p => p.id === binding?.playerId);
  if (!state || !binding || binding.gameId !== data.gameId || !player ||
    player.ownerUid !== socket.uid || player.socketId !== socket.id) throw new Error('你不是此房間的有效玩家');
  if (data.playerId !== undefined && data.playerId !== player.id) throw new Error('不可代替其他玩家操作');
  data.playerId = player.id;
  const isTurn = state.players[state.currentPlayerIndex]?.id === player.id;
  if (event === 'startGame' && (!player.isHost || state.gamePhase !== 'waiting')) throw new Error('只有房主可開始等待中的遊戲');
  if (event === 'gameAction') {
    const action = data.action;
    if (!action || typeof action !== 'object' || action.playerId !== player.id ||
      state.gamePhase !== 'playing' || pendingColorChoices.has(data.gameId) || !isTurn || !player.isActive) throw new Error('不是有效的行動回合');
    if (action.type === 'guess') {
      if (!Array.isArray(action.guessedColors) || action.guessedColors.length !== 2 || !action.guessedColors.every(c => COLORS.has(c))) throw new Error('猜牌顏色無效');
    } else if (action.type === 'question') {
      const target = state.players.find(p => p.id === action.targetPlayerId);
      if (!target || target.id === player.id || !validId(target.ownerUid) || ![1,2,3].includes(action.questionType) ||
        !Array.isArray(action.colors) || action.colors.length !== 2 || action.colors[0] === action.colors[1] ||
        !action.colors.every(c => COLORS.has(c))) throw new Error('問牌資料無效');
      if (action.questionType === 3 && (!action.colors.includes(action.giveColor) || !action.colors.includes(action.getColor) ||
        action.giveColor === action.getColor || !player.hand.some(c => c.color === action.giveColor))) throw new Error('沒有可交換的手牌');
    } else throw new Error('動作類型無效');
  }
  if (event === 'colorChoiceSubmit') {
    const pending = pendingColorChoices.get(data.gameId);
    if (pending?.action && (data.requestId !== pending.requestId || !['start','complete'].includes(data.stage))) throw new Error('無效的交牌請求');
    if (!pending || state.gamePhase !== 'playing' ||
      state.players[state.currentPlayerIndex]?.id !== pending.askingPlayerId || pending.targetPlayerId !== player.id ||
      (!pending.action && !(pending.availableColors.includes(data.chosenColor) || (data.chosenColor === 'none' && pending.availableColors.length === 0)))) throw new Error('不是有效的選色回應');
  }
  if (event === 'endTurn' && (postQuestionStates.get(data.gameId)?.playerId !== player.id ||
    state.gamePhase !== 'postQuestion' || (data.prediction && !COLORS.has(data.prediction)))) throw new Error('不是有效的結束回合');
  if (event === 'followGuessResponse' && (followGuessStates.get(data.gameId)?.currentDeciderId !== player.id ||
    state.gamePhase !== 'followGuessing' || typeof data.isFollowing !== 'boolean')) throw new Error('不是有效的跟猜回應');
  // Answers are delivered only by authoritative settlement, never by a client request.
  if (event === 'revealHiddenCards') throw new Error('答案只在結算時公布');
  if (event === 'startNextRound' && (!player.isHost || state.gamePhase !== 'roundEnd' || guessResultConfirmations.has(data.gameId))) throw new Error('尚不可開始下一局');
  if (event === 'dismissGuessResult') throw new Error('請使用個人結果確認');
  if (event === 'confirmGuessResult') {
    const confirmation = guessResultConfirmations.get(data.gameId);
    if (confirmation && !confirmation.requiredPlayers.includes(player.id)) throw new Error('不在本次確認名單');
  }
}

function installSocketSecurity(io, verifyToken, context) {
  io.use(async (socket, next) => {
    try {
      const identity = await verifyToken(socket.handshake.auth?.token);
      socket.uid = identity.uid;
      socket.authExpiresAt = identity.expiresAt;
      if (!validId(socket.uid) || !Number.isFinite(socket.authExpiresAt) || socket.authExpiresAt <= Date.now()) throw new Error('expired');
      const timer = setTimeout(() => socket.disconnect(true), Math.min(socket.authExpiresAt - Date.now(), 2147483647));
      timer.unref?.();
      socket.once('disconnect', () => clearTimeout(timer));
      socket.use((packet, accept) => {
        try { authorizePacket(socket, packet, context); accept(); }
        catch (_) {
          // Uniform failure for missing seats and ownership denials: clients can
          // leave an expired room without learning whether another seat exists.
          const event = packet[0] === 'reconnect' ? 'reconnectFailed' : 'error';
          socket.emit(event, {message: '未授權或無效的遊戲操作'});
        }
      });
      next();
    } catch (_) { next(new Error('登入驗證失敗')); }
  });
}

module.exports = { publicGameState, normalizePlayer, authorizePacket, installSocketSecurity };
