/**
 * AIPlayerSelector 組件測試
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AIPlayerSelector from './AIPlayerSelector';
import { AI_DIFFICULTY, AI_PLAYER_NAMES } from '../../../../shared/constants';

describe('AIPlayerSelector', () => {
  describe('初始化', () => {
    test('應該渲染組件標題', () => {
      const mockCallback = jest.fn();
      render(<AIPlayerSelector onConfigChange={mockCallback} />);

      expect(screen.getByText('AI 玩家設定')).toBeInTheDocument();
    });

    test('應該顯示預設 AI 數量 (2 個)', () => {
      const mockCallback = jest.fn();
      render(<AIPlayerSelector onConfigChange={mockCallback} />);

      const select = screen.getByLabelText('AI 玩家數量');
      expect(select.value).toBe('2');
    });

    test('應該顯示預設難度設定 (兩個 medium)', () => {
      const mockCallback = jest.fn();
      render(<AIPlayerSelector onConfigChange={mockCallback} />);

      const difficultySelects = screen.getAllByRole('combobox', {
        name: /難度/i
      });

      expect(difficultySelects).toHaveLength(2);
      expect(difficultySelects[0].value).toBe(AI_DIFFICULTY.MEDIUM);
      expect(difficultySelects[1].value).toBe(AI_DIFFICULTY.MEDIUM);
    });

    test('應該在初始化時調用 onConfigChange', () => {
      const mockCallback = jest.fn();
      render(<AIPlayerSelector onConfigChange={mockCallback} />);

      expect(mockCallback).toHaveBeenCalledWith({
        aiCount: 2,
        difficulties: [AI_DIFFICULTY.MEDIUM, AI_DIFFICULTY.MEDIUM]
      });
    });
  });

  describe('AI 數量變更', () => {
    test('應該能變更 AI 數量為 3', () => {
      const mockCallback = jest.fn();
      render(<AIPlayerSelector onConfigChange={mockCallback} />);

      const select = screen.getByLabelText('AI 玩家數量');
      fireEvent.change(select, { target: { value: '3' } });

      expect(select.value).toBe('3');
    });

    test('變更 AI 數量應該調整 difficulties 陣列長度', async () => {
      const mockCallback = jest.fn();
      render(<AIPlayerSelector onConfigChange={mockCallback} />);

      const select = screen.getByLabelText('AI 玩家數量');

      // 變更為 3 個 AI
      fireEvent.change(select, { target: { value: '3' } });

      await waitFor(() => {
        const difficultySelects = screen.getAllByRole('combobox', {
          name: /難度/i
        });
        expect(difficultySelects).toHaveLength(3);
      });

      // 檢查回調參數
      expect(mockCallback).toHaveBeenCalledWith({
        aiCount: 3,
        difficulties: [
          AI_DIFFICULTY.MEDIUM,
          AI_DIFFICULTY.MEDIUM,
          AI_DIFFICULTY.MEDIUM
        ]
      });
    });

    test('減少 AI 數量應該截斷 difficulties 陣列', async () => {
      const mockCallback = jest.fn();
      render(<AIPlayerSelector onConfigChange={mockCallback} />);

      const select = screen.getByLabelText('AI 玩家數量');

      // 先增加到 3
      fireEvent.change(select, { target: { value: '3' } });

      await waitFor(() => {
        const difficultySelects = screen.getAllByRole('combobox', {
          name: /難度/i
        });
        expect(difficultySelects).toHaveLength(3);
      });

      // 減少到 2
      fireEvent.change(select, { target: { value: '2' } });

      await waitFor(() => {
        const difficultySelects = screen.getAllByRole('combobox', {
          name: /難度/i
        });
        expect(difficultySelects).toHaveLength(2);
      });

      // 檢查最後的回調參數
      const lastCall = mockCallback.mock.calls[mockCallback.mock.calls.length - 1];
      expect(lastCall[0]).toEqual({
        aiCount: 2,
        difficulties: [AI_DIFFICULTY.MEDIUM, AI_DIFFICULTY.MEDIUM]
      });
    });
  });

  describe('難度變更', () => {
    test('應該能變更第一個 AI 的難度', async () => {
      const mockCallback = jest.fn();
      render(<AIPlayerSelector onConfigChange={mockCallback} />);

      const difficultySelects = screen.getAllByRole('combobox', {
        name: /難度/i
      });

      fireEvent.change(difficultySelects[0], {
        target: { value: AI_DIFFICULTY.HARD }
      });

      await waitFor(() => {
        expect(mockCallback).toHaveBeenCalledWith({
          aiCount: 2,
          difficulties: [AI_DIFFICULTY.HARD, AI_DIFFICULTY.MEDIUM]
        });
      });
    });

    test('應該能變更第二個 AI 的難度', async () => {
      const mockCallback = jest.fn();
      render(<AIPlayerSelector onConfigChange={mockCallback} />);

      const difficultySelects = screen.getAllByRole('combobox', {
        name: /難度/i
      });

      fireEvent.change(difficultySelects[1], {
        target: { value: AI_DIFFICULTY.EASY }
      });

      await waitFor(() => {
        expect(mockCallback).toHaveBeenCalledWith({
          aiCount: 2,
          difficulties: [AI_DIFFICULTY.MEDIUM, AI_DIFFICULTY.EASY]
        });
      });
    });

    test('應該能設定不同的難度組合', async () => {
      const mockCallback = jest.fn();
      render(<AIPlayerSelector onConfigChange={mockCallback} />);

      const difficultySelects = screen.getAllByRole('combobox', {
        name: /難度/i
      });

      // 設定第一個為 easy
      fireEvent.change(difficultySelects[0], {
        target: { value: AI_DIFFICULTY.EASY }
      });

      await waitFor(() => {
        expect(difficultySelects[0].value).toBe(AI_DIFFICULTY.EASY);
      });

      // 設定第二個為 hard
      fireEvent.change(difficultySelects[1], {
        target: { value: AI_DIFFICULTY.HARD }
      });

      await waitFor(() => {
        expect(mockCallback).toHaveBeenCalledWith({
          aiCount: 2,
          difficulties: [AI_DIFFICULTY.EASY, AI_DIFFICULTY.HARD]
        });
      });
    });
  });

  describe('UI 顯示', () => {
    test('應該顯示 AI 玩家名稱', () => {
      const mockCallback = jest.fn();
      render(<AIPlayerSelector onConfigChange={mockCallback} />);

      expect(screen.getByText(AI_PLAYER_NAMES[0])).toBeInTheDocument();
      expect(screen.getByText(AI_PLAYER_NAMES[1])).toBeInTheDocument();
    });

    test('應該顯示難度說明', () => {
      const mockCallback = jest.fn();
      render(<AIPlayerSelector onConfigChange={mockCallback} />);

      expect(screen.getByText('難度說明')).toBeInTheDocument();
      // 檢查難度名稱出現多次（在 select 和說明區）
      expect(screen.getAllByText('簡單').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('中等').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('困難').length).toBeGreaterThanOrEqual(1);
    });

    test('應該顯示難度描述', () => {
      const mockCallback = jest.fn();
      render(<AIPlayerSelector onConfigChange={mockCallback} />);

      expect(
        screen.getByText(/簡單 - 適合新手/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/中等 - 平衡挑戰/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/困難 - 高級玩家/)
      ).toBeInTheDocument();
    });

    test('應該顯示設定摘要', () => {
      const mockCallback = jest.fn();
      render(<AIPlayerSelector onConfigChange={mockCallback} />);

      // 檢查完整的摘要文字
      const summaryText = screen.getByText(/將與.*個 AI 玩家進行.*人遊戲/);
      expect(summaryText).toBeInTheDocument();
      expect(summaryText.textContent).toContain('2');
      expect(summaryText.textContent).toContain('3');
    });

    test('變更 AI 數量應該更新摘要', async () => {
      const mockCallback = jest.fn();
      render(<AIPlayerSelector onConfigChange={mockCallback} />);

      const select = screen.getByLabelText('AI 玩家數量');
      fireEvent.change(select, { target: { value: '3' } });

      await waitFor(() => {
        // 檢查是否顯示 "3 個 AI" 和 "4 人遊戲"
        const summaryElement = screen.getByText(/將與.*個 AI 玩家進行.*人遊戲/);
        expect(summaryElement).toBeInTheDocument();
      });
    });
  });

  describe('所有難度選項', () => {
    test('每個難度選擇器應該包含所有難度選項', () => {
      const mockCallback = jest.fn();
      render(<AIPlayerSelector onConfigChange={mockCallback} />);

      const difficultySelects = screen.getAllByRole('combobox', {
        name: /難度/i
      });

      difficultySelects.forEach(select => {
        const options = Array.from(select.options).map(opt => opt.value);
        expect(options).toEqual([
          AI_DIFFICULTY.EASY,
          AI_DIFFICULTY.MEDIUM,
          AI_DIFFICULTY.HARD
        ]);
      });
    });
  });

  describe('PropTypes', () => {
    test('應該接受 onConfigChange 函數作為 prop', () => {
      const mockCallback = jest.fn();

      // 正常渲染不應該拋出錯誤
      expect(() => {
        render(<AIPlayerSelector onConfigChange={mockCallback} />);
      }).not.toThrow();

      // 確認 callback 被調用
      expect(mockCallback).toHaveBeenCalled();
    });
  });

  describe('複雜場景', () => {
    test('應該正確處理多次變更', async () => {
      const mockCallback = jest.fn();
      render(<AIPlayerSelector onConfigChange={mockCallback} />);

      const countSelect = screen.getByLabelText('AI 玩家數量');

      // 變更為 3
      fireEvent.change(countSelect, { target: { value: '3' } });

      await waitFor(() => {
        const difficultySelects = screen.getAllByRole('combobox', {
          name: /難度/i
        });
        expect(difficultySelects).toHaveLength(3);
      });

      // 變更第一個 AI 難度
      const difficultySelects = screen.getAllByRole('combobox', {
        name: /難度/i
      });

      fireEvent.change(difficultySelects[0], {
        target: { value: AI_DIFFICULTY.HARD }
      });

      await waitFor(() => {
        expect(difficultySelects[0].value).toBe(AI_DIFFICULTY.HARD);
      });

      // 變更第三個 AI 難度
      fireEvent.change(difficultySelects[2], {
        target: { value: AI_DIFFICULTY.EASY }
      });

      await waitFor(() => {
        expect(mockCallback).toHaveBeenCalledWith({
          aiCount: 3,
          difficulties: [
            AI_DIFFICULTY.HARD,
            AI_DIFFICULTY.MEDIUM,
            AI_DIFFICULTY.EASY
          ]
        });
      });
    });
  });
});
