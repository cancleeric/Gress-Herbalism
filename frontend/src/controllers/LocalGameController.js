/**
 * 本地遊戲控制器
 *
 * 用於單人模式（含 AI 玩家）時的本地遊戲邏輯處理
 * 模擬後端遊戲邏輯，不依賴 Socket.io
 *
 * @module controllers/LocalGameController
 */

import {
  CARD_COUNTS,
  ALL_COLORS,
  HIDDEN_CARDS_COUNT,
  GAME_PHASE_WAITING,
  GAME_PHASE_PLAYING,
  GAME_PHASE_POST_QUESTION,
  GAME_PHASE_FOLLOW_GUESSING,
  GAME_PHASE_ROUND_END,
  GAME_PHASE_FINISHED,
  QUESTION_TYPE_ONE_EACH,
  QUESTION_TYPE_ALL_ONE_COLOR,
  QUESTION_TYPE_GIVE_ONE_GET_ALL
} from '../shared/constants';

import { validateGuess, getNextPlayerIndex } from '../utils/gameRules';

/**
 * 本地遊戲控制器類別
 */
class LocalGameController {
  /**
   * 建立本地遊戲控制器
   *
   * @param {Object} options - 選項
   * @param {Array} options.players - 玩家陣列（包含 AI 玩家實例）
   * @param {Function} options.onStateChange - 狀態變更回調
   * @param {Function} options.onEvent - 事件回調（用於通知 AI 玩家）
   */
  constructor({ players, onStateChange, onEvent }) {
    this.players = players;
    this.onStateChange = onStateChange;
    this.onEvent = onEvent;

    // 遊戲狀態
    this.gameState = {
      gameId: 'local-' + Date.now(),
      players: [],
      currentPlayerIndex: 0,
      gamePhase: GAME_PHASE_WAITING,
      winner: null,
      hiddenCards: [],
      gameHistory: [],
      currentPlayerId: null,
      maxPlayers: players.length,
      round: 0
    };

    // 牌組
    this.deck = [];

    // 跟猜狀態
    this.followGuessState = null;

    // 綁定方法
    this.startGame = this.startGame.bind(this);
    this.handleAction = this.handleAction.bind(this);
    this.handleFollowGuessResponse = this.handleFollowGuessResponse.bind(this);
    this.startNextRound = this.startNextRound.bind(this);
    this.endTurn = this.endTurn.bind(this);
  }

  /**
   * 創建牌組
   *
   * @returns {Array} 牌組陣列
   */
  createDeck() {
    const deck = [];
    let cardId = 1;

    for (const color of ALL_COLORS) {
      const count = CARD_COUNTS[color];
      for (let i = 0; i < count; i++) {
        deck.push({
          id: cardId++,
          color
        });
      }
    }

    return deck;
  }

  /**
   * 洗牌
   *
   * @param {Array} deck - 牌組
   * @returns {Array} 洗過的牌組
   */
  shuffleDeck(deck) {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * 開始遊戲
   */
  startGame() {
    console.log('[LocalGameController] 開始遊戲');

    // 創建並洗牌
    this.deck = this.shuffleDeck(this.createDeck());

    // 初始化玩家狀態
    this.gameState.players = this.players.map((player, index) => ({
      id: player.id,
      name: player.name,
      isAI: player.isAI || false,
      isHost: index === 0,
      isActive: true,
      score: 0,
      hand: []
    }));

    // 開始第一局
    this.startNextRound();
  }

  /**
   * 開始下一局
   */
  startNextRound() {
    console.log('[LocalGameController] 開始新局');

    // 重置牌組
    this.deck = this.shuffleDeck(this.createDeck());

    // 重置跟猜狀態
    this.followGuessState = null;

    // 增加局數
    this.gameState.round++;

    // 抽取蓋牌
    this.gameState.hiddenCards = this.deck.splice(0, HIDDEN_CARDS_COUNT);

    // 發牌給玩家
    const cardsPerPlayer = Math.floor(this.deck.length / this.gameState.players.length);
    this.gameState.players.forEach((player, index) => {
      const startIndex = index * cardsPerPlayer;
      player.hand = this.deck.slice(startIndex, startIndex + cardsPerPlayer);
      player.isActive = true;

      // 如果是 AI 玩家，更新其手牌
      const aiInstance = this.players.find(p => p.id === player.id);
      if (aiInstance && aiInstance.isAI) {
        aiInstance.setHand(player.hand);
      }
    });

    // 設定起始玩家（輪流）
    this.gameState.currentPlayerIndex = (this.gameState.round - 1) % this.gameState.players.length;

    // 設定遊戲階段
    this.gameState.gamePhase = GAME_PHASE_PLAYING;

    // 廣播局開始事件
    this.broadcastEvent({
      type: 'roundStarted',
      round: this.gameState.round,
      startPlayerIndex: this.gameState.currentPlayerIndex
    });

    // 通知狀態變更
    this.emitStateChange();

    console.log(`[LocalGameController] 第 ${this.gameState.round} 局開始，起始玩家: ${this.gameState.players[this.gameState.currentPlayerIndex].name}`);
  }

  /**
   * 處理遊戲動作
   *
   * @param {Object} action - 動作物件
   */
  async handleAction(action) {
    console.log('[LocalGameController] 處理動作:', action);

    if (action.type === 'question') {
      await this.handleQuestion(action);
    } else if (action.type === 'guess') {
      await this.handleGuess(action);
    }
  }

  /**
   * 處理問牌動作
   *
   * @param {Object} action - 問牌動作
   */
  async handleQuestion(action) {
    const { playerId, targetPlayerId, colors, questionType, giveColor, getColor } = action;

    const askingPlayer = this.gameState.players.find(p => p.id === playerId);
    const targetPlayer = this.gameState.players.find(p => p.id === targetPlayerId);

    if (!askingPlayer || !targetPlayer) {
      console.error('[LocalGameController] 找不到玩家');
      return;
    }

    console.log(`[LocalGameController] ${askingPlayer.name} 向 ${targetPlayer.name} 問牌 (類型 ${questionType})`);

    let cardsToTransfer = [];

    // 根據問牌類型處理
    if (questionType === QUESTION_TYPE_ONE_EACH) {
      // 類型 1：兩個顏色各一張
      colors.forEach(color => {
        const card = targetPlayer.hand.find(c => c.color === color);
        if (card) {
          cardsToTransfer.push(card);
        }
      });
    } else if (questionType === QUESTION_TYPE_ALL_ONE_COLOR) {
      // 類型 2：其中一種顏色全部
      // 需要目標玩家選擇給哪種顏色（此處簡化為隨機）
      const availableColors = colors.filter(color =>
        targetPlayer.hand.some(c => c.color === color)
      );

      if (availableColors.length > 0) {
        const chosenColor = availableColors[Math.floor(Math.random() * availableColors.length)];
        cardsToTransfer = targetPlayer.hand.filter(c => c.color === chosenColor);
      }
    } else if (questionType === QUESTION_TYPE_GIVE_ONE_GET_ALL) {
      // 類型 3：給一張要全部
      const giveCard = askingPlayer.hand.find(c => c.color === giveColor);
      const getCards = targetPlayer.hand.filter(c => c.color === getColor);

      if (giveCard) {
        // 問牌者給出一張
        askingPlayer.hand = askingPlayer.hand.filter(c => c.id !== giveCard.id);
        targetPlayer.hand.push(giveCard);

        // 目標玩家給出全部
        cardsToTransfer = getCards;
      }
    }

    // 轉移卡牌
    if (cardsToTransfer.length > 0) {
      targetPlayer.hand = targetPlayer.hand.filter(
        card => !cardsToTransfer.some(c => c.id === card.id)
      );
      askingPlayer.hand.push(...cardsToTransfer);
    }

    // 廣播卡牌轉移事件
    this.broadcastEvent({
      type: 'CARD_TRANSFER',
      from: targetPlayerId,
      to: playerId,
      cards: cardsToTransfer,
      questionType
    });

    // 進入問牌後階段
    this.gameState.gamePhase = GAME_PHASE_POST_QUESTION;
    this.emitStateChange();

    console.log(`[LocalGameController] 轉移了 ${cardsToTransfer.length} 張牌`);
  }

  /**
   * 結束回合
   *
   * @param {Object} options - 選項
   * @param {string} options.playerId - 玩家 ID
   * @param {Object} options.prediction - 預測（可選）
   */
  endTurn({ playerId, prediction }) {
    console.log('[LocalGameController] 結束回合:', playerId);

    // 廣播回合結束事件
    this.broadcastEvent({
      type: 'turnEnded',
      playerId,
      prediction,
      playerName: this.gameState.players.find(p => p.id === playerId)?.name
    });

    // 切換到下一個玩家
    this.nextTurn();
  }

  /**
   * 切換到下一個玩家
   */
  nextTurn() {
    const nextIndex = getNextPlayerIndex(
      this.gameState.currentPlayerIndex,
      this.gameState.players
    );

    if (nextIndex === -1) {
      console.log('[LocalGameController] 沒有活躍玩家，結束遊戲');
      this.endGame();
      return;
    }

    this.gameState.currentPlayerIndex = nextIndex;
    this.gameState.gamePhase = GAME_PHASE_PLAYING;
    this.emitStateChange();

    console.log(`[LocalGameController] 切換到玩家: ${this.gameState.players[nextIndex].name}`);
  }

  /**
   * 處理猜牌動作
   *
   * @param {Object} action - 猜牌動作
   */
  async handleGuess(action) {
    const { playerId, guessedColors } = action;

    const guessingPlayer = this.gameState.players.find(p => p.id === playerId);
    if (!guessingPlayer) {
      console.error('[LocalGameController] 找不到猜牌玩家');
      return;
    }

    console.log(`[LocalGameController] ${guessingPlayer.name} 猜牌: [${guessedColors.join(', ')}]`);

    // 驗證猜牌
    const result = validateGuess(guessedColors, this.gameState.hiddenCards);

    // 初始化跟猜狀態
    const otherActivePlayers = this.gameState.players.filter(
      p => p.id !== playerId && p.isActive
    );

    if (otherActivePlayers.length > 0) {
      // 有其他玩家，進入跟猜階段
      this.followGuessState = {
        guessingPlayerId: playerId,
        guessedColors,
        isCorrect: result.isCorrect,
        decisionOrder: otherActivePlayers.map(p => p.id),
        currentDeciderIndex: 0,
        decisions: {},
        followingPlayers: [],
        declinedPlayers: []
      };

      this.gameState.gamePhase = GAME_PHASE_FOLLOW_GUESSING;

      // 廣播跟猜開始事件
      this.broadcastEvent({
        type: 'followGuessStarted',
        guessingPlayerId: playerId,
        guessedColors,
        decisionOrder: this.followGuessState.decisionOrder,
        currentDeciderId: this.followGuessState.decisionOrder[0],
        decisions: {}
      });

      this.emitStateChange();

      console.log('[LocalGameController] 進入跟猜階段');
    } else {
      // 沒有其他玩家，直接結算
      this.resolveGuess(playerId, guessedColors, result.isCorrect, []);
    }
  }

  /**
   * 處理跟猜回應
   *
   * @param {Object} options - 選項
   * @param {string} options.playerId - 玩家 ID
   * @param {boolean} options.isFollowing - 是否跟猜
   */
  async handleFollowGuessResponse({ playerId, isFollowing }) {
    if (!this.followGuessState) {
      console.error('[LocalGameController] 沒有跟猜狀態');
      return;
    }

    console.log(`[LocalGameController] ${playerId} 決定: ${isFollowing ? '跟猜' : '不跟'}`);

    // 記錄決定
    this.followGuessState.decisions[playerId] = isFollowing ? 'follow' : 'pass';

    if (isFollowing) {
      this.followGuessState.followingPlayers.push(playerId);
    } else {
      this.followGuessState.declinedPlayers.push(playerId);
    }

    // 移動到下一個決定者
    this.followGuessState.currentDeciderIndex++;

    if (this.followGuessState.currentDeciderIndex < this.followGuessState.decisionOrder.length) {
      // 還有玩家需要決定
      const nextDeciderId = this.followGuessState.decisionOrder[this.followGuessState.currentDeciderIndex];

      // 廣播跟猜更新事件
      this.broadcastEvent({
        type: 'followGuessUpdate',
        playerId,
        isFollowing,
        currentDeciderId: nextDeciderId,
        decisions: this.followGuessState.decisions,
        followingPlayers: this.followGuessState.followingPlayers,
        declinedPlayers: this.followGuessState.declinedPlayers
      });

      this.emitStateChange();
    } else {
      // 所有玩家都決定完畢，結算猜牌
      this.resolveGuess(
        this.followGuessState.guessingPlayerId,
        this.followGuessState.guessedColors,
        this.followGuessState.isCorrect,
        this.followGuessState.followingPlayers
      );
    }
  }

  /**
   * 結算猜牌
   *
   * @param {string} guessingPlayerId - 猜牌玩家 ID
   * @param {Array} guessedColors - 猜測的顏色
   * @param {boolean} isCorrect - 是否猜對
   * @param {Array} followingPlayers - 跟猜玩家 ID 陣列
   */
  resolveGuess(guessingPlayerId, guessedColors, isCorrect, followingPlayers) {
    console.log(`[LocalGameController] 結算猜牌 - ${isCorrect ? '正確' : '錯誤'}`);

    const scoreChanges = {};

    const guessingPlayer = this.gameState.players.find(p => p.id === guessingPlayerId);

    if (isCorrect) {
      // 猜對：猜牌者 +3 分，跟猜者 +1 分
      guessingPlayer.score += 3;
      scoreChanges[guessingPlayerId] = 3;

      followingPlayers.forEach(playerId => {
        const player = this.gameState.players.find(p => p.id === playerId);
        if (player) {
          player.score += 1;
          scoreChanges[playerId] = 1;
        }
      });
    } else {
      // 猜錯：猜牌者和跟猜者退出當局，-1 分（最低 0 分）
      guessingPlayer.isActive = false;
      guessingPlayer.score = Math.max(0, guessingPlayer.score - 1);
      scoreChanges[guessingPlayerId] = -1;

      followingPlayers.forEach(playerId => {
        const player = this.gameState.players.find(p => p.id === playerId);
        if (player) {
          player.isActive = false;
          player.score = Math.max(0, player.score - 1);
          scoreChanges[playerId] = -1;
        }
      });
    }

    // 檢查是否有玩家達到 7 分（獲勝）
    const winner = this.gameState.players.find(p => p.score >= 7);

    if (winner) {
      this.gameState.winner = winner.id;
      this.gameState.gamePhase = GAME_PHASE_FINISHED;
      console.log(`[LocalGameController] ${winner.name} 獲勝！`);
    } else {
      this.gameState.gamePhase = GAME_PHASE_ROUND_END;
    }

    // 廣播猜牌結果事件
    this.broadcastEvent({
      type: 'guessResult',
      isCorrect,
      scoreChanges,
      hiddenCards: this.gameState.hiddenCards,
      guessingPlayerId,
      followingPlayers,
      predictionResults: [] // TODO: 預測結算
    });

    this.emitStateChange();

    // 清除跟猜狀態
    this.followGuessState = null;
  }

  /**
   * 結束遊戲
   */
  endGame() {
    console.log('[LocalGameController] 遊戲結束');
    this.gameState.gamePhase = GAME_PHASE_FINISHED;
    this.emitStateChange();
  }

  /**
   * 廣播事件給所有玩家（主要是 AI 玩家）
   *
   * @param {Object} event - 事件物件
   */
  broadcastEvent(event) {
    if (this.onEvent) {
      this.onEvent(event);
    }
  }

  /**
   * 發送狀態變更通知
   */
  emitStateChange() {
    if (this.onStateChange) {
      this.onStateChange({ ...this.gameState });
    }
  }

  /**
   * 取得當前遊戲狀態
   *
   * @returns {Object} 遊戲狀態
   */
  getState() {
    return { ...this.gameState };
  }

  /**
   * 取得當前玩家
   *
   * @returns {Object|null} 當前玩家
   */
  getCurrentPlayer() {
    return this.gameState.players[this.gameState.currentPlayerIndex] || null;
  }
}

export default LocalGameController;
