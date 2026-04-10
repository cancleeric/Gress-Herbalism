/**
 * Tutorial 組件測試
 *
 * 工單 0055 - 互動式新手教學系統
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Tutorial from './Tutorial';
import { markTutorialCompleted, clearTutorialCompleted } from './useTutorial';

const TUTORIAL_ID = 'herbalism-test';

// 簡單 mock steps（3 步）
jest.mock('./herbalismSteps', () => [
  { id: 's1', title: '第一步', content: '說明一', emoji: '🌿', target: null, placement: 'center' },
  { id: 's2', title: '第二步', content: '說明二', emoji: '🃏', target: null, placement: 'center' },
  { id: 's3', title: '第三步', content: '說明三', emoji: '🎯', target: null, placement: 'center' },
]);

describe('Tutorial 組件', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    clearTutorialCompleted(TUTORIAL_ID);
  });

  test('首次訪問時應自動顯示教學', () => {
    render(<Tutorial tutorialId={TUTORIAL_ID} autoStart />);
    expect(screen.getByText('第一步')).toBeInTheDocument();
  });

  test('已完成教學後不應自動顯示', () => {
    markTutorialCompleted(TUTORIAL_ID);
    render(<Tutorial tutorialId={TUTORIAL_ID} autoStart />);
    expect(screen.queryByText('第一步')).not.toBeInTheDocument();
  });

  test('autoStart=false 時不應顯示教學', () => {
    render(<Tutorial tutorialId={TUTORIAL_ID} autoStart={false} />);
    expect(screen.queryByText('第一步')).not.toBeInTheDocument();
  });

  test('點擊「下一步」應前往第二步', () => {
    render(<Tutorial tutorialId={TUTORIAL_ID} autoStart />);
    fireEvent.click(screen.getByLabelText('下一步'));
    expect(screen.getByText('第二步')).toBeInTheDocument();
  });

  test('點擊「跳過」應關閉教學', () => {
    render(<Tutorial tutorialId={TUTORIAL_ID} autoStart />);
    // 取第一個跳過按鈕
    const skipBtns = screen.getAllByLabelText('跳過教學');
    fireEvent.click(skipBtns[0]);
    expect(screen.queryByText('第一步')).not.toBeInTheDocument();
  });

  test('到達最後一步時應顯示「開始遊戲！」按鈕', () => {
    render(<Tutorial tutorialId={TUTORIAL_ID} autoStart />);
    // 前進到最後一步
    fireEvent.click(screen.getByLabelText('下一步'));
    fireEvent.click(screen.getByLabelText('下一步'));
    expect(screen.getByLabelText('完成教學')).toBeInTheDocument();
  });

  test('完成教學後應標記完成並關閉', () => {
    const { getCompletedTutorials } = require('./useTutorial');
    render(<Tutorial tutorialId={TUTORIAL_ID} autoStart />);
    fireEvent.click(screen.getByLabelText('下一步'));
    fireEvent.click(screen.getByLabelText('下一步'));
    fireEvent.click(screen.getByLabelText('完成教學'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(getCompletedTutorials()).toContain(TUTORIAL_ID);
  });

  test('進度指示器應顯示正確步驟數', () => {
    render(<Tutorial tutorialId={TUTORIAL_ID} autoStart />);
    expect(screen.getByText((_, el) => el?.className === 'tutorial-step-count' && el.textContent.includes('1') && el.textContent.includes('3'))).toBeInTheDocument();
  });

  test('應顯示當前步驟的 emoji 和標題', () => {
    render(<Tutorial tutorialId={TUTORIAL_ID} autoStart />);
    expect(screen.getByText('🌿')).toBeInTheDocument();
    expect(screen.getByText('第一步')).toBeInTheDocument();
    expect(screen.getByText('說明一')).toBeInTheDocument();
  });

  test('第一步不應顯示「上一步」按鈕', () => {
    render(<Tutorial tutorialId={TUTORIAL_ID} autoStart />);
    expect(screen.queryByLabelText('上一步')).not.toBeInTheDocument();
  });

  test('第二步應顯示「上一步」按鈕，點擊可返回', () => {
    render(<Tutorial tutorialId={TUTORIAL_ID} autoStart />);
    fireEvent.click(screen.getByLabelText('下一步'));
    const prevBtn = screen.getByLabelText('上一步');
    expect(prevBtn).toBeInTheDocument();
    fireEvent.click(prevBtn);
    expect(screen.getByText('第一步')).toBeInTheDocument();
  });

  test('按 Escape 鍵應跳過教學', () => {
    render(<Tutorial tutorialId={TUTORIAL_ID} autoStart />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByText('第一步')).not.toBeInTheDocument();
  });

  test('按 ArrowRight 鍵應前往下一步', () => {
    render(<Tutorial tutorialId={TUTORIAL_ID} autoStart />);
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    expect(screen.getByText('第二步')).toBeInTheDocument();
  });
});
