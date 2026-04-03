/**
 * 本草遊戲回放服務測試
 */

const {
  HerbalismReplayService,
  HERBALISM_EVENT_TYPES,
} = require('../replayService');

describe('HerbalismReplayService', () => {
  let service;

  beforeEach(() => {
    service = new HerbalismReplayService();
  });

  describe('HERBALISM_EVENT_TYPES', () => {
    it('should export event type constants', () => {
      expect(HERBALISM_EVENT_TYPES.GAME_START).toBe('game_start');
      expect(HERBALISM_EVENT_TYPES.ASK_CARD).toBe('ask_card');
      expect(HERBALISM_EVENT_TYPES.GUESS_CARDS).toBe('guess_cards');
      expect(HERBALISM_EVENT_TYPES.GUESS_RESULT).toBe('guess_result');
      expect(HERBALISM_EVENT_TYPES.GAME_END).toBe('game_end');
    });
  });

  describe('startRecording', () => {
    it('should create event buffer with game_start event', () => {
      const initialState = {
        players: [
          { id: 'p1', name: '玩家一' },
          { id: 'p2', name: '玩家二' },
          { id: 'p3', name: '玩家三' },
        ],
      };

      service.startRecording('game-1', initialState);

      expect(service.getEventCount('game-1')).toBe(1);
    });

    it('should include player count in first event', () => {
      const initialState = { players: [{ id: 'p1' }, { id: 'p2' }] };
      service.startRecording('game-1', initialState);

      // Buffer should have 1 event (game_start)
      expect(service.getEventCount('game-1')).toBe(1);
    });
  });

  describe('recordEvent', () => {
    beforeEach(() => {
      service.startRecording('game-1', { players: [] });
    });

    it('should add event to buffer', () => {
      service.recordEvent('game-1', HERBALISM_EVENT_TYPES.ASK_CARD, { askingPlayerId: 'p1' });
      expect(service.getEventCount('game-1')).toBe(2);
    });

    it('should not crash when buffer not found', () => {
      expect(() =>
        service.recordEvent('nonexistent', HERBALISM_EVENT_TYPES.ASK_CARD, {})
      ).not.toThrow();
    });
  });

  describe('recordAskCard', () => {
    it('should record ask card event', () => {
      service.startRecording('game-1', { players: [] });
      service.recordAskCard('game-1', 'p1', 'p2', 1);
      expect(service.getEventCount('game-1')).toBe(2);
    });
  });

  describe('recordGuessCards', () => {
    it('should record guess cards event', () => {
      service.startRecording('game-1', { players: [] });
      service.recordGuessCards('game-1', 'p1', ['red', 'blue'], 1);
      expect(service.getEventCount('game-1')).toBe(2);
    });
  });

  describe('recordGuessResult', () => {
    it('should record guess result event', () => {
      service.startRecording('game-1', { players: [] });
      service.recordGuessResult('game-1', true, 'p1', [], {});
      expect(service.getEventCount('game-1')).toBe(2);
    });
  });

  describe('recordGameEnd', () => {
    it('should finalize replay and store it', () => {
      service.startRecording('game-1', { players: [] });
      service.recordEvent('game-1', HERBALISM_EVENT_TYPES.ASK_CARD, {});
      service.recordGameEnd('game-1', { p1: 10 }, 'p1');

      // Buffer should be cleared
      expect(service.getEventCount('game-1')).toBe(0);

      // Replay should be accessible
      const replay = service.getReplay('game-1');
      expect(replay).not.toBeNull();
      expect(replay.gameType).toBe('herbalism');
      expect(replay.events.length).toBeGreaterThan(0);
    });

    it('should include game_end event in replay', () => {
      service.startRecording('game-1', { players: [] });
      service.recordGameEnd('game-1', { p1: 5 }, 'p1');

      const replay = service.getReplay('game-1');
      const lastEvent = replay.events[replay.events.length - 1];
      expect(lastEvent.type).toBe(HERBALISM_EVENT_TYPES.GAME_END);
    });
  });

  describe('getReplay', () => {
    it('should return null for nonexistent game', () => {
      expect(service.getReplay('nonexistent')).toBeNull();
    });

    it('should return replay after game ends', () => {
      service.startRecording('game-1', { players: [] });
      service.recordGameEnd('game-1', {}, null);

      expect(service.getReplay('game-1')).not.toBeNull();
    });
  });

  describe('sanitizeEventData', () => {
    it('should remove sensitive fields', () => {
      const data = {
        playerId: 'p1',
        socketId: 'socket-123',
        ip: '127.0.0.1',
        token: 'secret-token',
        password: 'secret',
        round: 1,
      };

      const sanitized = service.sanitizeEventData(data);

      expect(sanitized.socketId).toBeUndefined();
      expect(sanitized.ip).toBeUndefined();
      expect(sanitized.token).toBeUndefined();
      expect(sanitized.password).toBeUndefined();
      expect(sanitized.playerId).toBe('p1');
      expect(sanitized.round).toBe(1);
    });

    it('should return empty object for null data', () => {
      expect(service.sanitizeEventData(null)).toEqual({});
    });
  });
});
