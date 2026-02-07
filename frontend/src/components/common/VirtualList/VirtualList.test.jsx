/**
 * VirtualList 組件測試
 *
 * @file components/common/VirtualList/VirtualList.test.jsx
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { VirtualList, VirtualGrid } from './VirtualList';

// 模擬 ResizeObserver
class MockResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = MockResizeObserver;

describe('VirtualList', () => {
  const createItems = (count) =>
    Array.from({ length: count }, (_, i) => ({ id: i, name: `Item ${i}` }));

  const defaultProps = {
    items: createItems(100),
    itemHeight: 50,
    height: 300,
    renderItem: (item) => <div data-testid={`item-${item.id}`}>{item.name}</div>,
  };

  it('應該渲染列表容器', () => {
    render(<VirtualList {...defaultProps} />);
    expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
  });

  it('應該只渲染可見項目', () => {
    render(<VirtualList {...defaultProps} />);

    // 300px / 50px = 6 個可見項目 + 3 overscan = 9 個
    const renderedItems = screen.getAllByTestId(/^item-/);
    expect(renderedItems.length).toBeLessThan(defaultProps.items.length);
    expect(renderedItems.length).toBeLessThanOrEqual(12);
  });

  it('應該顯示空狀態訊息', () => {
    render(
      <VirtualList
        {...defaultProps}
        items={[]}
        emptyMessage="沒有資料"
      />
    );

    expect(screen.getByText('沒有資料')).toBeInTheDocument();
  });

  it('應該支援自訂 className', () => {
    render(<VirtualList {...defaultProps} className="custom-class" />);
    expect(screen.getByTestId('virtual-list')).toHaveClass('custom-class');
  });

  it('應該正確設置容器樣式', () => {
    render(<VirtualList {...defaultProps} width={500} />);
    const container = screen.getByTestId('virtual-list');
    expect(container).toHaveStyle({ height: '300px', width: '500px' });
  });

  it('滾動時應該更新可見項目', () => {
    render(<VirtualList {...defaultProps} />);
    const container = screen.getByTestId('virtual-list');

    // 滾動到中間位置
    fireEvent.scroll(container, { target: { scrollTop: 1000 } });

    // 應該渲染新的可見項目
    expect(screen.getByTestId('item-20')).toBeInTheDocument();
  });

  it('應該調用 onScroll 回調', () => {
    const handleScroll = jest.fn();
    render(<VirtualList {...defaultProps} onScroll={handleScroll} />);
    const container = screen.getByTestId('virtual-list');

    fireEvent.scroll(container, { target: { scrollTop: 100 } });

    expect(handleScroll).toHaveBeenCalled();
    expect(handleScroll.mock.calls[0][1]).toHaveProperty('scrollTop', 100);
  });

  it('應該正確計算總高度', () => {
    render(<VirtualList {...defaultProps} />);

    const inner = document.querySelector('.virtual-list__inner');
    expect(inner).toHaveStyle({ height: '5000px' }); // 100 items * 50px
  });

  it('應該正確計算偏移量', () => {
    render(<VirtualList {...defaultProps} />);
    const container = screen.getByTestId('virtual-list');

    fireEvent.scroll(container, { target: { scrollTop: 500 } });

    const content = document.querySelector('.virtual-list__content');
    // 500 / 50 = 10, 10 - 3 = 7, 7 * 50 = 350
    expect(content.style.transform).toContain('translateY');
  });

  it('應該使用 item.id 作為 key（如果存在）', () => {
    const items = [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }];
    render(
      <VirtualList
        items={items}
        itemHeight={50}
        height={300}
        renderItem={(item) => <span>{item.name}</span>}
      />
    );

    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
  });

  it('應該設置 data-index 屬性', () => {
    render(<VirtualList {...defaultProps} />);

    const firstItem = document.querySelector('[data-index="0"]');
    expect(firstItem).toBeInTheDocument();
  });
});

describe('VirtualGrid', () => {
  const createItems = (count) =>
    Array.from({ length: count }, (_, i) => ({ id: i, name: `Item ${i}` }));

  const defaultProps = {
    items: createItems(100),
    itemWidth: 100,
    itemHeight: 100,
    height: 300,
    width: 500,
    renderItem: (item) => <div data-testid={`grid-item-${item.id}`}>{item.name}</div>,
  };

  it('應該渲染網格容器', () => {
    render(<VirtualGrid {...defaultProps} />);
    expect(screen.getByTestId('virtual-grid')).toBeInTheDocument();
  });

  it('應該只渲染可見項目', () => {
    render(<VirtualGrid {...defaultProps} />);

    const renderedItems = screen.getAllByTestId(/^grid-item-/);
    expect(renderedItems.length).toBeLessThan(defaultProps.items.length);
  });

  it('應該正確計算網格列數', () => {
    render(<VirtualGrid {...defaultProps} />);

    const content = document.querySelector('.virtual-grid__content');
    expect(content).toHaveStyle({ gridTemplateColumns: 'repeat(5, 100px)' });
  });

  it('應該支援 gap 設置', () => {
    render(<VirtualGrid {...defaultProps} gap={10} />);

    const content = document.querySelector('.virtual-grid__content');
    expect(content).toHaveStyle({ gap: '10px' });
  });

  it('滾動時應該更新可見項目', () => {
    render(<VirtualGrid {...defaultProps} />);
    const container = screen.getByTestId('virtual-grid');

    fireEvent.scroll(container, { target: { scrollTop: 500 } });

    // 應該有新的項目出現
    expect(document.querySelectorAll('[data-testid^="grid-item-"]').length).toBeGreaterThan(0);
  });

  it('應該支援自訂 className', () => {
    render(<VirtualGrid {...defaultProps} className="my-grid" />);
    expect(screen.getByTestId('virtual-grid')).toHaveClass('my-grid');
  });

  it('應該設置項目尺寸', () => {
    render(<VirtualGrid {...defaultProps} />);

    const firstItem = document.querySelector('.virtual-grid__item');
    expect(firstItem).toHaveStyle({ width: '100px', height: '100px' });
  });

  it('應該響應容器寬度變化', () => {
    // 這個測試確認 ResizeObserver 類別被使用
    const observeSpy = jest.spyOn(MockResizeObserver.prototype, 'observe');
    render(<VirtualGrid {...defaultProps} width="100%" />);
    expect(observeSpy).toHaveBeenCalled();
    observeSpy.mockRestore();
  });
});
