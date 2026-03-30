/**
 * LazyImage - 懶加載圖片組件
 *
 * 使用原生 loading="lazy" 實現圖片懶加載，
 * 搭配 IntersectionObserver 處理不支援的瀏覽器，
 * 減少初始頁面載入的網路請求數量。
 *
 * @module components/common/LazyImage
 */

import React, { memo, useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * 懶加載圖片組件
 *
 * @param {Object} props
 * @param {string} props.src - 圖片 URL
 * @param {string} props.alt - 替代文字
 * @param {string} [props.className] - CSS class
 * @param {string} [props.placeholder] - 佔位圖片 URL 或 data URI
 * @param {Object} [props.style] - 行內樣式
 * @param {number} [props.threshold] - IntersectionObserver 觸發閾值（0~1）
 */
const LazyImage = memo(function LazyImage({
  src,
  alt,
  className = '',
  placeholder = '',
  style,
  threshold = 0.1,
  ...rest
}) {
  const imgRef = useRef(null);
  const [imageSrc, setImageSrc] = useState(placeholder || '');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const img = imgRef.current;
    if (!img || !src) return;

    // 優先使用原生 loading="lazy"（現代瀏覽器支援）
    if ('loading' in HTMLImageElement.prototype) {
      setImageSrc(src);
      return;
    }

    // 不支援原生懶加載時，使用 IntersectionObserver
    if (!('IntersectionObserver' in window)) {
      setImageSrc(src);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setImageSrc(src);
            observer.unobserve(img);
          }
        });
      },
      { threshold }
    );

    observer.observe(img);
    return () => observer.disconnect();
  }, [src, threshold]);

  const handleLoad = () => setIsLoaded(true);
  const handleError = () => setIsError(true);

  const imgClassName = [
    className,
    isLoaded ? 'lazy-loaded' : 'lazy-loading',
    isError ? 'lazy-error' : '',
  ].filter(Boolean).join(' ');

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      loading="lazy"
      className={imgClassName}
      style={style}
      onLoad={handleLoad}
      onError={handleError}
      {...rest}
    />
  );
});

LazyImage.propTypes = {
  src: PropTypes.string.isRequired,
  alt: PropTypes.string.isRequired,
  className: PropTypes.string,
  placeholder: PropTypes.string,
  style: PropTypes.object,
  threshold: PropTypes.number,
};

export default LazyImage;
