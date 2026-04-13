import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import './TutorialOverlay.css';

const TUTORIAL_STEPS = [
  {
    title: '歡迎來到本草',
    description: '目標是透過問牌與推理，猜中桌面兩張蓋牌的顏色，率先達到 7 分獲勝。'
  },
  {
    title: '你的回合要做什麼？',
    description: '輪到你時，先從中央「問牌選擇」挑一張雙色牌，對其他玩家發起問牌。'
  },
  {
    title: '問牌後流程',
    description: '問牌結束後你可以做預測並結束回合，之後輪到下一位玩家行動。'
  },
  {
    title: '猜牌與跟猜',
    description: '你可在自己回合按「猜牌」嘗試猜中蓋牌；其他玩家接著可選擇是否跟猜。'
  },
  {
    title: '分數與勝利',
    description: '猜中可獲高分，跟猜成功也能得分；任一玩家達到 7 分時遊戲結束。'
  }
];

function TutorialOverlay({ isOpen, onComplete, onSkip }) {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setStepIndex(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === TUTORIAL_STEPS.length - 1;
  const currentStep = TUTORIAL_STEPS[stepIndex];

  return (
    <div className="herbalism-tutorial-overlay" role="dialog" aria-modal="true" aria-label="本草新手教學">
      <div className="herbalism-tutorial-card">
        <button className="tutorial-skip-btn" onClick={onSkip}>跳過教學</button>

        <p className="tutorial-step-indicator">
          步驟 {stepIndex + 1} / {TUTORIAL_STEPS.length}
        </p>
        <h2>{currentStep.title}</h2>
        <p className="tutorial-step-description">{currentStep.description}</p>

        <div className="tutorial-progress-track">
          <div
            className="tutorial-progress-bar"
            style={{ width: `${((stepIndex + 1) / TUTORIAL_STEPS.length) * 100}%` }}
          />
        </div>

        <div className="tutorial-actions">
          <button
            className="tutorial-nav-btn"
            onClick={() => setStepIndex(prev => Math.max(prev - 1, 0))}
            disabled={isFirstStep}
          >
            上一步
          </button>
          <button
            className="tutorial-nav-btn tutorial-nav-btn-primary"
            onClick={() => {
              if (isLastStep) {
                onComplete();
              } else {
                setStepIndex(prev => prev + 1);
              }
            }}
          >
            {isLastStep ? '完成教學' : '下一步'}
          </button>
        </div>
      </div>
    </div>
  );
}

TutorialOverlay.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onComplete: PropTypes.func.isRequired,
  onSkip: PropTypes.func.isRequired
};

export default TutorialOverlay;
