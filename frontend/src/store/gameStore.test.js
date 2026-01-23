/**
 * Redux Store 單元測試
 * 工作單 0012
 */

import {
  ActionTypes,
  initialState,
  gameReducer,
  createGameAction,
  joinGame,
  leaveGame,
  updateGameState,
  questionAction,
  guessAction,
  setCurrentPlayer,
  gameEnded,
  resetGame
} from './gameStore';

import {
  GAME_PHASE_WAITING,
  GAME_PHASE_PLAYING,
  GAME_PHASE_FINISHED
} from '../../../shared/constants.js';

describe('gameStore - 工作單 0012', () => {
  describe('Action Types', () => {
    test('所有 action types 應已定義', () => {
      expect(ActionTypes.CREATE_GAME).toBe('CREATE_GAME');
      expect(ActionTypes.JOIN_GAME).toBe('JOIN_GAME');
      expect(ActionTypes.LEAVE_GAME).toBe('LEAVE_GAME');
      expect(ActionTypes.UPDATE_GAME_STATE).toBe('UPDATE_GAME_STATE');
      expect(ActionTypes.QUESTION_ACTION).toBe('QUESTION_ACTION');
      expect(ActionTypes.GUESS_ACTION).toBe('GUESS_ACTION');
      expect(ActionTypes.SET_CURRENT_PLAYER).toBe('SET_CURRENT_PLAYER');
      expect(ActionTypes.GAME_ENDED).toBe('GAME_ENDED');
    });
  });

  describe('Action Creators', () => {
    test('createGameAction 應返回正確的 action', () => {
      const players = [{ id: 'p1', name: '玩家1' }];
      const action = createGameAction(players);

      expect(action.type).toBe(ActionTypes.CREATE_GAME);
      expect(action.payload.players).toEqual(players);
    });

    test('joinGame 應返回正確的 action', () => {
      const action = joinGame('game_123', { id: 'p1', name: '玩家1' });

      expect(action.type).toBe(ActionTypes.JOIN_GAME);
      expect(action.payload.gameId).toBe('game_123');
      expect(action.payload.player.id).toBe('p1');
    });

    test('leaveGame 應返回正確的 action', () => {
      const action = leaveGame('game_123', 'p1');

      expect(action.type).toBe(ActionTypes.LEAVE_GAME);
      expect(action.payload.gameId).toBe('game_123');
      expect(action.payload.playerId).toBe('p1');
    });

    test('updateGameState 應返回正確的 action', () => {
      const gameState = { gameId: 'game_123', winner: 'p1' };
      const action = updateGameState(gameState);

      expect(action.type).toBe(ActionTypes.UPDATE_GAME_STATE);
      expect(action.payload).toEqual(gameState);
    });

    test('questionAction 應返回正確的 action', () => {
      const questionData = { playerId: 'p1', colors: ['red', 'blue'] };
      const action = questionAction(questionData);

      expect(action.type).toBe(ActionTypes.QUESTION_ACTION);
      expect(action.payload).toEqual(questionData);
    });

    test('guessAction 應返回正確的 action', () => {
      const guessData = { playerId: 'p1', guessedColors: ['red', 'blue'] };
      const action = guessAction(guessData);

      expect(action.type).toBe(ActionTypes.GUESS_ACTION);
      expect(action.payload).toEqual(guessData);
    });

    test('setCurrentPlayer 應返回正確的 action', () => {
      const action = setCurrentPlayer(2);

      expect(action.type).toBe(ActionTypes.SET_CURRENT_PLAYER);
      expect(action.payload.playerIndex).toBe(2);
    });

    test('gameEnded 應返回正確的 action', () => {
      const action = gameEnded('p1');

      expect(action.type).toBe(ActionTypes.GAME_ENDED);
      expect(action.payload.winner).toBe('p1');
    });

    test('resetGame 應返回正確的 action', () => {
      const action = resetGame();

      expect(action.type).toBe(ActionTypes.RESET_GAME);
    });
  });

  describe('Reducer', () => {
    test('應返回初始狀態', () => {
      const state = gameReducer(undefined, { type: 'UNKNOWN' });
      expect(state).toEqual(initialState);
    });

    test('CREATE_GAME 應更新玩家列表', () => {
      const players = [{ id: 'p1', name: '玩家1' }];
      const state = gameReducer(initialState, createGameAction(players));

      expect(state.players).toEqual(players);
      expect(state.gamePhase).toBe(GAME_PHASE_WAITING);
    });

    test('JOIN_GAME 應添加玩家', () => {
      const player = { id: 'p2', name: '玩家2' };
      const state = gameReducer(
        { ...initialState, players: [{ id: 'p1', name: '玩家1' }] },
        joinGame('game_123', player)
      );

      expect(state.players).toHaveLength(2);
      expect(state.gameId).toBe('game_123');
    });

    test('LEAVE_GAME 應移除玩家', () => {
      const state = gameReducer(
        { ...initialState, players: [{ id: 'p1' }, { id: 'p2' }] },
        leaveGame('game_123', 'p1')
      );

      expect(state.players).toHaveLength(1);
      expect(state.players[0].id).toBe('p2');
    });

    test('UPDATE_GAME_STATE 應更新狀態', () => {
      const newState = { winner: 'p1', gamePhase: GAME_PHASE_FINISHED };
      const state = gameReducer(initialState, updateGameState(newState));

      expect(state.winner).toBe('p1');
      expect(state.gamePhase).toBe(GAME_PHASE_FINISHED);
    });

    test('QUESTION_ACTION 應記錄到歷史', () => {
      const action = { playerId: 'p1', type: 'question' };
      const state = gameReducer(initialState, questionAction(action));

      expect(state.gameHistory).toHaveLength(1);
      expect(state.gameHistory[0]).toEqual(action);
    });

    test('GUESS_ACTION 應記錄到歷史', () => {
      const action = { playerId: 'p1', type: 'guess' };
      const state = gameReducer(initialState, guessAction(action));

      expect(state.gameHistory).toHaveLength(1);
    });

    test('SET_CURRENT_PLAYER 應更新當前玩家', () => {
      const state = gameReducer(
        {
          ...initialState,
          players: [
            { id: 'p1', isCurrentTurn: true },
            { id: 'p2', isCurrentTurn: false }
          ]
        },
        setCurrentPlayer(1)
      );

      expect(state.currentPlayerIndex).toBe(1);
      expect(state.players[0].isCurrentTurn).toBe(false);
      expect(state.players[1].isCurrentTurn).toBe(true);
    });

    test('GAME_ENDED 應結束遊戲', () => {
      const state = gameReducer(initialState, gameEnded('p1'));

      expect(state.gamePhase).toBe(GAME_PHASE_FINISHED);
      expect(state.winner).toBe('p1');
    });

    test('RESET_GAME 應重置狀態', () => {
      const modifiedState = {
        ...initialState,
        gameId: 'game_123',
        winner: 'p1'
      };
      const state = gameReducer(modifiedState, resetGame());

      expect(state).toEqual(initialState);
    });

    test('未知 action 應返回當前狀態', () => {
      const currentState = { ...initialState, gameId: 'game_123' };
      const state = gameReducer(currentState, { type: 'UNKNOWN_ACTION' });

      expect(state).toEqual(currentState);
    });
  });
});
