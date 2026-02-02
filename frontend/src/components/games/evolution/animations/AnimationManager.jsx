/**
 * AnimationManager - 動畫管理器
 *
 * 統一管理和播放遊戲動畫
 *
 * @module components/games/evolution/animations/AnimationManager
 */

import React, { useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { AnimatePresence } from 'framer-motion';
import {
  AttackAnimation,
  FeedAnimation,
  DeathAnimation,
  PhaseTransition,
  SatisfiedAnimation,
} from './AnimatedEvent';
import './AnimationManager.css';

/**
 * 動畫管理器
 * 統一管理和播放遊戲動畫
 *
 * 可透過 props 傳入狀態，或透過 Redux 連接使用
 */
export const AnimationManager = ({
  currentAnimation = null,
  isPlaying = false,
  settings = { enabled: true, speed: 1, reducedMotion: false },
  onComplete,
  onPlayNext,
}) => {
  // 動畫完成處理
  const handleAnimationComplete = useCallback(() => {
    onComplete?.();
  }, [onComplete]);

  // 檢查佇列並播放下一個
  useEffect(() => {
    if (!isPlaying) {
      onPlayNext?.();
    }
  }, [isPlaying, onPlayNext]);

  // 動畫禁用時直接跳過
  useEffect(() => {
    if (!settings.enabled && currentAnimation) {
      handleAnimationComplete();
    }
  }, [settings.enabled, currentAnimation, handleAnimationComplete]);

  // 渲染當前動畫
  const renderAnimation = () => {
    if (!currentAnimation || !settings.enabled) {
      return null;
    }

    const { type, data } = currentAnimation;

    switch (type) {
      case 'attack':
        return (
          <AttackAnimation
            show={true}
            onComplete={handleAnimationComplete}
          />
        );

      case 'feed':
        return (
          <FeedAnimation
            show={true}
            fromPosition={data?.fromPosition}
            toPosition={data?.toPosition}
            onComplete={handleAnimationComplete}
          />
        );

      case 'death':
        return (
          <DeathAnimation
            show={true}
            onComplete={handleAnimationComplete}
          />
        );

      case 'phase':
        return (
          <PhaseTransition
            phase={data?.phase}
            show={true}
            onComplete={handleAnimationComplete}
          />
        );

      case 'satisfied':
        return (
          <SatisfiedAnimation
            show={true}
            onComplete={handleAnimationComplete}
          />
        );

      default:
        // 未知動畫類型，直接完成
        handleAnimationComplete();
        return null;
    }
  };

  return (
    <div
      className={`animation-manager ${settings.reducedMotion ? 'animation-manager--reduced' : ''}`}
      data-testid="animation-manager"
      style={{ '--animation-speed': settings.speed }}
    >
      <AnimatePresence mode="wait">
        {renderAnimation()}
      </AnimatePresence>
    </div>
  );
};

AnimationManager.propTypes = {
  currentAnimation: PropTypes.shape({
    id: PropTypes.string,
    type: PropTypes.string.isRequired,
    data: PropTypes.object,
    priority: PropTypes.number,
  }),
  isPlaying: PropTypes.bool,
  settings: PropTypes.shape({
    enabled: PropTypes.bool,
    speed: PropTypes.number,
    reducedMotion: PropTypes.bool,
  }),
  onComplete: PropTypes.func,
  onPlayNext: PropTypes.func,
};

export default AnimationManager;
