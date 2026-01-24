/**
 * Socket 服務測試
 */

// 創建一個完整的 mock socket
const createMockSocket = () => ({
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
  disconnect: jest.fn(),
  connected: true,
});

let mockSocketInstance = createMockSocket();

// Mock socket.io-client
jest.mock('socket.io-client', () => ({
  io: jest.fn(() => mockSocketInstance),
}));

// Mock config
jest.mock('../config', () => ({
  __esModule: true,
  default: {
    socketUrl: 'http://localhost:3001',
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
      },
    }));

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
});
