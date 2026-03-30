/**
 * LanguageSwitcher 組件單元測試
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import LanguageSwitcher from './LanguageSwitcher';
import { changeLanguage } from '../../../i18n';

// Mock i18n module
jest.mock('../../../i18n', () => ({
  changeLanguage: jest.fn(),
  SUPPORTED_LANGUAGES: ['zh-TW', 'zh-CN', 'en', 'ja'],
  DEFAULT_LANGUAGE: 'zh-TW'
}));

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('應正常渲染語系選擇器', () => {
    render(<LanguageSwitcher />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  test('應顯示語言標籤', () => {
    render(<LanguageSwitcher showLabel={true} />);
    expect(screen.getByText('語言')).toBeInTheDocument();
  });

  test('不顯示標籤時應隱藏語言文字', () => {
    render(<LanguageSwitcher showLabel={false} />);
    expect(screen.queryByText('語言')).not.toBeInTheDocument();
  });

  test('選擇不同語系時應呼叫 changeLanguage', () => {
    render(<LanguageSwitcher />);
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'en' } });
    expect(changeLanguage).toHaveBeenCalledWith('en');
  });

  test('應顯示所有支援的語系選項', () => {
    render(<LanguageSwitcher />);
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    // 確保有4個選項
    expect(select.querySelectorAll('option').length).toBe(4);
  });

  test('showFlag 為 true 時應顯示旗幟', () => {
    const { container } = render(<LanguageSwitcher showFlag={true} />);
    expect(container.querySelector('.language-flag')).toBeInTheDocument();
  });

  test('showFlag 為 false 時不應顯示旗幟', () => {
    const { container } = render(<LanguageSwitcher showFlag={false} />);
    expect(container.querySelector('.language-flag')).not.toBeInTheDocument();
  });

  test('應接受自定義 className', () => {
    const { container } = render(<LanguageSwitcher className="custom-class" />);
    expect(container.querySelector('.language-switcher.custom-class')).toBeInTheDocument();
  });
});
