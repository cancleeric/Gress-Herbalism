/**
 * Socket 服務測試
 */

// 創建一個完整的 mock socket
const createMockSocket = () => ({
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
  disconnect: jest.fn(),
  connect: jest.fn(),
  io: { on: jest.fn() },
  connected: true,
});

let mockSocketInstance = createMockSocket();
let mockGetCurrentRoom = jest.fn();
let mockClearCurrentRoom = jest.fn();
let mockAuth;
let mockAuthChanged;

// Mock socket.io-client
jest.mock('socket.io-client', () => ({
  io: jest.fn(() => mockSocketInstance),
}));

// Mock config
jest.mock('../config', () => ({
  __esModule: true,
  default: {
    socketUrl: 'http://localhost:3001',
    socketPath: '/herbalism/socket.io',
  },
}));

describe('socketService', () => {
  let socketService;

  beforeEach(() => {
    // 在每個測試前重置模組
    jest.resetModules();
    mockSocketInstance = createMockSocket();

    // 重新設置 mock
    jest.doMock('socket.io-client', () => ({
      io: jest.fn(() => mockSocketInstance),
    }));

    jest.doMock('../config', () => ({
      __esModule: true,
      default: {
        socketUrl: 'http://localhost:3001',
        socketPath: '/herbalism/socket.io',
      },
    }));

    // 工單 0201：Mock localStorage utils
    mockGetCurrentRoom = jest.fn().mockReturnValue(null);
    mockClearCurrentRoom = jest.fn();
    jest.doMock('../utils/common/localStorage', () => ({
      getCurrentRoom: mockGetCurrentRoom,
      clearCurrentRoom: mockClearCurrentRoom,
    }));
    mockAuth = { currentUser: null, authStateReady: jest.fn().mockResolvedValue() };
    jest.doMock('../firebase/config', () => ({ auth: mockAuth }));
    jest.doMock('firebase/auth', () => ({
      onIdTokenChanged: jest.fn((_auth, callback) => {
        mockAuthChanged = callback;
        return jest.fn();
      }),
    }));

    localStorage.clear();

    // 重新載入模組
    socketService = require('./socketService');
  });

  describe('initSocket', () => {
    test('應初始化 socket 連線', () => {
      const socket = socketService.initSocket();
      expect(socket).toBeDefined();
      expect(mockSocketInstance.on).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(mockSocketInstance.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
      expect(mockSocketInstance.on).toHaveBeenCalledWith('connect_error', expect.any(Function));
    });

    test('重複呼叫應返回相同的 socket', () => {
      const socket1 = socketService.initSocket();
      const socket2 = socketService.initSocket();
      expect(socket1).toBe(socket2);
    });
  });

  describe('getSocket', () => {
    test('應返回 socket 實例', () => {
      const socket = socketService.getSocket();
      expect(socket).toBeDefined();
    });
  });

  describe('verified Firebase socket identity', () => {
    const options = () => require('socket.io-client').io.mock.calls[0][1];

    test('retries inactive handshake failures once with backoff, resets on success, and cancels at logout', () => {
      jest.useFakeTimers();
      try {
        socketService.initSocket();
        const user = {uid:'guest',getIdToken:jest.fn().mockResolvedValue('token')};
        mockAuth.currentUser=user; mockAuthChanged(user);
        mockSocketInstance.connected=false; mockSocketInstance.active=false;
        mockSocketInstance.connect.mockClear();
        const error = mockSocketInstance.on.mock.calls.find(([event])=>event==='connect_error')[1];
        const connected = mockSocketInstance.on.mock.calls.find(([event])=>event==='connect')[1];
        error(new Error('temporary')); error(new Error('temporary'));
        jest.advanceTimersByTime(999); expect(mockSocketInstance.connect).not.toHaveBeenCalled();
        jest.advanceTimersByTime(1); expect(mockSocketInstance.connect).toHaveBeenCalledTimes(1);
        error(new Error('temporary')); jest.advanceTimersByTime(1999);
        expect(mockSocketInstance.connect).toHaveBeenCalledTimes(1);
        jest.advanceTimersByTime(1); expect(mockSocketInstance.connect).toHaveBeenCalledTimes(2);
        connected();
        error(new Error('temporary')); jest.advanceTimersByTime(1000);
        expect(mockSocketInstance.connect).toHaveBeenCalledTimes(3);
        error(new Error('temporary'));
        mockAuth.currentUser=null; mockAuthChanged(null);
        jest.advanceTimersByTime(10000); expect(mockSocketInstance.connect).toHaveBeenCalledTimes(3);
      } finally {socketService.disconnect(); jest.useRealTimers();}
    });

    test('does not duplicate manager reconnection and cancels manual retry on disposal or UID switch', () => {
      jest.useFakeTimers();
      try {
        socketService.initSocket();
        mockAuth.currentUser={uid:'old'}; mockAuthChanged(mockAuth.currentUser);
        mockSocketInstance.connected=false; mockSocketInstance.active=true;
        const error=mockSocketInstance.on.mock.calls.find(([event])=>event==='connect_error')[1];
        mockSocketInstance.connect.mockClear(); error(new Error('transport'));
        jest.advanceTimersByTime(10000); expect(mockSocketInstance.connect).not.toHaveBeenCalled();
        mockSocketInstance.active=false; error(new Error('handshake'));
        mockAuth.currentUser={uid:'new'}; mockAuthChanged(mockAuth.currentUser);
        mockSocketInstance.connect.mockClear(); jest.advanceTimersByTime(10000);
        expect(mockSocketInstance.connect).not.toHaveBeenCalled();
        error(new Error('handshake')); socketService.disconnect();
        jest.advanceTimersByTime(10000); expect(mockSocketInstance.connect).not.toHaveBeenCalled();
      } finally {socketService.disconnect(); jest.useRealTimers();}
    });

    test('waits for Firebase and sends the anonymous ID token, not the UID', async () => {
      socketService.initSocket();
      expect(options().autoConnect).toBe(false);
      const user = { uid: 'guest-a', isAnonymous: true, getIdToken: jest.fn().mockResolvedValue('signed-id-token') };
      mockAuth.currentUser = user;
      mockAuthChanged(user);
      expect(mockSocketInstance.connect).toHaveBeenCalled();
      const done = jest.fn();
      await options().auth(done);
      expect(mockAuth.authStateReady).toHaveBeenCalled();
      expect(done).toHaveBeenCalledWith({ token: 'signed-id-token' });
      expect(localStorage.getItem('token')).toBeNull();
    });

    test('fails closed for missing user or failed token acquisition', async () => {
      socketService.initSocket();
      const done = jest.fn();
      await options().auth(done);
      expect(done).toHaveBeenLastCalledWith({ token: '' });
      mockAuth.currentUser = { uid: 'guest', getIdToken: jest.fn().mockRejectedValue(new Error('denied')) };
      await options().auth(done);
      expect(done).toHaveBeenLastCalledWith({ token: '' });
    });

    test('rejects a token acquired during an identity switch', async () => {
      socketService.initSocket();
      mockAuth.currentUser = {
        uid: 'old', getIdToken: jest.fn(async () => {
          mockAuth.currentUser = { uid: 'new' };
          return 'old-token';
        }),
      };
      const done = jest.fn();
      await options().auth(done);
      expect(done).toHaveBeenCalledWith({ token: '' });
    });

    test('logout or identity switch clears saved room and queued actions', () => {
      socketService.initSocket();
      mockAuthChanged({ uid: 'old' });
      localStorage.setItem('lastRoomId', 'private-room');
      mockSocketInstance.sendBuffer = [{ type: 'gameAction' }];
      mockAuthChanged(null);
      expect(mockClearCurrentRoom).toHaveBeenCalled();
      expect(localStorage.getItem('lastRoomId')).toBeNull();
      expect(mockSocketInstance.sendBuffer).toEqual([]);
      expect(mockSocketInstance.disconnect).toHaveBeenCalled();
    });

    test('each successful transport connection restores the saved room', () => {
      socketService.initSocket();
      mockGetCurrentRoom.mockReturnValue({ roomId: 'room', playerId: 'player', playerName: 'guest' });
      const connected = mockSocketInstance.on.mock.calls.find(([name]) => name === 'connect')[1];
      connected();
      connected();
      expect(mockSocketInstance.emit.mock.calls.filter(([name]) => name === 'reconnect')).toHaveLength(2);
      socketService.disconnect();
    });
  });

  describe('重新驗證後的房間與presence恢復', () => {
    const handler = name => mockSocketInstance.on.mock.calls.find(([event]) => event === name)[1];
    const user = { uid: 'owner', isAnonymous: false };
    const room = { roomId: 'evo-room', room: { players: [{ id: 'seat', firebaseUid: 'owner', socketId: 'socket-a' }] } };
    beforeEach(() => {
      jest.useFakeTimers();
      mockSocketInstance.id = 'socket-a';
      mockAuth.currentUser = user;
      socketService.initSocket();
      mockAuthChanged(user);
    });
    afterEach(() => { socketService.disconnect(); jest.useRealTimers(); });

    test.each(['evo:roomCreated', 'evo:joinedRoom'])('%s 的同UID席位在token更新後恢復', event => {
      handler(event)(event === 'evo:roomCreated' ? { ...room.room, id: room.roomId } : room);
      mockSocketInstance.emit.mockClear();
      mockAuthChanged(user);
      handler('connect')();
      expect(mockSocketInstance.emit).toHaveBeenCalledWith('evo:reconnect', { roomId: 'evo-room', playerId: 'seat' });
      expect(mockSocketInstance.emit).not.toHaveBeenCalledWith('reconnect', expect.anything());
    });

    test('已啟用presence在重新驗證連線後重送', () => {
      socketService.setPresence('owner');
      mockSocketInstance.emit.mockClear();
      mockAuthChanged(user);
      handler('connect')();
      expect(mockSocketInstance.emit).toHaveBeenCalledWith('setPresence', { firebaseUid: 'owner' });
      expect(localStorage.getItem('token')).toBeNull();
    });

    test('換UID不重送前帳號房間或presence，過期呼叫亦忽略', () => {
      handler('evo:joinedRoom')(room);
      socketService.setPresence('owner');
      mockAuth.currentUser = { uid: 'other' };
      mockAuthChanged(mockAuth.currentUser);
      mockSocketInstance.emit.mockClear();
      socketService.setPresence('owner');
      handler('connect')();
      expect(mockSocketInstance.emit).not.toHaveBeenCalledWith('setPresence', expect.anything());
      expect(mockSocketInstance.emit).not.toHaveBeenCalledWith('evo:reconnect', expect.anything());
    });

    test('離開房間不會在下次connect重新加入', () => {
      handler('evo:joinedRoom')(room);
      socketService.evoLeaveRoom('evo-room', 'seat');
      mockSocketInstance.emit.mockClear();
      handler('connect')();
      expect(mockSocketInstance.emit).not.toHaveBeenCalledWith('evo:reconnect', expect.anything());
    });

    test('離線離房先恢復綁定後離開，不重播失去所有權的leave', () => {
      handler('evo:joinedRoom')(room);
      mockSocketInstance.connected = false;
      mockSocketInstance.emit.mockClear();
      socketService.evoLeaveRoom('evo-room', 'seat');
      expect(mockSocketInstance.emit).not.toHaveBeenCalled();
      mockSocketInstance.connected = true;
      handler('connect')();
      expect(mockSocketInstance.emit).toHaveBeenCalledWith('evo:reconnect', { roomId: 'evo-room', playerId: 'seat' });
      handler('evo:joinedRoom')(room);
      expect(mockSocketInstance.emit).toHaveBeenCalledWith('evo:leaveRoom', { roomId: 'evo-room', playerId: 'seat' });
      mockSocketInstance.emit.mockClear();
      handler('connect')();
      expect(mockSocketInstance.emit).not.toHaveBeenCalledWith('evo:reconnect', expect.anything());
    });

    test('離線離房的內部確認不通知大廳重新導向，正常加入仍通知', () => {
      const navigate = jest.fn();
      socketService.onEvoJoinedRoom(data => navigate(`/evolution/room/${data.roomId}`));
      const deliver = data => mockSocketInstance.on.mock.calls.filter(([event]) => event === 'evo:joinedRoom').forEach(([, fn]) => fn(data));
      deliver(room); navigate.mockClear();
      mockSocketInstance.connected = false; socketService.evoLeaveRoom('evo-room', 'seat');
      mockSocketInstance.connected = true; handler('connect')();
      deliver({ ...room });
      expect(navigate).not.toHaveBeenCalled();
      deliver({ roomId: 'new-room', room: room.room });
      expect(navigate).toHaveBeenCalledWith('/evolution/room/new-room');
    });

    test('離線presence只在connect時送一次，不預先放入buffer', () => {
      mockSocketInstance.connected = false;
      mockSocketInstance.emit.mockClear();
      socketService.setPresence('owner');
      expect(mockSocketInstance.emit).not.toHaveBeenCalled();
      mockSocketInstance.connected = true;
      handler('connect')();
      expect(mockSocketInstance.emit.mock.calls.filter(([name]) => name === 'setPresence')).toHaveLength(1);
    });

    test('dispose後舊connect與auth回呼不能恢復狀態', () => {
      handler('evo:joinedRoom')(room); socketService.setPresence('owner');
      const connected = handler('connect'), authChanged = mockAuthChanged;
      socketService.disconnect(); mockSocketInstance.emit.mockClear(); mockSocketInstance.connect.mockClear();
      expect(() => { connected(); authChanged(user); }).not.toThrow();
      expect(mockSocketInstance.emit).not.toHaveBeenCalled();
      expect(mockSocketInstance.connect).not.toHaveBeenCalled();
    });

    test('不恢復其他帳號的席位', () => {
      handler('evo:joinedRoom')({ ...room, room: { players: [{ id: 'victim', firebaseUid: 'other' }] } });
      mockSocketInstance.emit.mockClear();
      handler('connect')();
      expect(mockSocketInstance.emit).not.toHaveBeenCalledWith('evo:reconnect', expect.anything());
    });
  });

  describe('事件監聽', () => {
    test('onRoomList 應監聽房間列表', () => {
      const callback = jest.fn();
      const unsubscribe = socketService.onRoomList(callback);

      expect(mockSocketInstance.on).toHaveBeenCalledWith('roomList', callback);
      expect(typeof unsubscribe).toBe('function');

      unsubscribe();
      expect(mockSocketInstance.off).toHaveBeenCalledWith('roomList', callback);
    });

    test('onGameState 應監聽遊戲狀態', () => {
      const callback = jest.fn();
      const unsubscribe = socketService.onGameState(callback);

      expect(mockSocketInstance.on).toHaveBeenCalledWith('gameState', callback);
      unsubscribe();
      expect(mockSocketInstance.off).toHaveBeenCalledWith('gameState', callback);
    });

    test('onError 應監聽錯誤', () => {
      const callback = jest.fn();
      const unsubscribe = socketService.onError(callback);

      expect(mockSocketInstance.on).toHaveBeenCalledWith('error', callback);
      unsubscribe();
      expect(mockSocketInstance.off).toHaveBeenCalledWith('error', callback);
    });

    test('onRoomCreated 應監聽房間創建', () => {
      const callback = jest.fn();
      const unsubscribe = socketService.onRoomCreated(callback);

      expect(mockSocketInstance.on).toHaveBeenCalledWith('roomCreated', callback);
      unsubscribe();
      expect(mockSocketInstance.off).toHaveBeenCalledWith('roomCreated', callback);
    });

    test('onJoinedRoom 應監聽加入房間', () => {
      const callback = jest.fn();
      const unsubscribe = socketService.onJoinedRoom(callback);

      expect(mockSocketInstance.on).toHaveBeenCalledWith('joinedRoom', callback);
      unsubscribe();
      expect(mockSocketInstance.off).toHaveBeenCalledWith('joinedRoom', callback);
    });

    test('onHiddenCardsRevealed 應監聽蓋牌揭示', () => {
      const callback = jest.fn();
      const unsubscribe = socketService.onHiddenCardsRevealed(callback);

      expect(mockSocketInstance.on).toHaveBeenCalledWith('hiddenCardsRevealed', callback);
      unsubscribe();
      expect(mockSocketInstance.off).toHaveBeenCalledWith('hiddenCardsRevealed', callback);
    });

    test('onColorChoiceRequired 應監聽顏色選擇請求', () => {
      const callback = jest.fn();
      const unsubscribe = socketService.onColorChoiceRequired(callback);

      expect(mockSocketInstance.on).toHaveBeenCalledWith('colorChoiceRequired', callback);
      unsubscribe();
      expect(mockSocketInstance.off).toHaveBeenCalledWith('colorChoiceRequired', callback);
    });

    test('onWaitingForColorChoice 應監聽等待選擇', () => {
      const callback = jest.fn();
      const unsubscribe = socketService.onWaitingForColorChoice(callback);

      expect(mockSocketInstance.on).toHaveBeenCalledWith('waitingForColorChoice', callback);
      unsubscribe();
      expect(mockSocketInstance.off).toHaveBeenCalledWith('waitingForColorChoice', callback);
    });

    test('onColorChoiceResult 應監聽選擇結果', () => {
      const callback = jest.fn();
      const unsubscribe = socketService.onColorChoiceResult(callback);

      expect(mockSocketInstance.on).toHaveBeenCalledWith('colorChoiceResult', callback);
      unsubscribe();
      expect(mockSocketInstance.off).toHaveBeenCalledWith('colorChoiceResult', callback);
    });

    test('onPasswordRequired 應監聽密碼需求', () => {
      const callback = jest.fn();
      const unsubscribe = socketService.onPasswordRequired(callback);

      expect(mockSocketInstance.on).toHaveBeenCalledWith('passwordRequired', callback);
      unsubscribe();
      expect(mockSocketInstance.off).toHaveBeenCalledWith('passwordRequired', callback);
    });

    test('onFollowGuessStarted 應監聽跟猜開始', () => {
      const callback = jest.fn();
      const unsubscribe = socketService.onFollowGuessStarted(callback);

      expect(mockSocketInstance.on).toHaveBeenCalledWith('followGuessStarted', callback);
      unsubscribe();
      expect(mockSocketInstance.off).toHaveBeenCalledWith('followGuessStarted', callback);
    });

    test('onFollowGuessUpdate 應監聽跟猜更新', () => {
      const callback = jest.fn();
      const unsubscribe = socketService.onFollowGuessUpdate(callback);

      expect(mockSocketInstance.on).toHaveBeenCalledWith('followGuessUpdate', callback);
      unsubscribe();
      expect(mockSocketInstance.off).toHaveBeenCalledWith('followGuessUpdate', callback);
    });

    test('onGuessResult 應監聽猜牌結果', () => {
      const callback = jest.fn();
      const unsubscribe = socketService.onGuessResult(callback);

      expect(mockSocketInstance.on).toHaveBeenCalledWith('guessResult', callback);
      unsubscribe();
      expect(mockSocketInstance.off).toHaveBeenCalledWith('guessResult', callback);
    });

    test('onRoundStarted 應監聽局開始', () => {
      const callback = jest.fn();
      const unsubscribe = socketService.onRoundStarted(callback);

      expect(mockSocketInstance.on).toHaveBeenCalledWith('roundStarted', callback);
      unsubscribe();
      expect(mockSocketInstance.off).toHaveBeenCalledWith('roundStarted', callback);
    });

    test('onConnectionChange 應註冊連線狀態回調', () => {
      const callback = jest.fn();
      socketService.initSocket();
      const unsubscribe = socketService.onConnectionChange(callback);

      expect(typeof unsubscribe).toBe('function');
      expect(callback).toHaveBeenCalledWith(true);
    });
  });

  describe('事件發送', () => {
    test('createRoom 應發送創建房間事件', () => {
      const player = { id: 'p1', name: '玩家1' };
      socketService.createRoom(player, 4, 'password123');

      expect(mockSocketInstance.emit).toHaveBeenCalledWith('createRoom', {
        player,
        maxPlayers: 4,
        password: 'password123',
      });
    });

    test('joinRoom 應發送加入房間事件', () => {
      const player = { id: 'p1', name: '玩家1' };
      socketService.joinRoom('game123', player, 'password');

      expect(mockSocketInstance.emit).toHaveBeenCalledWith('joinRoom', {
        gameId: 'game123',
        player,
        password: 'password',
      });
    });

    test('startGame 應發送開始遊戲事件', () => {
      socketService.startGame('game123');

      expect(mockSocketInstance.emit).toHaveBeenCalledWith('startGame', { gameId: 'game123' });
    });

    test('sendGameAction 應發送遊戲動作', () => {
      const action = { type: 'question', data: {} };
      socketService.sendGameAction('game123', action);

      expect(mockSocketInstance.emit).toHaveBeenCalledWith('gameAction', {
        gameId: 'game123',
        action,
      });
    });

    test('requestRevealHiddenCards 應發送揭示蓋牌請求', () => {
      socketService.requestRevealHiddenCards('game123', 'player1');

      expect(mockSocketInstance.emit).toHaveBeenCalledWith('revealHiddenCards', {
        gameId: 'game123',
        playerId: 'player1',
      });
    });

    test('leaveRoom 應發送離開房間事件', () => {
      socketService.leaveRoom('game123', 'player1');

      expect(mockSocketInstance.emit).toHaveBeenCalledWith('leaveRoom', {
        gameId: 'game123',
        playerId: 'player1',
      });
    });

    test('submitColorChoice 應發送顏色選擇', () => {
      socketService.submitColorChoice('game123', 'red');

      expect(mockSocketInstance.emit).toHaveBeenCalledWith('colorChoiceSubmit', {
        gameId: 'game123',
        chosenColor: 'red',
      });
    });

    test('submitFollowGuessResponse 應發送跟猜回應', () => {
      socketService.submitFollowGuessResponse('game123', 'player1', true);

      expect(mockSocketInstance.emit).toHaveBeenCalledWith('followGuessResponse', {
        gameId: 'game123',
        playerId: 'player1',
        isFollowing: true,
      });
    });

    test('startNextRound 應發送開始下一局事件', () => {
      socketService.startNextRound('game123');

      expect(mockSocketInstance.emit).toHaveBeenCalledWith('startNextRound', { gameId: 'game123' });
    });
  });

  describe('disconnect', () => {
    test('應斷開連線', () => {
      socketService.initSocket();
      socketService.disconnect();
      expect(mockSocketInstance.disconnect).toHaveBeenCalled();
    });

    test('未初始化時呼叫 disconnect 不應報錯', () => {
      expect(() => socketService.disconnect()).not.toThrow();
    });
  });

  // ====================================================================
  // 工單 0201：重連相關函數單元測試
  // ====================================================================
  describe('TC-0201-01：attemptReconnect 函數', () => {
    test('TC-0201-01a：應發送 reconnect 事件到 socket', () => {
      socketService.attemptReconnect('room1', 'player1', '玩家A');

      expect(mockSocketInstance.emit).toHaveBeenCalledWith('reconnect', expect.any(Object));
    });

    test('TC-0201-01b：參數應正確傳遞', () => {
      socketService.attemptReconnect('room1', 'player1', '玩家A');

      expect(mockSocketInstance.emit).toHaveBeenCalledWith('reconnect', {
        roomId: 'room1',
        playerId: 'player1',
        playerName: '玩家A',
      });
    });
  });

  describe('TC-0201-02：onReconnected 函數', () => {
    test('TC-0201-02a：應註冊 reconnected 事件監聽', () => {
      const callback = jest.fn();
      socketService.onReconnected(callback);

      expect(mockSocketInstance.on).toHaveBeenCalledWith('reconnected', callback);
    });

    test('TC-0201-02b：應返回 unsubscribe 函數', () => {
      const callback = jest.fn();
      const unsub = socketService.onReconnected(callback);

      expect(typeof unsub).toBe('function');

      unsub();
      expect(mockSocketInstance.off).toHaveBeenCalledWith('reconnected', callback);
    });
  });

  describe('TC-0201-03：onReconnectFailed 函數', () => {
    test('TC-0201-03a：應註冊 reconnectFailed 事件監聽', () => {
      const callback = jest.fn();
      socketService.onReconnectFailed(callback);

      expect(mockSocketInstance.on).toHaveBeenCalledWith('reconnectFailed', callback);
    });

    test('TC-0201-03b：應返回 unsubscribe 函數', () => {
      const callback = jest.fn();
      const unsub = socketService.onReconnectFailed(callback);

      expect(typeof unsub).toBe('function');

      unsub();
      expect(mockSocketInstance.off).toHaveBeenCalledWith('reconnectFailed', callback);
    });
  });

  describe('TC-0201-04：emitPlayerRefreshing 函數', () => {
    test('TC-0201-04a：socket 已連線時應發送 playerRefreshing 事件', () => {
      mockSocketInstance.connected = true;
      socketService.emitPlayerRefreshing('game1', 'player1');

      expect(mockSocketInstance.emit).toHaveBeenCalledWith('playerRefreshing', {
        gameId: 'game1',
        playerId: 'player1',
      });
    });

    test('TC-0201-04b：socket 未連線時不應發送事件', () => {
      mockSocketInstance.connected = false;
      socketService.emitPlayerRefreshing('game1', 'player1');

      expect(mockSocketInstance.emit).not.toHaveBeenCalledWith(
        'playerRefreshing',
        expect.anything()
      );
    });
  });

  describe('TC-0201-05：onConnectionChange 函數', () => {
    test('TC-0201-05a：應立即通知目前連線狀態', () => {
      socketService.initSocket();
      const callback = jest.fn();
      socketService.onConnectionChange(callback);

      // socket.connected 為 true，應立即收到 true
      expect(callback).toHaveBeenCalledWith(true);
    });

    test('TC-0201-05b：connect 事件觸發時 callback 應收到 true', () => {
      socketService.initSocket();
      const callback = jest.fn();
      socketService.onConnectionChange(callback);
      callback.mockClear();

      // 找到並觸發 connect handler
      const connectCall = mockSocketInstance.on.mock.calls.find(call => call[0] === 'connect');
      const connectHandler = connectCall[1];
      connectHandler();

      expect(callback).toHaveBeenCalledWith(true);
    });

    test('TC-0201-05c：disconnect 事件觸發時 callback 應收到 false', () => {
      socketService.initSocket();
      const callback = jest.fn();
      socketService.onConnectionChange(callback);
      callback.mockClear();

      // 找到並觸發 disconnect handler
      const disconnectCall = mockSocketInstance.on.mock.calls.find(call => call[0] === 'disconnect');
      const disconnectHandler = disconnectCall[1];
      disconnectHandler('transport close');

      expect(callback).toHaveBeenCalledWith(false);
    });

    test('TC-0201-05d：unsubscribe 後不再收到連線狀態通知', () => {
      socketService.initSocket();
      const callback = jest.fn();
      const unsub = socketService.onConnectionChange(callback);
      callback.mockClear();

      unsub();

      // 觸發 connect 事件
      const connectCall = mockSocketInstance.on.mock.calls.find(call => call[0] === 'connect');
      connectCall[1]();

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('TC-0201-06：Socket.io 自動重連事件處理', () => {
    test('TC-0201-06a：getCurrentRoom 有資料時應自動發送重連', () => {
      mockGetCurrentRoom.mockReturnValue({
        roomId: 'room1',
        playerId: 'player1',
        playerName: '玩家A',
      });

      socketService.initSocket();

      // 找到 reconnect handler 並觸發
      const reconnectCall = mockSocketInstance.on.mock.calls.find(call => call[0] === 'connect');
      const reconnectHandler = reconnectCall[1];
      reconnectHandler(1);

      expect(mockSocketInstance.emit).toHaveBeenCalledWith('reconnect', {
        roomId: 'room1',
        playerId: 'player1',
        playerName: '玩家A',
      });
    });

    test('TC-0201-06b：localStorage 無資料時不應自動發送重連', () => {
      mockGetCurrentRoom.mockReturnValue(null);
      localStorage.clear();

      socketService.initSocket();

      const reconnectCall = mockSocketInstance.on.mock.calls.find(call => call[0] === 'connect');
      const reconnectHandler = reconnectCall[1];
      reconnectHandler(1);

      expect(mockSocketInstance.emit).not.toHaveBeenCalledWith('reconnect', expect.any(Object));
    });

    test('TC-0201-06c：應支援 legacy key fallback', () => {
      mockGetCurrentRoom.mockReturnValue(null);
      localStorage.setItem('lastRoomId', 'room1');
      localStorage.setItem('lastPlayerId', 'player1');
      localStorage.setItem('lastPlayerName', '玩家A');

      socketService.initSocket();

      const reconnectCall = mockSocketInstance.on.mock.calls.find(call => call[0] === 'connect');
      const reconnectHandler = reconnectCall[1];
      reconnectHandler(1);

      expect(mockSocketInstance.emit).toHaveBeenCalledWith('reconnect', {
        roomId: 'room1',
        playerId: 'player1',
        playerName: '玩家A',
      });
    });
  });
});
