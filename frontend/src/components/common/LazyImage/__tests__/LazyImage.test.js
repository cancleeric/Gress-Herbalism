/**
 * LazyImage 組件測試
 *
 * Issue #7 - 效能優化：圖片資源懶加載
 */

import React from 'react';
import { render, screen, act } from '@testing-library/react';
import LazyImage from '../LazyImage';

// Mock IntersectionObserver
class MockIntersectionObserver {
  constructor(callback, options) {
    this.callback = callback;
    this.options = options;
    MockIntersectionObserver.instance = this;
  }

  observe(element) {
    this.element = element;
  }

  unobserve() {}

  disconnect() {}

  // 觸發 intersection 的輔助方法
  triggerIntersection(isIntersecting) {
    this.callback([{ isIntersecting, target: this.element }]);
  }
}

describe('LazyImage', () => {
  let originalIntersectionObserver;

  beforeEach(() => {
    originalIntersectionObserver = window.IntersectionObserver;
    window.IntersectionObserver = MockIntersectionObserver;
  });

  afterEach(() => {
    window.IntersectionObserver = originalIntersectionObserver;
  });

  it('應該渲染 img 元素', () => {
    render(<LazyImage src="/test.jpg" alt="測試圖片" />);
    const img = screen.getByAltText('測試圖片');
    expect(img).toBeInTheDocument();
  });

  it('進入視窗前不應顯示實際圖片 src', () => {
    const { container } = render(<LazyImage src="/test.jpg" alt="測試圖片" />);
    const img = container.querySelector('img');
    // 進入視窗前，src 應為佔位圖片（空字串）或未設定
    expect(img.src).not.toBe('http://localhost/test.jpg');
  });

  it('進入視窗後應顯示實際圖片 src', () => {
    render(<LazyImage src="/test.jpg" alt="測試圖片" />);

    act(() => {
      MockIntersectionObserver.instance.triggerIntersection(true);
    });

    const img = screen.getByAltText('測試圖片');
    expect(img.src).toBe('http://localhost/test.jpg');
  });

  it('應該套用 lazy-image CSS 類別', () => {
    render(<LazyImage src="/test.jpg" alt="測試圖片" />);
    const img = screen.getByAltText('測試圖片');
    expect(img.className).toContain('lazy-image');
  });

  it('應該套用自訂 className', () => {
    render(<LazyImage src="/test.jpg" alt="測試圖片" className="custom-class" />);
    const img = screen.getByAltText('測試圖片');
    expect(img.className).toContain('custom-class');
  });

  it('應該傳遞 width 和 height 屬性', () => {
    render(<LazyImage src="/test.jpg" alt="測試圖片" width="200" height="100" />);
    const img = screen.getByAltText('測試圖片');
    expect(img.getAttribute('width')).toBe('200');
    expect(img.getAttribute('height')).toBe('100');
  });

  it('應該設定 loading=lazy 屬性', () => {
    render(<LazyImage src="/test.jpg" alt="測試圖片" />);
    const img = screen.getByAltText('測試圖片');
    expect(img.getAttribute('loading')).toBe('lazy');
  });

  it('不支援 IntersectionObserver 時應直接顯示圖片', () => {
    // 移除 IntersectionObserver 模擬不支援的環境
    delete window.IntersectionObserver;

    render(<LazyImage src="/test.jpg" alt="測試圖片" />);
    const img = screen.getByAltText('測試圖片');
    expect(img.src).toBe('http://localhost/test.jpg');
  });
});
