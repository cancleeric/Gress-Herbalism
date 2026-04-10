/**
 * Tutorial 主組件
 *
 * @module Tutorial
 * @description 互動式新手教學系統，整合 useTutorial hook 和 TutorialOverlay UI
 * 工單 0055 - 互動式新手教學系統
 */

import React from 'react';
import PropTypes from 'prop-types';
import TutorialOverlay from './TutorialOverlay';
import useTutorial from './useTutorial';
import herbalismSteps from './herbalismSteps';

/**
 * Tutorial 組件
 *
 * 使用方式：
 * ```jsx
 * <Tutorial tutorialId="herbalism" autoStart />
 * ```
 *
 * 或控制顯示：
 * ```jsx
 * const { startTutorial, restartTutorial } = useTutorial({ tutorialId: 'herbalism', steps: herbalismSteps });
 * ```
 *
 * @param {Object}  props
 * @param {string}  props.tutorialId  - 教學唯一 ID
 * @param {Array}   [props.steps]     - 步驟資料（預設使用 herbalismSteps）
 * @param {boolean} [props.autoStart] - 首次訪問是否自動啟動（預設 true）
 */
function Tutorial({ tutorialId, steps = herbalismSteps, autoStart = true }) {
  const {
    isOpen,
    currentStep,
    totalSteps,
    currentStepData,
    nextStep,
    prevStep,
    skipTutorial,
  } = useTutorial({ tutorialId, steps, autoStart });

  if (!isOpen || !currentStepData) return null;

  return (
    <TutorialOverlay
      step={currentStepData}
      stepIndex={currentStep}
      totalSteps={totalSteps}
      onNext={nextStep}
      onPrev={prevStep}
      onSkip={skipTutorial}
    />
  );
}

Tutorial.propTypes = {
  tutorialId: PropTypes.string.isRequired,
  steps: PropTypes.array,
  autoStart: PropTypes.bool,
};

export { herbalismSteps, useTutorial };
export default Tutorial;
