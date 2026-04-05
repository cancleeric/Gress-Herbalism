/**
 * HerbalismReplayService 測試
 */

jest.mock('../../supabaseClient', () => ({
  getSupabase: jest.fn(),
  isSupabaseEnabled: jest.fn(),
}));

const { getSupabase, isSupabaseEnabled } = require('../../supabaseClient');
const {
  HerbalismReplayService,
  herbalismReplayService,
  HERBALISM_EVENT_TYPES,
} = require('../replayService');

describe('HerbalismReplayService', () => {
  let service;
  let mockSupabase;

  beforeEach(() => {
    service = new HerbalismReplayService();

    mockSupabase = {
      from: jest.fn(() => mockSupabase),
      upsert: jest.fn(() => mockSupabase),
      select: jest.fn(() => mockSupabase),
      eq: jest.fn(() => mockSupabase),
      single: jest.fn(),
      order: jest.fn(() => mockSupabase),
      limit: jest.fn(() => mockSupabase),
      contains: jest.fn(() => mockSupabase),
    };

    getSupabase.mockReturnValue(mockSupabase);
    isSupabaseEnabled.mockReturnValue(true);

    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('HERBALISM_EVENT_TYPES', () => {
    it('should define all expected event types', () => {
      expect(HERBALISM_EVENT_TYPES.GAME_START).toBe('game_start');
      expect(HERBALISM_EVENT_TYPES.ROUND_START).toBe('round_start');
      expect(HERBALISM_EVENT_TYPES.QUESTION).toBe('question');
      expect(HERBALISM_EVENT_TYPES.COLOR_CHOICE).toBe('color_choice');
      expect(HERBALISM_EVENT_TYPES.END_TURN).toBe('end_turn');
      expect(HERBALISM_EVENT_TYPES.GUESS).toBe('guess');
      expect(HERBALISM_EVENT_TYPES.FOLLOW_GUESS).toBe('follow_guess');
      expect(HERBALISM_EVENT_TYPES.ROUND_RESULT).toBe('round_result');
      expect(HERBALISM_EVENT_TYPES.GAME_END).toBe('game_end');
    });
  });

  describe('isAvailable', () => {
    it('should return true when Supabase is enabled', () => {
      isSupabaseEnabled.mockReturnValue(true);
      expect(service.isAvailable()).toBe(true);
    });

    it('should return false when Supabase is disabled', () => {
      isSupabaseEnabled.mockReturnValue(false);
      expect(service.isAvailable()).toBe(false);
    });
  });

  describe('startRecording', () => {
    it('should create a buffer with a GAME_START event', () => {
      const gameId = 'test-game-1';
      const state = {
        players: [
          { id: 'p1', name: 'Alice' },
          { id: 'p2', name: 'Bob' },
        ],
        winningScore: 7,
      };

      service.startRecording(gameId, state);

      expect(service.getEventCount(gameId)).toBe(1);
    });

    it('should initialise event count to 0 for unknown game', () => {
      expect(service.getEventCount('unknown')).toBe(0);
    });
  });

  describe('recordEvent helpers', () => {
    const gameId = 'g1';

    beforeEach(() => {
      service.startRecording(gameId, {
        players: [{ id: 'p1', name: 'Alice' }],
        winningScore: 7,
      });
    });

    it('recordRoundStart adds an event', () => {
      service.recordRoundStart(gameId, 1, 'Alice');
      expect(service.getEventCount(gameId)).toBe(2);
    });

    it('recordQuestion adds an event', () => {
      service.recordQuestion(gameId, {
        playerId: 'p1', playerName: 'Alice',
        targetPlayerId: 'p2', targetPlayerName: 'Bob',
        colors: ['red', 'blue'], questionType: 1,
      });
      expect(service.getEventCount(gameId)).toBe(2);
    });

    it('recordColorChoice adds an event', () => {
      service.recordColorChoice(gameId, {
        playerId: 'p2', playerName: 'Bob', chosenColor: 'red', cardsTransferred: 2,
      });
      expect(service.getEventCount(gameId)).toBe(2);
    });

    it('recordEndTurn adds an event', () => {
      service.recordEndTurn(gameId, { playerId: 'p1', playerName: 'Alice', prediction: 'green' });
      expect(service.getEventCount(gameId)).toBe(2);
    });

    it('recordGuess adds an event', () => {
      service.recordGuess(gameId, { playerId: 'p1', playerName: 'Alice', guessedColors: ['red', 'blue'] });
      expect(service.getEventCount(gameId)).toBe(2);
    });

    it('recordFollowGuess adds an event', () => {
      service.recordFollowGuess(gameId, { playerId: 'p2', playerName: 'Bob', isFollowing: true });
      expect(service.getEventCount(gameId)).toBe(2);
    });

    it('recordRoundResult adds an event', () => {
      service.recordRoundResult(gameId, {
        guessingPlayerId: 'p1', guessingPlayerName: 'Alice',
        guessedColors: ['red', 'blue'], hiddenColors: ['red', 'blue'],
        isCorrect: true, followingPlayers: [], scoreChanges: {}, scores: {},
      });
      expect(service.getEventCount(gameId)).toBe(2);
    });

    it('should not record for unknown gameId', () => {
      service.recordQuestion('unknown-id', { playerId: 'p1', playerName: 'A' });
      expect(service.getEventCount('unknown-id')).toBe(0);
    });
  });

  describe('clearBuffer', () => {
    it('should clear the buffer for a game', () => {
      service.startRecording('g2', { players: [], winningScore: 7 });
      expect(service.getEventCount('g2')).toBe(1);
      service.clearBuffer('g2');
      expect(service.getEventCount('g2')).toBe(0);
    });
  });

  describe('_compressEvents / _decompressEvents', () => {
    it('should compress and decompress correctly', () => {
      const events = [
        { type: 'game_start', timestamp: 1000, data: { players: [] } },
        { type: 'round_start', timestamp: 2000, data: { round: 1 } },
      ];
      const compressed = service._compressEvents(events);
      expect(compressed[0].t).toBe('game_start');
      expect(compressed[0].d).toBe(0);
      expect(compressed[1].d).toBe(1000);

      const decompressed = service._decompressEvents(compressed);
      expect(decompressed[0].type).toBe('game_start');
      expect(decompressed[1].type).toBe('round_start');
    });

    it('should handle empty arrays', () => {
      expect(service._compressEvents([])).toEqual([]);
      expect(service._decompressEvents([])).toEqual([]);
    });
  });

  describe('_sanitize', () => {
    it('should remove sensitive fields', () => {
      const data = { socketId: 'abc', ip: '1.2.3.4', token: 'secret', playerId: 'p1', hand: ['card1'] };
      const result = service._sanitize(data);
      expect(result.socketId).toBeUndefined();
      expect(result.ip).toBeUndefined();
      expect(result.token).toBeUndefined();
      expect(result.hand).toBeUndefined();
      expect(result.playerId).toBe('p1');
    });

    it('should handle null data', () => {
      expect(service._sanitize(null)).toEqual({});
    });
  });

  describe('saveReplay', () => {
    it('should return false when Supabase is disabled', async () => {
      isSupabaseEnabled.mockReturnValue(false);
      const result = await service.saveReplay('g1', { startTime: Date.now(), events: [] });
      expect(result).toBe(false);
    });

    it('should return true on successful upsert', async () => {
      mockSupabase.upsert.mockResolvedValue({ error: null });
      const events = [
        { type: 'game_start', timestamp: 1000, data: { players: [{ id: 'p1', name: 'A' }], winningScore: 7 } },
        { type: 'game_end', timestamp: 2000, data: { winner: 'p1', winnerName: 'A', scores: {}, rounds: 1 } },
      ];
      const result = await service.saveReplay('g1', { startTime: 1000, events });
      expect(result).toBe(true);
    });

    it('should return false on upsert error', async () => {
      mockSupabase.upsert.mockResolvedValue({ error: { message: 'DB error' } });
      const result = await service.saveReplay('g1', { startTime: Date.now(), events: [] });
      expect(result).toBe(false);
    });
  });

  describe('getReplay', () => {
    it('should return null when Supabase is disabled', async () => {
      isSupabaseEnabled.mockReturnValue(false);
      expect(await service.getReplay('g1')).toBeNull();
    });

    it('should return replay data with decompressed events', async () => {
      const compressed = [{ t: 'game_start', d: 0, players: [] }];
      mockSupabase.single.mockResolvedValue({
        data: {
          game_id: 'g1',
          events: compressed,
          player_names: ['Alice'],
          winner_name: 'Alice',
          rounds_played: 2,
          size_bytes: 100,
          duration_ms: 5000,
          created_at: '2025-01-01T00:00:00Z',
        },
        error: null,
      });
      const replay = await service.getReplay('g1');
      expect(replay).not.toBeNull();
      expect(replay.gameId).toBe('g1');
      expect(replay.playerNames).toEqual(['Alice']);
      expect(Array.isArray(replay.events)).toBe(true);
      expect(replay.events[0].type).toBe('game_start');
    });

    it('should return null on not found (PGRST116)', async () => {
      mockSupabase.single.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });
      expect(await service.getReplay('g1')).toBeNull();
    });
  });

  describe('listReplays', () => {
    it('should return empty array when Supabase is disabled', async () => {
      isSupabaseEnabled.mockReturnValue(false);
      expect(await service.listReplays()).toEqual([]);
    });

    it('should return a list of replays', async () => {
      mockSupabase.limit.mockResolvedValue({
        data: [
          {
            game_id: 'g1',
            player_names: ['Alice', 'Bob'],
            winner_name: 'Alice',
            rounds_played: 3,
            duration_ms: 12000,
            created_at: '2025-01-01T00:00:00Z',
          },
        ],
        error: null,
      });
      const list = await service.listReplays({ limit: 10 });
      expect(list).toHaveLength(1);
      expect(list[0].gameId).toBe('g1');
    });

    it('should return empty array on error', async () => {
      mockSupabase.limit.mockResolvedValue({ data: null, error: { message: 'DB error' } });
      expect(await service.listReplays()).toEqual([]);
    });
  });

  describe('singleton export', () => {
    it('should export a singleton herbalismReplayService instance', () => {
      expect(herbalismReplayService).toBeInstanceOf(HerbalismReplayService);
    });
  });

  describe('endRecording', () => {
    it('should return false when no buffer exists', async () => {
      const result = await service.endRecording('nonexistent', {});
      expect(result).toBe(false);
    });

    it('should save replay and clear buffer', async () => {
      mockSupabase.upsert.mockResolvedValue({ error: null });
      service.startRecording('g3', {
        players: [{ id: 'p1', name: 'Alice' }],
        winningScore: 7,
      });
      const finalState = {
        winner: 'p1',
        players: [{ id: 'p1', name: 'Alice' }],
        scores: { p1: 7 },
        currentRound: 2,
      };
      const result = await service.endRecording('g3', finalState);
      expect(result).toBe(true);
      expect(service.getEventCount('g3')).toBe(0);
    });
  });
});
