/**
 * Lobby 組件單元測試
 * 重新設計：配合側邊欄佈局設計（工單 0121）
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { createStore } from 'redux';
import Lobby from './Lobby';
import { gameReducer } from '../../store/gameStore';
import * as socketService from '../../services/socketService';

// Mock socketService
jest.mock('../../services/socketService');

// Mock useAuth
const mockUser = { displayName: null, isAnonymous: true, photoURL: null };
jest.mock('../../firebase/AuthContext', () => ({
  useAuth: () => ({ user: mockUser })
}));

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

// Socket event callbacks storage
let eventCallbacks = {};

// 測試用 wrapper
const renderWithProviders = (component) => {
  const store = createStore(gameReducer);
  return render(
    <Provider store={store}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </Provider>
  );
};

describe('Lobby - 頁面渲染', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    eventCallbacks = {};
    localStorage.clear();

    // Mock socket service functions
    socketService.initSocket.mockReturnValue({});
    socketService.onConnectionChange.mockImplementation((callback) => {
      eventCallbacks.connectionChange = callback;
      queueMicrotask(() => callback(true));
      return () => {};
    });
    socketService.onRoomList.mockImplementation((callback) => {
      eventCallbacks.roomList = callback;
      return () => {};
    });
    socketService.onRoomCreated.mockImplementation((callback) => {
      eventCallbacks.roomCreated = callback;
      return () => {};
    });
    socketService.onJoinedRoom.mockImplementation((callback) => {
      eventCallbacks.joinedRoom = callback;
      return () => {};
    });
    socketService.onError.mockImplementation((callback) => {
      eventCallbacks.error = callback;
      return () => {};
    });
    socketService.onPasswordRequired.mockImplementation((callback) => {
      eventCallbacks.passwordRequired = callback;
      return () => {};
    });
    socketService.onReconnected.mockImplementation((callback) => {
      eventCallbacks.reconnected = callback;
      return () => {};
    });
    socketService.onReconnectFailed.mockImplementation((callback) => {
      eventCallbacks.reconnectFailed = callback;
      return () => {};
    });
    socketService.attemptReconnect.mockImplementation(() => {});
    socketService.createRoom.mockImplementation(() => {});
    socketService.joinRoom.mockImplementation(() => {});
  });

  test('應顯示側邊欄標題「本草」', async () => {
    renderWithProviders(<Lobby />);
    await waitFor(() => {
      expect(screen.getByText('本草')).toBeInTheDocument();
    });
  });

  test('應顯示側邊欄導航按鈕', async () => {
    renderWithProviders(<Lobby />);
    await waitFor(() => {
      expect(screen.getByTitle('遊戲大廳')).toBeInTheDocument();
      expect(screen.getByTitle('個人資料')).toBeInTheDocument();
      expect(screen.getByTitle('好友')).toBeInTheDocument();
      expect(screen.getByTitle('排行榜')).toBeInTheDocument();
    });
  });

  test('應顯示遊戲暱稱輸入框', async () => {
    renderWithProviders(<Lobby />);
    await waitFor(() => {
      expect(screen.getByLabelText('遊戲暱稱')).toBeInTheDocument();
    });
  });

  test('Header 應顯示玩家名稱「訪客」', async () => {
    renderWithProviders(<Lobby />);
    await waitFor(() => {
      expect(screen.getByText('訪客')).toBeInTheDocument();
    });
  });

  test('應顯示創建新房間按鈕', async () => {
    renderWithProviders(<Lobby />);
    await waitFor(() => {
      expect(screen.getByText('創建新房間')).toBeInTheDocument();
    });
  });

  test('應顯示加入房間輸入框', async () => {
    renderWithProviders(<Lobby />);
    await waitFor(() => {
      expect(screen.getByPlaceholderText('輸入房間 ID')).toBeInTheDocument();
    });
  });

  test('無房間時應顯示提示訊息', async () => {
    renderWithProviders(<Lobby />);
    await waitFor(() => {
      expect(screen.getByText(/目前沒有可用的房間/)).toBeInTheDocument();
    });
  });

  test('應包含 lobby 容器類別', async () => {
    const { container } = renderWithProviders(<Lobby />);
    await waitFor(() => {
      expect(container.querySelector('.lobby')).toBeInTheDocument();
    });
  });

  test('應包含 lobby-sidebar 類別', async () => {
    const { container } = renderWithProviders(<Lobby />);
    await waitFor(() => {
      expect(container.querySelector('.lobby-sidebar')).toBeInTheDocument();
    });
  });

  test('應包含 lobby-header 類別', async () => {
    const { container } = renderWithProviders(<Lobby />);
    await waitFor(() => {
      expect(container.querySelector('.lobby-header')).toBeInTheDocument();
    });
  });

  test('應包含 lobby-content 類別', async () => {
    const { container } = renderWithProviders(<Lobby />);
    await waitFor(() => {
      expect(container.querySelector('.lobby-content')).toBeInTheDocument();
    });
  });
});

describe('Lobby - 輸入驗證', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    eventCallbacks = {};
    localStorage.clear();

    socketService.initSocket.mockReturnValue({});
    socketService.onConnectionChange.mockImplementation((callback) => {
      eventCallbacks.connectionChange = callback;
      queueMicrotask(() => callback(true));
      return () => {};
    });
    socketService.onRoomList.mockImplementation((callback) => {
      eventCallbacks.roomList = callback;
      return () => {};
    });
    socketService.onRoomCreated.mockImplementation((callback) => {
      eventCallbacks.roomCreated = callback;
      return () => {};
    });
    socketService.onJoinedRoom.mockImplementation((callback) => {
      eventCallbacks.joinedRoom = callback;
      return () => {};
    });
    socketService.onError.mockImplementation((callback) => {
      eventCallbacks.error = callback;
      return () => {};
    });
    socketService.onPasswordRequired.mockImplementation((callback) => {
      eventCallbacks.passwordRequired = callback;
      return () => {};
    });
    socketService.onReconnected.mockImplementation((callback) => {
      eventCallbacks.reconnected = callback;
      return () => {};
    });
    socketService.onReconnectFailed.mockImplementation((callback) => {
      eventCallbacks.reconnectFailed = callback;
      return () => {};
    });
    socketService.attemptReconnect.mockImplementation(() => {});
    socketService.createRoom.mockImplementation(() => {});
    socketService.joinRoom.mockImplementation(() => {});
  });

  test('輸入玩家名稱應更新輸入值', async () => {
    renderWithProviders(<Lobby />);
    await waitFor(() => {
      expect(screen.getByLabelText('遊戲暱稱')).toBeInTheDocument();
    });
    const input = screen.getByLabelText('遊戲暱稱');
    fireEvent.change(input, { target: { value: '測試玩家' } });
    expect(input.value).toBe('測試玩家');
  });

  test('未輸入玩家名稱時點擊加入按鈕應顯示錯誤', async () => {
    renderWithProviders(<Lobby />);
    await waitFor(() => {
      expect(screen.queryByText('未連線')).not.toBeInTheDocument();
    });

    // 輸入房間 ID
    const roomIdInput = screen.getByPlaceholderText('輸入房間 ID');
    fireEvent.change(roomIdInput, { target: { value: 'test-room' } });

    // 點擊加入按鈕
    const joinButtons = screen.getAllByText('加入');
    fireEvent.click(joinButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('請輸入暱稱')).toBeInTheDocument();
    });
  });

  test('輸入後錯誤訊息應消失', async () => {
    renderWithProviders(<Lobby />);

    await waitFor(() => {
      expect(screen.queryByText('未連線')).not.toBeInTheDocument();
    });

    // 輸入房間 ID 並點擊加入觸發錯誤
    const roomIdInput = screen.getByPlaceholderText('輸入房間 ID');
    fireEvent.change(roomIdInput, { target: { value: 'test-room' } });
    const joinButtons = screen.getAllByText('加入');
    fireEvent.click(joinButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('請輸入暱稱')).toBeInTheDocument();
    });

    // 輸入玩家名稱
    const input = screen.getByLabelText('遊戲暱稱');
    fireEvent.change(input, { target: { value: '玩家' } });

    // 錯誤訊息應消失
    await waitFor(() => {
      expect(screen.queryByText('請輸入暱稱')).not.toBeInTheDocument();
    });
  });
});

describe('Lobby - 創建房間功能', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    eventCallbacks = {};
    localStorage.clear();

    socketService.initSocket.mockReturnValue({});
    socketService.onConnectionChange.mockImplementation((callback) => {
      eventCallbacks.connectionChange = callback;
      queueMicrotask(() => callback(true));
      return () => {};
    });
    socketService.onRoomList.mockImplementation((callback) => {
      eventCallbacks.roomList = callback;
      return () => {};
    });
    socketService.onRoomCreated.mockImplementation((callback) => {
      eventCallbacks.roomCreated = callback;
      return () => {};
    });
    socketService.onJoinedRoom.mockImplementation((callback) => {
      eventCallbacks.joinedRoom = callback;
      return () => {};
    });
    socketService.onError.mockImplementation((callback) => {
      eventCallbacks.error = callback;
      return () => {};
    });
    socketService.onPasswordRequired.mockImplementation((callback) => {
      eventCallbacks.passwordRequired = callback;
      return () => {};
    });
    socketService.onReconnected.mockImplementation((callback) => {
      eventCallbacks.reconnected = callback;
      return () => {};
    });
    socketService.onReconnectFailed.mockImplementation((callback) => {
      eventCallbacks.reconnectFailed = callback;
      return () => {};
    });
    socketService.attemptReconnect.mockImplementation(() => {});
    socketService.createRoom.mockImplementation(() => {});
    socketService.joinRoom.mockImplementation(() => {});
  });

  test('點擊創建新房間按鈕應開啟對話框', async () => {
    renderWithProviders(<Lobby />);
    await waitFor(() => {
      expect(screen.getByText('創建新房間')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('創建新房間'));

    await waitFor(() => {
      expect(screen.getByLabelText('玩家數量')).toBeInTheDocument();
    });
  });

  test('預設應選擇 3 人', async () => {
    renderWithProviders(<Lobby />);
    await waitFor(() => {
      expect(screen.getByText('創建新房間')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('創建新房間'));

    await waitFor(() => {
      const select = screen.getByLabelText('玩家數量');
      expect(select.value).toBe('3');
    });
  });

  test('應可以選擇 4 人', async () => {
    renderWithProviders(<Lobby />);
    await waitFor(() => {
      expect(screen.getByText('創建新房間')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('創建新房間'));

    await waitFor(() => {
      const select = screen.getByLabelText('玩家數量');
      fireEvent.change(select, { target: { value: '4' } });
      expect(select.value).toBe('4');
    });
  });

  test('應有 3 人和 4 人選項', async () => {
    renderWithProviders(<Lobby />);
    await waitFor(() => {
      expect(screen.getByText('創建新房間')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('創建新房間'));

    await waitFor(() => {
      expect(screen.getByRole('option', { name: '3人' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: '4人' })).toBeInTheDocument();
    });
  });

  test('創建房間成功應調用 socketService.createRoom', async () => {
    renderWithProviders(<Lobby />);
    await waitFor(() => {
      expect(screen.getByLabelText('遊戲暱稱')).toBeInTheDocument();
    });

    const playerNameInput = screen.getByLabelText('遊戲暱稱');
    fireEvent.change(playerNameInput, { target: { value: '玩家1' } });

    fireEvent.click(screen.getByText('創建新房間'));

    await waitFor(() => {
      expect(screen.getByLabelText('玩家數量')).toBeInTheDocument();
    });

    // 點擊 Modal 內的確認按鈕
    const createButton = screen.getByRole('button', { name: /創建房間/ });
    fireEvent.click(createButton);

    expect(socketService.createRoom).toHaveBeenCalled();
  });

  test('創建房間成功後應導航到遊戲房間', async () => {
    renderWithProviders(<Lobby />);
    await waitFor(() => {
      expect(screen.getByLabelText('遊戲暱稱')).toBeInTheDocument();
    });

    const playerNameInput = screen.getByLabelText('遊戲暱稱');
    fireEvent.change(playerNameInput, { target: { value: '玩家1' } });

    fireEvent.click(screen.getByText('創建新房間'));

    await waitFor(() => {
      expect(screen.getByLabelText('玩家數量')).toBeInTheDocument();
    });

    const createButton = screen.getByRole('button', { name: /創建房間/ });
    fireEvent.click(createButton);

    // 模擬後端回應
    await act(async () => {
      eventCallbacks.roomCreated({
        gameId: 'test_game_123',
        gameState: {
          players: [{ id: 'p1', name: '玩家1' }],
          maxPlayers: 3,
          gamePhase: 'waiting'
        }
      });
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/game/test_game_123');
    });
  });

  test('創建房間錯誤應顯示錯誤訊息', async () => {
    renderWithProviders(<Lobby />);
    await waitFor(() => {
      expect(screen.getByLabelText('遊戲暱稱')).toBeInTheDocument();
    });

    const playerNameInput = screen.getByLabelText('遊戲暱稱');
    fireEvent.change(playerNameInput, { target: { value: '玩家1' } });

    fireEvent.click(screen.getByText('創建新房間'));

    await waitFor(() => {
      expect(screen.getByLabelText('玩家數量')).toBeInTheDocument();
    });

    const createButton = screen.getByRole('button', { name: /創建房間/ });
    fireEvent.click(createButton);

    // 模擬後端錯誤回應
    await act(async () => {
      eventCallbacks.error({ message: '創建房間失敗' });
    });

    await waitFor(() => {
      expect(screen.getByText('創建房間失敗')).toBeInTheDocument();
    });
  });
});

describe('Lobby - 房間列表功能', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    eventCallbacks = {};
    localStorage.clear();

    socketService.initSocket.mockReturnValue({});
    socketService.onConnectionChange.mockImplementation((callback) => {
      eventCallbacks.connectionChange = callback;
      queueMicrotask(() => callback(true));
      return () => {};
    });
    socketService.onRoomList.mockImplementation((callback) => {
      eventCallbacks.roomList = callback;
      return () => {};
    });
    socketService.onRoomCreated.mockImplementation((callback) => {
      eventCallbacks.roomCreated = callback;
      return () => {};
    });
    socketService.onJoinedRoom.mockImplementation((callback) => {
      eventCallbacks.joinedRoom = callback;
      return () => {};
    });
    socketService.onError.mockImplementation((callback) => {
      eventCallbacks.error = callback;
      return () => {};
    });
    socketService.onPasswordRequired.mockImplementation((callback) => {
      eventCallbacks.passwordRequired = callback;
      return () => {};
    });
    socketService.onReconnected.mockImplementation((callback) => {
      eventCallbacks.reconnected = callback;
      return () => {};
    });
    socketService.onReconnectFailed.mockImplementation((callback) => {
      eventCallbacks.reconnectFailed = callback;
      return () => {};
    });
    socketService.attemptReconnect.mockImplementation(() => {});
    socketService.createRoom.mockImplementation(() => {});
    socketService.joinRoom.mockImplementation(() => {});
  });

  test('顯示房間列表', async () => {
    renderWithProviders(<Lobby />);
    await waitFor(() => {
      expect(screen.getByText('本草')).toBeInTheDocument();
    });

    // 模擬收到房間列表
    await act(async () => {
      eventCallbacks.roomList([
        { id: 'room1', name: '玩家A的房間', playerCount: 1, maxPlayers: 3 },
        { id: 'room2', name: '玩家B的房間', playerCount: 2, maxPlayers: 4 }
      ]);
    });

    await waitFor(() => {
      expect(screen.getByText('玩家A的房間')).toBeInTheDocument();
      expect(screen.getByText('玩家B的房間')).toBeInTheDocument();
    });
  });

  test('點擊房間表格加入按鈕應加入該房間', async () => {
    renderWithProviders(<Lobby />);
    await waitFor(() => {
      expect(screen.getByText('本草')).toBeInTheDocument();
    });

    // 先輸入玩家名稱
    const playerNameInput = screen.getByLabelText('遊戲暱稱');
    fireEvent.change(playerNameInput, { target: { value: '玩家X' } });

    // 模擬收到房間列表
    await act(async () => {
      eventCallbacks.roomList([
        { id: 'room1', name: '玩家A的房間', playerCount: 1, maxPlayers: 3 }
      ]);
    });

    await waitFor(() => {
      expect(screen.getByText('玩家A的房間')).toBeInTheDocument();
    });

    // 點擊表格中的加入按鈕
    const joinButtons = screen.getAllByRole('button', { name: /加入/ });
    const tableJoinButton = joinButtons.find(btn => btn.classList.contains('room-action-btn'));
    fireEvent.click(tableJoinButton);

    expect(socketService.joinRoom).toHaveBeenCalledWith('room1', expect.objectContaining({
      name: '玩家X'
    }));
  });

  test('加入房間成功應導航到遊戲房間', async () => {
    renderWithProviders(<Lobby />);
    await waitFor(() => {
      expect(screen.getByLabelText('遊戲暱稱')).toBeInTheDocument();
    });

    const playerNameInput = screen.getByLabelText('遊戲暱稱');
    fireEvent.change(playerNameInput, { target: { value: '玩家2' } });

    // 模擬收到房間列表
    await act(async () => {
      eventCallbacks.roomList([
        { id: 'valid_room', name: '測試房間', playerCount: 1, maxPlayers: 4 }
      ]);
    });

    await waitFor(() => {
      expect(screen.getByText('測試房間')).toBeInTheDocument();
    });

    const joinButtons = screen.getAllByRole('button', { name: /加入/ });
    const tableJoinButton = joinButtons.find(btn => btn.classList.contains('room-action-btn'));
    fireEvent.click(tableJoinButton);

    // 模擬後端回應
    await act(async () => {
      eventCallbacks.joinedRoom({
        gameId: 'valid_room',
        gameState: {
          players: [
            { id: 'p1', name: '玩家1' },
            { id: 'p2', name: '玩家2' }
          ],
          maxPlayers: 4,
          gamePhase: 'waiting'
        }
      });
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/game/valid_room');
    });
  });

  test('加入房間錯誤應顯示錯誤訊息', async () => {
    renderWithProviders(<Lobby />);
    await waitFor(() => {
      expect(screen.getByLabelText('遊戲暱稱')).toBeInTheDocument();
    });

    const playerNameInput = screen.getByLabelText('遊戲暱稱');
    fireEvent.change(playerNameInput, { target: { value: '玩家1' } });

    // 模擬收到房間列表
    await act(async () => {
      eventCallbacks.roomList([
        { id: 'some_room', name: '測試房間', playerCount: 1, maxPlayers: 3 }
      ]);
    });

    await waitFor(() => {
      expect(screen.getByText('測試房間')).toBeInTheDocument();
    });

    const joinButtons = screen.getAllByRole('button', { name: /加入/ });
    const tableJoinButton = joinButtons.find(btn => btn.classList.contains('room-action-btn'));
    fireEvent.click(tableJoinButton);

    // 模擬後端錯誤回應
    await act(async () => {
      eventCallbacks.error({ message: '房間不存在' });
    });

    await waitFor(() => {
      expect(screen.getByText('房間不存在')).toBeInTheDocument();
    });
  });
});

describe('Lobby - 連線狀態', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    eventCallbacks = {};
    localStorage.clear();

    socketService.initSocket.mockReturnValue({});
    socketService.onRoomList.mockImplementation((callback) => {
      eventCallbacks.roomList = callback;
      return () => {};
    });
    socketService.onRoomCreated.mockImplementation((callback) => {
      eventCallbacks.roomCreated = callback;
      return () => {};
    });
    socketService.onJoinedRoom.mockImplementation((callback) => {
      eventCallbacks.joinedRoom = callback;
      return () => {};
    });
    socketService.onError.mockImplementation((callback) => {
      eventCallbacks.error = callback;
      return () => {};
    });
    socketService.onPasswordRequired.mockImplementation((callback) => {
      eventCallbacks.passwordRequired = callback;
      return () => {};
    });
    socketService.onReconnected.mockImplementation((callback) => {
      eventCallbacks.reconnected = callback;
      return () => {};
    });
    socketService.onReconnectFailed.mockImplementation((callback) => {
      eventCallbacks.reconnectFailed = callback;
      return () => {};
    });
    socketService.attemptReconnect.mockImplementation(() => {});
    socketService.createRoom.mockImplementation(() => {});
    socketService.joinRoom.mockImplementation(() => {});
  });

  test('未連線時應顯示未連線狀態', async () => {
    socketService.onConnectionChange.mockImplementation((callback) => {
      eventCallbacks.connectionChange = callback;
      setTimeout(() => callback(false), 0);
      return () => {};
    });

    renderWithProviders(<Lobby />);

    await waitFor(() => {
      expect(screen.getByText('未連線')).toBeInTheDocument();
    });
  });

  test('連線後不應顯示連線狀態', async () => {
    socketService.onConnectionChange.mockImplementation((callback) => {
      eventCallbacks.connectionChange = callback;
      queueMicrotask(() => callback(true));
      return () => {};
    });

    renderWithProviders(<Lobby />);

    await waitFor(() => {
      expect(screen.queryByText('未連線')).not.toBeInTheDocument();
      expect(screen.queryByText('已連線')).not.toBeInTheDocument();
    });
  });
});

describe('Lobby - 錯誤訊息', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    eventCallbacks = {};
    localStorage.clear();

    socketService.initSocket.mockReturnValue({});
    socketService.onConnectionChange.mockImplementation((callback) => {
      eventCallbacks.connectionChange = callback;
      queueMicrotask(() => callback(true));
      return () => {};
    });
    socketService.onRoomList.mockImplementation((callback) => {
      eventCallbacks.roomList = callback;
      return () => {};
    });
    socketService.onRoomCreated.mockImplementation((callback) => {
      eventCallbacks.roomCreated = callback;
      return () => {};
    });
    socketService.onJoinedRoom.mockImplementation((callback) => {
      eventCallbacks.joinedRoom = callback;
      return () => {};
    });
    socketService.onError.mockImplementation((callback) => {
      eventCallbacks.error = callback;
      return () => {};
    });
    socketService.onPasswordRequired.mockImplementation((callback) => {
      eventCallbacks.passwordRequired = callback;
      return () => {};
    });
    socketService.onReconnected.mockImplementation((callback) => {
      eventCallbacks.reconnected = callback;
      return () => {};
    });
    socketService.onReconnectFailed.mockImplementation((callback) => {
      eventCallbacks.reconnectFailed = callback;
      return () => {};
    });
    socketService.attemptReconnect.mockImplementation(() => {});
    socketService.createRoom.mockImplementation(() => {});
    socketService.joinRoom.mockImplementation(() => {});
  });

  test('錯誤訊息應有 role="alert"', async () => {
    renderWithProviders(<Lobby />);

    await waitFor(() => {
      expect(screen.queryByText('未連線')).not.toBeInTheDocument();
    });

    // 輸入房間 ID 並點擊加入（沒輸入名稱）
    const roomIdInput = screen.getByPlaceholderText('輸入房間 ID');
    fireEvent.change(roomIdInput, { target: { value: 'test-room' } });
    const joinButtons = screen.getAllByText('加入');
    fireEvent.click(joinButtons[0]);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toHaveTextContent('請輸入暱稱');
    });
  });
});

// ==================== 重連測試 ====================
describe('Lobby - 重連功能', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    eventCallbacks = {};
    localStorage.clear();

    socketService.initSocket.mockReturnValue({});
    socketService.onConnectionChange.mockImplementation((callback) => {
      eventCallbacks.connectionChange = callback;
      queueMicrotask(() => callback(true));
      return () => {};
    });
    socketService.onRoomList.mockImplementation((callback) => {
      eventCallbacks.roomList = callback;
      return () => {};
    });
    socketService.onRoomCreated.mockImplementation((callback) => {
      eventCallbacks.roomCreated = callback;
      return () => {};
    });
    socketService.onJoinedRoom.mockImplementation((callback) => {
      eventCallbacks.joinedRoom = callback;
      return () => {};
    });
    socketService.onError.mockImplementation((callback) => {
      eventCallbacks.error = callback;
      return () => {};
    });
    socketService.onPasswordRequired.mockImplementation((callback) => {
      eventCallbacks.passwordRequired = callback;
      return () => {};
    });
    socketService.onReconnected.mockImplementation((callback) => {
      eventCallbacks.reconnected = callback;
      return () => {};
    });
    socketService.onReconnectFailed.mockImplementation((callback) => {
      eventCallbacks.reconnectFailed = callback;
      return () => {};
    });
    socketService.attemptReconnect.mockImplementation(() => {});
    socketService.createRoom.mockImplementation(() => {});
    socketService.joinRoom.mockImplementation(() => {});
  });

  test('有儲存的房間資訊時應嘗試重連', async () => {
    localStorage.setItem('gress_current_room', JSON.stringify({
      roomId: 'test-room',
      playerId: 'test-player',
      playerName: '測試玩家',
      timestamp: Date.now()
    }));

    renderWithProviders(<Lobby />);

    await waitFor(() => {
      expect(socketService.attemptReconnect).toHaveBeenCalledWith(
        'test-room',
        'test-player',
        '測試玩家'
      );
    });
  });

  test('重連成功時應導航到遊戲頁面', async () => {
    localStorage.setItem('gress_current_room', JSON.stringify({
      roomId: 'test-room',
      playerId: 'test-player',
      playerName: '測試玩家',
      timestamp: Date.now()
    }));

    renderWithProviders(<Lobby />);

    await waitFor(() => {
      expect(socketService.attemptReconnect).toHaveBeenCalled();
    });

    // 模擬重連成功
    await act(async () => {
      eventCallbacks.reconnected({
        gameId: 'test-room',
        playerId: 'test-player',
        gameState: {
          players: [{ id: 'test-player', name: '測試玩家' }],
          maxPlayers: 3,
          gamePhase: 'playing'
        }
      });
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/game/test-room');
    });
  });

  test('重連失敗時應顯示錯誤訊息', async () => {
    localStorage.setItem('gress_current_room', JSON.stringify({
      roomId: 'test-room',
      playerId: 'test-player',
      playerName: '測試玩家',
      timestamp: Date.now()
    }));

    renderWithProviders(<Lobby />);

    await waitFor(() => {
      expect(socketService.attemptReconnect).toHaveBeenCalled();
    });

    // 模擬重連失敗
    await act(async () => {
      eventCallbacks.reconnectFailed({
        reason: 'room_not_found',
        message: '房間已不存在'
      });
    });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('重連失敗：房間已不存在');
    });
  });

  test('房間資訊過期時不應嘗試重連', async () => {
    // 設定過期的房間資訊（超過 2 小時）
    localStorage.setItem('gress_current_room', JSON.stringify({
      roomId: 'test-room',
      playerId: 'test-player',
      playerName: '測試玩家',
      timestamp: Date.now() - 3 * 60 * 60 * 1000 // 3 小時前
    }));

    renderWithProviders(<Lobby />);

    await waitFor(() => {
      expect(screen.queryByText('未連線')).not.toBeInTheDocument();
    });

    // 不應嘗試重連
    expect(socketService.attemptReconnect).not.toHaveBeenCalled();
  });
});

// ==================== Room ID 加入功能測試 ====================
describe('Lobby - Room ID 加入功能', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    eventCallbacks = {};
    localStorage.clear();

    socketService.initSocket.mockReturnValue({});
    socketService.onConnectionChange.mockImplementation((callback) => {
      eventCallbacks.connectionChange = callback;
      queueMicrotask(() => callback(true));
      return () => {};
    });
    socketService.onRoomList.mockImplementation((callback) => {
      eventCallbacks.roomList = callback;
      return () => {};
    });
    socketService.onRoomCreated.mockImplementation((callback) => {
      eventCallbacks.roomCreated = callback;
      return () => {};
    });
    socketService.onJoinedRoom.mockImplementation((callback) => {
      eventCallbacks.joinedRoom = callback;
      return () => {};
    });
    socketService.onError.mockImplementation((callback) => {
      eventCallbacks.error = callback;
      return () => {};
    });
    socketService.onPasswordRequired.mockImplementation((callback) => {
      eventCallbacks.passwordRequired = callback;
      return () => {};
    });
    socketService.onReconnected.mockImplementation((callback) => {
      eventCallbacks.reconnected = callback;
      return () => {};
    });
    socketService.onReconnectFailed.mockImplementation((callback) => {
      eventCallbacks.reconnectFailed = callback;
      return () => {};
    });
    socketService.attemptReconnect.mockImplementation(() => {});
    socketService.createRoom.mockImplementation(() => {});
    socketService.joinRoom.mockImplementation(() => {});
  });

  test('輸入 Room ID 並點擊加入應加入房間', async () => {
    renderWithProviders(<Lobby />);
    await waitFor(() => {
      expect(screen.getByLabelText('遊戲暱稱')).toBeInTheDocument();
    });

    // 輸入玩家名稱
    const playerNameInput = screen.getByLabelText('遊戲暱稱');
    fireEvent.change(playerNameInput, { target: { value: '玩家測試' } });

    // 輸入 Room ID
    const roomIdInput = screen.getByPlaceholderText('輸入房間 ID');
    fireEvent.change(roomIdInput, { target: { value: 'my-room-123' } });

    // 點擊加入按鈕
    const joinButtons = screen.getAllByText('加入');
    fireEvent.click(joinButtons[0]);

    expect(socketService.joinRoom).toHaveBeenCalledWith('my-room-123', expect.objectContaining({
      name: '玩家測試'
    }));
  });

  test('未輸入 Room ID 時點擊加入應顯示錯誤', async () => {
    renderWithProviders(<Lobby />);
    await waitFor(() => {
      expect(screen.getByLabelText('遊戲暱稱')).toBeInTheDocument();
    });

    // 輸入玩家名稱
    const playerNameInput = screen.getByLabelText('遊戲暱稱');
    fireEvent.change(playerNameInput, { target: { value: '玩家測試' } });

    // 加入按鈕應該是禁用的（因為沒有輸入 Room ID）
    const joinButtons = screen.getAllByText('加入');
    expect(joinButtons[0]).toBeDisabled();
  });
});

// ==================== 密碼房間功能測試 ====================
describe('Lobby - 密碼房間功能', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    eventCallbacks = {};
    localStorage.clear();

    socketService.initSocket.mockReturnValue({});
    socketService.onConnectionChange.mockImplementation((callback) => {
      eventCallbacks.connectionChange = callback;
      queueMicrotask(() => callback(true));
      return () => {};
    });
    socketService.onRoomList.mockImplementation((callback) => {
      eventCallbacks.roomList = callback;
      return () => {};
    });
    socketService.onRoomCreated.mockImplementation((callback) => {
      eventCallbacks.roomCreated = callback;
      return () => {};
    });
    socketService.onJoinedRoom.mockImplementation((callback) => {
      eventCallbacks.joinedRoom = callback;
      return () => {};
    });
    socketService.onError.mockImplementation((callback) => {
      eventCallbacks.error = callback;
      return () => {};
    });
    socketService.onPasswordRequired.mockImplementation((callback) => {
      eventCallbacks.passwordRequired = callback;
      return () => {};
    });
    socketService.onReconnected.mockImplementation((callback) => {
      eventCallbacks.reconnected = callback;
      return () => {};
    });
    socketService.onReconnectFailed.mockImplementation((callback) => {
      eventCallbacks.reconnectFailed = callback;
      return () => {};
    });
    socketService.attemptReconnect.mockImplementation(() => {});
    socketService.createRoom.mockImplementation(() => {});
    socketService.joinRoom.mockImplementation(() => {});
    socketService.requestRoomList.mockImplementation(() => {});
  });

  test('創建私人房間應勾選私人並輸入密碼', async () => {
    renderWithProviders(<Lobby />);
    await waitFor(() => {
      expect(screen.queryByText('未連線')).not.toBeInTheDocument();
    });

    // 輸入暱稱
    const nicknameInput = screen.getByLabelText('遊戲暱稱');
    fireEvent.change(nicknameInput, { target: { value: '玩家1' } });

    // 打開創建房間 Modal
    fireEvent.click(screen.getByText('創建新房間'));

    await waitFor(() => {
      expect(screen.getByLabelText('設為私人房間')).toBeInTheDocument();
    });

    // 勾選私人房間
    fireEvent.click(screen.getByLabelText('設為私人房間'));

    // 應顯示密碼輸入欄
    await waitFor(() => {
      expect(screen.getByLabelText('房間密碼')).toBeInTheDocument();
    });

    // 輸入密碼
    const passwordInput = screen.getByLabelText('房間密碼');
    fireEvent.change(passwordInput, { target: { value: '1234' } });

    // 點擊創建
    const createButton = screen.getByRole('button', { name: /創建房間/ });
    fireEvent.click(createButton);

    expect(socketService.createRoom).toHaveBeenCalledWith(
      expect.objectContaining({ name: '玩家1' }),
      3,
      '1234'
    );
  });

  test('取消勾選私人房間應隱藏密碼欄位', async () => {
    renderWithProviders(<Lobby />);
    await waitFor(() => {
      expect(screen.queryByText('未連線')).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('創建新房間'));

    await waitFor(() => {
      expect(screen.getByLabelText('設為私人房間')).toBeInTheDocument();
    });

    // 勾選再取消
    fireEvent.click(screen.getByLabelText('設為私人房間'));
    await waitFor(() => {
      expect(screen.getByLabelText('房間密碼')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('設為私人房間'));
    await waitFor(() => {
      expect(screen.queryByLabelText('房間密碼')).not.toBeInTheDocument();
    });
  });

  test('加入私人房間應顯示密碼輸入 Modal', async () => {
    renderWithProviders(<Lobby />);
    await waitFor(() => {
      expect(screen.queryByText('未連線')).not.toBeInTheDocument();
    });

    // 輸入暱稱
    const nicknameInput = screen.getByLabelText('遊戲暱稱');
    fireEvent.change(nicknameInput, { target: { value: '玩家1' } });

    // 模擬收到包含私人房間的列表
    await act(async () => {
      eventCallbacks.roomList([
        { id: 'private-room', name: '私密房間', playerCount: 1, maxPlayers: 3, isPrivate: true }
      ]);
    });

    await waitFor(() => {
      expect(screen.getByText('私密房間')).toBeInTheDocument();
    });

    // 點擊加入按鈕
    const joinButtons = screen.getAllByRole('button', { name: /加入/ });
    const tableJoinButton = joinButtons.find(btn => btn.classList.contains('room-action-btn'));
    fireEvent.click(tableJoinButton);

    // 應顯示密碼 Modal
    await waitFor(() => {
      expect(screen.getByPlaceholderText('請輸入房間密碼')).toBeInTheDocument();
    });
  });

  test('密碼 Modal 提交應傳遞密碼', async () => {
    renderWithProviders(<Lobby />);
    await waitFor(() => {
      expect(screen.queryByText('未連線')).not.toBeInTheDocument();
    });

    // 輸入暱稱
    const nicknameInput = screen.getByLabelText('遊戲暱稱');
    fireEvent.change(nicknameInput, { target: { value: '玩家1' } });

    // 模擬收到私人房間
    await act(async () => {
      eventCallbacks.roomList([
        { id: 'private-room', name: '私密房間', playerCount: 1, maxPlayers: 3, isPrivate: true }
      ]);
    });

    await waitFor(() => {
      expect(screen.getByText('私密房間')).toBeInTheDocument();
    });

    // 點擊加入觸發密碼 Modal
    const joinButtons = screen.getAllByRole('button', { name: /加入/ });
    const tableJoinButton = joinButtons.find(btn => btn.classList.contains('room-action-btn'));
    fireEvent.click(tableJoinButton);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('請輸入房間密碼')).toBeInTheDocument();
    });

    // 輸入密碼
    const pwdInput = screen.getByPlaceholderText('請輸入房間密碼');
    fireEvent.change(pwdInput, { target: { value: 'secret123' } });

    // 點擊加入
    const modalJoinBtn = screen.getAllByRole('button', { name: /加入/ }).find(
      btn => btn.classList.contains('btn-primary')
    );
    fireEvent.click(modalJoinBtn);

    expect(socketService.joinRoom).toHaveBeenCalledWith(
      'private-room',
      expect.objectContaining({ name: '玩家1' }),
      'secret123'
    );
  });

  test('密碼 Modal 取消應關閉 Modal', async () => {
    renderWithProviders(<Lobby />);
    await waitFor(() => {
      expect(screen.queryByText('未連線')).not.toBeInTheDocument();
    });

    const nicknameInput = screen.getByLabelText('遊戲暱稱');
    fireEvent.change(nicknameInput, { target: { value: '玩家1' } });

    await act(async () => {
      eventCallbacks.roomList([
        { id: 'private-room', name: '私密房間', playerCount: 1, maxPlayers: 3, isPrivate: true }
      ]);
    });

    await waitFor(() => {
      expect(screen.getByText('私密房間')).toBeInTheDocument();
    });

    const joinButtons = screen.getAllByRole('button', { name: /加入/ });
    const tableJoinButton = joinButtons.find(btn => btn.classList.contains('room-action-btn'));
    fireEvent.click(tableJoinButton);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('請輸入房間密碼')).toBeInTheDocument();
    });

    // 點擊取消
    fireEvent.click(screen.getByRole('button', { name: '取消' }));

    await waitFor(() => {
      expect(screen.queryByPlaceholderText('請輸入房間密碼')).not.toBeInTheDocument();
    });
  });

  test('密碼為空時提交應顯示錯誤', async () => {
    renderWithProviders(<Lobby />);
    await waitFor(() => {
      expect(screen.queryByText('未連線')).not.toBeInTheDocument();
    });

    const nicknameInput = screen.getByLabelText('遊戲暱稱');
    fireEvent.change(nicknameInput, { target: { value: '玩家1' } });

    await act(async () => {
      eventCallbacks.roomList([
        { id: 'private-room', name: '私密房間', playerCount: 1, maxPlayers: 3, isPrivate: true }
      ]);
    });

    await waitFor(() => {
      expect(screen.getByText('私密房間')).toBeInTheDocument();
    });

    const joinButtons = screen.getAllByRole('button', { name: /加入/ });
    const tableJoinButton = joinButtons.find(btn => btn.classList.contains('room-action-btn'));
    fireEvent.click(tableJoinButton);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('請輸入房間密碼')).toBeInTheDocument();
    });

    // 不輸入密碼直接提交
    const modalJoinBtn = screen.getAllByRole('button', { name: /加入/ }).find(
      btn => btn.classList.contains('btn-primary')
    );
    fireEvent.click(modalJoinBtn);

    await waitFor(() => {
      expect(screen.getByText('請輸入密碼')).toBeInTheDocument();
    });

    // 不應呼叫 joinRoom
    expect(socketService.joinRoom).not.toHaveBeenCalled();
  });

  test('私人房間應顯示鎖頭圖示', async () => {
    const { container } = renderWithProviders(<Lobby />);
    await waitFor(() => {
      expect(screen.queryByText('未連線')).not.toBeInTheDocument();
    });

    await act(async () => {
      eventCallbacks.roomList([
        { id: 'private-room', name: '私密房間', playerCount: 1, maxPlayers: 3, isPrivate: true },
        { id: 'public-room', name: '公開房間', playerCount: 1, maxPlayers: 3, isPrivate: false }
      ]);
    });

    await waitFor(() => {
      expect(screen.getByText('私密房間')).toBeInTheDocument();
      expect(screen.getByText('公開房間')).toBeInTheDocument();
    });

    // 私人房間應有 lock 圖示
    const lockIcons = container.querySelectorAll('.private-icon');
    expect(lockIcons).toHaveLength(1);
  });
});

// ==================== 房間滿員狀態測試 ====================
describe('Lobby - 房間滿員狀態', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    eventCallbacks = {};
    localStorage.clear();

    socketService.initSocket.mockReturnValue({});
    socketService.onConnectionChange.mockImplementation((callback) => {
      eventCallbacks.connectionChange = callback;
      queueMicrotask(() => callback(true));
      return () => {};
    });
    socketService.onRoomList.mockImplementation((callback) => {
      eventCallbacks.roomList = callback;
      return () => {};
    });
    socketService.onRoomCreated.mockImplementation((callback) => {
      eventCallbacks.roomCreated = callback;
      return () => {};
    });
    socketService.onJoinedRoom.mockImplementation((callback) => {
      eventCallbacks.joinedRoom = callback;
      return () => {};
    });
    socketService.onError.mockImplementation((callback) => {
      eventCallbacks.error = callback;
      return () => {};
    });
    socketService.onPasswordRequired.mockImplementation((callback) => {
      eventCallbacks.passwordRequired = callback;
      return () => {};
    });
    socketService.onReconnected.mockImplementation((callback) => {
      eventCallbacks.reconnected = callback;
      return () => {};
    });
    socketService.onReconnectFailed.mockImplementation((callback) => {
      eventCallbacks.reconnectFailed = callback;
      return () => {};
    });
    socketService.attemptReconnect.mockImplementation(() => {});
    socketService.createRoom.mockImplementation(() => {});
    socketService.joinRoom.mockImplementation(() => {});
    socketService.requestRoomList.mockImplementation(() => {});
  });

  test('房間滿員時加入按鈕應被禁用且顯示「已滿」', async () => {
    renderWithProviders(<Lobby />);
    await waitFor(() => {
      expect(screen.queryByText('未連線')).not.toBeInTheDocument();
    });

    await act(async () => {
      eventCallbacks.roomList([
        { id: 'full-room', name: '滿員房間', playerCount: 3, maxPlayers: 3 }
      ]);
    });

    await waitFor(() => {
      expect(screen.getByText('滿員房間')).toBeInTheDocument();
    });

    // 按鈕應顯示「已滿」且被禁用
    const actionBtn = screen.getByRole('button', { name: /已滿/ });
    expect(actionBtn).toBeDisabled();
  });

  test('房間滿員時狀態欄應顯示「已滿」', async () => {
    const { container } = renderWithProviders(<Lobby />);
    await waitFor(() => {
      expect(screen.queryByText('未連線')).not.toBeInTheDocument();
    });

    await act(async () => {
      eventCallbacks.roomList([
        { id: 'full-room', name: '滿員房間', playerCount: 4, maxPlayers: 4 }
      ]);
    });

    await waitFor(() => {
      expect(screen.getByText('滿員房間')).toBeInTheDocument();
    });

    // 狀態欄應顯示已滿
    const statusSpan = container.querySelector('.room-status.full');
    expect(statusSpan).toBeInTheDocument();
    expect(statusSpan).toHaveTextContent('已滿');
  });

  test('房間未滿時狀態欄應顯示「等待中」', async () => {
    const { container } = renderWithProviders(<Lobby />);
    await waitFor(() => {
      expect(screen.queryByText('未連線')).not.toBeInTheDocument();
    });

    await act(async () => {
      eventCallbacks.roomList([
        { id: 'open-room', name: '開放房間', playerCount: 1, maxPlayers: 3 }
      ]);
    });

    await waitFor(() => {
      expect(screen.getByText('開放房間')).toBeInTheDocument();
    });

    const statusSpan = container.querySelector('.room-status.waiting');
    expect(statusSpan).toBeInTheDocument();
    expect(statusSpan).toHaveTextContent('等待中');
  });

  test('玩家人數應顯示正確格式', async () => {
    renderWithProviders(<Lobby />);
    await waitFor(() => {
      expect(screen.queryByText('未連線')).not.toBeInTheDocument();
    });

    await act(async () => {
      eventCallbacks.roomList([
        { id: 'room1', name: '測試房間', playerCount: 2, maxPlayers: 4 }
      ]);
    });

    await waitFor(() => {
      expect(screen.getByText('2/4')).toBeInTheDocument();
    });
  });
});
