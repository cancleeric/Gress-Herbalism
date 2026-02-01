# 工單 0347：響應式設計與移動端適配

## 基本資訊
- **工單編號**：0347
- **所屬計畫**：P2-B 前端 UI
- **前置工單**：0337（GameBoard）
- **預計影響檔案**：
  - `frontend/src/styles/evolution/responsive.css`（新增）
  - `frontend/src/hooks/useResponsive.js`（新增）
  - 各組件 CSS 更新

---

## 目標

實現完整的響應式設計：
1. 斷點系統定義
2. 移動端布局適配
3. 觸控優化
4. 橫豎屏處理

---

## 詳細規格

### 1. 斷點系統

```css
/* frontend/src/styles/evolution/responsive.css */

:root {
  /* 斷點定義 */
  --breakpoint-xs: 480px;
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
  --breakpoint-2xl: 1536px;

  /* 間距縮放 */
  --spacing-scale: 1;
}

/* === 移動端基礎 === */
@media (max-width: 768px) {
  :root {
    --spacing-scale: 0.75;
  }

  /* 增大觸控目標 */
  button,
  .touchable {
    min-height: 44px;
    min-width: 44px;
  }
}

/* === 小螢幕手機 === */
@media (max-width: 480px) {
  :root {
    --spacing-scale: 0.6;
    --card-width-medium: 70px;
    --card-height-medium: 98px;
  }
}

/* === 橫屏模式 === */
@media (orientation: landscape) and (max-height: 500px) {
  .game-board {
    flex-direction: row;
  }

  .game-board__self {
    flex-direction: row;
    max-width: 40%;
  }

  .hand {
    max-height: 150px;
  }
}

/* === 觸控設備優化 === */
@media (hover: none) and (pointer: coarse) {
  /* 增大點擊區域 */
  .evolution-card {
    padding: 4px;
  }

  /* 禁用懸停效果 */
  .evolution-card:hover {
    transform: none;
  }

  /* 長按提示 */
  .touch-hint {
    display: block;
  }
}

/* === 高解析度螢幕 === */
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
  .evolution-card__face {
    border-width: 1px;
  }
}

/* === 減少動畫偏好 === */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* === 深色模式 === */
@media (prefers-color-scheme: dark) {
  :root {
    --color-card-bg: #1e293b;
    --color-card-border: #475569;
    --color-text: #f1f5f9;
  }
}
```

### 2. 響應式 Hook

```jsx
// frontend/src/hooks/useResponsive.js

import { useState, useEffect, useMemo } from 'react';

const BREAKPOINTS = {
  xs: 480,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

/**
 * 響應式尺寸 Hook
 */
export function useResponsive() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const breakpoint = useMemo(() => {
    const { width } = windowSize;
    if (width < BREAKPOINTS.xs) return 'xs';
    if (width < BREAKPOINTS.sm) return 'sm';
    if (width < BREAKPOINTS.md) return 'md';
    if (width < BREAKPOINTS.lg) return 'lg';
    if (width < BREAKPOINTS.xl) return 'xl';
    return '2xl';
  }, [windowSize.width]);

  return {
    ...windowSize,
    breakpoint,
    isMobile: windowSize.width < BREAKPOINTS.md,
    isTablet: windowSize.width >= BREAKPOINTS.md && windowSize.width < BREAKPOINTS.lg,
    isDesktop: windowSize.width >= BREAKPOINTS.lg,
    isLandscape: windowSize.width > windowSize.height,
  };
}

/**
 * 移動端檢測 Hook
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor;
      const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
      setIsMobile(
        mobileRegex.test(userAgent.toLowerCase()) ||
        window.innerWidth < 768 ||
        'ontouchstart' in window
      );
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

/**
 * 觸控設備檢測 Hook
 */
export function useTouchDevice() {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch(
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0
    );
  }, []);

  return isTouch;
}

/**
 * 螢幕方向 Hook
 */
export function useOrientation() {
  const [orientation, setOrientation] = useState('portrait');

  useEffect(() => {
    const handleOrientationChange = () => {
      setOrientation(
        window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
      );
    };

    handleOrientationChange();
    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleOrientationChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return orientation;
}
```

### 3. 移動端專用組件

```jsx
// frontend/src/components/games/evolution/mobile/MobileGameControls.jsx

import React from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import './MobileGameControls.css';

/**
 * 移動端遊戲控制面板
 */
export const MobileGameControls = ({
  isMyTurn,
  currentPhase,
  canFeed,
  canPass,
  onFeed,
  onPass,
  onShowHand,
  handCount,
}) => {
  return (
    <div className="mobile-controls">
      {/* 手牌按鈕 */}
      <motion.button
        className="mobile-controls__btn mobile-controls__btn--hand"
        onClick={onShowHand}
        whileTap={{ scale: 0.95 }}
      >
        <span className="mobile-controls__icon">🃏</span>
        <span className="mobile-controls__badge">{handCount}</span>
      </motion.button>

      {/* 進食按鈕 */}
      {canFeed && (
        <motion.button
          className="mobile-controls__btn mobile-controls__btn--feed"
          onClick={onFeed}
          whileTap={{ scale: 0.95 }}
          disabled={!isMyTurn}
        >
          <span className="mobile-controls__icon">🍖</span>
          <span className="mobile-controls__label">進食</span>
        </motion.button>
      )}

      {/* 跳過按鈕 */}
      {canPass && (
        <motion.button
          className="mobile-controls__btn mobile-controls__btn--pass"
          onClick={onPass}
          whileTap={{ scale: 0.95 }}
          disabled={!isMyTurn}
        >
          <span className="mobile-controls__icon">⏭️</span>
          <span className="mobile-controls__label">跳過</span>
        </motion.button>
      )}
    </div>
  );
};

MobileGameControls.propTypes = {
  isMyTurn: PropTypes.bool,
  currentPhase: PropTypes.string,
  canFeed: PropTypes.bool,
  canPass: PropTypes.bool,
  onFeed: PropTypes.func,
  onPass: PropTypes.func,
  onShowHand: PropTypes.func,
  handCount: PropTypes.number,
};
```

---

## 驗收標準

1. [ ] 各斷點布局正確
2. [ ] 觸控操作順暢
3. [ ] 橫豎屏切換正常
4. [ ] 小螢幕可正常遊戲
5. [ ] Hook API 可用
6. [ ] 減少動畫偏好支援
7. [ ] 效能良好

---

## 備註

- 移動端是重要遊戲平台
- 需充分測試各種設備
