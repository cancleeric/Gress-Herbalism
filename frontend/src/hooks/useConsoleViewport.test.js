import React from 'react';
import { act, render, screen } from '@testing-library/react';
import useConsoleViewport, { readConsoleViewport } from './useConsoleViewport';

test('layout viewport 大於實際可見範圍時使用可見寬高與位移，不禁用縮放', () => {
  expect(readConsoleViewport({ innerWidth: 390, innerHeight: 844,
    visualViewport: { width: 360, height: 780, offsetLeft: 8, offsetTop: 14 } })).toEqual({
    '--console-width': '360px', '--console-height': '780px', '--console-left': '8px', '--console-top': '14px',
  });
  expect(readConsoleViewport({ innerWidth: 320, innerHeight: 568 })['--console-width']).toBe('320px');
});

test('鍵盤、縮放與平移事件更新尺寸，卸載清除監聽', () => {
  const original = Object.getOwnPropertyDescriptor(window, 'visualViewport');
  const vv = new EventTarget();
  Object.assign(vv, { width: 390, height: 844, offsetLeft: 0, offsetTop: 0 });
  Object.defineProperty(window, 'visualViewport', { configurable: true, value: vv });
  function Probe() { const style = useConsoleViewport(); return <div data-testid="console" style={style} />; }
  try {
    const { unmount } = render(<Probe />);
    act(() => { vv.height = 340; vv.dispatchEvent(new Event('resize')); });
    expect(screen.getByTestId('console').style.getPropertyValue('--console-height')).toBe('340px');
    act(() => { vv.width = 300; vv.offsetLeft = 20; vv.dispatchEvent(new Event('scroll')); });
    expect(screen.getByTestId('console').style.getPropertyValue('--console-width')).toBe('300px');
    expect(screen.getByTestId('console').style.getPropertyValue('--console-left')).toBe('20px');
    const remove = jest.spyOn(vv, 'removeEventListener');
    unmount();
    expect(remove).toHaveBeenCalledWith('resize', expect.any(Function));
    expect(remove).toHaveBeenCalledWith('scroll', expect.any(Function));
  } finally {
    if (original) Object.defineProperty(window, 'visualViewport', original);
    else delete window.visualViewport;
  }
});
