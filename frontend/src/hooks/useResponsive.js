/**
 * 響應式 Hooks
 *
 * 提供響應式設計相關的 React Hooks
 *
 * @module hooks/useResponsive
 */

import { useState, useEffect, useMemo, useCallback } from 'react';

/**
 * 斷點定義
 */
export const BREAKPOINTS = {
  xs: 480,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

/**
 * 取得初始視窗尺寸
 * @returns {{ width: number, height: number }}
 */
const getWindowSize = () => {
  if (typeof window === 'undefined') {
    return { width: 0, height: 0 };
  }
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
};

/**
 * 根據寬度取得斷點名稱
 * @param {number} width - 視窗寬度
 * @returns {string} 斷點名稱
 */
export const getBreakpoint = (width) => {
  if (width < BREAKPOINTS.xs) return 'xs';
  if (width < BREAKPOINTS.sm) return 'sm';
  if (width < BREAKPOINTS.md) return 'md';
  if (width < BREAKPOINTS.lg) return 'lg';
  if (width < BREAKPOINTS.xl) return 'xl';
  return '2xl';
};

/**
 * 響應式尺寸 Hook
 *
 * @returns {{
 *   width: number,
 *   height: number,
 *   breakpoint: string,
 *   isMobile: boolean,
 *   isTablet: boolean,
 *   isDesktop: boolean,
 *   isLandscape: boolean,
 *   isPortrait: boolean
 * }}
 */
export function useResponsive() {
  const [windowSize, setWindowSize] = useState(getWindowSize);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize(getWindowSize());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const breakpoint = useMemo(() => {
    return getBreakpoint(windowSize.width);
  }, [windowSize.width]);

  const deviceInfo = useMemo(() => ({
    isMobile: windowSize.width < BREAKPOINTS.md,
    isTablet: windowSize.width >= BREAKPOINTS.md && windowSize.width < BREAKPOINTS.lg,
    isDesktop: windowSize.width >= BREAKPOINTS.lg,
    isLandscape: windowSize.width > windowSize.height,
    isPortrait: windowSize.width <= windowSize.height,
  }), [windowSize.width, windowSize.height]);

  return {
    ...windowSize,
    breakpoint,
    ...deviceInfo,
  };
}

/**
 * 移動端檢測 Hook
 *
 * @returns {boolean} 是否為移動設備
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || '';
      const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
      setIsMobile(
        mobileRegex.test(userAgent.toLowerCase()) ||
        window.innerWidth < BREAKPOINTS.md ||
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
 *
 * @returns {boolean} 是否為觸控設備
 */
export function useTouchDevice() {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch(
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      // @ts-ignore - 舊版 IE
      navigator.msMaxTouchPoints > 0
    );
  }, []);

  return isTouch;
}

/**
 * 螢幕方向 Hook
 *
 * @returns {'portrait' | 'landscape'} 螢幕方向
 */
export function useOrientation() {
  const [orientation, setOrientation] = useState('portrait');

  useEffect(() => {
    const handleOrientationChange = () => {
      // 優先使用 Screen Orientation API
      if (screen.orientation) {
        const type = screen.orientation.type;
        setOrientation(type.includes('landscape') ? 'landscape' : 'portrait');
      } else {
        // 退化為視窗尺寸判斷
        setOrientation(
          window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
        );
      }
    };

    handleOrientationChange();

    window.addEventListener('resize', handleOrientationChange);
    if (screen.orientation) {
      screen.orientation.addEventListener('change', handleOrientationChange);
    }
    // 舊版事件
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleOrientationChange);
      if (screen.orientation) {
        screen.orientation.removeEventListener('change', handleOrientationChange);
      }
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return orientation;
}

/**
 * 媒體查詢 Hook
 *
 * @param {string} query - 媒體查詢字串
 * @returns {boolean} 是否匹配
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQueryList = window.matchMedia(query);
    setMatches(mediaQueryList.matches);

    const listener = (event) => {
      setMatches(event.matches);
    };

    // 現代瀏覽器使用 addEventListener
    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener('change', listener);
    } else {
      // 舊版瀏覽器
      mediaQueryList.addListener(listener);
    }

    return () => {
      if (mediaQueryList.removeEventListener) {
        mediaQueryList.removeEventListener('change', listener);
      } else {
        mediaQueryList.removeListener(listener);
      }
    };
  }, [query]);

  return matches;
}

/**
 * 減少動畫偏好檢測 Hook
 *
 * @returns {boolean} 使用者是否偏好減少動畫
 */
export function usePrefersReducedMotion() {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

/**
 * 深色模式偏好檢測 Hook
 *
 * @returns {boolean} 使用者是否偏好深色模式
 */
export function usePrefersDarkMode() {
  return useMediaQuery('(prefers-color-scheme: dark)');
}

/**
 * 斷點匹配 Hook
 *
 * @param {string} breakpoint - 斷點名稱 ('xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl')
 * @param {'up' | 'down' | 'only'} direction - 匹配方向
 * @returns {boolean} 是否匹配
 */
export function useBreakpoint(breakpoint, direction = 'up') {
  const value = BREAKPOINTS[breakpoint];

  const query = useMemo(() => {
    if (direction === 'up') {
      return `(min-width: ${value}px)`;
    } else if (direction === 'down') {
      return `(max-width: ${value - 1}px)`;
    } else {
      // 'only'
      const keys = Object.keys(BREAKPOINTS);
      const index = keys.indexOf(breakpoint);
      const nextBreakpoint = keys[index + 1];
      const nextValue = BREAKPOINTS[nextBreakpoint];

      if (nextValue) {
        return `(min-width: ${value}px) and (max-width: ${nextValue - 1}px)`;
      }
      return `(min-width: ${value}px)`;
    }
  }, [value, direction, breakpoint]);

  return useMediaQuery(query);
}

/**
 * 視窗尺寸鎖定 Hook（用於防止虛擬鍵盤導致的布局變化）
 *
 * @param {boolean} lock - 是否鎖定
 * @returns {{ width: number, height: number }}
 */
export function useLockedSize(lock = false) {
  const [lockedSize, setLockedSize] = useState(null);
  const currentSize = useResponsive();

  useEffect(() => {
    if (lock && !lockedSize) {
      setLockedSize({ width: currentSize.width, height: currentSize.height });
    } else if (!lock) {
      setLockedSize(null);
    }
  }, [lock]);

  return lockedSize || currentSize;
}

/**
 * 安全區域檢測 Hook
 *
 * @returns {{ top: number, bottom: number, left: number, right: number }}
 */
export function useSafeArea() {
  const [safeArea, setSafeArea] = useState({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  });

  useEffect(() => {
    const computeSafeArea = () => {
      const style = getComputedStyle(document.documentElement);
      setSafeArea({
        top: parseInt(style.getPropertyValue('--sat') || '0', 10),
        bottom: parseInt(style.getPropertyValue('--sab') || '0', 10),
        left: parseInt(style.getPropertyValue('--sal') || '0', 10),
        right: parseInt(style.getPropertyValue('--sar') || '0', 10),
      });
    };

    // 設定 CSS 變數
    const setCSSVariables = () => {
      document.documentElement.style.setProperty(
        '--sat',
        'env(safe-area-inset-top, 0px)'
      );
      document.documentElement.style.setProperty(
        '--sab',
        'env(safe-area-inset-bottom, 0px)'
      );
      document.documentElement.style.setProperty(
        '--sal',
        'env(safe-area-inset-left, 0px)'
      );
      document.documentElement.style.setProperty(
        '--sar',
        'env(safe-area-inset-right, 0px)'
      );
    };

    setCSSVariables();
    computeSafeArea();
  }, []);

  return safeArea;
}

export default useResponsive;
