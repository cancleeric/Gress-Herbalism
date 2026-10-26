import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import EvolutionLobbyPage from './EvolutionLobbyPage';
let mockUser = { uid: 'uid-A', displayName: 'Tester' }; const mockNavigate = jest.fn(); const mockHandlers = {};
const mockCreate = jest.fn(), mockJoin = jest.fn();
jest.mock('react-router-dom', () => ({ ...jest.requireActual('react-router-dom'), useNavigate: () => mockNavigate }));
jest.mock('../../../firebase/AuthContext', () => ({ useAuth: () => ({ user: mockUser }) }));
jest.mock('../VersionInfo', () => () => null);
jest.mock('../../../services/socketService', () => ({
 initSocket: jest.fn(), onConnectionChange: callback => { callback(true); return jest.fn(); },
 evoCreateRoom: (...args) => mockCreate(...args), evoJoinRoom: (...args) => mockJoin(...args), evoRequestRoomList: jest.fn(),
 onEvoRoomCreated: callback => { mockHandlers.created = callback; return jest.fn(); },
 onEvoJoinedRoom: callback => { mockHandlers.joined = callback; return jest.fn(); },
 onEvoRoomListUpdated: callback => { mockHandlers.list = callback; return jest.fn(); },
 onEvoError: callback => { mockHandlers.error = callback; return jest.fn(); },
}));
beforeEach(() => { jest.clearAllMocks(); localStorage.clear(); mockUser = { uid: 'uid-A', displayName: 'Tester' }; });
test('normal create navigation records acquisition UID alongside authoritative room', () => {
 render(<MemoryRouter><EvolutionLobbyPage /></MemoryRouter>);
 fireEvent.change(screen.getByLabelText('遊戲暱稱'), { target: { value: 'Tester' } });
 fireEvent.click(screen.getByRole('button', { name: /創建新房間/ }));
 fireEvent.click(screen.getByRole('button', { name: /done_all 創建房間/ }));
 expect(mockCreate).toHaveBeenCalled(); const room = { id: 'room', players: [{ firebaseUid: 'uid-A' }] };
 act(() => mockHandlers.created(room));
 expect(mockNavigate).toHaveBeenCalledWith('/game/evolution/room', { state: { room, roomOwnerUid: 'uid-A', isCreator: true } });
});
test('normal join navigation records acquisition UID and stale previous-UID callback cannot navigate', () => {
 const v = render(<MemoryRouter><EvolutionLobbyPage /></MemoryRouter>);
 fireEvent.change(screen.getByLabelText('遊戲暱稱'), { target: { value: 'Tester' } });
 fireEvent.change(screen.getByPlaceholderText('輸入房間 ID'), { target: { value: 'room' } });
 fireEvent.click(screen.getByRole('button', { name: /login 加入/ })); expect(mockJoin).toHaveBeenCalled();
 const callback = mockHandlers.joined; const room = { id: 'room', players: [{ firebaseUid: 'uid-A' }, { firebaseUid: 'uid-B' }] };
 act(() => callback({ roomId: 'room', room }));
 expect(mockNavigate).toHaveBeenCalledWith('/game/evolution/room', { state: { room, roomOwnerUid: 'uid-A', isCreator: false } });
 mockNavigate.mockClear(); mockUser = { uid: 'uid-B' }; v.rerender(<MemoryRouter><EvolutionLobbyPage /></MemoryRouter>);
 act(() => callback({ roomId: 'room', room })); expect(mockNavigate).not.toHaveBeenCalled();
});
