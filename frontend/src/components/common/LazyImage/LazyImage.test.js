/**
 * LazyImage 組件測試
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import LazyImage from './LazyImage';

// Mock IntersectionObserver
class MockIntersectionObserver {
  constructor(callback, options) {
    this.callback = callback;
    this.options = options;
    MockIntersectionObserver.instances.push(this);
  }
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
  triggerIntersect(entries) {
    this.callback(entries);
  }
  static instances = [];
  static reset() {
    MockIntersectionObserver.instances = [];
  }
}

describe('LazyImage', () => {
  beforeEach(() => {
    MockIntersectionObserver.reset();
    global.IntersectionObserver = MockIntersectionObserver;
  });

  afterEach(() => {
    delete global.IntersectionObserver;
  });

  it('應該渲染 img 元素並帶有 loading="lazy"', () => {
    render(<LazyImage src="test.jpg" alt="測試圖片" />);
    const img = screen.getByRole('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('loading', 'lazy');
    expect(img).toHaveAttribute('alt', '測試圖片');
  });

  it('支援原生懶加載時應直接設定 src', () => {
    // 模擬瀏覽器支援原生 loading="lazy"
    Object.defineProperty(HTMLImageElement.prototype, 'loading', {
      get: () => 'lazy',
      configurable: true,
    });

    render(<LazyImage src="test.jpg" alt="測試" />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'test.jpg');
  });

  it('應該套用自訂 className', () => {
    render(<LazyImage src="test.jpg" alt="測試" className="my-image" />);
    const img = screen.getByRole('img');
    expect(img.className).toContain('my-image');
  });

  it('初始渲染時應有 lazy-loading class', () => {
    render(<LazyImage src="test.jpg" alt="測試" placeholder="" />);
    const img = screen.getByRole('img');
    expect(img.className).toContain('lazy-loading');
  });

  it('圖片載入後應有 lazy-loaded class', async () => {
    Object.defineProperty(HTMLImageElement.prototype, 'loading', {
      get: () => 'lazy',
      configurable: true,
    });

    const { getByRole } = render(<LazyImage src="test.jpg" alt="測試" />);
    const img = getByRole('img');

    // 模擬 onLoad 事件
    img.dispatchEvent(new Event('load'));

    await waitFor(() => {
      expect(img.className).toContain('lazy-loaded');
    });
  });

  it('圖片載入失敗後應有 lazy-error class', async () => {
    Object.defineProperty(HTMLImageElement.prototype, 'loading', {
      get: () => 'lazy',
      configurable: true,
    });

    const { getByRole } = render(<LazyImage src="bad-url.jpg" alt="測試" />);
    const img = getByRole('img');

    // 模擬 onError 事件
    img.dispatchEvent(new Event('error'));

    await waitFor(() => {
      expect(img.className).toContain('lazy-error');
    });
  });

  it('應該使用 placeholder 作為初始 src', () => {
    // 確保 HTMLImageElement.prototype.loading 不存在（模擬不支援原生懶加載）
    const loadingDescriptor = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'loading');
    if (loadingDescriptor) {
      delete HTMLImageElement.prototype.loading;
    }

    render(
      <LazyImage
        src="real-image.jpg"
        alt="測試"
        placeholder="placeholder.jpg"
      />
    );
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'placeholder.jpg');
  });
});
