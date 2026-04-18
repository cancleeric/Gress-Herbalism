/**
 * spectatorLogic 單元測試
 * 工單 0062 - 觀戰模式
 */

'use strict';

const {
  MAX_SPECTATORS,
  isGameSpectatable,
  joinSpectator,
  leaveSpectator,
  findSpectatorBySocket,
  getSpectatorCount,
  buildSpectatorGameState,
  cleanupSpectatorRoom
} = require('../../logic/herbalism/spectatorLogic');

// ==================== 輔助函數 ====================

function makeGameState(phase = 'playing') {
  return {
    gameId: 'game_test_001',
    gamePhase: phase,
    currentPlayerIndex: 0,
    currentRound: 1,
    winner: null,
    players: [
      { id: 'p1', name: '玩家A', score: 3, isActive: true, isCurrentTurn: true, isHost: true, hand: [{ id: 'c1', color: 'red' }] },
      { id: 'p2', name: '玩家B', score: 1, isActive: true, isCurrentTurn: false, isHost: false, hand: [{ id: 'c2', color: 'blue' }, { id: 'c3', color: 'green' }] }
    ],
    hiddenCards: [{ id: 'h1', color: 'yellow' }, { id: 'h2', color: 'green' }],
    gameHistory: [{ description: '玩家A 問牌：green' }],
    roundHistory: [],
    scores: { p1: 3, p2: 1 }
  };
}

// ==================== MAX_SPECTATORS ====================

describe('MAX_SPECTATORS', () => {
  test('應為 10', () => {
    expect(MAX_SPECTATORS).toBe(10);
  });
});

// ==================== isGameSpectatable ====================

describe('isGameSpectatable', () => {
  test('waiting 階段不可觀戰', () => {
    expect(isGameSpectatable(makeGameState('waiting'))).toBe(false);
  });

  test('finished 階段不可觀戰', () => {
    expect(isGameSpectatable(makeGameState('finished'))).toBe(false);
  });

  test('playing 階段可觀戰', () => {
    expect(isGameSpectatable(makeGameState('playing'))).toBe(true);
  });

  test('roundEnd 階段可觀戰', () => {
    expect(isGameSpectatable(makeGameState('roundEnd'))).toBe(true);
  });

  test('followGuessing 階段可觀戰', () => {
    expect(isGameSpectatable(makeGameState('followGuessing'))).toBe(true);
  });

  test('postQuestion 階段可觀戰', () => {
    expect(isGameSpectatable(makeGameState('postQuestion'))).toBe(true);
  });

  test('null 不可觀戰', () => {
    expect(isGameSpectatable(null)).toBe(false);
  });

  test('undefined 不可觀戰', () => {
    expect(isGameSpectatable(undefined)).toBe(false);
  });
});

// ==================== joinSpectator ====================

describe('joinSpectator', () => {
  test('成功加入觀戰', () => {
    const spectatorRooms = new Map();
    const result = joinSpectator(spectatorRooms, 'game1', { id: 'spec1', name: '觀戰者A', socketId: 'sock1' });
    expect(result.success).toBe(true);
    expect(result.spectatorId).toBe('spec1');
    expect(spectatorRooms.has('game1')).toBe(true);
    expect(spectatorRooms.get('game1').size).toBe(1);
  });

  test('若未提供 id 則自動產生', () => {
    const spectatorRooms = new Map();
    const result = joinSpectator(spectatorRooms, 'game1', { name: '觀戰者B', socketId: 'sock2' });
    expect(result.success).toBe(true);
    expect(typeof result.spectatorId).toBe('string');
    expect(result.spectatorId.startsWith('spectator_')).toBe(true);
  });

  test('觀戰人數達到上限時拒絕加入', () => {
    const spectatorRooms = new Map();
    const room = new Map();
    for (let i = 0; i < MAX_SPECTATORS; i++) {
      room.set(`spec${i}`, { id: `spec${i}`, name: `觀戰者${i}`, socketId: `sock${i}`, joinedAt: '' });
    }
    spectatorRooms.set('game1', room);

    const result = joinSpectator(spectatorRooms, 'game1', { id: 'extra', name: '超額', socketId: 'sockExtra' });
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  test('多人加入同一遊戲', () => {
    const spectatorRooms = new Map();
    joinSpectator(spectatorRooms, 'game1', { id: 'spec1', name: 'A', socketId: 's1' });
    joinSpectator(spectatorRooms, 'game1', { id: 'spec2', name: 'B', socketId: 's2' });
    expect(spectatorRooms.get('game1').size).toBe(2);
  });

  test('不同遊戲各自維護觀戰室', () => {
    const spectatorRooms = new Map();
    joinSpectator(spectatorRooms, 'gameA', { id: 'spec1', name: 'A', socketId: 's1' });
    joinSpectator(spectatorRooms, 'gameB', { id: 'spec2', name: 'B', socketId: 's2' });
    expect(spectatorRooms.get('gameA').size).toBe(1);
    expect(spectatorRooms.get('gameB').size).toBe(1);
  });
});

// ==================== leaveSpectator ====================

describe('leaveSpectator', () => {
  test('成功離開', () => {
    const spectatorRooms = new Map();
    joinSpectator(spectatorRooms, 'game1', { id: 'spec1', name: 'A', socketId: 's1' });
    const removed = leaveSpectator(spectatorRooms, 'game1', 'spec1');
    expect(removed).toBe(true);
    expect(spectatorRooms.has('game1')).toBe(false); // 空室應刪除
  });

  test('最後一人離開後刪除觀戰室', () => {
    const spectatorRooms = new Map();
    joinSpectator(spectatorRooms, 'game1', { id: 'spec1', name: 'A', socketId: 's1' });
    joinSpectator(spectatorRooms, 'game1', { id: 'spec2', name: 'B', socketId: 's2' });
    leaveSpectator(spectatorRooms, 'game1', 'spec1');
    expect(spectatorRooms.has('game1')).toBe(true); // 還有一人
    leaveSpectator(spectatorRooms, 'game1', 'spec2');
    expect(spectatorRooms.has('game1')).toBe(false); // 空室刪除
  });

  test('不存在的遊戲返回 false', () => {
    const spectatorRooms = new Map();
    expect(leaveSpectator(spectatorRooms, 'nonexistent', 'spec1')).toBe(false);
  });

  test('不存在的觀戰者返回 false', () => {
    const spectatorRooms = new Map();
    joinSpectator(spectatorRooms, 'game1', { id: 'spec1', name: 'A', socketId: 's1' });
    expect(leaveSpectator(spectatorRooms, 'game1', 'nonexistent')).toBe(false);
  });
});

// ==================== findSpectatorBySocket ====================

describe('findSpectatorBySocket', () => {
  test('找到觀戰者', () => {
    const spectatorRooms = new Map();
    joinSpectator(spectatorRooms, 'game1', { id: 'spec1', name: 'A', socketId: 'sock1' });
    const result = findSpectatorBySocket(spectatorRooms, 'sock1');
    expect(result.gameId).toBe('game1');
    expect(result.spectatorId).toBe('spec1');
  });

  test('找不到時返回 null', () => {
    const spectatorRooms = new Map();
    const result = findSpectatorBySocket(spectatorRooms, 'nonexistent');
    expect(result.gameId).toBeNull();
    expect(result.spectatorId).toBeNull();
  });
});

// ==================== getSpectatorCount ====================

describe('getSpectatorCount', () => {
  test('無觀戰者返回 0', () => {
    expect(getSpectatorCount(new Map(), 'game1')).toBe(0);
  });

  test('正確計算觀戰人數', () => {
    const spectatorRooms = new Map();
    joinSpectator(spectatorRooms, 'game1', { id: 's1', name: 'A', socketId: 'sock1' });
    joinSpectator(spectatorRooms, 'game1', { id: 's2', name: 'B', socketId: 'sock2' });
    expect(getSpectatorCount(spectatorRooms, 'game1')).toBe(2);
  });
});

// ==================== buildSpectatorGameState ====================

describe('buildSpectatorGameState', () => {
  test('null 輸入返回 null', () => {
    expect(buildSpectatorGameState(null)).toBeNull();
  });

  test('不包含手牌顏色', () => {
    const snapshot = buildSpectatorGameState(makeGameState());
    snapshot.players.forEach(p => {
      expect(p.hand).toBeUndefined();
    });
  });

  test('包含 handCount', () => {
    const snapshot = buildSpectatorGameState(makeGameState());
    expect(snapshot.players[0].handCount).toBe(1);
    expect(snapshot.players[1].handCount).toBe(2);
  });

  test('不暴露蓋牌顏色', () => {
    const snapshot = buildSpectatorGameState(makeGameState());
    expect(snapshot.hiddenCards).toBeUndefined();
    expect(snapshot.hiddenCardCount).toBe(2);
  });

  test('包含遊戲階段和輪次', () => {
    const snapshot = buildSpectatorGameState(makeGameState('playing'));
    expect(snapshot.gamePhase).toBe('playing');
    expect(snapshot.currentRound).toBe(1);
  });

  test('包含得分', () => {
    const snapshot = buildSpectatorGameState(makeGameState());
    expect(snapshot.scores).toEqual({ p1: 3, p2: 1 });
  });

  test('包含遊戲歷史', () => {
    const snapshot = buildSpectatorGameState(makeGameState());
    expect(snapshot.gameHistory).toHaveLength(1);
  });

  test('空 players 陣列時不崩潰', () => {
    const gs = makeGameState();
    gs.players = [];
    const snapshot = buildSpectatorGameState(gs);
    expect(snapshot.players).toEqual([]);
  });
});

// ==================== cleanupSpectatorRoom ====================

describe('cleanupSpectatorRoom', () => {
  test('清理後觀戰室不存在', () => {
    const spectatorRooms = new Map();
    joinSpectator(spectatorRooms, 'game1', { id: 's1', name: 'A', socketId: 'sock1' });
    cleanupSpectatorRoom(spectatorRooms, 'game1');
    expect(spectatorRooms.has('game1')).toBe(false);
  });

  test('清理不存在的遊戲不會報錯', () => {
    const spectatorRooms = new Map();
    expect(() => cleanupSpectatorRoom(spectatorRooms, 'nonexistent')).not.toThrow();
  });
});
