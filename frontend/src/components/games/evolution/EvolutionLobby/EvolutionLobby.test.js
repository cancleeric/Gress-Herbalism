import React, { useLayoutEffect } from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import EvolutionLobby from './EvolutionLobby';

let mockUser = { uid: 'host-uid' };
let mockHandlers = {};
const mockStart = jest.fn(), mockReady = jest.fn();
const mockSubscribe = (name, callback) => { mockHandlers[name] = callback; return jest.fn(); };
jest.mock('../../../../firebase/AuthContext', () => ({ useAuth: () => ({ user: mockUser }) }));
jest.mock('../../../../services/socketService', () => ({
  getSocket: () => ({ connected: true }),
  onConnectionChange: callback => mockSubscribe('connection', callback),
  evoStartGame: (...args) => mockStart(...args), evoSetReady: (...args) => mockReady(...args), evoLeaveRoom: jest.fn(),
  onEvoPlayerJoined: callback => mockSubscribe('joined', callback),
  onEvoPlayerLeft: callback => mockSubscribe('left', callback),
  onEvoPlayerReady: callback => mockSubscribe('ready', callback),
  onEvoPlayerConnectionChanged: callback => mockSubscribe('playerConnection', callback),
  onEvoGameStarted: callback => mockSubscribe('started', callback),
  onEvoError: callback => mockSubscribe('error', callback),
}));
const room = () => ({ id: 'room', players: [
  { id: 'host', firebaseUid: 'host-uid', name: 'Host', isHost: true },
  { id: 'guest', firebaseUid: 'guest-uid', name: 'Guest', isReady: true },
], maxPlayers: 4 });
const view = data => render(<MemoryRouter><EvolutionLobby roomId="room" initialRoom={data} initialRoomOwnerUid={mockUser.uid} /></MemoryRouter>);
beforeEach(() => { mockUser = { uid: 'host-uid' }; mockHandlers = {}; jest.clearAllMocks(); });

test('connected ready room can start using actual seat id', () => {
  view(room()); fireEvent.click(screen.getByRole('button', { name: '開始遊戲' }));
  expect(mockStart).toHaveBeenCalledWith('room', 'host');
});
test('ready but disconnected seat blocks start and explains reconnect', () => {
  const data = room(); data.players[1].isDisconnected = true; view(data);
  const start = screen.getByRole('button', { name: '等待玩家重新連線' });
  expect(start).toBeDisabled(); expect(screen.getByText('重新連線中')).toBeInTheDocument();
  fireEvent.click(start); expect(mockStart).not.toHaveBeenCalled();
});
test('peer connection event blocks immediately then restores start after recovery', () => {
  view(room()); const offline = room(); offline.players[1].isDisconnected = true;
  act(() => mockHandlers.playerConnection({ room: offline }));
  expect(screen.getByRole('button', { name: '等待玩家重新連線' })).toBeDisabled();
  act(() => mockHandlers.playerConnection({ room: room() }));
  expect(screen.getByRole('button', { name: '開始遊戲' })).toBeEnabled();
});
test('connection status from another room is ignored', () => {
  view(room()); const foreign = room(); foreign.id = 'other'; foreign.players[1].isDisconnected = true;
  act(() => mockHandlers.playerConnection({ room: foreign }));
  expect(screen.getByRole('button', { name: '開始遊戲' })).toBeEnabled();
});
test('own transport disconnect also blocks start', () => {
  view(room()); act(() => mockHandlers.connection(false));
  expect(screen.getByRole('button', { name: '等待玩家重新連線' })).toBeDisabled();
  act(() => mockHandlers.connection(true));
  expect(screen.getByRole('button', { name: '開始遊戲' })).toBeEnabled();
});
test('ready label and toggle use authoritative recovered room state', () => {
  mockUser = { uid: 'guest-uid' }; view(room());
  fireEvent.click(screen.getByRole('button', { name: '取消準備' }));
  expect(mockReady).toHaveBeenCalledWith('room', 'guest', false);
  const updated = room(); updated.players[1].isReady = false;
  act(() => mockHandlers.playerConnection({ room: updated }));
  expect(screen.getByRole('button', { name: '準備' })).toBeInTheDocument();
});

test.each(['joined','left','ready','playerConnection'])('%s room metadata cannot replace current room with another room', event => {
 view(room()); const foreign = { ...room(), id: 'other', name: 'FOREIGN_ROOM' };
 act(() => mockHandlers[event]({ room: foreign }));
 expect(screen.queryByText('FOREIGN_ROOM')).not.toBeInTheDocument();
 expect(screen.getByRole('button', { name: '開始遊戲' })).toBeEnabled();
});
test('metadata callback cleaned during A to B to A navigation remains inactive', () => {
 const a = { ...room(), name: 'ROOM_A' }; const b = { ...room(), id: 'B', name: 'ROOM_B' };
 const wrapper = (id, data) => <MemoryRouter><EvolutionLobby roomId={id} initialRoom={data} initialRoomOwnerUid={mockUser.uid} /></MemoryRouter>;
 const v = render(wrapper('room', a)); const stale = mockHandlers.joined;
 v.rerender(wrapper('B', b)); v.rerender(wrapper('room', a));
 act(() => stale({ room: { ...a, name: 'STALE_ROOM' } }));
 expect(screen.queryByText('STALE_ROOM')).not.toBeInTheDocument(); expect(screen.getByText('ROOM_A')).toBeInTheDocument();
});

function CommitProbe({ children, seen }) {
 useLayoutEffect(() => { seen.push(document.body.textContent); });
 return children;
}
test.each(['uid','route'])('changing %s with null initial room hides old metadata on the first commit', dimension => {
 const initial = { ...room(), name: 'PRIVATE_A_ROOM' }; const seen = [];
 const wrapper = (id, data) => <MemoryRouter><CommitProbe seen={seen}><EvolutionLobby roomId={id} initialRoom={data} initialRoomOwnerUid={mockUser.uid} /></CommitProbe></MemoryRouter>;
 const view = render(wrapper('room', initial)); seen.length = 0;
 if (dimension === 'uid') mockUser = { uid: 'other-uid' };
 view.rerender(wrapper(dimension === 'route' ? 'B' : 'room', null));
 expect(seen.every(text => !text.includes('PRIVATE_A_ROOM') && !text.includes('Host'))).toBe(true);
 expect(screen.queryByText('Host')).not.toBeInTheDocument();
});
test('switching room clears old error instead of stranding it after timer cleanup', () => {
 const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
 try {
  const wrapper = (id, data) => <MemoryRouter><EvolutionLobby roomId={id} initialRoom={data} initialRoomOwnerUid={mockUser.uid} /></MemoryRouter>;
  const v = render(wrapper('room', room()));
  act(() => mockHandlers.error({ gameId: 'room', message: 'OLD_A_ERROR' }));
  expect(screen.getByText('OLD_A_ERROR')).toBeInTheDocument();
  v.rerender(wrapper('B', { ...room(), id: 'B' }));
  expect(screen.queryByText('OLD_A_ERROR')).not.toBeInTheDocument();
 } finally { spy.mockRestore(); }
});

test('same UID same room profile/token refresh retains recovered local metadata with null initial prop', () => {
 const wrapper = data => <MemoryRouter><EvolutionLobby roomId="room" initialRoom={data} initialRoomOwnerUid={mockUser.uid} /></MemoryRouter>;
 const v = render(wrapper(room()));
 const recovered = { ...room(), name: 'RECOVERED_SAME_ROOM' }; recovered.players[1].isDisconnected = true;
 act(() => mockHandlers.playerConnection({ room: recovered }));
 mockUser = { uid: 'host-uid', displayName: 'refreshed' }; v.rerender(wrapper(null));
 expect(screen.getByText('RECOVERED_SAME_ROOM')).toBeInTheDocument();
 expect(screen.getByRole('button', { name: '等待玩家重新連線' })).toBeDisabled();
});

test('same-route metadata from old identity cannot rehydrate old room after UID switch', () => {
 const wrapper = data => <MemoryRouter><EvolutionLobby roomId="room" initialRoom={data} initialRoomOwnerUid={mockUser.uid} /></MemoryRouter>;
 const v = render(wrapper(room())); mockUser = { uid: 'other-uid' }; v.rerender(wrapper(null));
 act(() => mockHandlers.joined({ room: { ...room(), name: 'OLD_IDENTITY_ROOM' } }));
 expect(screen.queryByText('OLD_IDENTITY_ROOM')).not.toBeInTheDocument();
 expect(screen.queryByText('Host')).not.toBeInTheDocument();
});

test('non-null seed containing both identities cannot be reattributed after UID switch', () => {
 const snapshot = { ...room(), name: 'OLD_OWNER_SNAPSHOT' }; const seen = [];
 const wrapper = () => <MemoryRouter><CommitProbe seen={seen}><EvolutionLobby roomId="room" initialRoom={snapshot} initialRoomOwnerUid="host-uid" /></CommitProbe></MemoryRouter>;
 const v = render(wrapper()); seen.length = 0; mockUser = { uid: 'guest-uid' }; v.rerender(wrapper());
 expect(seen.every(text => !text.includes('OLD_OWNER_SNAPSHOT') && !text.includes('Host'))).toBe(true);
 expect(screen.queryByText('OLD_OWNER_SNAPSHOT')).not.toBeInTheDocument();
});
