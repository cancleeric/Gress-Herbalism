import React, { useEffect, useMemo, useState } from 'react';
import './TutorialOverlay.css';

const SPOTLIGHT_PADDING = 10;

function TutorialOverlay({
  isOpen,
  steps,
  currentStep,
  onNext,
  onBack,
  onSkip,
  onComplete
}) {
  const [targetRect, setTargetRect] = useState(null);
  const step = steps[currentStep];

  const hasNext = currentStep < steps.length - 1;
  const hasBack = currentStep > 0;

  const updateTargetRect = useMemo(() => {
    return () => {
      if (!step?.selector) {
        setTargetRect(null);
        return;
      }

      const target = document.querySelector(step.selector);
      if (!target) {
        setTargetRect(null);
        return;
      }

      target.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
      const rect = target.getBoundingClientRect();
      setTargetRect({
        top: Math.max(8, rect.top - SPOTLIGHT_PADDING),
        left: Math.max(8, rect.left - SPOTLIGHT_PADDING),
        width: rect.width + SPOTLIGHT_PADDING * 2,
        height: rect.height + SPOTLIGHT_PADDING * 2
      });
    };
  }, [step]);

  useEffect(() => {
    if (!isOpen || !step) return undefined;

    updateTargetRect();
    window.addEventListener('resize', updateTargetRect);
    window.addEventListener('scroll', updateTargetRect, true);

    return () => {
      window.removeEventListener('resize', updateTargetRect);
      window.removeEventListener('scroll', updateTargetRect, true);
    };
  }, [isOpen, step, updateTargetRect]);

  if (!isOpen || !step) {
    return null;
  }

  const tooltipStyle = targetRect
    ? {
        top: Math.min(window.innerHeight - 190, targetRect.top + targetRect.height + 14),
        left: Math.min(window.innerWidth - 340, Math.max(12, targetRect.left))
      }
    : {};

  return (
    <div className="tutorial-overlay" role="dialog" aria-modal="true" aria-label="新手教學">
      <div className="tutorial-overlay-backdrop" />
      {targetRect && (
        <div
          className="tutorial-spotlight"
          style={{
            top: targetRect.top,
            left: targetRect.left,
            width: targetRect.width,
            height: targetRect.height
          }}
        />
      )}

      <div className="tutorial-card" style={tooltipStyle}>
        <div className="tutorial-progress">{currentStep + 1} / {steps.length}</div>
        <h3>{step.title}</h3>
        <p>{step.description}</p>
        <div className="tutorial-actions">
          <button className="tutorial-btn tutorial-btn-skip" onClick={onSkip}>跳過</button>
          <div className="tutorial-actions-right">
            <button className="tutorial-btn tutorial-btn-secondary" onClick={onBack} disabled={!hasBack}>上一步</button>
            {hasNext ? (
              <button className="tutorial-btn tutorial-btn-primary" onClick={onNext}>下一步</button>
            ) : (
              <button className="tutorial-btn tutorial-btn-primary" onClick={onComplete}>完成</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TutorialOverlay;
