/**
 * Selectors 測試
 *
 * @module store/evolution/__tests__/selectors.test
 */

import {
  selectGameId,
  selectGameStatus,
  selectRound,
  selectCurrentPhase,
  selectFoodPool,
  selectTurnOrder,
  selectCurrentPlayerIndex,
  selectActionLog,
  selectDeckCount,
  selectIsRolling,
  selectLastFoodRoll,
  selectGameLoading,
  selectGameError,
  selectWinner,
  selectScores,
  selectCurrentPlayerId,
  selectMyPlayerId,
  selectPlayers,
  selectSelectedCreatureId,
  selectSelectedCardId,
  selectSelectedCardSide,
  selectAttackTarget,
  selectPendingResponse,
  selectIsMyTurn,
  selectMyPlayer,
  selectMyHand,
  selectMyCreatures,
  selectOpponents,
  selectAllCreatures,
  selectPlayerCount,
  selectSelectedCard,
  selectSelectedCreature,
  selectIsGameActive,
  selectIsGameFinished,
} from '../selectors';

describe('selectors', () => {
  const mockState = {
    evolutionGame: {
      gameId: 'game-1',
      status: 'playing',
      round: 3,
      currentPhase: 'feeding',
      foodPool: 5,
      turnOrder: ['p1', 'p2', 'p3'],
      currentPlayerIndex: 1,
      actionLog: [{ id: 'log-1', type: 'test' }],
      deckCount: 50,
      isRolling: false,
      lastFoodRoll: [3, 4],
      loading: false,
      error: null,
      winner: null,
      scores: {},
    },
    evolutionPlayer: {
      myPlayerId: 'p1',
      players: {
        'p1': {
          id: 'p1',
          name: 'Player 1',
          hand: [{ id: 'card-1', instanceId: 'inst-1' }, { id: 'card-2', instanceId: 'inst-2' }],
          creatures: [{ id: 'creature-1', traits: [] }],
        },
        'p2': {
          id: 'p2',
          name: 'Player 2',
          hand: [],
          creatures: [{ id: 'creature-2', traits: ['carnivore'] }],
        },
        'p3': {
          id: 'p3',
          name: 'Player 3',
          hand: [],
          creatures: [],
        },
      },
      selectedCreatureId: 'creature-1',
      selectedCardId: 'inst-1',
      selectedCardSide: 'front',
      attackTarget: null,
      pendingResponse: null,
    },
  };

  describe('Game Selectors', () => {
    it('selectGameId should return game id', () => {
      expect(selectGameId(mockState)).toBe('game-1');
    });

    it('selectGameStatus should return status', () => {
      expect(selectGameStatus(mockState)).toBe('playing');
    });

    it('selectRound should return round', () => {
      expect(selectRound(mockState)).toBe(3);
    });

    it('selectCurrentPhase should return phase', () => {
      expect(selectCurrentPhase(mockState)).toBe('feeding');
    });

    it('selectFoodPool should return food pool', () => {
      expect(selectFoodPool(mockState)).toBe(5);
    });

    it('selectTurnOrder should return turn order', () => {
      expect(selectTurnOrder(mockState)).toEqual(['p1', 'p2', 'p3']);
    });

    it('selectCurrentPlayerIndex should return index', () => {
      expect(selectCurrentPlayerIndex(mockState)).toBe(1);
    });

    it('selectActionLog should return log', () => {
      expect(selectActionLog(mockState)).toHaveLength(1);
    });

    it('selectDeckCount should return deck count', () => {
      expect(selectDeckCount(mockState)).toBe(50);
    });

    it('selectIsRolling should return rolling state', () => {
      expect(selectIsRolling(mockState)).toBe(false);
    });

    it('selectLastFoodRoll should return last roll', () => {
      expect(selectLastFoodRoll(mockState)).toEqual([3, 4]);
    });

    it('selectGameLoading should return loading state', () => {
      expect(selectGameLoading(mockState)).toBe(false);
    });

    it('selectGameError should return error', () => {
      expect(selectGameError(mockState)).toBeNull();
    });

    it('selectWinner should return winner', () => {
      expect(selectWinner(mockState)).toBeNull();
    });

    it('selectScores should return scores', () => {
      expect(selectScores(mockState)).toEqual({});
    });

    it('selectCurrentPlayerId should return current player', () => {
      expect(selectCurrentPlayerId(mockState)).toBe('p2');
    });
  });

  describe('Player Selectors', () => {
    it('selectMyPlayerId should return my id', () => {
      expect(selectMyPlayerId(mockState)).toBe('p1');
    });

    it('selectPlayers should return all players', () => {
      expect(Object.keys(selectPlayers(mockState))).toHaveLength(3);
    });

    it('selectSelectedCreatureId should return selected creature', () => {
      expect(selectSelectedCreatureId(mockState)).toBe('creature-1');
    });

    it('selectSelectedCardId should return selected card', () => {
      expect(selectSelectedCardId(mockState)).toBe('inst-1');
    });

    it('selectSelectedCardSide should return selected side', () => {
      expect(selectSelectedCardSide(mockState)).toBe('front');
    });

    it('selectAttackTarget should return target', () => {
      expect(selectAttackTarget(mockState)).toBeNull();
    });

    it('selectPendingResponse should return pending', () => {
      expect(selectPendingResponse(mockState)).toBeNull();
    });
  });

  describe('Derived Selectors', () => {
    it('selectIsMyTurn should return false when not my turn', () => {
      expect(selectIsMyTurn(mockState)).toBe(false);
    });

    it('selectIsMyTurn should return true when my turn', () => {
      const myTurnState = {
        ...mockState,
        evolutionGame: { ...mockState.evolutionGame, currentPlayerIndex: 0 },
      };
      expect(selectIsMyTurn(myTurnState)).toBe(true);
    });

    it('selectMyPlayer should return my player data', () => {
      const myPlayer = selectMyPlayer(mockState);
      expect(myPlayer.id).toBe('p1');
      expect(myPlayer.name).toBe('Player 1');
    });

    it('selectMyHand should return my hand', () => {
      expect(selectMyHand(mockState)).toHaveLength(2);
    });

    it('selectMyCreatures should return my creatures', () => {
      expect(selectMyCreatures(mockState)).toHaveLength(1);
    });

    it('selectOpponents should return other players', () => {
      const opponents = selectOpponents(mockState);
      expect(opponents).toHaveLength(2);
      expect(opponents.find(p => p.id === 'p1')).toBeUndefined();
    });

    it('selectAllCreatures should return all creatures with owner', () => {
      const creatures = selectAllCreatures(mockState);
      expect(creatures).toHaveLength(2);
      expect(creatures[0].ownerId).toBeDefined();
    });

    it('selectPlayerCount should return player count', () => {
      expect(selectPlayerCount(mockState)).toBe(3);
    });

    it('selectSelectedCard should return full card data', () => {
      const card = selectSelectedCard(mockState);
      expect(card).toBeDefined();
      expect(card.instanceId).toBe('inst-1');
    });

    it('selectSelectedCard should return null when no selection', () => {
      const noSelectionState = {
        ...mockState,
        evolutionPlayer: { ...mockState.evolutionPlayer, selectedCardId: null },
      };
      expect(selectSelectedCard(noSelectionState)).toBeNull();
    });

    it('selectSelectedCreature should return full creature data', () => {
      const creature = selectSelectedCreature(mockState);
      expect(creature).toBeDefined();
      expect(creature.id).toBe('creature-1');
    });

    it('selectIsGameActive should return true when playing', () => {
      expect(selectIsGameActive(mockState)).toBe(true);
    });

    it('selectIsGameFinished should return false when playing', () => {
      expect(selectIsGameFinished(mockState)).toBe(false);
    });

    it('selectIsGameFinished should return true when finished', () => {
      const finishedState = {
        ...mockState,
        evolutionGame: { ...mockState.evolutionGame, status: 'finished' },
      };
      expect(selectIsGameFinished(finishedState)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined state', () => {
      const emptyState = {};
      expect(selectRound(emptyState)).toBe(0);
      expect(selectFoodPool(emptyState)).toBe(0);
      expect(selectTurnOrder(emptyState)).toEqual([]);
      expect(selectPlayers(emptyState)).toEqual({});
      expect(selectMyHand(emptyState)).toEqual([]);
    });

    it('should handle null my player', () => {
      const noMyPlayerState = {
        ...mockState,
        evolutionPlayer: { ...mockState.evolutionPlayer, myPlayerId: 'p999' },
      };
      expect(selectMyPlayer(noMyPlayerState)).toBeNull();
      expect(selectMyHand(noMyPlayerState)).toEqual([]);
      expect(selectMyCreatures(noMyPlayerState)).toEqual([]);
    });
  });
});
