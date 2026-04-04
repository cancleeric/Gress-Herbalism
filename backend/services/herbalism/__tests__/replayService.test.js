/**
 * 本草遊戲回放服務測試
 */

const {
  HerbalismReplayService,
  herbalismReplayService,
  HERBALISM_EVENT_TYPES,
} = require('../replayService');

// Mock supabaseClient
jest.mock('../../supabaseClient', () => ({
  isSupabaseEnabled: jest.fn(() => false),
  getSupabase: jest.fn(),
}));

const { isSupabaseEnabled, getSupabase } = require('../../supabaseClient');

describe('HERBALISM_EVENT_TYPES', () => {
  it('應該包含所有本草事件類型', () => {
    expect(HERBALISM_EVENT_TYPES.GAME_START).toBe('game_start');
    expect(HERBALISM_EVENT_TYPES.QUESTION).toBe('question');
    expect(HERBALISM_EVENT_TYPES.COLOR_CHOICE).toBe('color_choice');
    expect(HERBALISM_EVENT_TYPES.PREDICTION).toBe('prediction');
    expect(HERBALISM_EVENT_TYPES.GUESS).toBe('guess');
    expect(HERBALISM_EVENT_TYPES.FOLLOW_GUESS).toBe('follow_guess');
    expect(HERBALISM_EVENT_TYPES.ROUND_END).toBe('round_end');
    expect(HERBALISM_EVENT_TYPES.GAME_END).toBe('game_end');
  });
});

describe('HerbalismReplayService', () => {
  let service;

  beforeEach(() => {
    service = new HerbalismReplayService();
    jest.clearAllMocks();
  });

  describe('isAvailable()', () => {
    it('Supabase 未啟用時應回傳 false', () => {
      isSupabaseEnabled.mockReturnValue(false);
      expect(service.isAvailable()).toBe(false);
    });

    it('Supabase 啟用時應回傳 true', () => {
      isSupabaseEnabled.mockReturnValue(true);
      expect(service.isAvailable()).toBe(true);
    });
  });

  describe('startRecording()', () => {
    it('應建立含 GAME_START 事件的緩衝區', () => {
      const initialState = {
        players: [
          { id: 'p1', name: '玩家一' },
          { id: 'p2', name: '玩家二' },
          { id: 'p3', name: '玩家三' },
        ],
        currentRound: 1,
      };

      service.startRecording('game_001', initialState);

      expect(service.getEventCount('game_001')).toBe(1);
    });

    it('GAME_START 事件應包含玩家資訊', () => {
      const initialState = {
        players: [
          { id: 'p1', name: '玩家一', hand: ['card1'] },
          { id: 'p2', name: '玩家二', hand: ['card2'] },
        ],
        currentRound: 1,
      };

      service.startRecording('game_002', initialState);

      const buffer = service.eventBuffers.get('game_002');
      expect(buffer[0].type).toBe(HERBALISM_EVENT_TYPES.GAME_START);
      expect(buffer[0].data.playerCount).toBe(2);
      expect(buffer[0].data.players).toHaveLength(2);
      expect(buffer[0].data.players[0]).toEqual({ id: 'p1', name: '玩家一' });
    });
  });

  describe('recordEvent()', () => {
    it('應新增事件到緩衝區', () => {
      service.startRecording('game_003', { players: [], currentRound: 1 });
      service.recordEvent('game_003', HERBALISM_EVENT_TYPES.QUESTION, {
        askingPlayerId: 'p1',
        targetPlayerId: 'p2',
        colors: ['red', 'green'],
      });

      expect(service.getEventCount('game_003')).toBe(2);
    });

    it('緩衝區不存在時不應拋出錯誤', () => {
      expect(() => {
        service.recordEvent('nonexistent', HERBALISM_EVENT_TYPES.QUESTION, {});
      }).not.toThrow();
    });
  });

  describe('recordQuestion()', () => {
    it('應記錄問牌事件', () => {
      service.startRecording('game_004', { players: [], currentRound: 1 });
      service.recordQuestion('game_004', 'p1', 'p2', ['red', 'blue']);

      const buffer = service.eventBuffers.get('game_004');
      const event = buffer.find(e => e.type === HERBALISM_EVENT_TYPES.QUESTION);
      expect(event).toBeDefined();
      expect(event.data.askingPlayerId).toBe('p1');
      expect(event.data.targetPlayerId).toBe('p2');
      expect(event.data.colors).toEqual(['red', 'blue']);
    });
  });

  describe('recordColorChoice()', () => {
    it('應記錄顏色選擇事件', () => {
      service.startRecording('game_005', { players: [], currentRound: 1 });
      service.recordColorChoice('game_005', 'p2', 'red', 3);

      const buffer = service.eventBuffers.get('game_005');
      const event = buffer.find(e => e.type === HERBALISM_EVENT_TYPES.COLOR_CHOICE);
      expect(event).toBeDefined();
      expect(event.data.chosenColor).toBe('red');
      expect(event.data.cardsTransferred).toBe(3);
    });
  });

  describe('recordPrediction()', () => {
    it('應記錄預測事件', () => {
      service.startRecording('game_006', { players: [], currentRound: 1 });
      service.recordPrediction('game_006', 'p1', 'blue', 2);

      const buffer = service.eventBuffers.get('game_006');
      const event = buffer.find(e => e.type === HERBALISM_EVENT_TYPES.PREDICTION);
      expect(event).toBeDefined();
      expect(event.data.playerId).toBe('p1');
      expect(event.data.color).toBe('blue');
      expect(event.data.round).toBe(2);
    });
  });

  describe('recordGuess()', () => {
    it('應記錄猜牌事件', () => {
      service.startRecording('game_007', { players: [], currentRound: 1 });
      service.recordGuess('game_007', 'p1', ['red', 'blue'], true);

      const buffer = service.eventBuffers.get('game_007');
      const event = buffer.find(e => e.type === HERBALISM_EVENT_TYPES.GUESS);
      expect(event).toBeDefined();
      expect(event.data.playerId).toBe('p1');
      expect(event.data.guessedColors).toEqual(['red', 'blue']);
      expect(event.data.isCorrect).toBe(true);
    });
  });

  describe('recordFollowGuess()', () => {
    it('應記錄跟猜事件', () => {
      service.startRecording('game_008', { players: [], currentRound: 1 });
      service.recordFollowGuess('game_008', 'p2', true);

      const buffer = service.eventBuffers.get('game_008');
      const event = buffer.find(e => e.type === HERBALISM_EVENT_TYPES.FOLLOW_GUESS);
      expect(event).toBeDefined();
      expect(event.data.playerId).toBe('p2');
      expect(event.data.isFollowing).toBe(true);
    });
  });

  describe('recordRoundEnd()', () => {
    it('應記錄局結束事件', () => {
      service.startRecording('game_009', { players: [], currentRound: 1 });
      service.recordRoundEnd(
        'game_009',
        1,
        { p1: 3, p2: 0 },
        [{ color: 'red' }, { color: 'blue' }]
      );

      const buffer = service.eventBuffers.get('game_009');
      const event = buffer.find(e => e.type === HERBALISM_EVENT_TYPES.ROUND_END);
      expect(event).toBeDefined();
      expect(event.data.round).toBe(1);
      expect(event.data.hiddenCards).toEqual(['red', 'blue']);
    });
  });

  describe('endRecording()', () => {
    it('應新增 GAME_END 事件並清除緩衝區', async () => {
      isSupabaseEnabled.mockReturnValue(false);
      service.startRecording('game_010', { players: [], currentRound: 1 });

      await service.endRecording('game_010', {
        winner: 'p1',
        scores: { p1: 7 },
        currentRound: 3,
      });

      expect(service.getEventCount('game_010')).toBe(0);
    });

    it('緩衝區不存在時應回傳 false', async () => {
      const result = await service.endRecording('nonexistent', {});
      expect(result).toBe(false);
    });
  });

  describe('saveReplay()', () => {
    it('Supabase 不可用時應回傳 false', async () => {
      isSupabaseEnabled.mockReturnValue(false);
      const result = await service.saveReplay('game_011', []);
      expect(result).toBe(false);
    });

    it('Supabase 可用時應儲存並回傳 true', async () => {
      isSupabaseEnabled.mockReturnValue(true);
      const mockUpsert = jest.fn().mockResolvedValue({ error: null });
      getSupabase.mockReturnValue({
        from: jest.fn(() => ({ upsert: mockUpsert })),
      });

      const events = [
        { type: HERBALISM_EVENT_TYPES.GAME_START, timestamp: 1000, data: {} },
      ];

      const result = await service.saveReplay('game_012', events);
      expect(result).toBe(true);
      expect(mockUpsert).toHaveBeenCalled();
    });

    it('Supabase 回傳錯誤時應回傳 false', async () => {
      isSupabaseEnabled.mockReturnValue(true);
      const mockUpsert = jest.fn().mockResolvedValue({ error: { message: 'DB error' } });
      getSupabase.mockReturnValue({
        from: jest.fn(() => ({ upsert: mockUpsert })),
      });

      const result = await service.saveReplay('game_013', []);
      expect(result).toBe(false);
    });
  });

  describe('getReplay()', () => {
    it('Supabase 不可用時應回傳 null', async () => {
      isSupabaseEnabled.mockReturnValue(false);
      const result = await service.getReplay('game_014');
      expect(result).toBe(null);
    });

    it('Supabase 可用時應回傳回放資料', async () => {
      isSupabaseEnabled.mockReturnValue(true);
      const mockEvents = [{ t: 'game_start', d: 0 }];
      const mockSingle = jest.fn().mockResolvedValue({
        data: {
          game_id: 'game_015',
          events: mockEvents,
          compressed: true,
          size_bytes: 100,
          created_at: '2026-01-01',
        },
        error: null,
      });

      getSupabase.mockReturnValue({
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: mockSingle,
            })),
          })),
        })),
      });

      const result = await service.getReplay('game_015');
      expect(result).not.toBeNull();
      expect(result.gameId).toBe('game_015');
      expect(result.events).toBeDefined();
    });
  });

  describe('compressEvents()', () => {
    it('應壓縮事件並使用相對時間戳', () => {
      const events = [
        { type: 'game_start', timestamp: 1000, data: { playerCount: 3 } },
        { type: 'question', timestamp: 2000, data: { askingPlayerId: 'p1' } },
      ];

      const compressed = service.compressEvents(events);

      expect(compressed[0].t).toBe('game_start');
      expect(compressed[0].d).toBe(0);
      expect(compressed[1].t).toBe('question');
      expect(compressed[1].d).toBe(1000);
      expect(compressed[1].askingPlayerId).toBe('p1');
    });

    it('空陣列應回傳空陣列', () => {
      expect(service.compressEvents([])).toEqual([]);
    });

    it('非陣列輸入應回傳空陣列', () => {
      expect(service.compressEvents(null)).toEqual([]);
    });
  });

  describe('decompressEvents()', () => {
    it('應解壓縮事件並還原結構', () => {
      const compressed = [
        { t: 'game_start', d: 0, playerCount: 3 },
        { t: 'question', d: 1000, askingPlayerId: 'p1' },
      ];

      const events = service.decompressEvents(compressed);

      expect(events[0].type).toBe('game_start');
      expect(events[0].data.playerCount).toBe(3);
      expect(events[1].type).toBe('question');
      expect(events[1].data.askingPlayerId).toBe('p1');
    });

    it('空陣列應回傳空陣列', () => {
      expect(service.decompressEvents([])).toEqual([]);
    });

    it('非陣列輸入應回傳空陣列', () => {
      expect(service.decompressEvents(null)).toEqual([]);
    });
  });

  describe('sanitizeEventData()', () => {
    it('應移除敏感欄位', () => {
      const data = {
        playerId: 'p1',
        socketId: 'socket_123',
        ip: '127.0.0.1',
        token: 'secret',
        hand: ['card1', 'card2'],
        colors: ['red'],
      };

      const sanitized = service.sanitizeEventData(data);

      expect(sanitized.playerId).toBe('p1');
      expect(sanitized.colors).toEqual(['red']);
      expect(sanitized.socketId).toBeUndefined();
      expect(sanitized.ip).toBeUndefined();
      expect(sanitized.token).toBeUndefined();
      expect(sanitized.hand).toBeUndefined();
    });

    it('null 輸入應回傳空物件', () => {
      expect(service.sanitizeEventData(null)).toEqual({});
    });
  });

  describe('getEventCount()', () => {
    it('有緩衝區時應回傳正確數量', () => {
      service.startRecording('game_016', { players: [], currentRound: 1 });
      expect(service.getEventCount('game_016')).toBe(1);

      service.recordEvent('game_016', HERBALISM_EVENT_TYPES.QUESTION, {});
      expect(service.getEventCount('game_016')).toBe(2);
    });

    it('無緩衝區時應回傳 0', () => {
      expect(service.getEventCount('nonexistent')).toBe(0);
    });
  });

  describe('clearBuffer()', () => {
    it('應清除緩衝區', () => {
      service.startRecording('game_017', { players: [], currentRound: 1 });
      service.clearBuffer('game_017');
      expect(service.getEventCount('game_017')).toBe(0);
    });
  });
});

describe('單例匯出', () => {
  it('herbalismReplayService 應為 HerbalismReplayService 實例', () => {
    expect(herbalismReplayService).toBeInstanceOf(HerbalismReplayService);
  });
});
