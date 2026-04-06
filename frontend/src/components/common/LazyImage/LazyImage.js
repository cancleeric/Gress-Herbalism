/**
 * 懶加載圖片組件
 *
 * Issue #7：使用 IntersectionObserver 實作圖片懶加載，減少初始載入時間
 *
 * @module components/common/LazyImage
 */

import React, { useState, useEffect, useRef, memo } from 'react';
import PropTypes from 'prop-types';

/**
 * 懶加載圖片組件
 *
 * 只有當圖片進入視窗時才載入，節省頻寬並加快初始頁面渲染。
 *
 * @param {Object} props
 * @param {string} props.src - 圖片來源 URL
 * @param {string} props.alt - 替代文字
 * @param {string} [props.placeholder] - 佔位圖片 URL（載入前顯示）
 * @param {string} [props.className] - CSS class
 * @param {Object} [props.style] - 內聯樣式
 * @param {string} [props.rootMargin] - IntersectionObserver rootMargin
 * @param {number} [props.threshold] - IntersectionObserver threshold
 */
function LazyImage({
  src,
  alt,
  placeholder = '',
  className = '',
  style = {},
  rootMargin = '200px',
  threshold = 0,
  ...rest
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    const node = imgRef.current;
    if (!node) return;

    // 瀏覽器不支援 IntersectionObserver 時直接載入
    if (!('IntersectionObserver' in window)) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(node);
        }
      },
      { rootMargin, threshold }
    );

    observer.observe(node);

    return () => {
      observer.unobserve(node);
    };
  }, [rootMargin, threshold]);

  const handleLoad = () => setIsLoaded(true);

  return (
    <img
      ref={imgRef}
      src={isInView ? src : (placeholder || undefined)}
      alt={alt}
      className={`lazy-image${isLoaded ? ' lazy-image--loaded' : ''}${className ? ` ${className}` : ''}`}
      style={{ opacity: isLoaded ? 1 : 0.3, transition: 'opacity 0.3s', ...style }}
      onLoad={handleLoad}
      {...rest}
    />
  );
}

LazyImage.propTypes = {
  src: PropTypes.string.isRequired,
  alt: PropTypes.string.isRequired,
  placeholder: PropTypes.string,
  className: PropTypes.string,
  style: PropTypes.object,
  rootMargin: PropTypes.string,
  threshold: PropTypes.number,
};

export default memo(LazyImage);
