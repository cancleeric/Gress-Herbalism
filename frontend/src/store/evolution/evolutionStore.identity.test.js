import reducer, { evolutionActions as actions } from './evolutionStore';
const data = { phase: 'evolution', players: { A: { hand: [{ id: 'private-A' }], creatures: [] }, B: { hand: [{ id: 'private-B' }], creatures: [] } }, currentPlayerId: 'A' };
test('switching to missing player clears previous private derived data', () => {
 let state = reducer(undefined, actions.setMyPlayerId('A')); state = reducer(state, actions.setGameState(data));
 state = reducer(state, actions.setMyPlayerId('missing'));
 expect(state.myHand).toEqual([]); expect(state.myCreatures).toEqual([]); expect(state.isMyTurn).toBe(false);
});
test('setting player after state arrival projects its existing individualized hand', () => {
 let state = reducer(undefined, actions.setGameState(data)); state = reducer(state, actions.setMyPlayerId('B'));
 expect(state.myHand).toEqual([{ id: 'private-B' }]);
});

test('late game state from another room cannot cross current context', () => {
 let state = reducer(undefined, actions.bindRoomContext({ uid: 'U', roomId: 'new', playerId: 'A' }));
 state = reducer(state, actions.setOwnedGameState({ uid: 'U', roomId: 'new', gameState: { ...data, gameId: 'old' } }));
 expect(state.phase).toBe('waiting'); expect(state.myHand).toEqual([]);
});

test('same UID same room binding preserves private state while a different room resets it', () => {
 let state = reducer(undefined, actions.bindRoomContext({ uid: 'U', roomId: 'R', playerId: 'A' }));
 state = reducer(state, actions.setOwnedGameState({ uid: 'U', roomId: 'R', gameState: { ...data, gameId: 'R' } }));
 const preserved = reducer(state, actions.bindRoomContext({ uid: 'U', roomId: 'R' }));
 expect(preserved).toBe(state);
 state = reducer(state, actions.bindRoomContext({ uid: 'U', roomId: 'new', playerId: 'A' }));
 expect(state.phase).toBe('waiting'); expect(state.myHand).toEqual([]);
});
test('stale cleanup and stale UID events cannot erase or restore another room context', () => {
 let state = reducer(undefined, actions.bindRoomContext({ uid: 'B', roomId: 'new' }));
 state = reducer(state, actions.clearRoomContext({ uid: 'A', roomId: 'old' }));
 expect(state.ownerUid).toBe('B'); expect(state.roomId).toBe('new');
 state = reducer(state, actions.setOwnedGameState({ uid: 'A', roomId: 'old', gameState: { ...data, gameId: 'old' } }));
 expect(state.myHand).toEqual([]);
});
