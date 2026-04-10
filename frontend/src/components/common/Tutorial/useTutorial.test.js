/**
 * useTutorial Hook 測試
 *
 * 工單 0055 - 互動式新手教學系統
 */

import { renderHook, act } from '@testing-library/react';
import useTutorial, {
  getCompletedTutorials,
  markTutorialCompleted,
  clearTutorialCompleted,
} from './useTutorial';

const mockSteps = [
  { id: 'step1', title: '步驟一', content: '內容一', emoji: '🌿', target: null, placement: 'center' },
  { id: 'step2', title: '步驟二', content: '內容二', emoji: '🃏', target: null, placement: 'center' },
  { id: 'step3', title: '步驟三', content: '內容三', emoji: '🎯', target: null, placement: 'center' },
];

const TUTORIAL_ID = 'test-tutorial';

describe('useTutorial', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // ==================== localStorage helpers ====================

  describe('getCompletedTutorials', () => {
    test('無資料時應回傳空陣列', () => {
      expect(getCompletedTutorials()).toEqual([]);
    });

    test('應回傳已儲存的完成列表', () => {
      localStorage.setItem('gress_tutorial_completed', JSON.stringify(['herbalism']));
      expect(getCompletedTutorials()).toEqual(['herbalism']);
    });

    test('localStorage 損毀時應回傳空陣列', () => {
      localStorage.setItem('gress_tutorial_completed', 'invalid-json');
      expect(getCompletedTutorials()).toEqual([]);
    });
  });

  describe('markTutorialCompleted', () => {
    test('應標記教學為已完成', () => {
      markTutorialCompleted(TUTORIAL_ID);
      expect(getCompletedTutorials()).toContain(TUTORIAL_ID);
    });

    test('重複標記不應產生重複項目', () => {
      markTutorialCompleted(TUTORIAL_ID);
      markTutorialCompleted(TUTORIAL_ID);
      const completed = getCompletedTutorials();
      expect(completed.filter((id) => id === TUTORIAL_ID)).toHaveLength(1);
    });
  });

  describe('clearTutorialCompleted', () => {
    test('應清除指定教學的完成紀錄', () => {
      markTutorialCompleted(TUTORIAL_ID);
      clearTutorialCompleted(TUTORIAL_ID);
      expect(getCompletedTutorials()).not.toContain(TUTORIAL_ID);
    });

    test('清除不存在的項目不應報錯', () => {
      expect(() => clearTutorialCompleted('nonexistent')).not.toThrow();
    });
  });

  // ==================== Hook 行為 ====================

  describe('autoStart=true（首次訪問）', () => {
    test('首次訪問時應自動開啟教學', () => {
      const { result } = renderHook(() =>
        useTutorial({ tutorialId: TUTORIAL_ID, steps: mockSteps, autoStart: true })
      );
      expect(result.current.isOpen).toBe(true);
    });

    test('已完成教學時不應自動開啟', () => {
      markTutorialCompleted(TUTORIAL_ID);
      const { result } = renderHook(() =>
        useTutorial({ tutorialId: TUTORIAL_ID, steps: mockSteps, autoStart: true })
      );
      expect(result.current.isOpen).toBe(false);
    });
  });

  describe('autoStart=false', () => {
    test('autoStart=false 時不應自動開啟', () => {
      const { result } = renderHook(() =>
        useTutorial({ tutorialId: TUTORIAL_ID, steps: mockSteps, autoStart: false })
      );
      expect(result.current.isOpen).toBe(false);
    });
  });

  describe('startTutorial', () => {
    test('呼叫 startTutorial 應開啟教學並重置步驟', () => {
      const { result } = renderHook(() =>
        useTutorial({ tutorialId: TUTORIAL_ID, steps: mockSteps, autoStart: false })
      );
      act(() => { result.current.startTutorial(); });
      expect(result.current.isOpen).toBe(true);
      expect(result.current.currentStep).toBe(0);
    });
  });

  describe('nextStep', () => {
    test('應前進到下一步', () => {
      const { result } = renderHook(() =>
        useTutorial({ tutorialId: TUTORIAL_ID, steps: mockSteps, autoStart: false })
      );
      act(() => { result.current.startTutorial(); });
      act(() => { result.current.nextStep(); });
      expect(result.current.currentStep).toBe(1);
    });

    test('最後一步呼叫 nextStep 應關閉教學並標記完成', () => {
      const { result } = renderHook(() =>
        useTutorial({ tutorialId: TUTORIAL_ID, steps: mockSteps, autoStart: false })
      );
      act(() => { result.current.startTutorial(); });
      // 前進到最後一步
      act(() => { result.current.nextStep(); });
      act(() => { result.current.nextStep(); });
      // 最後一步完成
      act(() => { result.current.nextStep(); });
      expect(result.current.isOpen).toBe(false);
      expect(getCompletedTutorials()).toContain(TUTORIAL_ID);
    });
  });

  describe('prevStep', () => {
    test('應後退到上一步', () => {
      const { result } = renderHook(() =>
        useTutorial({ tutorialId: TUTORIAL_ID, steps: mockSteps, autoStart: false })
      );
      act(() => { result.current.startTutorial(); });
      act(() => { result.current.nextStep(); });
      act(() => { result.current.prevStep(); });
      expect(result.current.currentStep).toBe(0);
    });

    test('第一步呼叫 prevStep 不應超出邊界', () => {
      const { result } = renderHook(() =>
        useTutorial({ tutorialId: TUTORIAL_ID, steps: mockSteps, autoStart: false })
      );
      act(() => { result.current.startTutorial(); });
      act(() => { result.current.prevStep(); });
      expect(result.current.currentStep).toBe(0);
    });
  });

  describe('skipTutorial', () => {
    test('應關閉教學並標記完成', () => {
      const { result } = renderHook(() =>
        useTutorial({ tutorialId: TUTORIAL_ID, steps: mockSteps, autoStart: true })
      );
      act(() => { result.current.skipTutorial(); });
      expect(result.current.isOpen).toBe(false);
      expect(getCompletedTutorials()).toContain(TUTORIAL_ID);
    });
  });

  describe('restartTutorial', () => {
    test('應清除完成紀錄並重新開啟教學', () => {
      markTutorialCompleted(TUTORIAL_ID);
      const { result } = renderHook(() =>
        useTutorial({ tutorialId: TUTORIAL_ID, steps: mockSteps, autoStart: false })
      );
      act(() => { result.current.restartTutorial(); });
      expect(result.current.isOpen).toBe(true);
      expect(result.current.currentStep).toBe(0);
      expect(getCompletedTutorials()).not.toContain(TUTORIAL_ID);
    });
  });

  describe('currentStepData', () => {
    test('應回傳當前步驟的資料', () => {
      const { result } = renderHook(() =>
        useTutorial({ tutorialId: TUTORIAL_ID, steps: mockSteps, autoStart: false })
      );
      act(() => { result.current.startTutorial(); });
      expect(result.current.currentStepData).toEqual(mockSteps[0]);
    });

    test('應回傳正確的 totalSteps', () => {
      const { result } = renderHook(() =>
        useTutorial({ tutorialId: TUTORIAL_ID, steps: mockSteps, autoStart: false })
      );
      expect(result.current.totalSteps).toBe(mockSteps.length);
    });
  });
});
