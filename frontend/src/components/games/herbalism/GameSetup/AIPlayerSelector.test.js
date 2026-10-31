import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import AIPlayerSelector from './AIPlayerSelector';

test('預設三人局，兩位對手中等難度，回傳原有設定契約', () => {
  const changed = jest.fn();
  render(<AIPlayerSelector onConfigChange={changed} />);
  expect(screen.getByRole('button', { name: /3 人局/ })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getAllByRole('group', { name: /難度/ })).toHaveLength(2);
  expect(changed).toHaveBeenLastCalledWith({ aiCount: 2, difficulties: ['medium', 'medium'] });
});

test('席位增減保留既有難度，新增對手預設中等，不殘留移除的對手', () => {
  const changed = jest.fn();
  render(<AIPlayerSelector onConfigChange={changed} />);
  fireEvent.click(screen.getByRole('button', { name: '阿哲：困難' }));
  fireEvent.click(screen.getByRole('button', { name: /4 人局/ }));
  expect(changed).toHaveBeenLastCalledWith({ aiCount: 3, difficulties: ['hard', 'medium', 'medium'] });
  fireEvent.click(screen.getByRole('button', { name: '柏宇：簡單' }));
  expect(changed).toHaveBeenLastCalledWith({ aiCount: 3, difficulties: ['hard', 'medium', 'easy'] });
  fireEvent.click(screen.getByRole('button', { name: /3 人局/ }));
  expect(changed).toHaveBeenLastCalledWith({ aiCount: 2, difficulties: ['hard', 'medium'] });
  expect(screen.queryByRole('group', { name: '柏宇 難度' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /4 人局/ }));
  expect(changed).toHaveBeenLastCalledWith({ aiCount: 3, difficulties: ['hard', 'medium', 'medium'] });
});

test('每位對手只有一個難度選中，改第二位不改第一位', () => {
  const changed = jest.fn();
  render(<AIPlayerSelector onConfigChange={changed} />);
  fireEvent.click(screen.getByRole('button', { name: '佳蓉：簡單' }));
  expect(changed).toHaveBeenLastCalledWith({ aiCount: 2, difficulties: ['medium', 'easy'] });
  for (const group of screen.getAllByRole('group', { name: /難度/ })) {
    expect(within(group).getAllByRole('button')).toHaveLength(3);
    expect(within(group).getAllByRole('button', { pressed: true })).toHaveLength(1);
  }
});

test('難度說明展開收起不更動設定，摘要跟隨席位', () => {
  const changed = jest.fn();
  render(<AIPlayerSelector onConfigChange={changed} />);
  const toggle = screen.getByRole('button', { name: /難度說明/ });
  expect(screen.getByText(/簡單 - 適合新手/)).not.toBeVisible();
  fireEvent.click(toggle);
  expect(toggle).toHaveAttribute('aria-expanded', 'true');
  expect(screen.getByText(/簡單 - 適合新手/)).toBeVisible();
  fireEvent.click(toggle);
  expect(changed).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole('button', { name: /4 人局/ }));
  expect(screen.getByRole('status')).toHaveTextContent('將與 3 個 AI 玩家進行 4 人遊戲');
});
