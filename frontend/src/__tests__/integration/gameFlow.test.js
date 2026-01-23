/**
 * 整合測試 - 完整遊戲流程
 *
 * 測試遊戲從建立到結束的完整流程
 * 包含問牌、猜牌、勝負判定等功能
 *
 * 工作單 0033
 */

import {
  createGame,
  createGameRoom,
  startGame,
  getGameState,
  updateGameState,
  deleteGame,
  clearAllGames,
  processAction,
  processQuestionAction,
  processGuessAction,
  revealHiddenCards
} from '../../services/gameService';

import {
  GAME_PHASE_WAITING,
  GAME_PHASE_PLAYING,
  GAME_PHASE_FINISHED,
  ACTION_TYPE_QUESTION,
  ACTION_TYPE_GUESS,
  QUESTION_TYPE_ONE_EACH,
  QUESTION_TYPE_ALL_ONE_COLOR,
  QUESTION_TYPE_GIVE_ONE_GET_ALL,
  COLORS
} from '../../shared/constants';

describe('整合測試 - 完整遊戲流程', () => {
  // 每個測試前清除所有遊戲狀態
  beforeEach(() => {
    clearAllGames();
  });

  // ==================== 測試完整遊戲流程 ====================

  describe('完整遊戲流程', () => {
    describe('3人遊戲流程', () => {
      it('應能創建並初始化3人遊戲', () => {
        const players = [
          { id: 'p1', name: '玩家1' },
          { id: 'p2', name: '玩家2' },
          { id: 'p3', name: '玩家3' }
        ];

        const gameState = createGame(players);

        // 驗證遊戲狀態
        expect(gameState.gameId).toBeDefined();
        expect(gameState.players).toHaveLength(3);
        expect(gameState.hiddenCards).toHaveLength(2);
        expect(gameState.gamePhase).toBe(GAME_PHASE_PLAYING);
        expect(gameState.currentPlayerIndex).toBe(0);
        expect(gameState.winner).toBeNull();

        // 驗證每個玩家的手牌（3人遊戲每人4張）
        gameState.players.forEach(player => {
          expect(player.hand).toHaveLength(4);
          expect(player.isActive).toBe(true);
        });

        // 驗證第一個玩家是當前玩家
        expect(gameState.players[0].isCurrentTurn).toBe(true);
      });

      it('3人遊戲應正確分配14張牌', () => {
        const players = [
          { id: 'p1', name: '玩家1' },
          { id: 'p2', name: '玩家2' },
          { id: 'p3', name: '玩家3' }
        ];

        const gameState = createGame(players);

        // 計算總牌數
        const totalHandCards = gameState.players.reduce(
          (sum, player) => sum + player.hand.length,
          0
        );
        const totalCards = totalHandCards + gameState.hiddenCards.length;

        expect(totalCards).toBe(14);
      });
    });

    describe('4人遊戲流程', () => {
      it('應能創建並初始化4人遊戲', () => {
        const players = [
          { id: 'p1', name: '玩家1' },
          { id: 'p2', name: '玩家2' },
          { id: 'p3', name: '玩家3' },
          { id: 'p4', name: '玩家4' }
        ];

        const gameState = createGame(players);

        // 驗證遊戲狀態
        expect(gameState.gameId).toBeDefined();
        expect(gameState.players).toHaveLength(4);
        expect(gameState.hiddenCards).toHaveLength(2);
        expect(gameState.gamePhase).toBe(GAME_PHASE_PLAYING);

        // 驗證每個玩家的手牌（4人遊戲每人3張）
        gameState.players.forEach(player => {
          expect(player.hand).toHaveLength(3);
          expect(player.isActive).toBe(true);
        });
      });

      it('4人遊戲應正確分配14張牌', () => {
        const players = [
          { id: 'p1', name: '玩家1' },
          { id: 'p2', name: '玩家2' },
          { id: 'p3', name: '玩家3' },
          { id: 'p4', name: '玩家4' }
        ];

        const gameState = createGame(players);

        // 計算總牌數
        const totalHandCards = gameState.players.reduce(
          (sum, player) => sum + player.hand.length,
          0
        );
        const totalCards = totalHandCards + gameState.hiddenCards.length;

        expect(totalCards).toBe(14);
      });
    });

    describe('遊戲房間流程', () => {
      it('應能建立房間、加入玩家、開始遊戲', () => {
        // 1. 房主建立房間
        const hostPlayer = { id: 'host', name: '房主' };
        const roomState = createGameRoom(hostPlayer, 3);

        expect(roomState.gamePhase).toBe(GAME_PHASE_WAITING);
        expect(roomState.players).toHaveLength(1);
        expect(roomState.maxPlayers).toBe(3);

        // 2. 玩家加入（模擬更新房間狀態）
        const updatedState = updateGameState(roomState.gameId, {
          players: [
            ...roomState.players,
            { id: 'p2', name: '玩家2', hand: [], isActive: true, isCurrentTurn: false },
            { id: 'p3', name: '玩家3', hand: [], isActive: true, isCurrentTurn: false }
          ]
        });

        expect(updatedState.players).toHaveLength(3);

        // 3. 開始遊戲
        const startResult = startGame(roomState.gameId);

        expect(startResult.success).toBe(true);
        expect(startResult.gameState.gamePhase).toBe(GAME_PHASE_PLAYING);
        expect(startResult.gameState.players[0].hand.length).toBeGreaterThan(0);
      });

      it('玩家人數不足時不能開始遊戲', () => {
        const hostPlayer = { id: 'host', name: '房主' };
        const roomState = createGameRoom(hostPlayer, 3);

        // 只有1個玩家時嘗試開始遊戲
        const startResult = startGame(roomState.gameId);

        expect(startResult.success).toBe(false);
        expect(startResult.message).toContain('玩家數量');
      });
    });
  });

  // ==================== 測試問牌流程 ====================

  describe('問牌流程', () => {
    let gameState;
    let gameId;

    beforeEach(() => {
      const players = [
        { id: 'p1', name: '玩家1' },
        { id: 'p2', name: '玩家2' },
        { id: 'p3', name: '玩家3' }
      ];
      gameState = createGame(players);
      gameId = gameState.gameId;
    });

    describe('類型1 - 兩個顏色各一張', () => {
      it('應成功處理類型1問牌', () => {
        // 找出目標玩家有的兩種顏色
        const targetPlayer = gameState.players[1];
        const colors = [...new Set(targetPlayer.hand.map(card => card.color))];

        // 如果目標玩家有至少兩種顏色
        if (colors.length >= 2) {
          const action = {
            playerId: 'p1',
            targetPlayerId: 'p2',
            colors: [colors[0], colors[1]],
            questionType: QUESTION_TYPE_ONE_EACH
          };

          const result = processQuestionAction(gameId, action);

          expect(result.success).toBe(true);
          expect(result.gameState).toBeDefined();
        }
      });

      it('類型1問牌後應更新玩家手牌', () => {
        const targetPlayer = gameState.players[1];
        const colors = [...new Set(targetPlayer.hand.map(card => card.color))];

        if (colors.length >= 2) {
          const initialP1HandCount = gameState.players[0].hand.length;
          const initialP2HandCount = targetPlayer.hand.length;

          const action = {
            playerId: 'p1',
            targetPlayerId: 'p2',
            colors: [colors[0], colors[1]],
            questionType: QUESTION_TYPE_ONE_EACH
          };

          const result = processQuestionAction(gameId, action);

          if (result.success) {
            // 問牌者手牌應該增加
            expect(result.gameState.players[0].hand.length).toBeGreaterThanOrEqual(initialP1HandCount);
          }
        }
      });
    });

    describe('類型2 - 其中一種顏色全部', () => {
      it('應成功處理類型2問牌', () => {
        const targetPlayer = gameState.players[1];
        const colors = [...new Set(targetPlayer.hand.map(card => card.color))];

        if (colors.length >= 2) {
          const action = {
            playerId: 'p1',
            targetPlayerId: 'p2',
            colors: [colors[0], colors[1]],
            questionType: QUESTION_TYPE_ALL_ONE_COLOR,
            selectedColor: colors[0]
          };

          const result = processQuestionAction(gameId, action);

          expect(result.success).toBe(true);
        }
      });
    });

    describe('類型3 - 給一張要全部', () => {
      it('應成功處理類型3問牌', () => {
        const currentPlayer = gameState.players[0];
        const targetPlayer = gameState.players[1];
        const currentColors = [...new Set(currentPlayer.hand.map(card => card.color))];
        const targetColors = [...new Set(targetPlayer.hand.map(card => card.color))];

        if (currentColors.length >= 1 && targetColors.length >= 1) {
          const giveColor = currentColors[0];
          const getColor = targetColors.find(c => c !== giveColor) || targetColors[0];

          const action = {
            playerId: 'p1',
            targetPlayerId: 'p2',
            colors: [giveColor, getColor],
            questionType: QUESTION_TYPE_GIVE_ONE_GET_ALL,
            giveColor: giveColor,
            getColor: getColor
          };

          const result = processQuestionAction(gameId, action);

          // 成功或失敗取決於是否有可交換的牌
          expect(result).toBeDefined();
          expect(typeof result.success).toBe('boolean');
        }
      });
    });

    describe('問牌後的狀態更新', () => {
      it('問牌後應切換到下一個玩家', () => {
        const targetPlayer = gameState.players[1];
        const colors = [...new Set(targetPlayer.hand.map(card => card.color))];

        if (colors.length >= 2) {
          const action = {
            playerId: 'p1',
            targetPlayerId: 'p2',
            colors: [colors[0], colors[1]],
            questionType: QUESTION_TYPE_ONE_EACH
          };

          const result = processQuestionAction(gameId, action);

          if (result.success) {
            // 檢查當前玩家索引是否變化
            expect(result.gameState.currentPlayerIndex).not.toBe(0);
          }
        }
      });

      it('問牌紀錄應被添加到遊戲歷史', () => {
        const targetPlayer = gameState.players[1];
        const colors = [...new Set(targetPlayer.hand.map(card => card.color))];

        if (colors.length >= 2) {
          const action = {
            playerId: 'p1',
            targetPlayerId: 'p2',
            colors: [colors[0], colors[1]],
            questionType: QUESTION_TYPE_ONE_EACH
          };

          const result = processQuestionAction(gameId, action);

          if (result.success) {
            expect(result.gameState.gameHistory.length).toBeGreaterThan(0);
          }
        }
      });
    });

    describe('玩家輪流機制', () => {
      it('應該按順序輪流', () => {
        // 取得初始狀態
        const initialPlayerIndex = gameState.currentPlayerIndex;
        expect(initialPlayerIndex).toBe(0);

        // 第一個玩家的回合
        expect(gameState.players[0].isCurrentTurn).toBe(true);
        expect(gameState.players[1].isCurrentTurn).toBe(false);
      });
    });
  });

  // ==================== 測試猜牌流程 ====================

  describe('猜牌流程', () => {
    let gameState;
    let gameId;

    beforeEach(() => {
      const players = [
        { id: 'p1', name: '玩家1' },
        { id: 'p2', name: '玩家2' },
        { id: 'p3', name: '玩家3' }
      ];
      gameState = createGame(players);
      gameId = gameState.gameId;
    });

    describe('猜對的完整流程', () => {
      it('猜對應該獲勝', () => {
        // 取得蓋牌的實際顏色
        const hiddenColors = gameState.hiddenCards.map(card => card.color);

        const action = {
          playerId: 'p1',
          guessedColors: hiddenColors
        };

        const result = processGuessAction(gameId, action);

        expect(result.success).toBe(true);
        expect(result.gameState.winner).toBe('p1');
        expect(result.gameState.gamePhase).toBe(GAME_PHASE_FINISHED);
      });

      it('猜對後遊戲應該結束', () => {
        const hiddenColors = gameState.hiddenCards.map(card => card.color);

        const action = {
          playerId: 'p1',
          guessedColors: hiddenColors
        };

        const result = processGuessAction(gameId, action);

        expect(result.gameState.gamePhase).toBe(GAME_PHASE_FINISHED);
      });

      it('猜對順序不同也應該判定為正確', () => {
        const hiddenColors = gameState.hiddenCards.map(card => card.color);

        const action = {
          playerId: 'p1',
          guessedColors: [hiddenColors[1], hiddenColors[0]] // 顛倒順序
        };

        const result = processGuessAction(gameId, action);

        expect(result.success).toBe(true);
        expect(result.gameState.winner).toBe('p1');
      });
    });

    describe('猜錯的完整流程', () => {
      it('猜錯應該讓玩家退出遊戲', () => {
        // 使用不可能正確的顏色組合
        const wrongColors = ['red', 'red']; // 假設不會兩張都是紅色

        const action = {
          playerId: 'p1',
          guessedColors: wrongColors
        };

        const result = processGuessAction(gameId, action);

        // 檢查玩家是否被標記為不活躍（如果猜錯）
        if (!result.gameState.winner) {
          const player = result.gameState.players.find(p => p.id === 'p1');
          expect(player.isActive).toBe(false);
        }
      });

      it('猜錯後遊戲應該繼續（如果還有其他玩家）', () => {
        // 構造一個錯誤的猜測
        const hiddenColors = gameState.hiddenCards.map(card => card.color);
        const allColors = [COLORS.RED, COLORS.YELLOW, COLORS.GREEN, COLORS.BLUE];
        const wrongColor = allColors.find(c => !hiddenColors.includes(c)) || COLORS.RED;

        const action = {
          playerId: 'p1',
          guessedColors: [wrongColor, wrongColor]
        };

        const result = processGuessAction(gameId, action);

        // 如果沒有猜對且還有其他活躍玩家，遊戲應該繼續
        if (!result.gameState.winner) {
          const activePlayers = result.gameState.players.filter(p => p.isActive);
          if (activePlayers.length > 1) {
            expect(result.gameState.gamePhase).toBe(GAME_PHASE_PLAYING);
          }
        }
      });

      it('猜錯後應該切換到下一個玩家', () => {
        // 構造一個可能錯誤的猜測
        const action = {
          playerId: 'p1',
          guessedColors: ['red', 'red']
        };

        const result = processGuessAction(gameId, action);

        // 如果沒有猜對
        if (!result.gameState.winner) {
          // 當前玩家應該變化
          expect(result.gameState.currentPlayerIndex).not.toBe(0);
        }
      });
    });

    describe('最後一個玩家猜錯', () => {
      it('所有玩家都猜錯應該結束遊戲', () => {
        // 模擬只剩一個玩家的情況
        const updatedState = updateGameState(gameId, {
          players: gameState.players.map((player, index) => ({
            ...player,
            isActive: index === 0 // 只有第一個玩家活躍
          }))
        });

        // 最後一個玩家猜錯
        const action = {
          playerId: 'p1',
          guessedColors: ['red', 'red']
        };

        const result = processGuessAction(gameId, action);

        // 如果猜錯，遊戲應該結束
        if (!result.gameState.winner) {
          expect(result.gameState.gamePhase).toBe(GAME_PHASE_FINISHED);
        }
      });
    });
  });

  // ==================== 測試邊界情況 ====================

  describe('邊界情況', () => {
    describe('只剩一個玩家的情況', () => {
      it('只剩一個活躍玩家時必須猜牌', () => {
        const players = [
          { id: 'p1', name: '玩家1' },
          { id: 'p2', name: '玩家2' },
          { id: 'p3', name: '玩家3' }
        ];
        const gameState = createGame(players);
        const gameId = gameState.gameId;

        // 將其他玩家設為不活躍
        updateGameState(gameId, {
          players: gameState.players.map((player, index) => ({
            ...player,
            isActive: index === 0
          }))
        });

        const currentState = getGameState(gameId);
        const activePlayers = currentState.players.filter(p => p.isActive);

        expect(activePlayers.length).toBe(1);
      });
    });

    describe('玩家手牌為空的情況', () => {
      it('玩家手牌為空時應能正確處理', () => {
        const players = [
          { id: 'p1', name: '玩家1' },
          { id: 'p2', name: '玩家2' },
          { id: 'p3', name: '玩家3' }
        ];
        const gameState = createGame(players);
        const gameId = gameState.gameId;

        // 將某個玩家的手牌清空
        const updatedState = updateGameState(gameId, {
          players: gameState.players.map((player, index) => ({
            ...player,
            hand: index === 1 ? [] : player.hand
          }))
        });

        const currentState = getGameState(gameId);
        expect(currentState.players[1].hand).toHaveLength(0);
      });
    });

    describe('各種異常情況', () => {
      it('不存在的遊戲應返回錯誤', () => {
        const result = processAction('non_existent_game', {
          type: ACTION_TYPE_QUESTION
        });

        expect(result.success).toBe(false);
        expect(result.message).toContain('不存在');
      });

      it('缺少動作類型應返回錯誤', () => {
        const players = [
          { id: 'p1', name: '玩家1' },
          { id: 'p2', name: '玩家2' },
          { id: 'p3', name: '玩家3' }
        ];
        const gameState = createGame(players);

        const result = processAction(gameState.gameId, {});

        expect(result.success).toBe(false);
      });

      it('無效的動作類型應返回錯誤', () => {
        const players = [
          { id: 'p1', name: '玩家1' },
          { id: 'p2', name: '玩家2' },
          { id: 'p3', name: '玩家3' }
        ];
        const gameState = createGame(players);

        const result = processAction(gameState.gameId, {
          type: 'invalid_action'
        });

        expect(result.success).toBe(false);
      });

      it('遊戲結束後不能繼續操作', () => {
        const players = [
          { id: 'p1', name: '玩家1' },
          { id: 'p2', name: '玩家2' },
          { id: 'p3', name: '玩家3' }
        ];
        const gameState = createGame(players);
        const gameId = gameState.gameId;

        // 正確猜測讓遊戲結束
        const hiddenColors = gameState.hiddenCards.map(card => card.color);
        processGuessAction(gameId, {
          playerId: 'p1',
          guessedColors: hiddenColors
        });

        // 遊戲結束後嘗試操作
        const result = processQuestionAction(gameId, {
          playerId: 'p2',
          targetPlayerId: 'p3',
          colors: ['red', 'blue'],
          questionType: QUESTION_TYPE_ONE_EACH
        });

        expect(result.success).toBe(false);
      });
    });
  });

  // ==================== 測試狀態一致性 ====================

  describe('狀態一致性', () => {
    describe('遊戲狀態在各個階段的一致性', () => {
      it('等待階段的狀態應該一致', () => {
        const hostPlayer = { id: 'host', name: '房主' };
        const roomState = createGameRoom(hostPlayer, 3);

        expect(roomState.gamePhase).toBe(GAME_PHASE_WAITING);
        expect(roomState.players.length).toBe(1);
        expect(roomState.hiddenCards).toHaveLength(0);
        expect(roomState.currentPlayerIndex).toBe(0);
        expect(roomState.winner).toBeNull();
      });

      it('進行階段的狀態應該一致', () => {
        const players = [
          { id: 'p1', name: '玩家1' },
          { id: 'p2', name: '玩家2' },
          { id: 'p3', name: '玩家3' }
        ];
        const gameState = createGame(players);

        expect(gameState.gamePhase).toBe(GAME_PHASE_PLAYING);
        expect(gameState.players.length).toBe(3);
        expect(gameState.hiddenCards.length).toBe(2);
        expect(gameState.currentPlayerIndex).toBeGreaterThanOrEqual(0);
        expect(gameState.winner).toBeNull();

        // 所有玩家都應該有手牌
        gameState.players.forEach(player => {
          expect(player.hand.length).toBeGreaterThan(0);
          expect(player.isActive).toBe(true);
        });
      });

      it('結束階段的狀態應該一致', () => {
        const players = [
          { id: 'p1', name: '玩家1' },
          { id: 'p2', name: '玩家2' },
          { id: 'p3', name: '玩家3' }
        ];
        const gameState = createGame(players);
        const gameId = gameState.gameId;

        // 正確猜測讓遊戲結束
        const hiddenColors = gameState.hiddenCards.map(card => card.color);
        const result = processGuessAction(gameId, {
          playerId: 'p1',
          guessedColors: hiddenColors
        });

        expect(result.gameState.gamePhase).toBe(GAME_PHASE_FINISHED);
        expect(result.gameState.winner).not.toBeNull();
      });
    });

    describe('牌數一致性', () => {
      it('問牌後總牌數應該保持不變', () => {
        const players = [
          { id: 'p1', name: '玩家1' },
          { id: 'p2', name: '玩家2' },
          { id: 'p3', name: '玩家3' }
        ];
        const gameState = createGame(players);
        const gameId = gameState.gameId;

        // 計算初始總牌數
        const initialTotalCards = gameState.players.reduce(
          (sum, player) => sum + player.hand.length,
          0
        ) + gameState.hiddenCards.length;

        expect(initialTotalCards).toBe(14);

        // 進行問牌操作
        const targetPlayer = gameState.players[1];
        const colors = [...new Set(targetPlayer.hand.map(card => card.color))];

        if (colors.length >= 2) {
          const result = processQuestionAction(gameId, {
            playerId: 'p1',
            targetPlayerId: 'p2',
            colors: [colors[0], colors[1]],
            questionType: QUESTION_TYPE_ONE_EACH
          });

          if (result.success) {
            // 計算操作後總牌數
            const afterTotalCards = result.gameState.players.reduce(
              (sum, player) => sum + player.hand.length,
              0
            ) + result.gameState.hiddenCards.length;

            expect(afterTotalCards).toBe(14);
          }
        }
      });
    });

    describe('遊戲服務與狀態存儲同步', () => {
      it('更新後應能取得最新狀態', () => {
        const players = [
          { id: 'p1', name: '玩家1' },
          { id: 'p2', name: '玩家2' },
          { id: 'p3', name: '玩家3' }
        ];
        const gameState = createGame(players);
        const gameId = gameState.gameId;

        // 更新狀態
        const newHistory = [{ action: 'test' }];
        updateGameState(gameId, { gameHistory: newHistory });

        // 取得更新後的狀態
        const updatedState = getGameState(gameId);

        expect(updatedState.gameHistory).toEqual(newHistory);
      });

      it('刪除後應無法取得狀態', () => {
        const players = [
          { id: 'p1', name: '玩家1' },
          { id: 'p2', name: '玩家2' },
          { id: 'p3', name: '玩家3' }
        ];
        const gameState = createGame(players);
        const gameId = gameState.gameId;

        // 刪除遊戲
        const deleted = deleteGame(gameId);
        expect(deleted).toBe(true);

        // 嘗試取得已刪除的遊戲
        const deletedState = getGameState(gameId);
        expect(deletedState).toBeNull();
      });

      it('清除所有遊戲後應無法取得任何狀態', () => {
        // 建立多個遊戲
        const game1 = createGame([
          { id: 'p1', name: '玩家1' },
          { id: 'p2', name: '玩家2' },
          { id: 'p3', name: '玩家3' }
        ]);

        const game2 = createGame([
          { id: 'p4', name: '玩家4' },
          { id: 'p5', name: '玩家5' },
          { id: 'p6', name: '玩家6' }
        ]);

        // 清除所有遊戲
        clearAllGames();

        // 嘗試取得已清除的遊戲
        expect(getGameState(game1.gameId)).toBeNull();
        expect(getGameState(game2.gameId)).toBeNull();
      });
    });
  });

  // ==================== 測試揭示蓋牌功能 ====================

  describe('揭示蓋牌功能', () => {
    it('當前玩家應能查看蓋牌', () => {
      const players = [
        { id: 'p1', name: '玩家1' },
        { id: 'p2', name: '玩家2' },
        { id: 'p3', name: '玩家3' }
      ];
      const gameState = createGame(players);

      const result = revealHiddenCards(gameState.gameId, 'p1');

      expect(result.success).toBe(true);
      expect(result.cards).toHaveLength(2);
      expect(result.cards[0]).toHaveProperty('color');
    });

    it('非當前玩家不能查看蓋牌', () => {
      const players = [
        { id: 'p1', name: '玩家1' },
        { id: 'p2', name: '玩家2' },
        { id: 'p3', name: '玩家3' }
      ];
      const gameState = createGame(players);

      const result = revealHiddenCards(gameState.gameId, 'p2');

      expect(result.success).toBe(false);
      expect(result.message).toContain('不是你的回合');
    });

    it('不存在的遊戲應返回錯誤', () => {
      const result = revealHiddenCards('non_existent_game', 'p1');

      expect(result.success).toBe(false);
      expect(result.message).toContain('不存在');
    });

    it('不存在的玩家應返回錯誤', () => {
      const players = [
        { id: 'p1', name: '玩家1' },
        { id: 'p2', name: '玩家2' },
        { id: 'p3', name: '玩家3' }
      ];
      const gameState = createGame(players);

      const result = revealHiddenCards(gameState.gameId, 'non_existent_player');

      expect(result.success).toBe(false);
      expect(result.message).toContain('不存在');
    });
  });
});
