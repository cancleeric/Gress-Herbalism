/**
 * Player Slice 測試
 *
 * @module store/evolution/__tests__/playerSlice.test
 */

import reducer, {
  setMyPlayerId,
  setPlayers,
  updatePlayer,
  setHand,
  addCardsToHand,
  removeCardFromHand,
  setCreatures,
  addCreature,
  removeCreature,
  updateCreature,
  selectCreature,
  setAttackTarget,
  selectCard,
  clearSelection,
  setPlayerPassed,
  setPendingResponse,
  clearPendingResponse,
  resetPlayers,
} from '../playerSlice';

describe('playerSlice', () => {
  const initialState = {
    myPlayerId: null,
    players: {},
    selectedCreatureId: null,
    attackTarget: null,
    selectedCardId: null,
    selectedCardSide: null,
    pendingResponse: null,
  };

  const mockPlayers = {
    'p1': {
      id: 'p1',
      name: 'Player 1',
      hand: [{ id: 'card-1' }, { id: 'card-2' }],
      creatures: [{ id: 'creature-1', traits: [] }],
    },
    'p2': {
      id: 'p2',
      name: 'Player 2',
      hand: [],
      creatures: [],
    },
  };

  it('should return initial state', () => {
    expect(reducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  describe('setMyPlayerId', () => {
    it('should set my player id', () => {
      const state = reducer(initialState, setMyPlayerId('p1'));
      expect(state.myPlayerId).toBe('p1');
    });
  });

  describe('setPlayers', () => {
    it('should set all players', () => {
      const state = reducer(initialState, setPlayers(mockPlayers));
      expect(state.players).toEqual(mockPlayers);
    });
  });

  describe('updatePlayer', () => {
    it('should update single player', () => {
      let state = reducer(initialState, setPlayers(mockPlayers));
      state = reducer(state, updatePlayer({
        playerId: 'p1',
        updates: { score: 10 },
      }));

      expect(state.players['p1'].score).toBe(10);
      expect(state.players['p1'].name).toBe('Player 1');
    });

    it('should do nothing for non-existent player', () => {
      let state = reducer(initialState, setPlayers(mockPlayers));
      state = reducer(state, updatePlayer({
        playerId: 'p999',
        updates: { score: 10 },
      }));

      expect(state.players['p999']).toBeUndefined();
    });
  });

  describe('setHand', () => {
    it('should set player hand', () => {
      let state = reducer(initialState, setPlayers(mockPlayers));
      const newHand = [{ id: 'new-card' }];
      state = reducer(state, setHand({ playerId: 'p1', hand: newHand }));

      expect(state.players['p1'].hand).toEqual(newHand);
    });
  });

  describe('addCardsToHand', () => {
    it('should add cards to hand', () => {
      let state = reducer(initialState, setPlayers(mockPlayers));
      state = reducer(state, addCardsToHand({
        playerId: 'p1',
        cards: [{ id: 'card-3' }],
      }));

      expect(state.players['p1'].hand.length).toBe(3);
    });
  });

  describe('removeCardFromHand', () => {
    it('should remove card from hand', () => {
      let state = reducer(initialState, setPlayers(mockPlayers));
      state = reducer(state, removeCardFromHand({
        playerId: 'p1',
        cardId: 'card-1',
      }));

      expect(state.players['p1'].hand.length).toBe(1);
      expect(state.players['p1'].hand[0].id).toBe('card-2');
    });
  });

  describe('setCreatures', () => {
    it('should set player creatures', () => {
      let state = reducer(initialState, setPlayers(mockPlayers));
      const newCreatures = [{ id: 'new-creature' }];
      state = reducer(state, setCreatures({ playerId: 'p1', creatures: newCreatures }));

      expect(state.players['p1'].creatures).toEqual(newCreatures);
    });
  });

  describe('addCreature', () => {
    it('should add creature', () => {
      let state = reducer(initialState, setPlayers(mockPlayers));
      state = reducer(state, addCreature({
        playerId: 'p1',
        creature: { id: 'creature-2', traits: [] },
      }));

      expect(state.players['p1'].creatures.length).toBe(2);
    });

    it('should create creatures array if not exists', () => {
      let state = reducer(initialState, setPlayers({
        'p1': { id: 'p1', name: 'Player 1' },
      }));
      state = reducer(state, addCreature({
        playerId: 'p1',
        creature: { id: 'creature-1' },
      }));

      expect(state.players['p1'].creatures.length).toBe(1);
    });
  });

  describe('removeCreature', () => {
    it('should remove creature', () => {
      let state = reducer(initialState, setPlayers(mockPlayers));
      state = reducer(state, removeCreature({
        playerId: 'p1',
        creatureId: 'creature-1',
      }));

      expect(state.players['p1'].creatures.length).toBe(0);
    });
  });

  describe('updateCreature', () => {
    it('should update creature', () => {
      let state = reducer(initialState, setPlayers(mockPlayers));
      state = reducer(state, updateCreature({
        playerId: 'p1',
        creatureId: 'creature-1',
        updates: { food: 2 },
      }));

      expect(state.players['p1'].creatures[0].food).toBe(2);
    });
  });

  describe('selectCreature', () => {
    it('should select creature', () => {
      const state = reducer(initialState, selectCreature('creature-1'));
      expect(state.selectedCreatureId).toBe('creature-1');
    });
  });

  describe('setAttackTarget', () => {
    it('should set attack target', () => {
      const state = reducer(initialState, setAttackTarget({
        creatureId: 'target-1',
        playerId: 'p2',
      }));
      expect(state.attackTarget).toEqual({
        creatureId: 'target-1',
        playerId: 'p2',
      });
    });
  });

  describe('selectCard', () => {
    it('should select card with object', () => {
      const state = reducer(initialState, selectCard({ cardId: 'card-1', side: 'back' }));
      expect(state.selectedCardId).toBe('card-1');
      expect(state.selectedCardSide).toBe('back');
    });

    it('should select card with string', () => {
      const state = reducer(initialState, selectCard('card-2'));
      expect(state.selectedCardId).toBe('card-2');
      expect(state.selectedCardSide).toBe('front');
    });

    it('should clear selection with null', () => {
      let state = reducer(initialState, selectCard({ cardId: 'card-1' }));
      state = reducer(state, selectCard(null));
      expect(state.selectedCardId).toBeNull();
      expect(state.selectedCardSide).toBeNull();
    });
  });

  describe('clearSelection', () => {
    it('should clear all selections', () => {
      let state = reducer(initialState, selectCreature('creature-1'));
      state = reducer(state, selectCard({ cardId: 'card-1' }));
      state = reducer(state, setAttackTarget({ creatureId: 'target-1' }));
      state = reducer(state, clearSelection());

      expect(state.selectedCreatureId).toBeNull();
      expect(state.selectedCardId).toBeNull();
      expect(state.selectedCardSide).toBeNull();
      expect(state.attackTarget).toBeNull();
    });
  });

  describe('setPlayerPassed', () => {
    it('should set player passed state', () => {
      let state = reducer(initialState, setPlayers(mockPlayers));
      state = reducer(state, setPlayerPassed({ playerId: 'p1', passed: true }));

      expect(state.players['p1'].passed).toBe(true);
    });
  });

  describe('setPendingResponse', () => {
    it('should set pending response', () => {
      const pending = { type: 'select_trait', options: ['a', 'b'] };
      const state = reducer(initialState, setPendingResponse(pending));
      expect(state.pendingResponse).toEqual(pending);
    });
  });

  describe('clearPendingResponse', () => {
    it('should clear pending response', () => {
      let state = reducer(initialState, setPendingResponse({ type: 'test' }));
      state = reducer(state, clearPendingResponse());
      expect(state.pendingResponse).toBeNull();
    });
  });

  describe('resetPlayers', () => {
    it('should reset to initial state', () => {
      let state = reducer(initialState, setPlayers(mockPlayers));
      state = reducer(state, setMyPlayerId('p1'));
      state = reducer(state, resetPlayers());

      expect(state).toEqual(initialState);
    });
  });
});
