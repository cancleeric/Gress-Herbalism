/**
 * 無障礙性 Provider
 *
 * @module components/common/AccessibilityProvider
 * 工單 0372
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  getAccessibilityPreferences,
  LiveAnnouncer,
  applyColorBlindMode,
} from '../../utils/accessibility';

// 建立 Context
const AccessibilityContext = createContext();

/**
 * 無障礙性 Hook
 */
export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
}

/**
 * 無障礙性設定
 */
const DEFAULT_SETTINGS = {
  reducedMotion: false,
  highContrast: false,
  largeText: false,
  colorBlindMode: 'normal',
  keyboardNavigation: true,
  screenReaderOptimized: false,
};

/**
 * AccessibilityProvider 組件
 */
export function AccessibilityProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    // 從 localStorage 讀取設定
    const saved = localStorage.getItem('accessibilitySettings');
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  });

  const [announcer, setAnnouncer] = useState(null);
  const [systemPreferences, setSystemPreferences] = useState({});

  // 初始化
  useEffect(() => {
    // 取得系統偏好
    const prefs = getAccessibilityPreferences();
    setSystemPreferences(prefs);

    // 建立通知器
    const liveAnnouncer = new LiveAnnouncer();
    setAnnouncer(liveAnnouncer);

    // 套用色盲模式
    applyColorBlindMode(settings.colorBlindMode);

    // 監聽系統偏好變化
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMotionChange = (e) => {
      setSystemPreferences(prev => ({ ...prev, reducedMotion: e.matches }));
    };
    reducedMotionQuery.addEventListener('change', handleMotionChange);

    return () => {
      liveAnnouncer.destroy();
      reducedMotionQuery.removeEventListener('change', handleMotionChange);
    };
  }, []);

  // 儲存設定
  useEffect(() => {
    localStorage.setItem('accessibilitySettings', JSON.stringify(settings));
    applyColorBlindMode(settings.colorBlindMode);

    // 套用 CSS 變數
    document.documentElement.classList.toggle('reduced-motion', settings.reducedMotion || systemPreferences.reducedMotion);
    document.documentElement.classList.toggle('high-contrast', settings.highContrast);
    document.documentElement.classList.toggle('large-text', settings.largeText);
    document.documentElement.classList.toggle('keyboard-nav', settings.keyboardNavigation);
  }, [settings, systemPreferences]);

  // 更新單一設定
  const updateSetting = useCallback((key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  // 重置設定
  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  // 通知
  const announce = useCallback((message, priority = 'polite') => {
    if (announcer) {
      announcer.announce(message, priority);
    }
  }, [announcer]);

  // 通知遊戲事件
  const announceGameEvent = useCallback((event) => {
    const messages = {
      yourTurn: '輪到你的回合',
      opponentTurn: (name) => `輪到 ${name} 的回合`,
      phaseChange: (phase) => `進入${phase}階段`,
      creatureCreated: '生物已創建',
      traitAdded: '性狀已添加',
      creatureFed: '生物已進食',
      creatureDied: '生物已死亡',
      gameEnd: '遊戲結束',
      attack: (attacker, defender) => `${attacker} 攻擊 ${defender}`,
    };

    const message = typeof messages[event.type] === 'function'
      ? messages[event.type](...(event.args || []))
      : messages[event.type];

    if (message) {
      announce(message, event.priority || 'polite');
    }
  }, [announce]);

  const value = {
    settings,
    systemPreferences,
    updateSetting,
    resetSettings,
    announce,
    announceGameEvent,
    isReducedMotion: settings.reducedMotion || systemPreferences.reducedMotion,
    isHighContrast: settings.highContrast,
    isLargeText: settings.largeText,
    isKeyboardNavigation: settings.keyboardNavigation,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}

AccessibilityProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * SkipLink 組件 - 跳過導航
 */
export function SkipLink({ targetId, children = '跳到主要內容' }) {
  return (
    <a
      href={`#${targetId}`}
      className="skip-link"
      style={{
        position: 'absolute',
        left: '-9999px',
        top: 'auto',
        width: '1px',
        height: '1px',
        overflow: 'hidden',
      }}
      onFocus={(e) => {
        e.target.style.cssText = `
          position: fixed;
          top: 10px;
          left: 10px;
          width: auto;
          height: auto;
          padding: 1rem;
          background: var(--color-primary, #2196F3);
          color: white;
          z-index: 9999;
          text-decoration: none;
          border-radius: 4px;
        `;
      }}
      onBlur={(e) => {
        e.target.style.cssText = `
          position: absolute;
          left: -9999px;
          width: 1px;
          height: 1px;
          overflow: hidden;
        `;
      }}
    >
      {children}
    </a>
  );
}

SkipLink.propTypes = {
  targetId: PropTypes.string.isRequired,
  children: PropTypes.node,
};

/**
 * VisuallyHidden 組件 - 視覺隱藏但螢幕閱讀器可見
 */
export function VisuallyHidden({ children, as: Component = 'span' }) {
  return (
    <Component
      className="sr-only"
      style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: 0,
      }}
    >
      {children}
    </Component>
  );
}

VisuallyHidden.propTypes = {
  children: PropTypes.node.isRequired,
  as: PropTypes.elementType,
};

export default AccessibilityProvider;
