/**
 * 懶加載圖片組件
 *
 * 使用 Intersection Observer API 延遲加載圖片，提升首次載入效能
 *
 * Issue #7 - 效能優化：圖片資源懶加載
 *
 * @module components/common/LazyImage
 */

import React, { useState, useRef, useEffect, memo } from 'react';

/**
 * 懶加載圖片組件
 *
 * @param {Object} props
 * @param {string} props.src - 圖片來源 URL
 * @param {string} props.alt - 圖片替代文字
 * @param {string} [props.placeholder] - 加載中的佔位圖片 URL
 * @param {string} [props.className] - CSS 類別
 * @param {string} [props.width] - 寬度
 * @param {string} [props.height] - 高度
 * @param {Object} [props.style] - 行內樣式
 * @param {string} [props.rootMargin] - Intersection Observer 的 rootMargin
 * @param {number} [props.threshold] - Intersection Observer 的 threshold
 */
function LazyImage({
  src,
  alt,
  placeholder = '',
  className = '',
  width,
  height,
  style,
  rootMargin = '100px',
  threshold = 0.01,
  ...rest
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    const element = imgRef.current;
    if (!element) return;

    // 如果瀏覽器不支援 IntersectionObserver，直接顯示圖片
    if (!('IntersectionObserver' in window)) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(element);
        }
      },
      {
        rootMargin,
        threshold,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [rootMargin, threshold]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  const imgSrc = isInView ? src : placeholder;

  return (
    <img
      ref={imgRef}
      src={imgSrc || undefined}
      alt={alt}
      className={`lazy-image ${isLoaded ? 'lazy-image--loaded' : 'lazy-image--loading'} ${hasError ? 'lazy-image--error' : ''} ${className}`}
      width={width}
      height={height}
      style={style}
      onLoad={handleLoad}
      onError={handleError}
      loading="lazy"
      {...rest}
    />
  );
}

export default memo(LazyImage);
export { LazyImage };
