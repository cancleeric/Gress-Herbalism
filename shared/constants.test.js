/**
 * 遊戲常數單元測試
 * 工作單 0002
 */

const {
  COLORS,
  CARD_COUNTS,
  TOTAL_CARDS,
  ALL_COLORS,
  MIN_PLAYERS,
  MAX_PLAYERS,
  HIDDEN_CARDS_COUNT,
  GAME_PHASE_WAITING,
  GAME_PHASE_PLAYING,
  GAME_PHASE_FINISHED,
  GAME_PHASES,
  QUESTION_TYPE_ONE_EACH,
  QUESTION_TYPE_ALL_ONE_COLOR,
  QUESTION_TYPE_GIVE_ONE_GET_ALL,
  QUESTION_TYPES,
  QUESTION_TYPE_DESCRIPTIONS,
  ACTION_TYPE_QUESTION,
  ACTION_TYPE_GUESS,
  ACTION_TYPES,
  DEFAULT_GAME_CONFIG,
  isValidColor,
  isValidPlayerCount,
  isValidQuestionType,
  isValidGamePhase,
  getCardCount,
  getQuestionTypeDescription
} = require('./constants/herbalism');

describe('牌組配置常數', () => {
  test('顏色定義應包含四種顏色', () => {
    expect(COLORS.RED).toBe('red');
    expect(COLORS.YELLOW).toBe('yellow');
    expect(COLORS.GREEN).toBe('green');
    expect(COLORS.BLUE).toBe('blue');
  });

  test('各顏色牌數應正確', () => {
    expect(CARD_COUNTS[COLORS.RED]).toBe(2);
    expect(CARD_COUNTS[COLORS.YELLOW]).toBe(3);
    expect(CARD_COUNTS[COLORS.GREEN]).toBe(4);
    expect(CARD_COUNTS[COLORS.BLUE]).toBe(5);
  });

  test('總牌數應為 14', () => {
    expect(TOTAL_CARDS).toBe(14);
  });

  test('總牌數應等於各顏色牌數之和', () => {
    const sum = Object.values(CARD_COUNTS).reduce((a, b) => a + b, 0);
    expect(sum).toBe(TOTAL_CARDS);
  });

  test('ALL_COLORS 應包含所有顏色', () => {
    expect(ALL_COLORS).toHaveLength(4);
    expect(ALL_COLORS).toContain('red');
    expect(ALL_COLORS).toContain('yellow');
    expect(ALL_COLORS).toContain('green');
    expect(ALL_COLORS).toContain('blue');
  });
});

describe('遊戲規則常數', () => {
  test('玩家數量限制應正確', () => {
    expect(MIN_PLAYERS).toBe(3);
    expect(MAX_PLAYERS).toBe(4);
  });

  test('蓋牌數量應為 2', () => {
    expect(HIDDEN_CARDS_COUNT).toBe(2);
  });
});

describe('遊戲階段常數', () => {
  test('遊戲階段值應正確', () => {
    expect(GAME_PHASE_WAITING).toBe('waiting');
    expect(GAME_PHASE_PLAYING).toBe('playing');
    expect(GAME_PHASE_FINISHED).toBe('finished');
  });

  test('GAME_PHASES 應包含所有階段', () => {
    expect(GAME_PHASES).toContain('waiting');
    expect(GAME_PHASES).toContain('playing');
    expect(GAME_PHASES).toContain('finished');
  });
});

describe('問牌類型常數', () => {
  test('問牌類型值應正確', () => {
    expect(QUESTION_TYPE_ONE_EACH).toBe(1);
    expect(QUESTION_TYPE_ALL_ONE_COLOR).toBe(2);
    expect(QUESTION_TYPE_GIVE_ONE_GET_ALL).toBe(3);
  });

  test('QUESTION_TYPES 應包含所有類型', () => {
    expect(QUESTION_TYPES).toHaveLength(3);
    expect(QUESTION_TYPES).toContain(1);
    expect(QUESTION_TYPES).toContain(2);
    expect(QUESTION_TYPES).toContain(3);
  });

  test('問牌類型描述應正確', () => {
    expect(QUESTION_TYPE_DESCRIPTIONS[1]).toBe('兩個顏色各一張');
    expect(QUESTION_TYPE_DESCRIPTIONS[2]).toBe('其中一種顏色全部');
    expect(QUESTION_TYPE_DESCRIPTIONS[3]).toBe('給其中一種顏色一張，要另一種顏色全部');
  });
});

describe('動作類型常數', () => {
  test('動作類型值應正確', () => {
    expect(ACTION_TYPE_QUESTION).toBe('question');
    expect(ACTION_TYPE_GUESS).toBe('guess');
  });

  test('ACTION_TYPES 應包含所有類型', () => {
    expect(ACTION_TYPES).toHaveLength(2);
    expect(ACTION_TYPES).toContain('question');
    expect(ACTION_TYPES).toContain('guess');
  });
});

describe('預設遊戲配置', () => {
  test('DEFAULT_GAME_CONFIG 應包含正確配置', () => {
    expect(DEFAULT_GAME_CONFIG.minPlayers).toBe(3);
    expect(DEFAULT_GAME_CONFIG.maxPlayers).toBe(4);
    expect(DEFAULT_GAME_CONFIG.totalCards).toBe(14);
    expect(DEFAULT_GAME_CONFIG.hiddenCardsCount).toBe(2);
    expect(DEFAULT_GAME_CONFIG.cardCounts).toEqual(CARD_COUNTS);
  });
});

describe('工具函數', () => {
  describe('isValidColor', () => {
    test('有效顏色應返回 true', () => {
      expect(isValidColor('red')).toBe(true);
      expect(isValidColor('yellow')).toBe(true);
      expect(isValidColor('green')).toBe(true);
      expect(isValidColor('blue')).toBe(true);
    });

    test('無效顏色應返回 false', () => {
      expect(isValidColor('purple')).toBe(false);
      expect(isValidColor('orange')).toBe(false);
      expect(isValidColor('')).toBe(false);
      expect(isValidColor(null)).toBe(false);
    });
  });

  describe('isValidPlayerCount', () => {
    test('有效玩家數應返回 true', () => {
      expect(isValidPlayerCount(3)).toBe(true);
      expect(isValidPlayerCount(4)).toBe(true);
    });

    test('無效玩家數應返回 false', () => {
      expect(isValidPlayerCount(2)).toBe(false);
      expect(isValidPlayerCount(5)).toBe(false);
      expect(isValidPlayerCount(0)).toBe(false);
    });
  });

  describe('isValidQuestionType', () => {
    test('有效問牌類型應返回 true', () => {
      expect(isValidQuestionType(1)).toBe(true);
      expect(isValidQuestionType(2)).toBe(true);
      expect(isValidQuestionType(3)).toBe(true);
    });

    test('無效問牌類型應返回 false', () => {
      expect(isValidQuestionType(0)).toBe(false);
      expect(isValidQuestionType(4)).toBe(false);
      expect(isValidQuestionType(-1)).toBe(false);
    });
  });

  describe('isValidGamePhase', () => {
    test('有效遊戲階段應返回 true', () => {
      expect(isValidGamePhase('waiting')).toBe(true);
      expect(isValidGamePhase('playing')).toBe(true);
      expect(isValidGamePhase('finished')).toBe(true);
    });

    test('無效遊戲階段應返回 false', () => {
      expect(isValidGamePhase('started')).toBe(false);
      expect(isValidGamePhase('')).toBe(false);
    });
  });

  describe('getCardCount', () => {
    test('應返回正確的牌數', () => {
      expect(getCardCount('red')).toBe(2);
      expect(getCardCount('yellow')).toBe(3);
      expect(getCardCount('green')).toBe(4);
      expect(getCardCount('blue')).toBe(5);
    });

    test('無效顏色應返回 0', () => {
      expect(getCardCount('purple')).toBe(0);
      expect(getCardCount('')).toBe(0);
    });
  });

  describe('getQuestionTypeDescription', () => {
    test('應返回正確的描述', () => {
      expect(getQuestionTypeDescription(1)).toBe('兩個顏色各一張');
      expect(getQuestionTypeDescription(2)).toBe('其中一種顏色全部');
      expect(getQuestionTypeDescription(3)).toBe('給其中一種顏色一張，要另一種顏色全部');
    });

    test('無效類型應返回未知類型', () => {
      expect(getQuestionTypeDescription(0)).toBe('未知類型');
      expect(getQuestionTypeDescription(99)).toBe('未知類型');
    });
  });
});
