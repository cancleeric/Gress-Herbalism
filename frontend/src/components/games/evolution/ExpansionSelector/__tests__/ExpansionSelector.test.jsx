/**
 * ExpansionSelector 組件測試
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ExpansionSelector from '../ExpansionSelector';

describe('ExpansionSelector', () => {
  const defaultProps = {
    selectedExpansions: ['base'],
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('應渲染擴充包選擇標題', () => {
    render(<ExpansionSelector {...defaultProps} />);
    expect(screen.getByText('擴充包選擇')).toBeInTheDocument();
  });

  it('應渲染所有擴充包', () => {
    render(<ExpansionSelector {...defaultProps} />);
    expect(screen.getByText('基礎版')).toBeInTheDocument();
    expect(screen.getByText('深海生態')).toBeInTheDocument();
  });

  it('基礎版應標示為必選', () => {
    render(<ExpansionSelector {...defaultProps} />);
    expect(screen.getByText('必選')).toBeInTheDocument();
  });

  it('基礎版的 checkbox 應為 disabled', () => {
    render(<ExpansionSelector {...defaultProps} />);
    const checkboxes = screen.getAllByRole('checkbox');
    // 基礎版的 checkbox 是第一個
    expect(checkboxes[0]).toBeDisabled();
  });

  it('深海擴充包可以被切換啟用', () => {
    render(<ExpansionSelector {...defaultProps} />);
    const deepSeaCheckbox = screen.getByLabelText('啟用深海生態');
    fireEvent.click(deepSeaCheckbox);
    expect(defaultProps.onChange).toHaveBeenCalledWith(['base', 'deep-sea']);
  });

  it('深海擴充包已啟用時可以被停用', () => {
    render(
      <ExpansionSelector
        selectedExpansions={['base', 'deep-sea']}
        onChange={defaultProps.onChange}
      />
    );
    const deepSeaCheckbox = screen.getByLabelText('啟用深海生態');
    fireEvent.click(deepSeaCheckbox);
    expect(defaultProps.onChange).toHaveBeenCalledWith(['base']);
  });

  it('disabled 時所有 checkbox 應被禁用', () => {
    render(<ExpansionSelector {...defaultProps} disabled />);
    const checkboxes = screen.getAllByRole('checkbox');
    checkboxes.forEach(cb => expect(cb).toBeDisabled());
  });

  it('點擊展開按鈕應顯示擴充包詳情', () => {
    render(<ExpansionSelector {...defaultProps} />);
    const expandButtons = screen.getAllByRole('button');
    fireEvent.click(expandButtons[0]);
    expect(screen.getByText(/基礎遊戲/)).toBeInTheDocument();
  });

  it('應顯示正確的卡牌總數', () => {
    render(<ExpansionSelector {...defaultProps} />);
    expect(screen.getByText(/84 張卡牌/)).toBeInTheDocument();
  });

  it('啟用深海後應顯示 108 張卡牌總數', () => {
    render(
      <ExpansionSelector
        selectedExpansions={['base', 'deep-sea']}
        onChange={defaultProps.onChange}
      />
    );
    expect(screen.getByText(/108 張卡牌/)).toBeInTheDocument();
  });
});
