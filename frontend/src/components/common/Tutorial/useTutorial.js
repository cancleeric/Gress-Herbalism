/**
 * useTutorial Hook
 *
 * @module useTutorial
 * @description 管理教學系統的狀態與 localStorage 持久化
 * 工單 0055 - 互動式新手教學系統
 */

import { useState, useCallback, useEffect } from 'react';

const TUTORIAL_STORAGE_KEY = 'gress_tutorial_completed';

/**
 * 取得已完成的教學列表（從 localStorage）
 * @returns {string[]} 已完成的教學 ID 陣列
 */
function getCompletedTutorials() {
  try {
    const raw = localStorage.getItem(TUTORIAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * 標記教學為已完成（存入 localStorage）
 * @param {string} tutorialId - 教學 ID
 */
function markTutorialCompleted(tutorialId) {
  try {
    const completed = getCompletedTutorials();
    if (!completed.includes(tutorialId)) {
      completed.push(tutorialId);
      localStorage.setItem(TUTORIAL_STORAGE_KEY, JSON.stringify(completed));
    }
  } catch (e) {
    console.warn('無法儲存教學進度到 localStorage:', e);
  }
}

/**
 * 清除指定教學的完成紀錄（用於重新觀看）
 * @param {string} tutorialId - 教學 ID
 */
function clearTutorialCompleted(tutorialId) {
  try {
    const completed = getCompletedTutorials();
    const updated = completed.filter((id) => id !== tutorialId);
    localStorage.setItem(TUTORIAL_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('無法清除教學進度:', e);
  }
}

/**
 * 教學系統 Hook
 *
 * @param {Object} options
 * @param {string}   options.tutorialId  - 教學唯一 ID（例如 'herbalism'）
 * @param {Array}    options.steps       - 教學步驟陣列
 * @param {boolean}  [options.autoStart] - 是否在首次訪問時自動啟動
 * @returns {Object} 教學狀態與控制函數
 */
function useTutorial({ tutorialId, steps, autoStart = true }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // 首次訪問自動啟動
  useEffect(() => {
    if (autoStart) {
      const completed = getCompletedTutorials();
      if (!completed.includes(tutorialId)) {
        setIsOpen(true);
      }
    }
  }, [tutorialId, autoStart]);

  /** 開啟教學（可手動重新觀看） */
  const startTutorial = useCallback(() => {
    setCurrentStep(0);
    setIsOpen(true);
  }, []);

  /** 前往下一步 */
  const nextStep = useCallback(() => {
    setCurrentStep((prev) => {
      const next = prev + 1;
      if (next >= steps.length) {
        // 教學完成
        markTutorialCompleted(tutorialId);
        setIsOpen(false);
        return 0;
      }
      return next;
    });
  }, [steps.length, tutorialId]);

  /** 前往上一步 */
  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  }, []);

  /** 跳過教學 */
  const skipTutorial = useCallback(() => {
    markTutorialCompleted(tutorialId);
    setIsOpen(false);
    setCurrentStep(0);
  }, [tutorialId]);

  /** 重新觀看教學（清除完成紀錄） */
  const restartTutorial = useCallback(() => {
    clearTutorialCompleted(tutorialId);
    setCurrentStep(0);
    setIsOpen(true);
  }, [tutorialId]);

  const isCompleted = getCompletedTutorials().includes(tutorialId);

  return {
    isOpen,
    currentStep,
    totalSteps: steps.length,
    currentStepData: steps[currentStep] || null,
    isCompleted,
    startTutorial,
    nextStep,
    prevStep,
    skipTutorial,
    restartTutorial,
  };
}

export { getCompletedTutorials, markTutorialCompleted, clearTutorialCompleted };
export default useTutorial;
