import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TutorialOverlay from './TutorialOverlay';

describe('TutorialOverlay', () => {
  test('應顯示第一步與步驟進度', () => {
    render(<TutorialOverlay isOpen={true} onComplete={jest.fn()} onSkip={jest.fn()} />);
    expect(screen.getByText('歡迎來到本草')).toBeInTheDocument();
    expect(screen.getByText('步驟 1 / 5')).toBeInTheDocument();
  });

  test('點擊下一步後應切換步驟', () => {
    render(<TutorialOverlay isOpen={true} onComplete={jest.fn()} onSkip={jest.fn()} />);
    fireEvent.click(screen.getByText('下一步'));
    expect(screen.getByText('你的回合要做什麼？')).toBeInTheDocument();
  });

  test('最後一步點擊完成教學應觸發 onComplete', () => {
    const onComplete = jest.fn();
    render(<TutorialOverlay isOpen={true} onComplete={onComplete} onSkip={jest.fn()} />);

    fireEvent.click(screen.getByText('下一步'));
    fireEvent.click(screen.getByText('下一步'));
    fireEvent.click(screen.getByText('下一步'));
    fireEvent.click(screen.getByText('下一步'));
    fireEvent.click(screen.getByText('完成教學'));

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  test('點擊跳過教學應觸發 onSkip', () => {
    const onSkip = jest.fn();
    render(<TutorialOverlay isOpen={true} onComplete={jest.fn()} onSkip={onSkip} />);
    fireEvent.click(screen.getByText('跳過教學'));
    expect(onSkip).toHaveBeenCalledTimes(1);
  });
});
