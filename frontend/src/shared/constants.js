/**
 * 遊戲常數定義
 *
 * 此檔案包含所有遊戲相關的常數定義，包括：
 * - 牌組配置（顏色、牌數）
 * - 遊戲規則常數（玩家數量、蓋牌數量）
 * - 遊戲階段常數
 * - 問牌類型常數
 * - 動作類型常數
 *
 * @module constants
 */

// ==================== 牌組配置 ====================

/**
 * 顏色定義
 * @readonly
 * @enum {string}
 */
export const COLORS = {
  /** 紅色 */
  RED: 'red',
  /** 黃色 */
  YELLOW: 'yellow',
  /** 綠色 */
  GREEN: 'green',
  /** 藍色 */
  BLUE: 'blue'
};

/**
 * 各顏色的牌數配置
 * @readonly
 * @type {Object<string, number>}
 */
export const CARD_COUNTS = {
  [COLORS.RED]: 2,      // 紅色2張
  [COLORS.YELLOW]: 3,  // 黃色3張
  [COLORS.GREEN]: 4,   // 綠色4張
  [COLORS.BLUE]: 5     // 藍色5張
};

/**
 * 總牌數
 * @readonly
 * @type {number}
 */
export const TOTAL_CARDS = 14;

/**
 * 所有顏色的陣列
 * @readonly
 * @type {string[]}
 */
export const ALL_COLORS = Object.values(COLORS);

// ==================== 遊戲規則常數 ====================

/**
 * 最小玩家數
 * @readonly
 * @type {number}
 */
export const MIN_PLAYERS = 3;

/**
 * 最大玩家數
 * @readonly
 * @type {number}
 */
export const MAX_PLAYERS = 4;

/**
 * 蓋牌數量
 * @readonly
 * @type {number}
 */
export const HIDDEN_CARDS_COUNT = 2;

// ==================== 遊戲階段常數 ====================

/**
 * 遊戲階段：等待中
 * @readonly
 * @type {string}
 */
export const GAME_PHASE_WAITING = 'waiting';

/**
 * 遊戲階段：進行中
 * @readonly
 * @type {string}
 */
export const GAME_PHASE_PLAYING = 'playing';

/**
 * 遊戲階段：跟猜中
 * @readonly
 * @type {string}
 */
export const GAME_PHASE_FOLLOW_GUESSING = 'followGuessing';

/**
 * 遊戲階段：局結束
 * @readonly
 * @type {string}
 */
export const GAME_PHASE_ROUND_END = 'roundEnd';

/**
 * 遊戲階段：已結束
 * @readonly
 * @type {string}
 */
export const GAME_PHASE_FINISHED = 'finished';

/**
 * 遊戲階段：問牌後預測
 * @readonly
 * @type {string}
 */
export const GAME_PHASE_POST_QUESTION = 'postQuestion';

/**
 * 所有遊戲階段
 * @readonly
 * @type {string[]}
 */
export const GAME_PHASES = [
  GAME_PHASE_WAITING,
  GAME_PHASE_PLAYING,
  GAME_PHASE_POST_QUESTION,
  GAME_PHASE_FOLLOW_GUESSING,
  GAME_PHASE_ROUND_END,
  GAME_PHASE_FINISHED
];

// ==================== 問牌類型常數 ====================

/**
 * 問牌類型：兩個顏色各一張
 * @readonly
 * @type {number}
 */
export const QUESTION_TYPE_ONE_EACH = 1;

/**
 * 問牌類型：其中一種顏色全部
 * @readonly
 * @type {number}
 */
export const QUESTION_TYPE_ALL_ONE_COLOR = 2;

/**
 * 問牌類型：給其中一種顏色一張，要另一種顏色全部
 * @readonly
 * @type {number}
 */
export const QUESTION_TYPE_GIVE_ONE_GET_ALL = 3;

/**
 * 所有問牌類型
 * @readonly
 * @type {number[]}
 */
export const QUESTION_TYPES = [
  QUESTION_TYPE_ONE_EACH,
  QUESTION_TYPE_ALL_ONE_COLOR,
  QUESTION_TYPE_GIVE_ONE_GET_ALL
];

/**
 * 問牌類型描述
 * @readonly
 * @type {Object<number, string>}
 */
export const QUESTION_TYPE_DESCRIPTIONS = {
  [QUESTION_TYPE_ONE_EACH]: '兩個顏色各一張',
  [QUESTION_TYPE_ALL_ONE_COLOR]: '其中一種顏色全部',
  [QUESTION_TYPE_GIVE_ONE_GET_ALL]: '給其中一種顏色一張，要另一種顏色全部'
};

// ==================== 動作類型常數 ====================

/**
 * 動作類型：問牌
 * @readonly
 * @type {string}
 */
export const ACTION_TYPE_QUESTION = 'question';

/**
 * 動作類型：猜牌
 * @readonly
 * @type {string}
 */
export const ACTION_TYPE_GUESS = 'guess';

/**
 * 所有動作類型
 * @readonly
 * @type {string[]}
 */
export const ACTION_TYPES = [
  ACTION_TYPE_QUESTION,
  ACTION_TYPE_GUESS
];

// ==================== 顏色組合牌常數 ====================

/**
 * 六張顏色組合牌定義
 * 從四種顏色中選兩種的所有組合
 * @readonly
 * @type {Array<{id: string, colors: string[], name: string}>}
 */
export const COLOR_COMBINATION_CARDS = [
  { id: 'red-green', colors: ['red', 'green'], name: '紅綠' },
  { id: 'green-blue', colors: ['green', 'blue'], name: '綠藍' },
  { id: 'green-yellow', colors: ['green', 'yellow'], name: '綠黃' },
  { id: 'red-blue', colors: ['red', 'blue'], name: '紅藍' },
  { id: 'yellow-red', colors: ['yellow', 'red'], name: '黃紅' },
  { id: 'yellow-blue', colors: ['yellow', 'blue'], name: '黃藍' },
];

// ==================== 預設值 ====================

/**
 * 預設遊戲配置
 * @readonly
 * @type {Object}
 */
export const DEFAULT_GAME_CONFIG = {
  minPlayers: MIN_PLAYERS,
  maxPlayers: MAX_PLAYERS,
  totalCards: TOTAL_CARDS,
  hiddenCardsCount: HIDDEN_CARDS_COUNT,
  cardCounts: CARD_COUNTS
};

// ==================== 工具函數 ====================

/**
 * 驗證顏色是否有效
 * @param {string} color - 要驗證的顏色
 * @returns {boolean} 顏色是否有效
 */
export function isValidColor(color) {
  return ALL_COLORS.includes(color);
}

/**
 * 驗證玩家數量是否有效
 * @param {number} count - 玩家數量
 * @returns {boolean} 玩家數量是否有效
 */
export function isValidPlayerCount(count) {
  return count >= MIN_PLAYERS && count <= MAX_PLAYERS;
}

/**
 * 驗證問牌類型是否有效
 * @param {number} type - 問牌類型
 * @returns {boolean} 問牌類型是否有效
 */
export function isValidQuestionType(type) {
  return QUESTION_TYPES.includes(type);
}

/**
 * 驗證遊戲階段是否有效
 * @param {string} phase - 遊戲階段
 * @returns {boolean} 遊戲階段是否有效
 */
export function isValidGamePhase(phase) {
  return GAME_PHASES.includes(phase);
}

/**
 * 取得指定顏色的牌數
 * @param {string} color - 顏色
 * @returns {number} 該顏色的牌數
 */
export function getCardCount(color) {
  return CARD_COUNTS[color] || 0;
}

/**
 * 取得問牌類型的描述
 * @param {number} type - 問牌類型
 * @returns {string} 問牌類型描述
 */
export function getQuestionTypeDescription(type) {
  return QUESTION_TYPE_DESCRIPTIONS[type] || '未知類型';
}

// ==================== AI 玩家常數 ====================

/**
 * AI 難度等級
 * @readonly
 * @enum {string}
 */
export const AI_DIFFICULTY = {
  /** 簡單 */
  EASY: 'easy',
  /** 中等 */
  MEDIUM: 'medium',
  /** 困難 */
  HARD: 'hard'
};

/**
 * AI 思考延遲（毫秒）
 * @readonly
 * @type {Object<string, number>}
 */
export const AI_THINK_DELAY = {
  [AI_DIFFICULTY.EASY]: 1000,
  [AI_DIFFICULTY.MEDIUM]: 1500,
  [AI_DIFFICULTY.HARD]: 2000
};

/**
 * 玩家類型
 * @readonly
 * @enum {string}
 */
export const PLAYER_TYPE = {
  /** 人類玩家 */
  HUMAN: 'human',
  /** AI 玩家 */
  AI: 'ai'
};

/**
 * 驗證是否為有效的 AI 難度
 * @param {string} difficulty - 難度值
 * @returns {boolean} 是否有效
 */
export function isValidAIDifficulty(difficulty) {
  return Object.values(AI_DIFFICULTY).includes(difficulty);
}

/**
 * 取得 AI 玩家名稱
 * @param {number} index - AI 玩家索引
 * @param {string} difficulty - 難度
 * @returns {string} AI 玩家名稱
 */
export function getAIPlayerName(index, difficulty) {
  const difficultyNames = {
    [AI_DIFFICULTY.EASY]: '初學者',
    [AI_DIFFICULTY.MEDIUM]: '中級',
    [AI_DIFFICULTY.HARD]: '專家'
  };
  return `AI ${difficultyNames[difficulty] || ''} ${index + 1}`;
}

/**
 * 所有 AI 難度等級的陣列
 * @readonly
 * @type {string[]}
 */
export const ALL_AI_DIFFICULTIES = Object.values(AI_DIFFICULTY);

/**
 * AI 玩家名稱列表
 * @readonly
 * @type {string[]}
 */
export const AI_PLAYER_NAMES = ['小草', '小花', '小樹'];

/**
 * 取得 AI 難度描述
 * @param {string} difficulty - 難度值
 * @returns {string} 難度描述
 */
export function getAIDifficultyDescription(difficulty) {
  const descriptions = {
    [AI_DIFFICULTY.EASY]: '簡單 - 適合新手',
    [AI_DIFFICULTY.MEDIUM]: '中等 - 平衡挑戰',
    [AI_DIFFICULTY.HARD]: '困難 - 高級玩家'
  };
  return descriptions[difficulty] || '未知難度';
}
