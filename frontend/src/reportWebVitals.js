/**
 * Web Vitals 效能指標回報
 *
 * 追蹤核心 Web Vitals：
 * - CLS (Cumulative Layout Shift) - 累積版面配置移位
 * - INP (Interaction to Next Paint) - 互動到下一次繪製
 * - FCP (First Contentful Paint) - 首次內容繪製
 * - LCP (Largest Contentful Paint) - 最大內容繪製
 * - TTFB (Time to First Byte) - 第一位元組時間
 *
 * @module reportWebVitals
 */

/**
 * 回報 Web Vitals 效能指標
 * @param {Function} onPerfEntry - 接收效能資料的回調函數
 */
const reportWebVitals = (onPerfEntry) => {
  if (onPerfEntry && typeof onPerfEntry === 'function') {
    import('web-vitals').then(({ onCLS, onINP, onFCP, onLCP, onTTFB }) => {
      onCLS(onPerfEntry);
      onINP(onPerfEntry);
      onFCP(onPerfEntry);
      onLCP(onPerfEntry);
      onTTFB(onPerfEntry);
    });
  }
};

export default reportWebVitals;
