/**
 * 預測功能單元測試
 * 工單 0095
 */

describe('Prediction Feature', () => {
  // 模擬 gameState
  let mockGameState;

  beforeEach(() => {
    mockGameState = {
      players: [
        { id: 'player1', name: '小明', score: 5, isActive: true },
        { id: 'player2', name: '小華', score: 3, isActive: true },
        { id: 'player3', name: '小王', score: 0, isActive: true }
      ],
      hiddenCards: [
        { color: 'red' },
        { color: 'blue' }
      ],
      predictions: [],
      currentRound: 1,
      scores: {
        player1: 5,
        player2: 3,
        player3: 0
      },
      gamePhase: 'playing',
      gameHistory: []
    };
  });

  /**
   * 結算預測的函數（從 server.js 提取）
   */
  function settlePredictions(gameState, scoreChanges) {
    const predictions = gameState.predictions || [];
    const currentRound = gameState.currentRound;
    const hiddenColors = gameState.hiddenCards.map(c => c.color);
    const results = [];

    // 只結算當局尚未結算的預測（工單 0092：防重複結算）
    const roundPredictions = predictions.filter(
      p => p.round === currentRound && p.isCorrect === null
    );

    for (const pred of roundPredictions) {
      // 檢查預測是否正確
      const isPredictionCorrect = hiddenColors.includes(pred.color);
      pred.isCorrect = isPredictionCorrect;

      // 計算分數變化
      const change = isPredictionCorrect ? 1 : -1;
      const playerId = pred.playerId;
      const currentScore = gameState.scores[playerId] || 0;
      const newScore = Math.max(0, currentScore + change);
      const actualChange = newScore - currentScore;

      // 更新分數
      gameState.scores[playerId] = newScore;
      const playerIndex = gameState.players.findIndex(p => p.id === playerId);
      if (playerIndex !== -1) {
        gameState.players[playerIndex].score = newScore;
      }

      // 累計到 scoreChanges
      scoreChanges[playerId] = (scoreChanges[playerId] || 0) + actualChange;

      results.push({
        playerId: playerId,
        playerName: pred.playerName,
        color: pred.color,
        isCorrect: isPredictionCorrect,
        scoreChange: actualChange
      });
    }

    return results;
  }

  describe('settlePredictions', () => {
    test('沒有預測時應返回空陣列', () => {
      const scoreChanges = {};
      const results = settlePredictions(mockGameState, scoreChanges);

      expect(results).toEqual([]);
      expect(Object.keys(scoreChanges)).toHaveLength(0);
    });

    test('預測正確時應標記 isCorrect 為 true', () => {
      mockGameState.predictions = [
        { playerId: 'player1', playerName: '小明', color: 'red', round: 1, isCorrect: null }
      ];
      const scoreChanges = {};

      const results = settlePredictions(mockGameState, scoreChanges);

      expect(results[0].isCorrect).toBe(true);
      expect(mockGameState.predictions[0].isCorrect).toBe(true);
    });

    test('預測錯誤時應標記 isCorrect 為 false', () => {
      mockGameState.predictions = [
        { playerId: 'player1', playerName: '小明', color: 'green', round: 1, isCorrect: null }
      ];
      const scoreChanges = {};

      const results = settlePredictions(mockGameState, scoreChanges);

      expect(results[0].isCorrect).toBe(false);
      expect(mockGameState.predictions[0].isCorrect).toBe(false);
    });

    test('預測正確應加 1 分', () => {
      mockGameState.predictions = [
        { playerId: 'player1', playerName: '小明', color: 'red', round: 1, isCorrect: null }
      ];
      const scoreChanges = {};

      const results = settlePredictions(mockGameState, scoreChanges);

      expect(results[0].scoreChange).toBe(1);
      expect(mockGameState.scores.player1).toBe(6); // 5 + 1
      expect(mockGameState.players[0].score).toBe(6);
      expect(scoreChanges.player1).toBe(1);
    });

    test('預測錯誤應扣 1 分', () => {
      mockGameState.predictions = [
        { playerId: 'player2', playerName: '小華', color: 'yellow', round: 1, isCorrect: null }
      ];
      const scoreChanges = {};

      const results = settlePredictions(mockGameState, scoreChanges);

      expect(results[0].scoreChange).toBe(-1);
      expect(mockGameState.scores.player2).toBe(2); // 3 - 1
      expect(mockGameState.players[1].score).toBe(2);
      expect(scoreChanges.player2).toBe(-1);
    });

    test('0 分時預測錯誤不會變成負分', () => {
      mockGameState.predictions = [
        { playerId: 'player3', playerName: '小王', color: 'yellow', round: 1, isCorrect: null }
      ];
      const scoreChanges = {};

      const results = settlePredictions(mockGameState, scoreChanges);

      expect(results[0].scoreChange).toBe(0); // 0 - 1 = 0 (最低)
      expect(mockGameState.scores.player3).toBe(0);
      expect(mockGameState.players[2].score).toBe(0);
    });

    test('只結算當局的預測', () => {
      mockGameState.currentRound = 2;
      mockGameState.predictions = [
        { playerId: 'player1', playerName: '小明', color: 'red', round: 1, isCorrect: null },
        { playerId: 'player2', playerName: '小華', color: 'blue', round: 2, isCorrect: null }
      ];
      const scoreChanges = {};

      const results = settlePredictions(mockGameState, scoreChanges);

      expect(results).toHaveLength(1);
      expect(results[0].playerId).toBe('player2');
      // 第一局的預測不應被結算
      expect(mockGameState.predictions[0].isCorrect).toBeNull();
    });

    test('不應重複結算已結算的預測', () => {
      mockGameState.predictions = [
        { playerId: 'player1', playerName: '小明', color: 'red', round: 1, isCorrect: true }
      ];
      const scoreChanges = {};

      const results = settlePredictions(mockGameState, scoreChanges);

      expect(results).toHaveLength(0);
      // 分數不應改變
      expect(mockGameState.scores.player1).toBe(5);
    });

    test('多人預測應各自結算', () => {
      mockGameState.predictions = [
        { playerId: 'player1', playerName: '小明', color: 'red', round: 1, isCorrect: null },
        { playerId: 'player2', playerName: '小華', color: 'green', round: 1, isCorrect: null },
        { playerId: 'player3', playerName: '小王', color: 'blue', round: 1, isCorrect: null }
      ];
      const scoreChanges = {};

      const results = settlePredictions(mockGameState, scoreChanges);

      expect(results).toHaveLength(3);

      // player1: red 正確 +1 (5 -> 6)
      expect(results[0].isCorrect).toBe(true);
      expect(results[0].scoreChange).toBe(1);

      // player2: green 錯誤 -1 (3 -> 2)
      expect(results[1].isCorrect).toBe(false);
      expect(results[1].scoreChange).toBe(-1);

      // player3: blue 正確 +1 (0 -> 1)
      expect(results[2].isCorrect).toBe(true);
      expect(results[2].scoreChange).toBe(1);
    });

    test('scoreChanges 應累計現有分數變化', () => {
      mockGameState.predictions = [
        { playerId: 'player1', playerName: '小明', color: 'red', round: 1, isCorrect: null }
      ];
      const scoreChanges = { player1: 3 }; // 已有猜牌得分

      const results = settlePredictions(mockGameState, scoreChanges);

      expect(scoreChanges.player1).toBe(4); // 3 + 1
    });
  });

  describe('endTurn 預測記錄', () => {
    /**
     * 模擬記錄預測的邏輯
     */
    function recordPrediction(gameState, playerId, prediction) {
      const player = gameState.players.find(p => p.id === playerId);

      if (prediction) {
        gameState.predictions.push({
          playerId: playerId,
          playerName: player?.name || '未知玩家',
          color: prediction,
          round: gameState.currentRound,
          isCorrect: null
        });

        gameState.gameHistory.push({
          type: 'prediction',
          playerId: playerId,
          color: prediction,
          timestamp: Date.now()
        });
      }
    }

    test('有顏色時應記錄預測', () => {
      recordPrediction(mockGameState, 'player1', 'red');

      expect(mockGameState.predictions).toHaveLength(1);
      expect(mockGameState.predictions[0]).toMatchObject({
        playerId: 'player1',
        playerName: '小明',
        color: 'red',
        round: 1,
        isCorrect: null
      });
    });

    test('顏色為 null 時不應記錄預測', () => {
      recordPrediction(mockGameState, 'player1', null);

      expect(mockGameState.predictions).toHaveLength(0);
      expect(mockGameState.gameHistory).toHaveLength(0);
    });

    test('應記錄到遊戲歷史', () => {
      recordPrediction(mockGameState, 'player1', 'blue');

      expect(mockGameState.gameHistory).toHaveLength(1);
      expect(mockGameState.gameHistory[0]).toMatchObject({
        type: 'prediction',
        playerId: 'player1',
        color: 'blue'
      });
    });

    test('玩家不存在時應使用預設名稱', () => {
      recordPrediction(mockGameState, 'unknown', 'red');

      expect(mockGameState.predictions[0].playerName).toBe('未知玩家');
    });
  });

  describe('新局預測清理', () => {
    test('新局開始時應清空預測陣列', () => {
      mockGameState.predictions = [
        { playerId: 'player1', color: 'red', round: 1, isCorrect: true }
      ];

      // 模擬新局開始
      mockGameState.predictions = [];
      mockGameState.currentRound += 1;

      expect(mockGameState.predictions).toHaveLength(0);
      expect(mockGameState.currentRound).toBe(2);
    });
  });

  describe('postQuestionPhase', () => {
    test('gamePhase 應設為 postQuestion', () => {
      mockGameState.gamePhase = 'postQuestion';
      expect(mockGameState.gamePhase).toBe('postQuestion');
    });
  });
});
