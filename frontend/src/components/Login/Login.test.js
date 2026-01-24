/**
 * Login 組件單元測試
 * 工單 0059
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Login from './Login';

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock useAuth
const mockLoginWithGoogle = jest.fn();
const mockLoginAsGuest = jest.fn();

jest.mock('../../firebase', () => ({
  useAuth: () => ({
    loginWithGoogle: mockLoginWithGoogle,
    loginAsGuest: mockLoginAsGuest,
    isLoading: false,
  }),
}));

describe('Login - 工單 0059', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('頁面渲染', () => {
    test('應顯示遊戲標題', () => {
      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      );
      expect(screen.getByText('本草 Herbalism')).toBeInTheDocument();
    });

    test('應顯示副標題', () => {
      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      );
      expect(screen.getByText('3-4 人推理卡牌遊戲')).toBeInTheDocument();
    });

    test('應顯示 Google 登入按鈕', () => {
      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      );
      expect(screen.getByText('使用 Google 帳號登入')).toBeInTheDocument();
    });

    test('應顯示訪客登入按鈕', () => {
      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      );
      expect(screen.getByText('訪客模式')).toBeInTheDocument();
    });

    test('應顯示訪客說明文字', () => {
      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      );
      expect(screen.getByText(/訪客模式可以直接遊玩/)).toBeInTheDocument();
    });

    test('應顯示服務條款文字', () => {
      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      );
      expect(screen.getByText(/登入即表示您同意我們的服務條款/)).toBeInTheDocument();
    });
  });

  describe('Google 登入', () => {
    test('點擊 Google 登入按鈕應呼叫 loginWithGoogle', async () => {
      mockLoginWithGoogle.mockResolvedValue({ success: true });

      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      );

      fireEvent.click(screen.getByText('使用 Google 帳號登入'));

      await waitFor(() => {
        expect(mockLoginWithGoogle).toHaveBeenCalledTimes(1);
      });
    });

    test('Google 登入成功應導航到首頁', async () => {
      mockLoginWithGoogle.mockResolvedValue({ success: true });

      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      );

      fireEvent.click(screen.getByText('使用 Google 帳號登入'));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });

    test('Google 登入失敗應顯示錯誤訊息', async () => {
      mockLoginWithGoogle.mockResolvedValue({ success: false, error: '登入失敗' });

      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      );

      fireEvent.click(screen.getByText('使用 Google 帳號登入'));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('登入失敗');
      });
    });
  });

  describe('訪客登入', () => {
    test('點擊訪客登入按鈕應呼叫 loginAsGuest', async () => {
      mockLoginAsGuest.mockResolvedValue({ success: true });

      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      );

      fireEvent.click(screen.getByText('訪客模式'));

      await waitFor(() => {
        expect(mockLoginAsGuest).toHaveBeenCalledTimes(1);
      });
    });

    test('訪客登入成功應導航到首頁', async () => {
      mockLoginAsGuest.mockResolvedValue({ success: true });

      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      );

      fireEvent.click(screen.getByText('訪客模式'));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });

    test('訪客登入失敗應顯示錯誤訊息', async () => {
      mockLoginAsGuest.mockResolvedValue({ success: false, error: '訪客登入失敗' });

      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      );

      fireEvent.click(screen.getByText('訪客模式'));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('訪客登入失敗');
      });
    });
  });

  describe('載入狀態', () => {
    test('處理中應禁用所有按鈕', async () => {
      // 設置一個延遲的 Promise 來模擬處理中狀態
      mockLoginWithGoogle.mockImplementation(() => new Promise(resolve => {
        setTimeout(() => resolve({ success: true }), 1000);
      }));

      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      );

      const googleBtn = screen.getByText('使用 Google 帳號登入').closest('button');
      const guestBtn = screen.getByText('訪客模式').closest('button');

      // 初始狀態按鈕應可用
      expect(googleBtn).not.toBeDisabled();
      expect(guestBtn).not.toBeDisabled();

      // 點擊後按鈕應被禁用
      fireEvent.click(googleBtn);

      await waitFor(() => {
        expect(googleBtn).toBeDisabled();
        expect(guestBtn).toBeDisabled();
      });
    });
  });
});
