import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import TreasureGuessDialog from './TreasureGuessDialog';
import GuessCard from '../GuessCard/GuessCard';

test('expanded treasure dialog preserves duplicate-color guessing and visible cancel/submit controls', () => {
  const submit = jest.fn(), close = jest.fn();
  render(<TreasureGuessDialog onClose={close}><GuessCard onSubmit={submit} onCancel={close} /></TreasureGuessDialog>);
  expect(screen.getByRole('dialog', {name:'寶盒猜牌'})).toBeInTheDocument();
  const confirm = screen.getByRole('button', {name:/確認猜牌/});
  expect(confirm).toBeDisabled();
  fireEvent.click(screen.getByRole('button', {name:'選擇 紅色'}));
  fireEvent.click(screen.getByRole('button', {name:'選擇 紅色'}));
  fireEvent.click(confirm);
  expect(submit).toHaveBeenCalledWith({guessedColors:['red','red']});
  fireEvent.click(screen.getByRole('button', {name:'取消'}));
  expect(close).toHaveBeenCalledTimes(1);
});

test('focus stays inside expanded controls and Escape restores the dock focus on close', () => {
  const close = jest.fn();
  const dock = document.createElement('button');
  dock.className = 'tabletop3d-treasure-box';
  document.body.appendChild(dock); dock.focus();
  const { unmount } = render(<TreasureGuessDialog onClose={close}><button>最後動作</button></TreasureGuessDialog>);
  const first = screen.getByRole('button', {name:'關閉寶盒'});
  expect(first).toHaveFocus();
  fireEvent.keyDown(document, {key:'Tab',shiftKey:true});
  expect(screen.getByRole('button', {name:'最後動作'})).toHaveFocus();
  fireEvent.keyDown(document, {key:'Tab'});
  expect(first).toHaveFocus();
  fireEvent.keyDown(document, {key:'Escape'});
  expect(close).toHaveBeenCalledTimes(1);
  unmount(); expect(dock).toHaveFocus(); dock.remove();
});
