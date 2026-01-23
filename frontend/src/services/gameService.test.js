/**
 * 遊戲服務單元測試
 * 工作單 0009, 0010, 0011
 */

import {
  createGame,
  createGameRoom,
  getGameState,
  updateGameState,
  deleteGame,
  clearAllGames,
  processQuestionAction,
  processGuessAction,
  revealHiddenCards
} from './gameService';

import {
  GAME_PHASE_WAITING,
  GAME_PHASE_PLAYING,
  GAME_PHASE_FINISHED,
  TOTAL_CARDS,
  HIDDEN_CARDS_COUNT,
  QUESTION_TYPE_ONE_EACH,
  QUESTION_TYPE_ALL_ONE_COLOR,
  QUESTION_TYPE_GIVE_ONE_GET_ALL
} from '../shared/constants';

describe('gameService - 工作單 0009', () => {
  // 每個測試後清除所有遊戲
  afterEach(() => {
    clearAllGames();
  });

  describe('createGame', () => {
    const players = [
      { id: 'p1', name: '玩家1' },
      { id: 'p2', name: '玩家2' },
      { id: 'p3', name: '玩家3' }
    ];

    test('應正確建立 3 人遊戲', () => {
      const gameState = createGame(players);

      expect(gameState).toBeDefined();
      expect(gameState.gameId).toBeDefined();
      expect(gameState.players).toHaveLength(3);
      expect(gameState.hiddenCards).toHaveLength(HIDDEN_CARDS_COUNT);
      expect(gameState.currentPlayerIndex).toBe(0);
      expect(gameState.gamePhase).toBe(GAME_PHASE_PLAYING);
      expect(gameState.winner).toBeNull();
      expect(gameState.gameHistory).toEqual([]);
    });

    test('應正確建立 4 人遊戲', () => {
      const fourPlayers = [
        { id: 'p1', name: '玩家1' },
        { id: 'p2', name: '玩家2' },
        { id: 'p3', name: '玩家3' },
        { id: 'p4', name: '玩家4' }
      ];
      const gameState = createGame(fourPlayers);

      expect(gameState.players).toHaveLength(4);
      // 4 人遊戲每人 3 張牌
      gameState.players.forEach(player => {
        expect(player.hand).toHaveLength(3);
      });
    });

    test('玩家應有正確的初始狀態', () => {
      const gameState = createGame(players);

      gameState.players.forEach((player, index) => {
        expect(player.id).toBeDefined();
        expect(player.name).toBeDefined();
        expect(player.hand).toBeDefined();
        expect(player.isActive).toBe(true);
        expect(player.isCurrentTurn).toBe(index === 0);
      });
    });

    test('蓋牌應有 isHidden: true', () => {
      const gameState = createGame(players);

      gameState.hiddenCards.forEach(card => {
        expect(card.isHidden).toBe(true);
      });
    });

    test('所有牌應被正確分配', () => {
      const gameState = createGame(players);

      const hiddenCount = gameState.hiddenCards.length;
      const handCount = gameState.players.reduce(
        (sum, player) => sum + player.hand.length,
        0
      );

      expect(hiddenCount + handCount).toBe(TOTAL_CARDS);
    });

    test('2 人遊戲應拋出錯誤', () => {
      const twoPlayers = [
        { id: 'p1', name: '玩家1' },
        { id: 'p2', name: '玩家2' }
      ];

      expect(() => createGame(twoPlayers)).toThrow();
    });

    test('5 人遊戲應拋出錯誤', () => {
      const fivePlayers = [
        { id: 'p1', name: '玩家1' },
        { id: 'p2', name: '玩家2' },
        { id: 'p3', name: '玩家3' },
        { id: 'p4', name: '玩家4' },
        { id: 'p5', name: '玩家5' }
      ];

      expect(() => createGame(fivePlayers)).toThrow();
    });
  });

  describe('createGameRoom - 工作單 0036', () => {
    test('應正確建立 3 人房間', () => {
      const hostPlayer = { id: 'p1', name: '玩家1' };
      const room = createGameRoom(hostPlayer, 3);

      expect(room).toBeDefined();
      expect(room.gameId).toBeDefined();
      expect(room.players).toHaveLength(1);
      expect(room.players[0].name).toBe('玩家1');
      expect(room.players[0].isHost).toBe(true);
      expect(room.hiddenCards).toHaveLength(0);
      expect(room.gamePhase).toBe(GAME_PHASE_WAITING);
      expect(room.maxPlayers).toBe(3);
    });

    test('應正確建立 4 人房間', () => {
      const hostPlayer = { id: 'p1', name: '房主' };
      const room = createGameRoom(hostPlayer, 4);

      expect(room.maxPlayers).toBe(4);
      expect(room.gamePhase).toBe(GAME_PHASE_WAITING);
    });

    test('房間應可以被查詢', () => {
      const hostPlayer = { id: 'p1', name: '玩家1' };
      const room = createGameRoom(hostPlayer, 3);
      const retrieved = getGameState(room.gameId);

      expect(retrieved).toEqual(room);
    });

    test('預設最大玩家數應為 4', () => {
      const hostPlayer = { id: 'p1', name: '玩家1' };
      const room = createGameRoom(hostPlayer);

      expect(room.maxPlayers).toBe(4);
    });

    test('房主應有正確的初始狀態', () => {
      const hostPlayer = { id: 'host123', name: '房主玩家' };
      const room = createGameRoom(hostPlayer, 3);

      expect(room.players[0].id).toBe('host123');
      expect(room.players[0].name).toBe('房主玩家');
      expect(room.players[0].isHost).toBe(true);
      expect(room.players[0].isActive).toBe(true);
      expect(room.players[0].hand).toEqual([]);
    });
  });

  describe('getGameState', () => {
    test('應返回已建立的遊戲狀態', () => {
      const players = [
        { id: 'p1', name: '玩家1' },
        { id: 'p2', name: '玩家2' },
        { id: 'p3', name: '玩家3' }
      ];
      const gameState = createGame(players);
      const retrieved = getGameState(gameState.gameId);

      expect(retrieved).toEqual(gameState);
    });

    test('不存在的遊戲應返回 null', () => {
      const result = getGameState('non_existent_game');
      expect(result).toBeNull();
    });
  });

  describe('updateGameState', () => {
    test('應正確更新遊戲狀態', () => {
      const players = [
        { id: 'p1', name: '玩家1' },
        { id: 'p2', name: '玩家2' },
        { id: 'p3', name: '玩家3' }
      ];
      const gameState = createGame(players);

      const updated = updateGameState(gameState.gameId, {
        currentPlayerIndex: 1
      });

      expect(updated.currentPlayerIndex).toBe(1);
      expect(updated.gameId).toBe(gameState.gameId);
    });

    test('應可以更新多個屬性', () => {
      const players = [
        { id: 'p1', name: '玩家1' },
        { id: 'p2', name: '玩家2' },
        { id: 'p3', name: '玩家3' }
      ];
      const gameState = createGame(players);

      const updated = updateGameState(gameState.gameId, {
        currentPlayerIndex: 2,
        winner: 'p1'
      });

      expect(updated.currentPlayerIndex).toBe(2);
      expect(updated.winner).toBe('p1');
    });

    test('更新應持久化', () => {
      const players = [
        { id: 'p1', name: '玩家1' },
        { id: 'p2', name: '玩家2' },
        { id: 'p3', name: '玩家3' }
      ];
      const gameState = createGame(players);

      updateGameState(gameState.gameId, { currentPlayerIndex: 1 });
      const retrieved = getGameState(gameState.gameId);

      expect(retrieved.currentPlayerIndex).toBe(1);
    });

    test('不存在的遊戲應返回 null', () => {
      const result = updateGameState('non_existent_game', { winner: 'p1' });
      expect(result).toBeNull();
    });
  });

  describe('deleteGame', () => {
    test('應成功刪除遊戲', () => {
      const players = [
        { id: 'p1', name: '玩家1' },
        { id: 'p2', name: '玩家2' },
        { id: 'p3', name: '玩家3' }
      ];
      const gameState = createGame(players);

      const deleted = deleteGame(gameState.gameId);
      expect(deleted).toBe(true);

      const retrieved = getGameState(gameState.gameId);
      expect(retrieved).toBeNull();
    });

    test('刪除不存在的遊戲應返回 false', () => {
      const result = deleteGame('non_existent_game');
      expect(result).toBe(false);
    });
  });
});

describe('processQuestionAction - 工作單 0010', () => {
  afterEach(() => {
    clearAllGames();
  });

  // 建立一個有已知手牌的遊戲用於測試
  function createTestGame() {
    const players = [
      { id: 'p1', name: '玩家1' },
      { id: 'p2', name: '玩家2' },
      { id: 'p3', name: '玩家3' }
    ];
    const gameState = createGame(players);

    // 設定已知的手牌用於測試
    const testHands = [
      [
        { id: 'red-1', color: 'red', isHidden: false },
        { id: 'blue-1', color: 'blue', isHidden: false }
      ],
      [
        { id: 'red-2', color: 'red', isHidden: false },
        { id: 'yellow-1', color: 'yellow', isHidden: false },
        { id: 'yellow-2', color: 'yellow', isHidden: false }
      ],
      [
        { id: 'green-1', color: 'green', isHidden: false },
        { id: 'blue-2', color: 'blue', isHidden: false }
      ]
    ];

    const updatedPlayers = gameState.players.map((p, i) => ({
      ...p,
      hand: testHands[i]
    }));

    updateGameState(gameState.gameId, { players: updatedPlayers });
    return getGameState(gameState.gameId);
  }

  describe('基本驗證', () => {
    test('遊戲不存在應返回錯誤', () => {
      const result = processQuestionAction('non_existent', {
        playerId: 'p1',
        targetPlayerId: 'p2',
        colors: ['red', 'blue'],
        questionType: QUESTION_TYPE_ONE_EACH
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('不存在');
    });

    test('不是當前玩家回合應返回錯誤', () => {
      const gameState = createTestGame();

      const result = processQuestionAction(gameState.gameId, {
        playerId: 'p2', // p2 不是當前玩家
        targetPlayerId: 'p1',
        colors: ['red', 'blue'],
        questionType: QUESTION_TYPE_ONE_EACH
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('不是你的回合');
    });
  });

  describe('類型1 - 兩個顏色各一張', () => {
    test('目標玩家兩個顏色都有時應各給一張', () => {
      const gameState = createTestGame();

      const result = processQuestionAction(gameState.gameId, {
        playerId: 'p1',
        targetPlayerId: 'p2',
        colors: ['red', 'yellow'],
        questionType: QUESTION_TYPE_ONE_EACH
      });

      expect(result.success).toBe(true);
      expect(result.result.cardsReceived).toHaveLength(2);
      expect(result.result.hasCards).toBe(true);
    });

    test('目標玩家只有一個顏色時應只給一張', () => {
      const gameState = createTestGame();

      const result = processQuestionAction(gameState.gameId, {
        playerId: 'p1',
        targetPlayerId: 'p2',
        colors: ['red', 'blue'], // p2 沒有 blue
        questionType: QUESTION_TYPE_ONE_EACH
      });

      expect(result.success).toBe(true);
      expect(result.result.cardsReceived).toHaveLength(1);
      expect(result.result.cardsReceived[0].color).toBe('red');
    });

    test('目標玩家兩個顏色都沒有時應返回 hasCards: false', () => {
      const gameState = createTestGame();

      const result = processQuestionAction(gameState.gameId, {
        playerId: 'p1',
        targetPlayerId: 'p2',
        colors: ['green', 'blue'], // p2 沒有 green 和 blue
        questionType: QUESTION_TYPE_ONE_EACH
      });

      expect(result.success).toBe(true);
      expect(result.result.cardsReceived).toHaveLength(0);
      expect(result.result.hasCards).toBe(false);
    });
  });

  describe('類型2 - 其中一種顏色全部', () => {
    test('應正確給出指定顏色的全部牌', () => {
      const gameState = createTestGame();

      const result = processQuestionAction(gameState.gameId, {
        playerId: 'p1',
        targetPlayerId: 'p2',
        colors: ['yellow', 'blue'],
        questionType: QUESTION_TYPE_ALL_ONE_COLOR,
        selectedColor: 'yellow'
      });

      expect(result.success).toBe(true);
      expect(result.result.cardsReceived).toHaveLength(2); // p2 有 2 張 yellow
      expect(result.result.cardsReceived.every(c => c.color === 'yellow')).toBe(true);
    });

    test('目標玩家沒有該顏色時應返回 hasCards: false', () => {
      const gameState = createTestGame();

      const result = processQuestionAction(gameState.gameId, {
        playerId: 'p1',
        targetPlayerId: 'p2',
        colors: ['green', 'blue'],
        questionType: QUESTION_TYPE_ALL_ONE_COLOR
      });

      expect(result.success).toBe(true);
      expect(result.result.hasCards).toBe(false);
    });
  });

  describe('類型3 - 給一張要全部', () => {
    test('應正確給一張並收到全部', () => {
      const gameState = createTestGame();

      const result = processQuestionAction(gameState.gameId, {
        playerId: 'p1',
        targetPlayerId: 'p2',
        colors: ['red', 'yellow'],
        questionType: QUESTION_TYPE_GIVE_ONE_GET_ALL,
        giveColor: 'red',
        getColor: 'yellow'
      });

      expect(result.success).toBe(true);
      expect(result.result.cardsGiven).toHaveLength(1);
      expect(result.result.cardsGiven[0].color).toBe('red');
      expect(result.result.cardsReceived).toHaveLength(2); // p2 有 2 張 yellow
    });

    test('目標玩家沒有要的顏色時，已給的牌不收回', () => {
      const gameState = createTestGame();

      const result = processQuestionAction(gameState.gameId, {
        playerId: 'p1',
        targetPlayerId: 'p2',
        colors: ['red', 'green'],
        questionType: QUESTION_TYPE_GIVE_ONE_GET_ALL,
        giveColor: 'red',
        getColor: 'green' // p2 沒有 green
      });

      expect(result.success).toBe(true);
      expect(result.result.cardsGiven).toHaveLength(1); // 給出的牌
      expect(result.result.cardsReceived).toHaveLength(0); // 沒有收到牌
      expect(result.result.hasCards).toBe(false);
    });
  });

  describe('遊戲狀態更新', () => {
    test('問牌後應切換到下一個玩家', () => {
      const gameState = createTestGame();

      const result = processQuestionAction(gameState.gameId, {
        playerId: 'p1',
        targetPlayerId: 'p2',
        colors: ['red', 'yellow'],
        questionType: QUESTION_TYPE_ONE_EACH
      });

      expect(result.success).toBe(true);
      expect(result.gameState.currentPlayerIndex).toBe(1);
      expect(result.gameState.players[0].isCurrentTurn).toBe(false);
      expect(result.gameState.players[1].isCurrentTurn).toBe(true);
    });

    test('問牌應記錄到遊戲歷史', () => {
      const gameState = createTestGame();

      const result = processQuestionAction(gameState.gameId, {
        playerId: 'p1',
        targetPlayerId: 'p2',
        colors: ['red', 'yellow'],
        questionType: QUESTION_TYPE_ONE_EACH
      });

      expect(result.gameState.gameHistory).toHaveLength(1);
      expect(result.gameState.gameHistory[0].type).toBe('question');
      expect(result.gameState.gameHistory[0].playerId).toBe('p1');
    });
  });
});

describe('processGuessAction - 工作單 0011', () => {
  afterEach(() => {
    clearAllGames();
  });

  // 建立一個有已知蓋牌的遊戲用於測試
  function createTestGameWithKnownHidden() {
    const players = [
      { id: 'p1', name: '玩家1' },
      { id: 'p2', name: '玩家2' },
      { id: 'p3', name: '玩家3' }
    ];
    const gameState = createGame(players);

    // 設定已知的蓋牌
    const testHiddenCards = [
      { id: 'red-1', color: 'red', isHidden: true },
      { id: 'blue-1', color: 'blue', isHidden: true }
    ];

    updateGameState(gameState.gameId, { hiddenCards: testHiddenCards });
    return getGameState(gameState.gameId);
  }

  describe('基本驗證', () => {
    test('遊戲不存在應返回錯誤', () => {
      const result = processGuessAction('non_existent', {
        playerId: 'p1',
        guessedColors: ['red', 'blue']
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('不存在');
    });

    test('不是當前玩家回合應返回錯誤', () => {
      const gameState = createTestGameWithKnownHidden();

      const result = processGuessAction(gameState.gameId, {
        playerId: 'p2',
        guessedColors: ['red', 'blue']
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('不是你的回合');
    });
  });

  describe('猜對', () => {
    test('猜對應設定獲勝者並結束遊戲', () => {
      const gameState = createTestGameWithKnownHidden();

      const result = processGuessAction(gameState.gameId, {
        playerId: 'p1',
        guessedColors: ['red', 'blue']
      });

      expect(result.success).toBe(true);
      expect(result.isCorrect).toBe(true);
      expect(result.gameState.winner).toBe('p1');
      expect(result.gameState.gamePhase).toBe(GAME_PHASE_FINISHED);
    });

    test('猜對應公布蓋牌', () => {
      const gameState = createTestGameWithKnownHidden();

      const result = processGuessAction(gameState.gameId, {
        playerId: 'p1',
        guessedColors: ['red', 'blue']
      });

      expect(result.revealedCards).not.toBeNull();
      expect(result.revealedCards).toHaveLength(2);
      expect(result.revealedCards.every(c => c.isHidden === false)).toBe(true);
    });

    test('猜對順序不同也算正確', () => {
      const gameState = createTestGameWithKnownHidden();

      const result = processGuessAction(gameState.gameId, {
        playerId: 'p1',
        guessedColors: ['blue', 'red'] // 順序相反
      });

      expect(result.isCorrect).toBe(true);
    });
  });

  describe('猜錯', () => {
    test('猜錯應標記玩家為非活躍', () => {
      const gameState = createTestGameWithKnownHidden();

      const result = processGuessAction(gameState.gameId, {
        playerId: 'p1',
        guessedColors: ['red', 'yellow'] // 錯誤
      });

      expect(result.success).toBe(true);
      expect(result.isCorrect).toBe(false);
      expect(result.gameState.players[0].isActive).toBe(false);
    });

    test('猜錯不應公布蓋牌', () => {
      const gameState = createTestGameWithKnownHidden();

      const result = processGuessAction(gameState.gameId, {
        playerId: 'p1',
        guessedColors: ['red', 'yellow']
      });

      expect(result.revealedCards).toBeNull();
    });

    test('猜錯後應切換到下一個玩家', () => {
      const gameState = createTestGameWithKnownHidden();

      const result = processGuessAction(gameState.gameId, {
        playerId: 'p1',
        guessedColors: ['red', 'yellow']
      });

      expect(result.gameState.currentPlayerIndex).toBe(1);
      expect(result.gameState.players[1].isCurrentTurn).toBe(true);
    });
  });

  describe('最後一個玩家猜錯', () => {
    test('最後一個玩家猜錯應結束遊戲但無獲勝者', () => {
      const gameState = createTestGameWithKnownHidden();

      // 設定只剩一個活躍玩家
      const updatedPlayers = gameState.players.map((p, i) => ({
        ...p,
        isActive: i === 0,
        isCurrentTurn: i === 0
      }));
      updateGameState(gameState.gameId, {
        players: updatedPlayers,
        currentPlayerIndex: 0
      });

      const result = processGuessAction(gameState.gameId, {
        playerId: 'p1',
        guessedColors: ['red', 'yellow'] // 錯誤
      });

      expect(result.success).toBe(true);
      expect(result.isCorrect).toBe(false);
      expect(result.gameState.gamePhase).toBe(GAME_PHASE_FINISHED);
      expect(result.gameState.winner).toBeNull();
    });
  });

  describe('revealHiddenCards', () => {
    test('當前玩家可以查看蓋牌', () => {
      const gameState = createTestGameWithKnownHidden();

      const result = revealHiddenCards(gameState.gameId, 'p1');

      expect(result.success).toBe(true);
      expect(result.cards).toHaveLength(2);
    });

    test('非當前玩家不能查看蓋牌', () => {
      const gameState = createTestGameWithKnownHidden();

      const result = revealHiddenCards(gameState.gameId, 'p2');

      expect(result.success).toBe(false);
    });
  });
});
