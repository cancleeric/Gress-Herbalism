/**
 * TutorialOverlay 組件
 *
 * @module TutorialOverlay
 * @description 教學系統的覆蓋層 UI，包含背景遮罩、高亮框和 Tooltip 卡片
 * 工單 0055 - 互動式新手教學系統
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import './TutorialOverlay.css';

/**
 * 計算目標元素的位置與尺寸（加上 padding）
 */
function getTargetRect(selector, padding = 8) {
  if (!selector) return null;
  const el = document.querySelector(selector);
  if (!el) return null;

  const rect = el.getBoundingClientRect();
  return {
    top: rect.top - padding,
    left: rect.left - padding,
    width: rect.width + padding * 2,
    height: rect.height + padding * 2,
    bottom: rect.bottom + padding,
    right: rect.right + padding,
    centerX: rect.left + rect.width / 2,
    centerY: rect.top + rect.height / 2,
  };
}

/**
 * 計算 Tooltip 的絕對定位樣式
 */
function getTooltipStyle(targetRect, placement, tooltipRef) {
  if (!targetRect || placement === 'center') {
    return {};
  }

  const tooltipWidth = tooltipRef.current?.offsetWidth || 380;
  const tooltipHeight = tooltipRef.current?.offsetHeight || 280;
  const gap = 16;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let top, left;

  switch (placement) {
    case 'bottom':
      top = Math.min(targetRect.bottom + gap, vh - tooltipHeight - 10);
      left = Math.max(10, Math.min(targetRect.centerX - tooltipWidth / 2, vw - tooltipWidth - 10));
      return { top, left, transform: 'none' };
    case 'top':
      top = Math.max(10, targetRect.top - tooltipHeight - gap);
      left = Math.max(10, Math.min(targetRect.centerX - tooltipWidth / 2, vw - tooltipWidth - 10));
      return { top, left, transform: 'none' };
    case 'right':
      top = Math.max(10, Math.min(targetRect.centerY - tooltipHeight / 2, vh - tooltipHeight - 10));
      left = Math.min(targetRect.right + gap, vw - tooltipWidth - 10);
      return { top, left, transform: 'none' };
    case 'left':
      top = Math.max(10, Math.min(targetRect.centerY - tooltipHeight / 2, vh - tooltipHeight - 10));
      left = Math.max(10, targetRect.left - tooltipWidth - gap);
      return { top, left, transform: 'none' };
    default:
      return {};
  }
}

/**
 * 進度指示點
 */
function ProgressDots({ total, current }) {
  return (
    <div className="tutorial-progress" role="tablist" aria-label="教學進度">
      {Array.from({ length: total }).map((_, idx) => (
        <div
          key={idx}
          className={[
            'tutorial-progress-dot',
            idx === current ? 'active' : '',
            idx < current ? 'done' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          role="tab"
          aria-selected={idx === current}
          aria-label={`步驟 ${idx + 1}`}
        />
      ))}
    </div>
  );
}

ProgressDots.propTypes = {
  total: PropTypes.number.isRequired,
  current: PropTypes.number.isRequired,
};

/**
 * TutorialOverlay 主組件
 *
 * @param {Object}   props
 * @param {Object}   props.step        - 當前步驟資料
 * @param {number}   props.stepIndex   - 當前步驟索引（0-based）
 * @param {number}   props.totalSteps  - 總步驟數
 * @param {Function} props.onNext      - 下一步回調
 * @param {Function} props.onPrev      - 上一步回調
 * @param {Function} props.onSkip      - 跳過回調
 */
function TutorialOverlay({ step, stepIndex, totalSteps, onNext, onPrev, onSkip }) {
  const [targetRect, setTargetRect] = useState(null);
  const tooltipRef = useRef(null);
  const [tooltipStyle, setTooltipStyle] = useState({});

  const isLastStep = stepIndex === totalSteps - 1;
  const isFirstStep = stepIndex === 0;

  // 計算目標元素位置
  const updatePositions = useCallback(() => {
    const rect = getTargetRect(step.target);
    setTargetRect(rect);
  }, [step.target]);

  useEffect(() => {
    updatePositions();
    window.addEventListener('resize', updatePositions);
    window.addEventListener('scroll', updatePositions, true);
    return () => {
      window.removeEventListener('resize', updatePositions);
      window.removeEventListener('scroll', updatePositions, true);
    };
  }, [updatePositions]);

  // 計算 Tooltip 位置（在 targetRect 或 tooltipRef 更新後）
  useEffect(() => {
    if (tooltipRef.current) {
      const style = getTooltipStyle(targetRect, step.placement, tooltipRef);
      setTooltipStyle(style);
    }
  }, [targetRect, step.placement]);

  // 鍵盤控制
  useEffect(() => {
    function handleKeyDown(e) {
      switch (e.key) {
        case 'ArrowRight':
        case 'Enter':
          onNext();
          break;
        case 'ArrowLeft':
          if (!isFirstStep) onPrev();
          break;
        case 'Escape':
          onSkip();
          break;
        default:
          break;
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onNext, onPrev, onSkip, isFirstStep]);

  const placementClass =
    targetRect && step.placement !== 'center'
      ? `placement-${step.placement}`
      : 'placement-center';

  const overlay = (
    <>
      {/* 背景遮罩（無目標元素時使用） */}
      {!targetRect && (
        <div
          className="tutorial-backdrop"
          onClick={onSkip}
          role="presentation"
          aria-hidden="true"
        />
      )}

      {/* 目標元素高亮框 */}
      {targetRect && (
        <div
          className="tutorial-highlight"
          style={{
            top: targetRect.top,
            left: targetRect.left,
            width: targetRect.width,
            height: targetRect.height,
          }}
          aria-hidden="true"
        />
      )}

      {/* Tooltip 卡片 */}
      <div
        ref={tooltipRef}
        className={`tutorial-tooltip ${placementClass}`}
        style={tooltipStyle}
        role="dialog"
        aria-modal="true"
        aria-label={`教學步驟 ${stepIndex + 1}：${step.title}`}
      >
        {/* 圖示 */}
        <div className="tutorial-emoji" aria-hidden="true">
          {step.emoji}
        </div>

        {/* 標題 */}
        <h2 className="tutorial-title">{step.title}</h2>

        {/* 內容 */}
        <p className="tutorial-content">{step.content}</p>

        {/* 進度點 */}
        <ProgressDots total={totalSteps} current={stepIndex} />

        {/* 按鈕列 */}
        <div className="tutorial-actions">
          {/* 跳過按鈕 */}
          <button
            className="tutorial-btn tutorial-btn-skip"
            onClick={onSkip}
            aria-label="跳過教學"
          >
            跳過
          </button>

          {/* 上一步按鈕 */}
          {!isFirstStep && (
            <button
              className="tutorial-btn tutorial-btn-prev"
              onClick={onPrev}
              aria-label="上一步"
            >
              ← 上一步
            </button>
          )}

          {/* 下一步 / 完成按鈕 */}
          {isLastStep ? (
            <button
              className="tutorial-btn tutorial-btn-finish"
              onClick={onNext}
              aria-label="完成教學"
            >
              🎉 開始遊戲！
            </button>
          ) : (
            <button
              className="tutorial-btn tutorial-btn-next"
              onClick={onNext}
              aria-label="下一步"
            >
              下一步 →
            </button>
          )}
        </div>

        {/* 步驟計數 */}
        <div className="tutorial-step-count" aria-live="polite">
          步驟 {stepIndex + 1} / {totalSteps}　（Esc 跳過）
        </div>
      </div>
    </>
  );

  return ReactDOM.createPortal(overlay, document.body);
}

TutorialOverlay.propTypes = {
  step: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
    emoji: PropTypes.string.isRequired,
    target: PropTypes.string,
    placement: PropTypes.oneOf(['center', 'top', 'bottom', 'left', 'right']),
  }).isRequired,
  stepIndex: PropTypes.number.isRequired,
  totalSteps: PropTypes.number.isRequired,
  onNext: PropTypes.func.isRequired,
  onPrev: PropTypes.func.isRequired,
  onSkip: PropTypes.func.isRequired,
};

export default TutorialOverlay;
