/**
 * ReplayService 測試
 */

// Mock supabaseClient
jest.mock('../../supabaseClient', () => ({
  getSupabase: jest.fn(),
  isSupabaseEnabled: jest.fn(),
}));

const { getSupabase, isSupabaseEnabled } = require('../../supabaseClient');
const {
  ReplayService,
  replayService,
  EVENT_TYPES,
} = require('../replayService');

describe('ReplayService', () => {
  let service;
  let mockSupabase;

  beforeEach(() => {
    service = new ReplayService();

    mockSupabase = {
      from: jest.fn(() => mockSupabase),
      upsert: jest.fn(() => mockSupabase),
      select: jest.fn(() => mockSupabase),
      eq: jest.fn(() => mockSupabase),
      single: jest.fn(),
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

  describe('EVENT_TYPES', () => {
    it('should have all event types defined', () => {
      expect(EVENT_TYPES.GAME_START).toBe('game_start');
      expect(EVENT_TYPES.PHASE_CHANGE).toBe('phase_change');
      expect(EVENT_TYPES.CARD_PLAY).toBe('card_play');
      expect(EVENT_TYPES.CREATE_CREATURE).toBe('create_creature');
      expect(EVENT_TYPES.ADD_TRAIT).toBe('add_trait');
      expect(EVENT_TYPES.FOOD_REVEAL).toBe('food_reveal');
      expect(EVENT_TYPES.FEEDING).toBe('feeding');
      expect(EVENT_TYPES.ATTACK).toBe('attack');
      expect(EVENT_TYPES.DEFENSE).toBe('defense');
      expect(EVENT_TYPES.EXTINCTION).toBe('extinction');
      expect(EVENT_TYPES.GAME_END).toBe('game_end');
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
    it('should create event buffer for game', () => {
      const initialState = {
        config: { playerCount: 2 },
        turnOrder: ['player-1', 'player-2'],
      };

      service.startRecording('game-1', initialState);

      expect(service.getEventCount('game-1')).toBe(1);
    });

    it('should record game_start event', () => {
      const initialState = {
        config: { playerCount: 2 },
        turnOrder: ['player-1', 'player-2'],
      };

      service.startRecording('game-1', initialState);

      const buffer = service.eventBuffers.get('game-1');
      expect(buffer[0].type).toBe(EVENT_TYPES.GAME_START);
      expect(buffer[0].data.playerCount).toBe(2);
    });
  });

  describe('recordEvent', () => {
    beforeEach(() => {
      service.startRecording('game-1', { turnOrder: ['p1'] });
    });

    it('should add event to buffer', () => {
      service.recordEvent('game-1', 'test_event', { foo: 'bar' });

      expect(service.getEventCount('game-1')).toBe(2);
    });

    it('should warn if game buffer not found', () => {
      service.recordEvent('non-existent', 'test_event', {});

      expect(console.warn).toHaveBeenCalled();
    });
  });

  describe('recordPhaseChange', () => {
    beforeEach(() => {
      service.startRecording('game-1', { turnOrder: ['p1'] });
    });

    it('should record phase change event', () => {
      service.recordPhaseChange('game-1', 'feeding', 2);

      const buffer = service.eventBuffers.get('game-1');
      const event = buffer[buffer.length - 1];
      expect(event.type).toBe(EVENT_TYPES.PHASE_CHANGE);
      expect(event.data.phase).toBe('feeding');
      expect(event.data.round).toBe(2);
    });
  });

  describe('recordCreateCreature', () => {
    beforeEach(() => {
      service.startRecording('game-1', { turnOrder: ['p1'] });
    });

    it('should record create creature event', () => {
      service.recordCreateCreature('game-1', 'player-1', 'creature-1', 'card-1');

      const buffer = service.eventBuffers.get('game-1');
      const event = buffer[buffer.length - 1];
      expect(event.type).toBe(EVENT_TYPES.CREATE_CREATURE);
      expect(event.data.playerId).toBe('player-1');
      expect(event.data.creatureId).toBe('creature-1');
    });
  });

  describe('recordAddTrait', () => {
    beforeEach(() => {
      service.startRecording('game-1', { turnOrder: ['p1'] });
    });

    it('should record add trait event', () => {
      service.recordAddTrait('game-1', 'player-1', 'creature-1', 'CARNIVORE', 'card-2');

      const buffer = service.eventBuffers.get('game-1');
      const event = buffer[buffer.length - 1];
      expect(event.type).toBe(EVENT_TYPES.ADD_TRAIT);
      expect(event.data.traitType).toBe('CARNIVORE');
    });

    it('should record interaction trait with target', () => {
      service.recordAddTrait('game-1', 'player-1', 'creature-1', 'SYMBIOSIS', 'card-3', 'creature-2');

      const buffer = service.eventBuffers.get('game-1');
      const event = buffer[buffer.length - 1];
      expect(event.data.targetCreatureId).toBe('creature-2');
    });
  });

  describe('recordFoodReveal', () => {
    beforeEach(() => {
      service.startRecording('game-1', { turnOrder: ['p1'] });
    });

    it('should record food reveal event', () => {
      service.recordFoodReveal('game-1', 8);

      const buffer = service.eventBuffers.get('game-1');
      const event = buffer[buffer.length - 1];
      expect(event.type).toBe(EVENT_TYPES.FOOD_REVEAL);
      expect(event.data.foodAmount).toBe(8);
    });
  });

  describe('recordFeeding', () => {
    beforeEach(() => {
      service.startRecording('game-1', { turnOrder: ['p1'] });
    });

    it('should record feeding event', () => {
      service.recordFeeding('game-1', 'player-1', 'creature-1', 'red');

      const buffer = service.eventBuffers.get('game-1');
      const event = buffer[buffer.length - 1];
      expect(event.type).toBe(EVENT_TYPES.FEEDING);
      expect(event.data.foodType).toBe('red');
    });
  });

  describe('recordAttack', () => {
    beforeEach(() => {
      service.startRecording('game-1', { turnOrder: ['p1', 'p2'] });
    });

    it('should record attack event', () => {
      service.recordAttack('game-1', 'player-1', 'creature-1', 'player-2', 'creature-2', true);

      const buffer = service.eventBuffers.get('game-1');
      const event = buffer[buffer.length - 1];
      expect(event.type).toBe(EVENT_TYPES.ATTACK);
      expect(event.data.success).toBe(true);
    });
  });

  describe('recordDefense', () => {
    beforeEach(() => {
      service.startRecording('game-1', { turnOrder: ['p1'] });
    });

    it('should record defense event', () => {
      service.recordDefense('game-1', 'player-2', 'creature-2', 'CAMOUFLAGE', true);

      const buffer = service.eventBuffers.get('game-1');
      const event = buffer[buffer.length - 1];
      expect(event.type).toBe(EVENT_TYPES.DEFENSE);
      expect(event.data.traitUsed).toBe('CAMOUFLAGE');
    });
  });

  describe('recordExtinction', () => {
    beforeEach(() => {
      service.startRecording('game-1', { turnOrder: ['p1'] });
    });

    it('should record extinction event', () => {
      service.recordExtinction('game-1', 'player-1', 'creature-1', 'starvation');

      const buffer = service.eventBuffers.get('game-1');
      const event = buffer[buffer.length - 1];
      expect(event.type).toBe(EVENT_TYPES.EXTINCTION);
      expect(event.data.reason).toBe('starvation');
    });
  });

  describe('endRecording', () => {
    beforeEach(() => {
      service.startRecording('game-1', { turnOrder: ['p1', 'p2'] });
    });

    it('should add game_end event and save', async () => {
      mockSupabase.from.mockImplementation(() => ({
        upsert: () => Promise.resolve({ error: null }),
      }));

      const result = await service.endRecording('game-1', {
        winner: 'player-1',
        scores: { 'player-1': 25, 'player-2': 18 },
        round: 5,
      });

      expect(result).toBe(true);
      expect(service.getEventCount('game-1')).toBe(0); // Buffer cleared
    });

    it('should return false if buffer not found', async () => {
      const result = await service.endRecording('non-existent', {});
      expect(result).toBe(false);
    });
  });

  describe('saveReplay', () => {
    it('should return false when Supabase is disabled', async () => {
      isSupabaseEnabled.mockReturnValue(false);

      const result = await service.saveReplay('game-1', []);
      expect(result).toBe(false);
    });

    it('should return true on successful save', async () => {
      mockSupabase.from.mockImplementation(() => ({
        upsert: () => Promise.resolve({ error: null }),
      }));

      const result = await service.saveReplay('game-1', [{ type: 'test' }]);
      expect(result).toBe(true);
    });

    it('should return false on error', async () => {
      mockSupabase.from.mockImplementation(() => ({
        upsert: () => Promise.resolve({ error: { message: 'Error' } }),
      }));

      const result = await service.saveReplay('game-1', []);
      expect(result).toBe(false);
    });
  });

  describe('getReplay', () => {
    it('should return null when Supabase is disabled', async () => {
      isSupabaseEnabled.mockReturnValue(false);

      const result = await service.getReplay('game-1');
      expect(result).toBeNull();
    });

    it('should return decompressed replay', async () => {
      mockSupabase.from.mockImplementation(() => ({
        select: () => ({
          eq: () => ({
            single: () =>
              Promise.resolve({
                data: {
                  game_id: 'game-1',
                  events: [{ t: 'game_start', d: 0, playerCount: 2 }],
                  compressed: true,
                  size_bytes: 100,
                  created_at: '2026-01-01T00:00:00Z',
                },
                error: null,
              }),
          }),
        }),
      }));

      const result = await service.getReplay('game-1');

      expect(result.gameId).toBe('game-1');
      expect(result.events[0].type).toBe('game_start');
    });

    it('should return null on not found', async () => {
      mockSupabase.from.mockImplementation(() => ({
        select: () => ({
          eq: () => ({
            single: () =>
              Promise.resolve({
                data: null,
                error: { code: 'PGRST116' },
              }),
          }),
        }),
      }));

      const result = await service.getReplay('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('compressEvents', () => {
    it('should compress events', () => {
      const events = [
        { type: 'game_start', timestamp: 1000, data: { playerCount: 2 } },
        { type: 'phase_change', timestamp: 1100, data: { phase: 'evolution' } },
      ];

      const compressed = service.compressEvents(events);

      expect(compressed[0].t).toBe('game_start');
      expect(compressed[0].d).toBe(0);
      expect(compressed[0].playerCount).toBe(2);
      expect(compressed[1].d).toBe(100);
    });

    it('should handle empty array', () => {
      expect(service.compressEvents([])).toEqual([]);
    });

    it('should handle non-array', () => {
      expect(service.compressEvents(null)).toEqual([]);
    });
  });

  describe('decompressEvents', () => {
    it('should decompress events', () => {
      const compressed = [
        { t: 'game_start', d: 0, playerCount: 2 },
        { t: 'phase_change', d: 100, phase: 'evolution' },
      ];

      const events = service.decompressEvents(compressed);

      expect(events[0].type).toBe('game_start');
      expect(events[0].data.playerCount).toBe(2);
      expect(events[1].type).toBe('phase_change');
    });

    it('should handle empty array', () => {
      expect(service.decompressEvents([])).toEqual([]);
    });

    it('should handle non-array', () => {
      expect(service.decompressEvents(null)).toEqual([]);
    });
  });

  describe('sanitizeEventData', () => {
    it('should remove sensitive fields', () => {
      const data = {
        playerId: 'player-1',
        socketId: 'socket-123',
        ip: '192.168.1.1',
        token: 'secret-token',
      };

      const sanitized = service.sanitizeEventData(data);

      expect(sanitized.playerId).toBe('player-1');
      expect(sanitized.socketId).toBeUndefined();
      expect(sanitized.ip).toBeUndefined();
      expect(sanitized.token).toBeUndefined();
    });

    it('should handle null data', () => {
      expect(service.sanitizeEventData(null)).toEqual({});
    });
  });

  describe('getEventCount', () => {
    it('should return event count', () => {
      service.startRecording('game-1', { turnOrder: ['p1'] });
      service.recordEvent('game-1', 'test', {});
      service.recordEvent('game-1', 'test', {});

      expect(service.getEventCount('game-1')).toBe(3);
    });

    it('should return 0 for non-existent game', () => {
      expect(service.getEventCount('non-existent')).toBe(0);
    });
  });

  describe('clearBuffer', () => {
    it('should clear game buffer', () => {
      service.startRecording('game-1', { turnOrder: ['p1'] });
      expect(service.getEventCount('game-1')).toBe(1);

      service.clearBuffer('game-1');
      expect(service.getEventCount('game-1')).toBe(0);
    });
  });

  describe('singleton export', () => {
    it('should export replayService instance', () => {
      expect(replayService).toBeInstanceOf(ReplayService);
    });
  });
});
