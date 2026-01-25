/**
 * 重連服務單元測試
 * 工單 0120 - 測試重連邏輯
 */

const {
  DISCONNECT_TIMEOUT,
  WAITING_PHASE_DISCONNECT_TIMEOUT,
  REFRESH_GRACE_PERIOD,
  calculateDisconnectTimeout,
  validateReconnection,
  handleDisconnectTimeout,
  processPlayerReconnect,
  allPlayersResponded,
  transferHost,
  isSessionExpired,
  generateRefreshKey,
  shouldSkipPlayer,
  getNextActivePlayerIndex
} = require('../../services/reconnectionService');

describe('reconnectionService', () => {
  describe('常數', () => {
    test('DISCONNECT_TIMEOUT 應為 60 秒', () => {
      expect(DISCONNECT_TIMEOUT).toBe(60000);
    });

    test('WAITING_PHASE_DISCONNECT_TIMEOUT 應為 15 秒', () => {
      expect(WAITING_PHASE_DISCONNECT_TIMEOUT).toBe(15000);
    });

    test('REFRESH_GRACE_PERIOD 應為 10 秒', () => {
      expect(REFRESH_GRACE_PERIOD).toBe(10000);
    });
  });

  describe('calculateDisconnectTimeout', () => {
    test('重整中應返回 REFRESH_GRACE_PERIOD', () => {
      expect(calculateDisconnectTimeout(false, true)).toBe(REFRESH_GRACE_PERIOD);
      expect(calculateDisconnectTimeout(true, true)).toBe(REFRESH_GRACE_PERIOD);
    });

    test('等待階段非重整應返回 WAITING_PHASE_DISCONNECT_TIMEOUT', () => {
      expect(calculateDisconnectTimeout(true, false)).toBe(WAITING_PHASE_DISCONNECT_TIMEOUT);
    });

    test('遊戲中非重整應返回 DISCONNECT_TIMEOUT', () => {
      expect(calculateDisconnectTimeout(false, false)).toBe(DISCONNECT_TIMEOUT);
    });
  });

  describe('validateReconnection', () => {
    test('gameState 為 null 時應返回 room_not_found', () => {
      const result = validateReconnection(null, 'player1');
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('room_not_found');
      expect(result.message).toBe('房間已不存在');
    });

    test('gameState 為 undefined 時應返回 room_not_found', () => {
      const result = validateReconnection(undefined, 'player1');
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('room_not_found');
    });

    test('玩家不在房間中應返回 player_not_found', () => {
      const gameState = {
        players: [
          { id: 'player2', name: '玩家B' }
        ]
      };
      const result = validateReconnection(gameState, 'player1');
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('player_not_found');
      expect(result.message).toBe('你已不在此房間中');
    });

    test('玩家在房間中應返回 valid 和 playerIndex', () => {
      const gameState = {
        players: [
          { id: 'player1', name: '玩家A' },
          { id: 'player2', name: '玩家B' }
        ]
      };
      const result = validateReconnection(gameState, 'player1');
      expect(result.valid).toBe(true);
      expect(result.playerIndex).toBe(0);
    });

    test('應返回正確的 playerIndex', () => {
      const gameState = {
        players: [
          { id: 'player1', name: '玩家A' },
          { id: 'player2', name: '玩家B' },
          { id: 'player3', name: '玩家C' }
        ]
      };
      expect(validateReconnection(gameState, 'player2').playerIndex).toBe(1);
      expect(validateReconnection(gameState, 'player3').playerIndex).toBe(2);
    });
  });

  describe('handleDisconnectTimeout', () => {
    test('等待階段應返回 remove 動作', () => {
      const gameState = {
        players: [
          { id: 'player1', name: '玩家A', isHost: true },
          { id: 'player2', name: '玩家B', isHost: false }
        ]
      };
      const result = handleDisconnectTimeout(gameState, 0, true, false);
      expect(result.action).toBe('remove');
      expect(result.removedPlayer.id).toBe('player1');
    });

    test('重整中應返回 remove 動作', () => {
      const gameState = {
        players: [
          { id: 'player1', name: '玩家A', isHost: false }
        ]
      };
      const result = handleDisconnectTimeout(gameState, 0, false, true);
      expect(result.action).toBe('remove');
    });

    test('遊戲中非重整應返回 deactivate 動作', () => {
      const gameState = {
        players: [
          { id: 'player1', name: '玩家A', isHost: false }
        ]
      };
      const result = handleDisconnectTimeout(gameState, 0, false, false);
      expect(result.action).toBe('deactivate');
    });

    test('移除房主時應設定 newHostIndex', () => {
      const gameState = {
        players: [
          { id: 'player1', name: '玩家A', isHost: true },
          { id: 'player2', name: '玩家B', isHost: false }
        ]
      };
      const result = handleDisconnectTimeout(gameState, 0, true, false);
      expect(result.action).toBe('remove');
      expect(result.newHostIndex).toBe(0);
    });

    test('移除非房主時不應設定 newHostIndex', () => {
      const gameState = {
        players: [
          { id: 'player1', name: '玩家A', isHost: true },
          { id: 'player2', name: '玩家B', isHost: false }
        ]
      };
      const result = handleDisconnectTimeout(gameState, 1, true, false);
      expect(result.action).toBe('remove');
      expect(result.newHostIndex).toBeUndefined();
    });

    test('只有一個玩家時移除房主不應設定 newHostIndex', () => {
      const gameState = {
        players: [
          { id: 'player1', name: '玩家A', isHost: true }
        ]
      };
      const result = handleDisconnectTimeout(gameState, 0, true, false);
      expect(result.action).toBe('remove');
      expect(result.newHostIndex).toBeUndefined();
    });
  });

  describe('processPlayerReconnect', () => {
    test('應清除斷線相關屬性', () => {
      const player = {
        id: 'player1',
        name: '玩家A',
        isDisconnected: true,
        disconnectedAt: Date.now(),
        isRefreshing: true,
        score: 5
      };

      const result = processPlayerReconnect(player);

      expect(result.isDisconnected).toBe(false);
      expect(result.disconnectedAt).toBeNull();
      expect(result.isRefreshing).toBeUndefined();
      expect(result.score).toBe(5); // 其他屬性應保留
      expect(result.id).toBe('player1');
    });

    test('應保留其他屬性', () => {
      const player = {
        id: 'player1',
        name: '玩家A',
        hand: ['card1', 'card2'],
        score: 3,
        isHost: true,
        isDisconnected: true
      };

      const result = processPlayerReconnect(player);

      expect(result.hand).toEqual(['card1', 'card2']);
      expect(result.score).toBe(3);
      expect(result.isHost).toBe(true);
    });
  });

  describe('allPlayersResponded', () => {
    test('followGuessState 為 null 時應返回 false', () => {
      expect(allPlayersResponded(null, 'player1')).toBe(false);
    });

    test('followGuessState 為 undefined 時應返回 false', () => {
      expect(allPlayersResponded(undefined, 'player1')).toBe(false);
    });

    test('沒有 responses 時應返回 false', () => {
      const followGuessState = {
        eligiblePlayers: ['player1', 'player2']
      };
      expect(allPlayersResponded(followGuessState, 'player1')).toBe(false);
    });

    test('所有玩家都已回應時應返回 true', () => {
      const followGuessState = {
        responses: new Map([
          ['player2', { isFollowing: true }],
          ['player3', { isFollowing: false }]
        ]),
        eligiblePlayers: ['player1', 'player2', 'player3']
      };
      expect(allPlayersResponded(followGuessState, 'player1')).toBe(true);
    });

    test('有玩家未回應時應返回 false', () => {
      const followGuessState = {
        responses: new Map([
          ['player2', { isFollowing: true }]
        ]),
        eligiblePlayers: ['player1', 'player2', 'player3']
      };
      expect(allPlayersResponded(followGuessState, 'player1')).toBe(false);
    });

    test('當前玩家不需要回應', () => {
      const followGuessState = {
        responses: new Map([
          ['player2', { isFollowing: true }]
        ]),
        eligiblePlayers: ['player1', 'player2']
      };
      // player1 是當前玩家，只需要 player2 回應
      expect(allPlayersResponded(followGuessState, 'player1')).toBe(true);
    });
  });

  describe('transferHost', () => {
    test('移除房主後應將房主轉移給第一個玩家', () => {
      const players = [
        { id: 'player1', name: '玩家A', isHost: true },
        { id: 'player2', name: '玩家B', isHost: false },
        { id: 'player3', name: '玩家C', isHost: false }
      ];

      const result = transferHost(players, 0);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('player2');
      expect(result[0].isHost).toBe(true);
      expect(result[1].id).toBe('player3');
      expect(result[1].isHost).toBe(false);
    });

    test('移除非房主時不應改變房主', () => {
      const players = [
        { id: 'player1', name: '玩家A', isHost: true },
        { id: 'player2', name: '玩家B', isHost: false },
        { id: 'player3', name: '玩家C', isHost: false }
      ];

      const result = transferHost(players, 1);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('player1');
      expect(result[0].isHost).toBe(true);
      expect(result[1].id).toBe('player3');
    });

    test('移除最後一個房主時不應轉移（沒有其他玩家）', () => {
      const players = [
        { id: 'player1', name: '玩家A', isHost: true }
      ];

      const result = transferHost(players, 0);

      expect(result).toHaveLength(0);
    });

    test('不應修改原始陣列', () => {
      const players = [
        { id: 'player1', name: '玩家A', isHost: true },
        { id: 'player2', name: '玩家B', isHost: false }
      ];
      const originalLength = players.length;

      transferHost(players, 0);

      expect(players).toHaveLength(originalLength);
    });
  });

  describe('isSessionExpired', () => {
    test('timestamp 為 null 時應返回 true', () => {
      expect(isSessionExpired(null)).toBe(true);
    });

    test('timestamp 為 undefined 時應返回 true', () => {
      expect(isSessionExpired(undefined)).toBe(true);
    });

    test('timestamp 為 0 時應返回 true', () => {
      expect(isSessionExpired(0)).toBe(true);
    });

    test('未過期的 timestamp 應返回 false', () => {
      const recentTimestamp = Date.now() - 1000; // 1 秒前
      expect(isSessionExpired(recentTimestamp)).toBe(false);
    });

    test('超過預設 2 小時的 timestamp 應返回 true', () => {
      const oldTimestamp = Date.now() - 3 * 60 * 60 * 1000; // 3 小時前
      expect(isSessionExpired(oldTimestamp)).toBe(true);
    });

    test('剛好 2 小時內的 timestamp 應返回 false', () => {
      const timestamp = Date.now() - 1.9 * 60 * 60 * 1000; // 1.9 小時前
      expect(isSessionExpired(timestamp)).toBe(false);
    });

    test('應支援自訂過期時間', () => {
      const timestamp = Date.now() - 10000; // 10 秒前
      expect(isSessionExpired(timestamp, 5000)).toBe(true); // 5 秒過期
      expect(isSessionExpired(timestamp, 15000)).toBe(false); // 15 秒過期
    });
  });

  describe('generateRefreshKey', () => {
    test('應返回 gameId:playerId 格式', () => {
      expect(generateRefreshKey('game123', 'player456')).toBe('game123:player456');
    });

    test('應處理特殊字元', () => {
      expect(generateRefreshKey('game_123_abc', 'player-456')).toBe('game_123_abc:player-456');
    });
  });

  describe('shouldSkipPlayer', () => {
    test('不活躍玩家應被跳過', () => {
      expect(shouldSkipPlayer({ isActive: false, isDisconnected: false })).toBe(true);
    });

    test('斷線玩家應被跳過', () => {
      expect(shouldSkipPlayer({ isActive: true, isDisconnected: true })).toBe(true);
    });

    test('活躍且連線的玩家不應被跳過', () => {
      expect(shouldSkipPlayer({ isActive: true, isDisconnected: false })).toBe(false);
    });

    test('不活躍且斷線的玩家應被跳過', () => {
      expect(shouldSkipPlayer({ isActive: false, isDisconnected: true })).toBe(true);
    });
  });

  describe('getNextActivePlayerIndex', () => {
    test('應返回下一個活躍玩家的索引', () => {
      const players = [
        { id: 'p1', isActive: true, isDisconnected: false },
        { id: 'p2', isActive: true, isDisconnected: false },
        { id: 'p3', isActive: true, isDisconnected: false }
      ];
      expect(getNextActivePlayerIndex(players, 0)).toBe(1);
      expect(getNextActivePlayerIndex(players, 1)).toBe(2);
      expect(getNextActivePlayerIndex(players, 2)).toBe(0);
    });

    test('應跳過不活躍玩家', () => {
      const players = [
        { id: 'p1', isActive: true, isDisconnected: false },
        { id: 'p2', isActive: false, isDisconnected: false },
        { id: 'p3', isActive: true, isDisconnected: false }
      ];
      expect(getNextActivePlayerIndex(players, 0)).toBe(2);
    });

    test('應跳過斷線玩家', () => {
      const players = [
        { id: 'p1', isActive: true, isDisconnected: false },
        { id: 'p2', isActive: true, isDisconnected: true },
        { id: 'p3', isActive: true, isDisconnected: false }
      ];
      expect(getNextActivePlayerIndex(players, 0)).toBe(2);
    });

    test('應能處理連續多個不活躍玩家', () => {
      const players = [
        { id: 'p1', isActive: true, isDisconnected: false },
        { id: 'p2', isActive: false, isDisconnected: false },
        { id: 'p3', isActive: false, isDisconnected: true },
        { id: 'p4', isActive: true, isDisconnected: false }
      ];
      expect(getNextActivePlayerIndex(players, 0)).toBe(3);
    });

    test('應能循環回到開頭', () => {
      const players = [
        { id: 'p1', isActive: true, isDisconnected: false },
        { id: 'p2', isActive: false, isDisconnected: false },
        { id: 'p3', isActive: false, isDisconnected: false }
      ];
      expect(getNextActivePlayerIndex(players, 0)).toBe(0); // 只有自己活躍，回到自己
    });

    test('所有玩家都不活躍時應返回下一個索引', () => {
      const players = [
        { id: 'p1', isActive: false, isDisconnected: false },
        { id: 'p2', isActive: false, isDisconnected: false },
        { id: 'p3', isActive: false, isDisconnected: false }
      ];
      // 嘗試所有玩家後會停在某個索引
      const result = getNextActivePlayerIndex(players, 0);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThan(players.length);
    });
  });
});
