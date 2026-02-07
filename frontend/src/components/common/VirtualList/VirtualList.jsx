/**
 * VirtualList - 虛擬滾動列表
 *
 * 高效渲染大量列表項目
 *
 * @module components/common/VirtualList
 */

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import './VirtualList.css';

/**
 * 虛擬滾動列表組件
 */
export const VirtualList = ({
  items,
  itemHeight,
  height,
  width = '100%',
  overscan = 3,
  renderItem,
  onScroll,
  className = '',
  emptyMessage = '沒有項目',
}) => {
  const containerRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);

  // 計算可見範圍
  const { startIndex, endIndex, visibleItems, totalHeight, offsetY } = useMemo(() => {
    const containerHeight = height;
    const totalHeight = items.length * itemHeight;

    // 計算開始和結束索引
    let startIndex = Math.floor(scrollTop / itemHeight);
    let endIndex = Math.ceil((scrollTop + containerHeight) / itemHeight);

    // 加入 overscan
    startIndex = Math.max(0, startIndex - overscan);
    endIndex = Math.min(items.length - 1, endIndex + overscan);

    // 計算偏移量
    const offsetY = startIndex * itemHeight;

    // 取得可見項目
    const visibleItems = items.slice(startIndex, endIndex + 1);

    return {
      startIndex,
      endIndex,
      visibleItems,
      totalHeight,
      offsetY,
    };
  }, [items, itemHeight, height, scrollTop, overscan]);

  // 處理滾動
  const handleScroll = useCallback(
    (e) => {
      const newScrollTop = e.target.scrollTop;
      setScrollTop(newScrollTop);
      onScroll?.(e, { scrollTop: newScrollTop, startIndex, endIndex });
    },
    [onScroll, startIndex, endIndex]
  );

  // 滾動到指定索引
  const scrollToIndex = useCallback(
    (index, align = 'start') => {
      if (!containerRef.current) return;

      let targetScrollTop;
      switch (align) {
        case 'center':
          targetScrollTop = index * itemHeight - height / 2 + itemHeight / 2;
          break;
        case 'end':
          targetScrollTop = (index + 1) * itemHeight - height;
          break;
        case 'start':
        default:
          targetScrollTop = index * itemHeight;
      }

      containerRef.current.scrollTop = Math.max(0, targetScrollTop);
    },
    [itemHeight, height]
  );

  // 暴露方法給父組件
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollToIndex = scrollToIndex;
    }
  }, [scrollToIndex]);

  if (items.length === 0) {
    return (
      <div
        className={`virtual-list virtual-list--empty ${className}`}
        style={{ height, width }}
      >
        <div className="virtual-list__empty-message">{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`virtual-list ${className}`}
      style={{ height, width }}
      onScroll={handleScroll}
      data-testid="virtual-list"
    >
      <div
        className="virtual-list__inner"
        style={{ height: totalHeight }}
      >
        <div
          className="virtual-list__content"
          style={{ transform: `translateY(${offsetY}px)` }}
        >
          {visibleItems.map((item, index) => {
            const actualIndex = startIndex + index;
            return (
              <div
                key={item.id || actualIndex}
                className="virtual-list__item"
                style={{ height: itemHeight }}
                data-index={actualIndex}
              >
                {renderItem(item, actualIndex)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

VirtualList.propTypes = {
  items: PropTypes.array.isRequired,
  itemHeight: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  overscan: PropTypes.number,
  renderItem: PropTypes.func.isRequired,
  onScroll: PropTypes.func,
  className: PropTypes.string,
  emptyMessage: PropTypes.string,
};

/**
 * 虛擬滾動網格組件
 */
export const VirtualGrid = ({
  items,
  itemWidth,
  itemHeight,
  height,
  width,
  gap = 0,
  overscan = 2,
  renderItem,
  className = '',
}) => {
  const containerRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerWidth, setContainerWidth] = useState(
    typeof width === 'number' ? width : 300
  );

  // 監聽容器寬度變化
  useEffect(() => {
    if (typeof width === 'number') {
      setContainerWidth(width);
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [width]);

  // 計算網格佈局
  const gridInfo = useMemo(() => {
    const columns = Math.floor((containerWidth + gap) / (itemWidth + gap)) || 1;
    const rows = Math.ceil(items.length / columns);
    const totalHeight = rows * (itemHeight + gap) - gap;

    // 計算可見行
    const startRow = Math.floor(scrollTop / (itemHeight + gap));
    const endRow = Math.ceil((scrollTop + height) / (itemHeight + gap));

    const startRowWithOverscan = Math.max(0, startRow - overscan);
    const endRowWithOverscan = Math.min(rows - 1, endRow + overscan);

    const startIndex = startRowWithOverscan * columns;
    const endIndex = Math.min(items.length - 1, (endRowWithOverscan + 1) * columns - 1);

    const offsetY = startRowWithOverscan * (itemHeight + gap);
    const visibleItems = items.slice(startIndex, endIndex + 1);

    return {
      columns,
      rows,
      totalHeight,
      startIndex,
      endIndex,
      offsetY,
      visibleItems,
    };
  }, [items, itemWidth, itemHeight, containerWidth, height, gap, scrollTop, overscan]);

  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`virtual-grid ${className}`}
      style={{ height, width }}
      onScroll={handleScroll}
      data-testid="virtual-grid"
    >
      <div
        className="virtual-grid__inner"
        style={{ height: gridInfo.totalHeight }}
      >
        <div
          className="virtual-grid__content"
          style={{
            transform: `translateY(${gridInfo.offsetY}px)`,
            display: 'grid',
            gridTemplateColumns: `repeat(${gridInfo.columns}, ${itemWidth}px)`,
            gap,
          }}
        >
          {gridInfo.visibleItems.map((item, index) => {
            const actualIndex = gridInfo.startIndex + index;
            return (
              <div
                key={item.id || actualIndex}
                className="virtual-grid__item"
                style={{ width: itemWidth, height: itemHeight }}
                data-index={actualIndex}
              >
                {renderItem(item, actualIndex)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

VirtualGrid.propTypes = {
  items: PropTypes.array.isRequired,
  itemWidth: PropTypes.number.isRequired,
  itemHeight: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  gap: PropTypes.number,
  overscan: PropTypes.number,
  renderItem: PropTypes.func.isRequired,
  className: PropTypes.string,
};

export default VirtualList;
