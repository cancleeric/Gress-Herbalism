/**
 * ConnectionStatus 組件測試
 * 工單 0119
 */

import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import ConnectionStatus from './ConnectionStatus';

// Mock socketService
const mockOnConnectionChange = jest.fn();
const mockGetSocket = jest.fn();

jest.mock('../../services/socketService', () => ({
  onConnectionChange: (callback) => {
    mockOnConnectionChange(callback);
    return jest.fn(); // 返回 unsubscribe 函數
  },
  getSocket: () => mockGetSocket()
}));

describe('ConnectionStatus', () => {
  let connectionCallback;
  let mockSocket;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // 設置 mock socket
    mockSocket = {
      on: jest.fn(),
      off: jest.fn()
    };
    mockGetSocket.mockReturnValue(mockSocket);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('正常連線狀態', () => {
    test('連線正常時不顯示任何內容', () => {
      // 模擬初始連線狀態為已連線
      mockOnConnectionChange.mockImplementation((callback) => {
        connectionCallback = callback;
        callback(true);
        return jest.fn();
      });

      render(<ConnectionStatus />);

      expect(screen.queryByText('連線已中斷')).not.toBeInTheDocument();
      expect(screen.queryByText(/重新連線中/)).not.toBeInTheDocument();
      expect(screen.queryByText('重連成功！')).not.toBeInTheDocument();
    });
  });

  describe('斷線狀態', () => {
    test('斷線時顯示警告訊息', () => {
      // 模擬初始連線狀態為已斷線
      mockOnConnectionChange.mockImplementation((callback) => {
        connectionCallback = callback;
        callback(false); // 直接設定為斷線
        return jest.fn();
      });

      render(<ConnectionStatus />);

      expect(screen.getByText('連線已中斷')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toHaveClass('disconnected');
    });

    test('斷線時顯示警告圖標', () => {
      mockOnConnectionChange.mockImplementation((callback) => {
        connectionCallback = callback;
        callback(false);
        return jest.fn();
      });

      render(<ConnectionStatus />);

      const warningIcon = screen.getByText('!');
      expect(warningIcon).toBeInTheDocument();
      expect(warningIcon).toHaveClass('warning-icon');
    });
  });

  describe('重連狀態', () => {
    test('重連時顯示嘗試次數', () => {
      // 先設定為斷線狀態
      mockOnConnectionChange.mockImplementation((callback) => {
        connectionCallback = callback;
        callback(false);
        return jest.fn();
      });

      render(<ConnectionStatus />);

      // 獲取 reconnect_attempt 的回調
      const reconnectAttemptCallback = mockSocket.on.mock.calls.find(
        call => call[0] === 'reconnect_attempt'
      )?.[1];

      // 模擬重連嘗試
      if (reconnectAttemptCallback) {
        act(() => {
          reconnectAttemptCallback(3);
        });

        expect(screen.getByText(/重新連線中/)).toBeInTheDocument();
        expect(screen.getByText(/第 3 次嘗試/)).toBeInTheDocument();
      }
    });

    test('重連時顯示 spinner', () => {
      mockOnConnectionChange.mockImplementation((callback) => {
        connectionCallback = callback;
        callback(false);
        return jest.fn();
      });

      render(<ConnectionStatus />);

      const reconnectAttemptCallback = mockSocket.on.mock.calls.find(
        call => call[0] === 'reconnect_attempt'
      )?.[1];

      if (reconnectAttemptCallback) {
        act(() => {
          reconnectAttemptCallback(1);
        });

        const spinner = document.querySelector('.spinner');
        expect(spinner).toBeInTheDocument();
      }
    });
  });

  describe('重連成功', () => {
    test('重連成功時顯示成功提示', async () => {
      // 先設定為斷線狀態
      mockOnConnectionChange.mockImplementation((callback) => {
        connectionCallback = callback;
        callback(false);
        return jest.fn();
      });

      render(<ConnectionStatus />);

      // 確認初始為斷線狀態
      expect(screen.getByText('連線已中斷')).toBeInTheDocument();

      // 模擬重連成功
      act(() => {
        connectionCallback(true);
      });

      expect(screen.getByText('重連成功！')).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveClass('connected');
    });

    test('成功提示 3 秒後自動消失', async () => {
      mockOnConnectionChange.mockImplementation((callback) => {
        connectionCallback = callback;
        callback(false);
        return jest.fn();
      });

      render(<ConnectionStatus />);

      // 模擬重連成功
      act(() => {
        connectionCallback(true);
      });

      expect(screen.getByText('重連成功！')).toBeInTheDocument();

      // 快進 3 秒
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      await waitFor(() => {
        expect(screen.queryByText('重連成功！')).not.toBeInTheDocument();
      });
    });
  });

  describe('Socket 事件監聯', () => {
    test('應該監聽 reconnect_attempt 和 reconnect 事件', () => {
      mockOnConnectionChange.mockImplementation((callback) => {
        connectionCallback = callback;
        callback(true);
        return jest.fn();
      });

      render(<ConnectionStatus />);

      const onCalls = mockSocket.on.mock.calls;
      const eventNames = onCalls.map(call => call[0]);

      expect(eventNames).toContain('reconnect_attempt');
      expect(eventNames).toContain('reconnect');
    });

    test('組件卸載時應該移除事件監聽', () => {
      mockOnConnectionChange.mockImplementation((callback) => {
        connectionCallback = callback;
        callback(true);
        return jest.fn();
      });

      const { unmount } = render(<ConnectionStatus />);

      unmount();

      const offCalls = mockSocket.off.mock.calls;
      const eventNames = offCalls.map(call => call[0]);

      expect(eventNames).toContain('reconnect_attempt');
      expect(eventNames).toContain('reconnect');
    });
  });

  describe('無障礙功能', () => {
    test('斷線警告應有 aria-live="assertive"', () => {
      mockOnConnectionChange.mockImplementation((callback) => {
        connectionCallback = callback;
        callback(false);
        return jest.fn();
      });

      render(<ConnectionStatus />);

      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-live', 'assertive');
    });

    test('成功提示應有 aria-live="polite"', () => {
      mockOnConnectionChange.mockImplementation((callback) => {
        connectionCallback = callback;
        callback(false);
        return jest.fn();
      });

      render(<ConnectionStatus />);

      act(() => {
        connectionCallback(true);
      });

      const status = screen.getByRole('status');
      expect(status).toHaveAttribute('aria-live', 'polite');
    });
  });
});
