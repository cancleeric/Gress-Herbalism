import React, { useLayoutEffect } from 'react';
import { render, screen, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createStore, combineReducers } from 'redux';
import { MemoryRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import reducer, { evolutionActions as actions } from '../../../../store/evolution/evolutionStore';
import EvolutionRoom from './EvolutionRoom';
let mockUser = { uid: 'uid-A' };
const mockListeners = new Map();
const mockEmits = {};
jest.mock('../../../../firebase/AuthContext', () => ({ useAuth: () => ({ user: mockUser }) }));
jest.mock('../EvolutionLobby', () => ({ EvolutionLobby: ({ initialRoom }) => <div data-testid="waiting">{initialRoom?.name || '載入中'}</div> }));
jest.mock('../../../../services/socketService', () => {
 const exports = {};
 ["evoJoinRoom", "evoCreateCreature", "evoAddTrait", "evoPassEvolution", "evoFeedCreature", "evoAttack", "evoRespondAttack", "evoUseTrait", "onEvoJoinedRoom", "onEvoGameStarted", "onEvoGameState", "onEvoCreatureCreated", "onEvoTraitAdded", "onEvoPlayerPassed", "onEvoCreatureFed", "onEvoChainTriggered", "onEvoAttackPending", "onEvoAttackResolved", "onEvoTraitUsed", "onEvoError", "evoLeaveRoom"].forEach(name => {
   exports[name] = name.startsWith('on') ? callback => {
    mockListeners.set(name, callback); return () => mockListeners.delete(name);
   } : (...args) => { mockEmits[name] = args; };
 });
 return exports;
});
const room = (id, uid, seat) => ({ id, name: id, players: [{ id: seat, firebaseUid: uid, isHost: true }] });
const privateState = { gameId: 'room-A', phase: 'evolution', round: 1, players: { 'seat-A': { id: 'seat-A', hand: [{ id: 'private', traitType: 'PRIVATE_A_CARD' }], creatures: [] } }, playerOrder: ['seat-A'], currentPlayerId: 'seat-A' };
function seededStore() {
 let state = reducer(undefined, { type: '@@init' });
 state = reducer(state, actions.setMyPlayerId('seat-A'));
 state = reducer(state, actions.setGameState(privateState));
 return createStore(combineReducers({ evolution: reducer }), { evolution: { ...state, ownerUid: 'uid-A', roomId: 'room-A' } });
}
function Harness({ store, id, initialRoom, observations, seedOwnerUid = mockUser.uid }) {
 useLayoutEffect(() => { observations?.push(document.body.textContent); });
 return <Provider store={store}><MemoryRouter initialEntries={[{ pathname: `/game/evolution/${id}`, state: { room: initialRoom, roomOwnerUid: seedOwnerUid, isCreator: true } }]}><Routes><Route path="/game/evolution/:roomId" element={<EvolutionRoom />} /></Routes></MemoryRouter></Provider>;
}
beforeEach(() => { mockUser = { uid: 'uid-A' }; mockListeners.clear(); Object.keys(mockEmits).forEach(k => delete mockEmits[k]); });
test('new account/new waiting room never commits old private hand or old playing phase', () => {
 const store = seededStore(); mockUser = { uid: 'uid-B' }; const observations = [];
 render(<Harness store={store} id="room-B" initialRoom={room('room-B','uid-B','seat-B')} observations={observations} />);
 expect(screen.getByTestId('waiting')).toHaveTextContent('room-B');
 expect(observations.every(text => !text.includes('PRIVATE_A_CARD'))).toBe(true);
 expect(store.getState().evolution.myHand).toEqual([]);
});
test('same account different waiting room clears previous game instead of bypassing lobby', () => {
 const store = seededStore(); render(<Harness store={store} id="room-B" initialRoom={room('room-B','uid-A','seat-B')} />);
 expect(screen.getByTestId('waiting')).toHaveTextContent('room-B'); expect(store.getState().evolution.myHand).toEqual([]);
});
test('same UID same room token-refresh-style user replacement preserves playing state', () => {
 const store = seededStore(); const props = { store, id: 'room-A', initialRoom: room('room-A','uid-A','seat-A') };
 const view = render(<Harness {...props} />); expect(screen.getByText('PRIVATE_A_CARD')).toBeInTheDocument();
 mockUser = { uid: 'uid-A', displayName: 'updated' }; view.rerender(<Harness {...props} />);
 expect(screen.getByText('PRIVATE_A_CARD')).toBeInTheDocument();
});
test('room unmount clears private state and late game callbacks cannot restore it', () => {
 const store = seededStore(); const view = render(<Harness store={store} id="room-A" initialRoom={room('room-A','uid-A','seat-A')} />);
 const late = mockListeners.get('onEvoGameState'); view.unmount();
 expect(store.getState().evolution.myHand).toEqual([]);
 act(() => late(privateState)); expect(store.getState().evolution.myHand).toEqual([]);
});

test('late state from prior room is rejected while current own state is accepted', () => {
 const store = seededStore(); mockUser = { uid: 'uid-B' };
 render(<Harness store={store} id="room-B" initialRoom={room('room-B','uid-B','seat-B')} />);
 const callback = mockListeners.get('onEvoGameState');
 act(() => callback(privateState)); expect(screen.queryByText('PRIVATE_A_CARD')).not.toBeInTheDocument();
 expect(store.getState().evolution.phase).toBe('waiting');
 act(() => callback({ ...privateState, gameId: 'room-B', players: { 'seat-B': { id: 'seat-B', hand: [{ id: 'b', traitType: 'OWN_B_CARD' }], creatures: [] } } }));
 expect(screen.getByText('OWN_B_CARD')).toBeInTheDocument();
});

test('foreign-room attack pending cannot contaminate the current room', () => {
 const store = seededStore(); render(<Harness store={store} id="room-B" initialRoom={room('room-B','uid-A','seat-B')} />);
 act(() => mockListeners.get('onEvoAttackPending')({ gameId: 'room-A', options: ['A_ONLY_OPTION'] }));
 expect(store.getState().evolution.pendingResponse).toBeNull();
});
test('foreign-room attack resolved cannot clear legitimate current pending', () => {
 const store = seededStore(); render(<Harness store={store} id="room-B" initialRoom={room('room-B','uid-A','seat-B')} />);
 const legitimate = { gameId: 'room-B', options: ['B_VALID_OPTION'] };
 act(() => mockListeners.get('onEvoAttackPending')(legitimate));
 act(() => mockListeners.get('onEvoAttackResolved')({ gameId: 'room-A' }));
 expect(store.getState().evolution.pendingResponse).toEqual(legitimate);
});
test('foreign-room creature event never enters current action log', () => {
 const store = seededStore(); render(<Harness store={store} id="room-B" initialRoom={room('room-B','uid-A','seat-B')} />);
 act(() => mockListeners.get('onEvoCreatureCreated')({ roomId: 'room-A', marker: 'A_LOG' }));
 expect(store.getState().evolution.actionLog).toEqual([]);
});
test('old cleaned callback stays inactive after same UID returns to the same room', () => {
 const store = seededStore(); const a = { store, id: 'room-A', initialRoom: room('room-A','uid-A','seat-A') };
 const first = render(<Harness {...a} />); const stale = mockListeners.get('onEvoGameState'); first.unmount();
 const second = render(<Harness store={store} id="room-B" initialRoom={room('room-B','uid-A','seat-B')} />); second.unmount();
 render(<Harness {...a} />);
 act(() => stale({ ...privateState, players: { 'seat-A': { hand: [{ id: 'stale', traitType: 'STALE_A_HAND' }], creatures: [] } } }));
 expect(screen.queryByText('STALE_A_HAND')).not.toBeInTheDocument(); expect(store.getState().evolution.phase).toBe('waiting');
});

const logEvents = ['onEvoCreatureCreated','onEvoTraitAdded','onEvoPlayerPassed','onEvoCreatureFed','onEvoAttackResolved','onEvoTraitUsed'];
test.each(logEvents)('%s rejects all foreign/missing/mixed-source events and accepts matching array events', event => {
 const store = seededStore(); render(<Harness store={store} id="room-B" initialRoom={room('room-B','uid-A','seat-B')} />);
 const callback = mockListeners.get(event);
 act(() => {
  callback({ marker: 'MISSING_ID' }); callback([{ gameId: 'room-A', marker: 'FOREIGN' }]);
  callback([{ gameId: 'room-B' }, { gameId: 'room-A' }]); callback([]);
 });
 expect(store.getState().evolution.actionLog).toEqual([]);
 act(() => callback([{ gameId: 'room-B', marker: 'CURRENT' }]));
 expect(store.getState().evolution.actionLog).toHaveLength(1);
});
test('current pending/resolved events retain expected interaction behavior', () => {
 const store = seededStore(); render(<Harness store={store} id="room-B" initialRoom={room('room-B','uid-A','seat-B')} />);
 act(() => mockListeners.get('onEvoAttackPending')({ gameId: 'room-B', options: ['VALID'] }));
 expect(store.getState().evolution.pendingResponse.options).toEqual(['VALID']);
 act(() => mockListeners.get('onEvoAttackResolved')([{ gameId: 'room-B', type: 'attackResolved' }]));
 expect(store.getState().evolution.pendingResponse).toBeNull();
});
test('foreign errors do not modify current-room UI and stale timers are cleaned', () => {
 jest.useFakeTimers(); const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
 try {
  const store = seededStore(); const view = render(<Harness store={store} id="room-A" initialRoom={room('room-A','uid-A','seat-A')} />);
  act(() => mockListeners.get('onEvoError')({ gameId: 'room-B', message: 'FOREIGN_ERROR' }));
  expect(screen.queryByText('FOREIGN_ERROR')).not.toBeInTheDocument();
  act(() => mockListeners.get('onEvoError')({ gameId: 'room-A', message: 'OWN_ERROR' }));
  expect(screen.getByText('OWN_ERROR')).toBeInTheDocument(); view.unmount(); expect(jest.getTimerCount()).toBe(0);
 } finally { jest.runOnlyPendingTimers(); jest.useRealTimers(); spy.mockRestore(); }
});

test('room error from A is hidden on first B game commit and does not reappear', () => {
 const spy = jest.spyOn(console, 'error').mockImplementation(() => {}); const seen = []; let navigate;
 function RouteProbe() {
  navigate = useNavigate(); useLocation();
  useLayoutEffect(() => { seen.push(document.body.textContent); });
  return <EvolutionRoom />;
 }
 try {
  const store = seededStore();
  render(<Provider store={store}><MemoryRouter initialEntries={[{ pathname: '/game/evolution/room-A', state: { room: room('room-A','uid-A','seat-A') } }]}><Routes><Route path="/game/evolution/:roomId" element={<RouteProbe />} /></Routes></MemoryRouter></Provider>);
  act(() => mockListeners.get('onEvoError')({ gameId: 'room-A', message: 'OLD_A_ROOM_ERROR' }));
  expect(screen.getByText('OLD_A_ROOM_ERROR')).toBeInTheDocument(); seen.length = 0;
  act(() => {
   store.dispatch(actions.bindRoomContext({ uid: 'uid-A', roomId: 'room-B', playerId: 'seat-B' }));
   store.dispatch(actions.setOwnedGameState({ uid: 'uid-A', roomId: 'room-B', gameState: { ...privateState, gameId: 'room-B', players: { 'seat-B': { id: 'seat-B', hand: [], creatures: [] } } } }));
   navigate('/game/evolution/room-B', { state: { room: room('room-B','uid-A','seat-B') } });
  });
  expect(seen.every(text => !text.includes('OLD_A_ROOM_ERROR'))).toBe(true);
  expect(screen.queryByText('OLD_A_ROOM_ERROR')).not.toBeInTheDocument();
 } finally { spy.mockRestore(); }
});

test('Room does not reattribute a non-null old seed even when it contains both UIDs', () => {
 const store = seededStore(); const snapshot = room('room-A','uid-A','seat-A'); snapshot.players.push({ id: 'seat-B', firebaseUid: 'uid-B' });
 const props = { store, id: 'room-A', initialRoom: snapshot, seedOwnerUid: 'uid-A' }; const seen = [];
 const v = render(<Harness {...props} observations={seen} />); seen.length = 0;
 mockUser = { uid: 'uid-B' }; v.rerender(<Harness {...props} observations={seen} />);
 expect(screen.getByTestId('waiting')).toHaveTextContent('載入中');
 expect(seen.every(text => !text.includes('PRIVATE_A_CARD'))).toBe(true);
});
test('seed without acquisition owner fails closed and requests fresh join acknowledgement', () => {
 const store = seededStore(); render(<Harness store={store} id="room-B" initialRoom={room('room-B','uid-A','seat-B')} seedOwnerUid={null} />);
 expect(screen.getByTestId('waiting')).toHaveTextContent('載入中');
 expect(mockEmits.evoJoinRoom[0]).toBe('room-B');
 act(() => mockListeners.get('onEvoJoinedRoom')({ roomId: 'room-B', room: room('room-B','uid-A','seat-B') }));
 expect(screen.getByTestId('waiting')).toHaveTextContent('room-B');
});
test('fresh-join fallback id changes with UID but stays stable for same UID refresh', () => {
 const store = seededStore(); const props = { store, id: 'room-B', initialRoom: null, seedOwnerUid: null };
 const v = render(<Harness {...props} />); const firstId = mockEmits.evoJoinRoom[1].id;
 mockUser = { uid: 'uid-A', displayName: 'refreshed' }; v.rerender(<Harness {...props} />);
 expect(mockEmits.evoJoinRoom[1].id).toBe(firstId);
 mockUser = { uid: 'uid-B' }; v.rerender(<Harness {...props} />);
 expect(mockEmits.evoJoinRoom[1].id).not.toBe(firstId);
});

test('known-owner create/join seed enters waiting room without redundant join request', () => {
 const store = seededStore(); render(<Harness store={store} id="room-B" initialRoom={room('room-B','uid-A','seat-B')} seedOwnerUid="uid-A" />);
 expect(screen.getByTestId('waiting')).toHaveTextContent('room-B'); expect(mockEmits.evoJoinRoom).toBeUndefined();
});
