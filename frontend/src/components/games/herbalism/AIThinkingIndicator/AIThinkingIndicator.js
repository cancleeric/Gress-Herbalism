import React from 'react';
import PropTypes from 'prop-types';
import './AIThinkingIndicator.css';

/**
 * AI 思考動畫指示器組件
 *
 * 當 AI 玩家正在思考時顯示動畫效果
 */
function AIThinkingIndicator({ isThinking, aiName, size = 'medium' }) {
  if (!isThinking) return null;

  return (
    <span className={`ai-thinking-indicator ai-thinking-${size}`}>
      <span className="thinking-text">
        {aiName ? `${aiName} ` : ''}思考中
      </span>
      <span className="thinking-dots">
        <span className="dot">.</span>
        <span className="dot">.</span>
        <span className="dot">.</span>
      </span>
    </span>
  );
}

AIThinkingIndicator.propTypes = {
  isThinking: PropTypes.bool.isRequired,
  aiName: PropTypes.string,
  size: PropTypes.oneOf(['small', 'medium', 'large'])
};

export default AIThinkingIndicator;
