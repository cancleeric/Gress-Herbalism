/**
 * 懶加載圖片組件
 *
 * @module LazyImage
 * @description Issue #7：使用 IntersectionObserver 實現圖片懶加載，
 *              只在圖片進入視窗時才載入，減少初始頁面流量。
 */

import React, { useRef, useState, useEffect, memo } from 'react';
import PropTypes from 'prop-types';

/**
 * 懶加載圖片組件
 *
 * @param {Object} props
 * @param {string} props.src - 圖片 URL
 * @param {string} props.alt - 替代文字
 * @param {string} [props.placeholder] - 佔位圖 URL（可選）
 * @param {string} [props.className] - CSS class
 * @param {Object} [props.style] - 行內樣式
 * @param {string} [props.rootMargin] - IntersectionObserver rootMargin
 */
function LazyImage({
  src,
  alt,
  placeholder = '',
  className = '',
  style = {},
  rootMargin = '200px',
  ...rest
}) {
  const imgRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(placeholder);

  useEffect(() => {
    const el = imgRef.current;
    if (!el) return;

    // 若瀏覽器不支援 IntersectionObserver，直接載入
    if (typeof IntersectionObserver === 'undefined') {
      setCurrentSrc(src);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setCurrentSrc(src);
          observer.unobserve(el);
        }
      },
      { rootMargin }
    );

    observer.observe(el);

    return () => {
      observer.unobserve(el);
    };
  }, [src, rootMargin]);

  const classes = [
    'lazy-image',
    loaded ? 'lazy-image--loaded' : 'lazy-image--loading',
    className,
  ].filter(Boolean).join(' ');

  return (
    <img
      ref={imgRef}
      src={currentSrc}
      alt={alt}
      className={classes}
      style={style}
      onLoad={() => setLoaded(true)}
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
};

export default memo(LazyImage);
