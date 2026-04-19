/**
 * spectatorLogic 單元測試
 * 工單 0062 - 觀戰模式
 */

const {
  MAX_SPECTATORS,
  buildSpectatorGameState,
  shouldRevealHiddenCards,
  maskPlayerHands,
  maskHistoryEntry,
  createSpectator,
  getSpectatorCount,
  canJoinAsSpectator,
} = require('../../logic/herbalism/spectatorLogic');

// 建立測試用遊戲狀態
function makeGameState(overrides = {}) {
  return {
    gameId: 'game_test_123',
    gamePhase: 'playing',
    currentPlayerIndex: 0,
    currentRound: 1,
    scores: { player1: 3, player2: 0 },
    winningScore: 7,
    maxPlayers: 4,
    isPrivate: false,
    players: [
      {
        id: 'player1',
        name: '玩家一',
        score: 3,
        isActive: true,
        isCurrentTurn: true,
        isHost: true,
        isDisconnected: false,
        hand: [{ color: 'red' }, { color: 'blue' }],
      },
      {
        id: 'player2',
        name: '玩家二',
        score: 0,
        isActive: true,
        isCurrentTurn: false,
        isHost: false,
        isDisconnected: false,
        hand: [{ color: 'green' }, { color: 'yellow' }, { color: 'green' }],
      },
    ],
    hiddenCards: [{ color: 'red' }, { color: 'blue' }],
    gameHistory: [
      { playerId: 'player1', action: 'question', hand: [{ color: 'red' }] },
    ],
    predictions: [{ playerId: 'player2', prediction: 'red,blue' }],
    winner: null,
    roundHistory: [],
    ...overrides,
  };
}

// ==================== MAX_SPECTATORS ====================

describe('MAX_SPECTATORS', () => {
  test('應為 10', () => {
    expect(MAX_SPECTATORS).toBe(10);
  });
});

// ==================== shouldRevealHiddenCards ====================

describe('shouldRevealHiddenCards', () => {
  test('roundEnd 時應揭示蓋牌', () => {
    expect(shouldRevealHiddenCards('roundEnd')).toBe(true);
  });

  test('finished 時應揭示蓋牌', () => {
    expect(shouldRevealHiddenCards('finished')).toBe(true);
  });

  test('playing 時不應揭示蓋牌', () => {
    expect(shouldRevealHiddenCards('playing')).toBe(false);
  });

  test('waiting 時不應揭示蓋牌', () => {
    expect(shouldRevealHiddenCards('waiting')).toBe(false);
  });

  test('followGuessing 時不應揭示蓋牌', () => {
    expect(shouldRevealHiddenCards('followGuessing')).toBe(false);
  });
});

// ==================== maskPlayerHands ====================

describe('maskPlayerHands', () => {
  test('應移除手牌顏色，保留張數', () => {
    const players = [
      {
        id: 'p1',
        name: '玩家一',
        score: 3,
        isActive: true,
        isCurrentTurn: true,
        isHost: true,
        hand: [{ color: 'red' }, { color: 'blue' }],
      },
    ];
    const result = maskPlayerHands(players);
    expect(result[0].handCount).toBe(2);
    expect(result[0].hand).toBeUndefined();
    expect(result[0].score).toBe(3);
  });

  test('應保留所有公開欄位', () => {
    const players = [
      {
        id: 'p1',
        name: '玩家一',
        score: 3,
        isActive: true,
        isCurrentTurn: true,
        isHost: true,
        isDisconnected: false,
        hand: [],
      },
    ];
    const result = maskPlayerHands(players);
    expect(result[0]).toMatchObject({
      id: 'p1',
      name: '玩家一',
      score: 3,
      isActive: true,
      isCurrentTurn: true,
      isHost: true,
      isDisconnected: false,
      handCount: 0,
    });
  });

  test('非陣列輸入應回傳空陣列', () => {
    expect(maskPlayerHands(null)).toEqual([]);
    expect(maskPlayerHands(undefined)).toEqual([]);
  });
});

// ==================== maskHistoryEntry ====================

describe('maskHistoryEntry', () => {
  test('應移除手牌欄位', () => {
    const entry = { playerId: 'p1', action: 'question', hand: [{ color: 'red' }] };
    const result = maskHistoryEntry(entry);
    expect(result.hand).toBeUndefined();
    expect(result.playerId).toBe('p1');
    expect(result.action).toBe('question');
  });

  test('null 輸入應回傳 null', () => {
    expect(maskHistoryEntry(null)).toBeNull();
  });
});

// ==================== buildSpectatorGameState ====================

describe('buildSpectatorGameState', () => {
  test('null 輸入應回傳 null', () => {
    expect(buildSpectatorGameState(null)).toBeNull();
  });

  test('進行中遊戲應隱藏蓋牌顏色', () => {
    const state = makeGameState({ gamePhase: 'playing' });
    const result = buildSpectatorGameState(state);
    expect(result.hiddenCards).toEqual([{ color: null }, { color: null }]);
  });

  test('roundEnd 時應揭示蓋牌', () => {
    const state = makeGameState({ gamePhase: 'roundEnd' });
    const result = buildSpectatorGameState(state);
    expect(result.hiddenCards[0].color).toBe('red');
    expect(result.hiddenCards[1].color).toBe('blue');
  });

  test('finished 時應揭示蓋牌', () => {
    const state = makeGameState({ gamePhase: 'finished' });
    const result = buildSpectatorGameState(state);
    expect(result.hiddenCards[0].color).toBe('red');
  });

  test('應隱藏玩家手牌', () => {
    const state = makeGameState();
    const result = buildSpectatorGameState(state);
    result.players.forEach(p => {
      expect(p.hand).toBeUndefined();
      expect(typeof p.handCount).toBe('number');
    });
  });

  test('應包含正確的公開資訊', () => {
    const state = makeGameState();
    const result = buildSpectatorGameState(state);
    expect(result.gameId).toBe('game_test_123');
    expect(result.gamePhase).toBe('playing');
    expect(result.scores).toEqual({ player1: 3, player2: 0 });
    expect(result.currentRound).toBe(1);
  });

  test('應遮蔽歷史紀錄中的手牌', () => {
    const state = makeGameState();
    const result = buildSpectatorGameState(state);
    result.gameHistory.forEach(entry => {
      expect(entry.hand).toBeUndefined();
    });
  });

  test('空蓋牌陣列不應出錯', () => {
    const state = makeGameState({ hiddenCards: [] });
    const result = buildSpectatorGameState(state);
    expect(result.hiddenCards).toEqual([]);
  });

  test('缺少 gameHistory 應給空陣列', () => {
    const state = makeGameState({ gameHistory: undefined });
    const result = buildSpectatorGameState(state);
    expect(result.gameHistory).toEqual([]);
  });
});

// ==================== createSpectator ====================

describe('createSpectator', () => {
  test('應建立包含正確欄位的觀戰者物件', () => {
    const spectator = createSpectator('spec1', '觀戰者甲', 'socket123');
    expect(spectator.id).toBe('spec1');
    expect(spectator.name).toBe('觀戰者甲');
    expect(spectator.socketId).toBe('socket123');
    expect(typeof spectator.joinedAt).toBe('number');
  });
});

// ==================== getSpectatorCount / canJoinAsSpectator ====================

describe('getSpectatorCount', () => {
  test('空房間應回傳 0', () => {
    const rooms = new Map();
    expect(getSpectatorCount(rooms, 'game1')).toBe(0);
  });

  test('應回傳正確的觀戰者數量', () => {
    const rooms = new Map();
    const inner = new Map();
    inner.set('s1', createSpectator('s1', 'A', 'sock1'));
    inner.set('s2', createSpectator('s2', 'B', 'sock2'));
    rooms.set('game1', inner);
    expect(getSpectatorCount(rooms, 'game1')).toBe(2);
  });
});

describe('canJoinAsSpectator', () => {
  test('未達上限時可加入', () => {
    const rooms = new Map();
    expect(canJoinAsSpectator(rooms, 'game1')).toBe(true);
  });

  test('達到 MAX_SPECTATORS 時不可加入', () => {
    const rooms = new Map();
    const inner = new Map();
    for (let i = 0; i < MAX_SPECTATORS; i++) {
      inner.set(`s${i}`, createSpectator(`s${i}`, `觀戰者${i}`, `sock${i}`));
    }
    rooms.set('game1', inner);
    expect(canJoinAsSpectator(rooms, 'game1')).toBe(false);
  });

  test('剛好低於上限時可加入', () => {
    const rooms = new Map();
    const inner = new Map();
    for (let i = 0; i < MAX_SPECTATORS - 1; i++) {
      inner.set(`s${i}`, createSpectator(`s${i}`, `觀戰者${i}`, `sock${i}`));
    }
    rooms.set('game1', inner);
    expect(canJoinAsSpectator(rooms, 'game1')).toBe(true);
  });
});
