import React from 'react';
import PropTypes from 'prop-types';
import './TutorialOverlay.css';

const tutorialSteps = [
  {
    title: '歡迎來到本草 Herbalism',
    description: '你的目標是推理桌面上兩張蓋牌的顏色。先透過問牌收集資訊，再在合適時機猜牌得分。'
  },
  {
    title: '問牌是主要情報來源',
    description: '在「問牌選擇」區點擊雙色牌，指定目標玩家與問牌方式，藉由拿到牌來推理蓋牌。'
  },
  {
    title: '猜牌時機很關鍵',
    description: '當你掌握足夠線索，可按下「猜牌」直接猜兩張蓋牌。猜對大幅加分，猜錯可能失去機會。'
  },
  {
    title: '跟猜機制',
    description: '有玩家猜牌後，其他玩家會依序決定是否跟猜：跟對 +1，跟錯 -1 並退出當局。'
  },
  {
    title: '持續觀察紀錄與分數',
    description: '左側會顯示遊戲紀錄，右側可看每位玩家分數與手牌。善用資訊判斷下一步。'
  },
  {
    title: '完成！',
    description: '你可以隨時用右上角「設定」重播教學。祝你推理順利，早日猜中蓋牌！'
  }
];

function TutorialOverlay({
  isOpen,
  currentStep,
  onNext,
  onPrev,
  onSkip,
  onFinish
}) {
  if (!isOpen) return null;

  const safeStep = Math.min(Math.max(currentStep, 0), tutorialSteps.length - 1);
  const step = tutorialSteps[safeStep];
  const isFirstStep = safeStep === 0;
  const isLastStep = safeStep === tutorialSteps.length - 1;

  return (
    <div className="tutorial-overlay" role="dialog" aria-modal="true" aria-label="新手教學">
      <div className="tutorial-card">
        <div className="tutorial-header">
          <span className="tutorial-step-badge">步驟 {safeStep + 1}/{tutorialSteps.length}</span>
          <button className="tutorial-skip-btn" onClick={onSkip}>
            跳過教學
          </button>
        </div>

        <h2 className="tutorial-title">{step.title}</h2>
        <p className="tutorial-description">{step.description}</p>

        <div className="tutorial-progress-dots">
          {tutorialSteps.map((_, index) => (
            <span
              key={index}
              className={`tutorial-dot ${index === safeStep ? 'active' : ''}`}
            />
          ))}
        </div>

        <div className="tutorial-actions">
          <button
            className="tutorial-btn tutorial-btn-secondary"
            onClick={onPrev}
            disabled={isFirstStep}
          >
            上一步
          </button>
          {isLastStep ? (
            <button className="tutorial-btn tutorial-btn-primary" onClick={onFinish}>
              開始遊戲
            </button>
          ) : (
            <button className="tutorial-btn tutorial-btn-primary" onClick={onNext}>
              下一步
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

TutorialOverlay.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  currentStep: PropTypes.number.isRequired,
  onNext: PropTypes.func.isRequired,
  onPrev: PropTypes.func.isRequired,
  onSkip: PropTypes.func.isRequired,
  onFinish: PropTypes.func.isRequired
};

export default TutorialOverlay;
