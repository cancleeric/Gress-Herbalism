/**
 * useSocketConnection Hook 測試
 *
 * Issue #7 - 效能優化：Socket.io 連線管理
 */

import { renderHook, act } from '@testing-library/react';

// Mock socketService
let registeredCallback = null;
jest.mock('../../services/socketService', () => ({
  onConnectionChange: jest.fn((cb) => {
    registeredCallback = cb;
    return () => {
      registeredCallback = null;
    };
  }),
}));

const { useSocketConnection } = require('../useSocketConnection');

describe('useSocketConnection', () => {
  beforeEach(() => {
    registeredCallback = null;
    const { onConnectionChange } = require('../../services/socketService');
    onConnectionChange.mockClear();
    onConnectionChange.mockImplementation((cb) => {
      registeredCallback = cb;
      return () => {
        registeredCallback = null;
      };
    });
  });

  it('應該在 mount 時訂閱連線狀態', () => {
    const { onConnectionChange } = require('../../services/socketService');
    renderHook(() => useSocketConnection());
    expect(onConnectionChange).toHaveBeenCalled();
  });

  it('連線時應呼叫 onConnect 回調', () => {
    const onConnect = jest.fn();
    renderHook(() => useSocketConnection(onConnect));

    act(() => {
      if (registeredCallback) registeredCallback(true);
    });

    expect(onConnect).toHaveBeenCalled();
  });

  it('斷線時應呼叫 onDisconnect 回調', () => {
    const onDisconnect = jest.fn();
    renderHook(() => useSocketConnection(undefined, onDisconnect));

    act(() => {
      if (registeredCallback) registeredCallback(false);
    });

    expect(onDisconnect).toHaveBeenCalled();
  });

  it('unmount 時應清除連線狀態監聽器', () => {
    const { unmount } = renderHook(() => useSocketConnection());
    expect(registeredCallback).not.toBeNull();

    unmount();

    expect(registeredCallback).toBeNull();
  });

  it('addListener 應允許登記額外監聽器，並在 unmount 時自動清理', () => {
    const mockUnsub = jest.fn();
    const { result, unmount } = renderHook(() => useSocketConnection());

    act(() => {
      result.current.addListener(mockUnsub);
    });

    unmount();
    expect(mockUnsub).toHaveBeenCalledTimes(1);
  });

  it('removeAllListeners 應清除所有已登記監聽器', () => {
    const mockUnsub = jest.fn();
    const { result } = renderHook(() => useSocketConnection());

    act(() => {
      result.current.addListener(mockUnsub);
      result.current.removeAllListeners();
    });

    expect(mockUnsub).toHaveBeenCalledTimes(1);
  });
});
