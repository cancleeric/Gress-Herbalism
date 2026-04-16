/**
 * 觀戰邏輯單元測試 - Issue #62
 */

const {
  MAX_SPECTATORS,
  joinSpectator,
  leaveSpectator,
  removeSpectatorBySocketId,
  getSpectators,
  getSpectatorCount,
  buildSpectatorSnapshot
} = require('../logic/herbalism/spectatorLogic');

// 輔助函數：建立遊戲房間 Map
function makeGameRooms(phase = 'playing') {
  const gameRooms = new Map();
  gameRooms.set('game_1', {
    gameId: 'game_1',
    gamePhase: phase,
    players: [
      { id: 'p1', name: '玩家一', hand: [{ id: 'c1', color: 'red' }] },
      { id: 'p2', name: '玩家二', hand: [{ id: 'c2', color: 'blue' }] }
    ],
    hiddenCards: [{ id: 'h1', color: 'green' }, { id: 'h2', color: 'yellow' }],
    currentPlayerIndex: 0
  });
  return gameRooms;
}

function makeSpectatorRooms() {
  return new Map();
}

describe('spectatorLogic', () => {
  describe('MAX_SPECTATORS', () => {
    test('上限應為 10', () => {
      expect(MAX_SPECTATORS).toBe(10);
    });
  });

  describe('joinSpectator', () => {
    test('成功加入進行中的遊戲', () => {
      const spectatorRooms = makeSpectatorRooms();
      const gameRooms = makeGameRooms('playing');
      const result = joinSpectator(spectatorRooms, gameRooms, 'game_1', {
        id: 'spec1',
        name: '觀戰者A',
        socketId: 'sock1'
      });
      expect(result.success).toBe(true);
      expect(result.spectatorCount).toBe(1);
    });

    test('遊戲不存在時回傳失敗', () => {
      const spectatorRooms = makeSpectatorRooms();
      const gameRooms = makeGameRooms();
      const result = joinSpectator(spectatorRooms, gameRooms, 'nonexistent', {
        id: 'spec1',
        name: '觀戰者A',
        socketId: 'sock1'
      });
      expect(result.success).toBe(false);
      expect(result.message).toMatch('遊戲不存在');
    });

    test('等待中的遊戲不可觀戰', () => {
      const spectatorRooms = makeSpectatorRooms();
      const gameRooms = makeGameRooms('waiting');
      const result = joinSpectator(spectatorRooms, gameRooms, 'game_1', {
        id: 'spec1',
        name: '觀戰者A',
        socketId: 'sock1'
      });
      expect(result.success).toBe(false);
    });

    test('已結束的遊戲不可觀戰', () => {
      const spectatorRooms = makeSpectatorRooms();
      const gameRooms = makeGameRooms('finished');
      const result = joinSpectator(spectatorRooms, gameRooms, 'game_1', {
        id: 'spec1',
        name: '觀戰者A',
        socketId: 'sock1'
      });
      expect(result.success).toBe(false);
    });

    test('超過人數上限時回傳失敗', () => {
      const spectatorRooms = makeSpectatorRooms();
      const gameRooms = makeGameRooms('playing');

      // 填滿 10 個觀戰者
      for (let i = 0; i < MAX_SPECTATORS; i++) {
        joinSpectator(spectatorRooms, gameRooms, 'game_1', {
          id: `spec${i}`,
          name: `觀戰者${i}`,
          socketId: `sock${i}`
        });
      }

      const result = joinSpectator(spectatorRooms, gameRooms, 'game_1', {
        id: 'specExtra',
        name: '第11位',
        socketId: 'sockExtra'
      });
      expect(result.success).toBe(false);
      expect(result.message).toContain('上限');
    });

    test('同一觀戰者重複加入時更新 socketId', () => {
      const spectatorRooms = makeSpectatorRooms();
      const gameRooms = makeGameRooms('playing');

      joinSpectator(spectatorRooms, gameRooms, 'game_1', {
        id: 'spec1',
        name: '觀戰者A',
        socketId: 'oldSock'
      });

      const result = joinSpectator(spectatorRooms, gameRooms, 'game_1', {
        id: 'spec1',
        name: '觀戰者A',
        socketId: 'newSock'
      });

      expect(result.success).toBe(true);
      expect(result.spectatorCount).toBe(1); // 人數不增加
    });
  });

  describe('leaveSpectator', () => {
    test('成功離開觀戰', () => {
      const spectatorRooms = makeSpectatorRooms();
      const gameRooms = makeGameRooms('playing');

      joinSpectator(spectatorRooms, gameRooms, 'game_1', {
        id: 'spec1',
        name: '觀戰者A',
        socketId: 'sock1'
      });

      const result = leaveSpectator(spectatorRooms, 'game_1', 'spec1');
      expect(result.success).toBe(true);
      expect(result.spectatorCount).toBe(0);
    });

    test('最後一位觀戰者離開後清空 Map entry', () => {
      const spectatorRooms = makeSpectatorRooms();
      const gameRooms = makeGameRooms('playing');

      joinSpectator(spectatorRooms, gameRooms, 'game_1', {
        id: 'spec1',
        name: '觀戰者A',
        socketId: 'sock1'
      });

      leaveSpectator(spectatorRooms, 'game_1', 'spec1');
      expect(spectatorRooms.has('game_1')).toBe(false);
    });

    test('房間不存在時回傳 success:false', () => {
      const spectatorRooms = makeSpectatorRooms();
      const result = leaveSpectator(spectatorRooms, 'nonexistent', 'spec1');
      expect(result.success).toBe(false);
    });
  });

  describe('removeSpectatorBySocketId', () => {
    test('根據 socketId 移除觀戰者', () => {
      const spectatorRooms = makeSpectatorRooms();
      const gameRooms = makeGameRooms('playing');

      joinSpectator(spectatorRooms, gameRooms, 'game_1', {
        id: 'spec1',
        name: '觀戰者A',
        socketId: 'sock1'
      });

      const removed = removeSpectatorBySocketId(spectatorRooms, 'sock1');
      expect(removed.length).toBe(1);
      expect(removed[0].gameId).toBe('game_1');
      expect(removed[0].spectatorId).toBe('spec1');
    });

    test('socketId 不存在時回傳空陣列', () => {
      const spectatorRooms = makeSpectatorRooms();
      const removed = removeSpectatorBySocketId(spectatorRooms, 'nonexistent');
      expect(removed).toEqual([]);
    });
  });

  describe('getSpectators', () => {
    test('返回觀戰者列表', () => {
      const spectatorRooms = makeSpectatorRooms();
      const gameRooms = makeGameRooms('playing');

      joinSpectator(spectatorRooms, gameRooms, 'game_1', {
        id: 'spec1',
        name: '觀戰者A',
        socketId: 'sock1'
      });

      const spectators = getSpectators(spectatorRooms, 'game_1');
      expect(spectators).toHaveLength(1);
      expect(spectators[0].id).toBe('spec1');
      expect(spectators[0].name).toBe('觀戰者A');
    });

    test('無觀戰者時返回空陣列', () => {
      const spectatorRooms = makeSpectatorRooms();
      expect(getSpectators(spectatorRooms, 'game_1')).toEqual([]);
    });
  });

  describe('getSpectatorCount', () => {
    test('返回正確人數', () => {
      const spectatorRooms = makeSpectatorRooms();
      const gameRooms = makeGameRooms('playing');

      expect(getSpectatorCount(spectatorRooms, 'game_1')).toBe(0);

      joinSpectator(spectatorRooms, gameRooms, 'game_1', {
        id: 'spec1', name: 'A', socketId: 's1'
      });
      joinSpectator(spectatorRooms, gameRooms, 'game_1', {
        id: 'spec2', name: 'B', socketId: 's2'
      });

      expect(getSpectatorCount(spectatorRooms, 'game_1')).toBe(2);
    });
  });

  describe('buildSpectatorSnapshot', () => {
    test('快照包含 isSpectatorView 標記', () => {
      const gameState = {
        gameId: 'game_1',
        gamePhase: 'playing',
        players: [{ id: 'p1', hand: [] }]
      };
      const spectators = [{ id: 'spec1', name: 'A' }];
      const snapshot = buildSpectatorSnapshot(gameState, spectators);

      expect(snapshot.isSpectatorView).toBe(true);
      expect(snapshot.spectators).toEqual(spectators);
      expect(snapshot.gameId).toBe('game_1');
    });
  });
});
