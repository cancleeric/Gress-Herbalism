/**
 * 無障礙性工具
 *
 * @module utils/accessibility
 * 工單 0372
 */

/**
 * 檢測使用者偏好設定
 */
export function getAccessibilityPreferences() {
  return {
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    highContrast: window.matchMedia('(prefers-contrast: more)').matches,
    darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
    screenReader: detectScreenReader(),
  };
}

/**
 * 簡易螢幕閱讀器檢測
 */
function detectScreenReader() {
  // 無法 100% 確定，但可以做一些啟發式檢測
  return (
    navigator.userAgent.includes('NVDA') ||
    navigator.userAgent.includes('JAWS') ||
    navigator.userAgent.includes('VoiceOver')
  );
}

/**
 * 鍵盤導航管理
 */
export class KeyboardNavigation {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      selector: options.selector || '[tabindex], button, a, input, select',
      wrapAround: options.wrapAround !== false,
      onSelect: options.onSelect || (() => {}),
    };
    this.currentIndex = 0;
    this.elements = [];

    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  init() {
    this.updateElements();
    this.container.addEventListener('keydown', this.handleKeyDown);
  }

  destroy() {
    this.container.removeEventListener('keydown', this.handleKeyDown);
  }

  updateElements() {
    this.elements = Array.from(
      this.container.querySelectorAll(this.options.selector)
    ).filter(el => !el.disabled && el.tabIndex !== -1);
  }

  handleKeyDown(event) {
    const { key } = event;

    switch (key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        this.focusNext();
        break;

      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        this.focusPrevious();
        break;

      case 'Home':
        event.preventDefault();
        this.focusFirst();
        break;

      case 'End':
        event.preventDefault();
        this.focusLast();
        break;

      case 'Enter':
      case ' ':
        event.preventDefault();
        this.selectCurrent();
        break;
    }
  }

  focusNext() {
    this.currentIndex++;
    if (this.currentIndex >= this.elements.length) {
      this.currentIndex = this.options.wrapAround ? 0 : this.elements.length - 1;
    }
    this.focusCurrent();
  }

  focusPrevious() {
    this.currentIndex--;
    if (this.currentIndex < 0) {
      this.currentIndex = this.options.wrapAround ? this.elements.length - 1 : 0;
    }
    this.focusCurrent();
  }

  focusFirst() {
    this.currentIndex = 0;
    this.focusCurrent();
  }

  focusLast() {
    this.currentIndex = this.elements.length - 1;
    this.focusCurrent();
  }

  focusCurrent() {
    const element = this.elements[this.currentIndex];
    if (element) {
      element.focus();
    }
  }

  selectCurrent() {
    const element = this.elements[this.currentIndex];
    if (element) {
      element.click();
      this.options.onSelect(element, this.currentIndex);
    }
  }
}

/**
 * 焦點陷阱（用於模態窗）
 */
export class FocusTrap {
  constructor(container) {
    this.container = container;
    this.previouslyFocused = null;
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  activate() {
    this.previouslyFocused = document.activeElement;
    this.container.addEventListener('keydown', this.handleKeyDown);

    // 移動焦點到容器內第一個可聚焦元素
    const firstFocusable = this.getFirstFocusable();
    if (firstFocusable) {
      firstFocusable.focus();
    }
  }

  deactivate() {
    this.container.removeEventListener('keydown', this.handleKeyDown);

    // 恢復焦點
    if (this.previouslyFocused) {
      this.previouslyFocused.focus();
    }
  }

  handleKeyDown(event) {
    if (event.key !== 'Tab') return;

    const focusables = this.getFocusableElements();
    const firstFocusable = focusables[0];
    const lastFocusable = focusables[focusables.length - 1];

    if (event.shiftKey) {
      if (document.activeElement === firstFocusable) {
        event.preventDefault();
        lastFocusable.focus();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        event.preventDefault();
        firstFocusable.focus();
      }
    }
  }

  getFocusableElements() {
    return Array.from(
      this.container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ).filter(el => !el.disabled);
  }

  getFirstFocusable() {
    const focusables = this.getFocusableElements();
    return focusables[0];
  }
}

/**
 * 即時區域通知
 */
export class LiveAnnouncer {
  constructor() {
    this.element = null;
    this.init();
  }

  init() {
    // 建立隱藏的 ARIA live 區域
    this.element = document.createElement('div');
    this.element.setAttribute('role', 'status');
    this.element.setAttribute('aria-live', 'polite');
    this.element.setAttribute('aria-atomic', 'true');
    this.element.className = 'sr-only';
    this.element.style.cssText = `
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    `;
    document.body.appendChild(this.element);
  }

  announce(message, priority = 'polite') {
    this.element.setAttribute('aria-live', priority);
    // 清空後再設置，確保通知
    this.element.textContent = '';
    setTimeout(() => {
      this.element.textContent = message;
    }, 100);
  }

  destroy() {
    if (this.element) {
      document.body.removeChild(this.element);
    }
  }
}

/**
 * 色盲友好配色
 */
export const colorBlindPalettes = {
  normal: {
    primary: '#2196F3',
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    info: '#9C27B0',
  },
  deuteranopia: {
    primary: '#0072B2',
    success: '#009E73',
    warning: '#F0E442',
    error: '#D55E00',
    info: '#CC79A7',
  },
  protanopia: {
    primary: '#0072B2',
    success: '#009E73',
    warning: '#F0E442',
    error: '#D55E00',
    info: '#CC79A7',
  },
  tritanopia: {
    primary: '#0077BB',
    success: '#33BBEE',
    warning: '#EE7733',
    error: '#CC3311',
    info: '#EE3377',
  },
};

/**
 * 套用色盲模式
 */
export function applyColorBlindMode(mode) {
  const palette = colorBlindPalettes[mode] || colorBlindPalettes.normal;

  Object.entries(palette).forEach(([name, value]) => {
    document.documentElement.style.setProperty(`--color-${name}`, value);
  });
}

/**
 * 取得 ARIA 屬性輔助函數
 */
export const aria = {
  label: (label) => ({ 'aria-label': label }),
  describedBy: (id) => ({ 'aria-describedby': id }),
  expanded: (expanded) => ({ 'aria-expanded': expanded }),
  selected: (selected) => ({ 'aria-selected': selected }),
  disabled: (disabled) => ({ 'aria-disabled': disabled }),
  hidden: (hidden) => ({ 'aria-hidden': hidden }),
  live: (mode = 'polite') => ({ 'aria-live': mode }),
  role: (role) => ({ role }),
};

/**
 * 生成唯一 ID
 */
let idCounter = 0;
export function generateId(prefix = 'a11y') {
  return `${prefix}-${++idCounter}`;
}

export default {
  getAccessibilityPreferences,
  KeyboardNavigation,
  FocusTrap,
  LiveAnnouncer,
  colorBlindPalettes,
  applyColorBlindMode,
  aria,
  generateId,
};
