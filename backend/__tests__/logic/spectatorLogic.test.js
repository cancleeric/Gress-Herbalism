/**
 * spectatorLogic 單元測試
 * 工單 0062：觀戰模式
 */

const {
  MAX_SPECTATORS,
  canJoinAsSpectator,
  createSpectatorData,
  getSpectatorCount,
  getSpectatorList,
  buildPublicGameState
} = require('../../logic/herbalism/spectatorLogic');

describe('spectatorLogic', () => {
  // 幫助函數：建立模擬遊戲狀態
  function makeGameState(gamePhase = 'playing', players = []) {
    return {
      gameId: 'test_game',
      gamePhase,
      players,
      currentPlayerIndex: 0,
      currentRound: 1,
      scores: {},
      winningScore: 7,
      winner: null,
      gameHistory: [],
      maxPlayers: 4
    };
  }

  // 幫助函數：建立模擬觀戰者 Map
  function makeSpectatorRoom(count = 0) {
    const room = new Map();
    for (let i = 0; i < count; i++) {
      room.set(`spec_${i}`, { id: `spec_${i}`, name: `觀眾${i}`, socketId: `socket_${i}`, joinedAt: Date.now() });
    }
    return room;
  }

  describe('MAX_SPECTATORS', () => {
    test('觀戰人數上限應為 10', () => {
      expect(MAX_SPECTATORS).toBe(10);
    });
  });

  describe('canJoinAsSpectator', () => {
    test('遊戲進行中可加入觀戰', () => {
      const gameState = makeGameState('playing');
      const spectatorRoom = makeSpectatorRoom(0);
      const result = canJoinAsSpectator(gameState, spectatorRoom, 'new_spectator');
      expect(result.canJoin).toBe(true);
    });

    test('遊戲不存在時不可觀戰', () => {
      const result = canJoinAsSpectator(null, new Map(), 'spec');
      expect(result.canJoin).toBe(false);
      expect(result.reason).toBeTruthy();
    });

    test('等待中的遊戲不可觀戰', () => {
      const gameState = makeGameState('waiting');
      const result = canJoinAsSpectator(gameState, new Map(), 'spec');
      expect(result.canJoin).toBe(false);
    });

    test('已結束的遊戲不可觀戰', () => {
      const gameState = makeGameState('finished');
      const result = canJoinAsSpectator(gameState, new Map(), 'spec');
      expect(result.canJoin).toBe(false);
    });

    test('已是玩家者不可觀戰', () => {
      const players = [{ id: 'player1', name: '玩家' }];
      const gameState = makeGameState('playing', players);
      const result = canJoinAsSpectator(gameState, new Map(), 'player1');
      expect(result.canJoin).toBe(false);
    });

    test('觀戰人數達上限時不可觀戰', () => {
      const gameState = makeGameState('playing');
      const spectatorRoom = makeSpectatorRoom(MAX_SPECTATORS);
      const result = canJoinAsSpectator(gameState, spectatorRoom, 'new_spectator');
      expect(result.canJoin).toBe(false);
      expect(result.reason).toContain(`${MAX_SPECTATORS}`);
    });

    test('觀戰人數未達上限可加入', () => {
      const gameState = makeGameState('playing');
      const spectatorRoom = makeSpectatorRoom(MAX_SPECTATORS - 1);
      const result = canJoinAsSpectator(gameState, spectatorRoom, 'new_spectator');
      expect(result.canJoin).toBe(true);
    });

    test('問牌後階段也可觀戰', () => {
      const gameState = makeGameState('postQuestion');
      const result = canJoinAsSpectator(gameState, new Map(), 'spec');
      expect(result.canJoin).toBe(true);
    });

    test('局結束階段也可觀戰', () => {
      const gameState = makeGameState('roundEnd');
      const result = canJoinAsSpectator(gameState, new Map(), 'spec');
      expect(result.canJoin).toBe(true);
    });
  });

  describe('createSpectatorData', () => {
    test('應建立含有必要欄位的觀戰者資料', () => {
      const data = createSpectatorData('spec1', '觀眾1', 'socket123');
      expect(data.id).toBe('spec1');
      expect(data.name).toBe('觀眾1');
      expect(data.socketId).toBe('socket123');
      expect(typeof data.joinedAt).toBe('number');
    });
  });

  describe('getSpectatorCount', () => {
    test('空 Map 應回傳 0', () => {
      expect(getSpectatorCount(new Map())).toBe(0);
    });

    test('null 應回傳 0', () => {
      expect(getSpectatorCount(null)).toBe(0);
    });

    test('應回傳正確人數', () => {
      const room = makeSpectatorRoom(3);
      expect(getSpectatorCount(room)).toBe(3);
    });
  });

  describe('getSpectatorList', () => {
    test('null 應回傳空陣列', () => {
      expect(getSpectatorList(null)).toEqual([]);
    });

    test('應回傳不含 socketId 的觀戰者列表', () => {
      const room = makeSpectatorRoom(2);
      const list = getSpectatorList(room);
      expect(list).toHaveLength(2);
      list.forEach(item => {
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('name');
        expect(item).toHaveProperty('joinedAt');
        expect(item).not.toHaveProperty('socketId');
      });
    });
  });

  describe('buildPublicGameState', () => {
    test('null 應回傳 null', () => {
      expect(buildPublicGameState(null)).toBeNull();
    });

    test('應隱藏玩家手牌，僅顯示手牌數量', () => {
      const gameState = makeGameState('playing', [
        { id: 'p1', name: '玩家1', hand: [{ id: 'c1', color: 'red' }, { id: 'c2', color: 'blue' }], score: 3, isActive: true, isCurrentTurn: true, isHost: false, isDisconnected: false }
      ]);
      gameState.scores = { p1: 3 };

      const publicState = buildPublicGameState(gameState);
      expect(publicState).toBeDefined();
      expect(publicState.players[0].handCount).toBe(2);
      expect(publicState.players[0]).not.toHaveProperty('hand');
    });

    test('應包含正確的遊戲資訊', () => {
      const gameState = makeGameState('playing');
      gameState.scores = {};
      const publicState = buildPublicGameState(gameState);
      expect(publicState.gameId).toBe('test_game');
      expect(publicState.gamePhase).toBe('playing');
      expect(publicState.currentPlayerIndex).toBe(0);
      expect(publicState.currentRound).toBe(1);
      expect(publicState.winningScore).toBe(7);
    });

    test('觀戰者不應看到蓋牌', () => {
      const gameState = makeGameState('playing');
      gameState.hiddenCards = [{ id: 'hc1', color: 'red' }];
      const publicState = buildPublicGameState(gameState);
      expect(publicState).not.toHaveProperty('hiddenCards');
    });
  });
});
