/**
 * MobileGameControls 組件測試
 *
 * @module components/games/evolution/mobile/MobileGameControls.test
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    button: ({ children, whileTap, whileHover, variants, initial, animate, exit, ...props }) => (
      <button {...props}>{children}</button>
    ),
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

import { MobileGameControls } from './MobileGameControls';

describe('MobileGameControls', () => {
  const defaultProps = {
    isMyTurn: false,
    currentPhase: 'evolution',
    canFeed: false,
    canPass: false,
    canAttack: false,
    onFeed: jest.fn(),
    onPass: jest.fn(),
    onAttack: jest.fn(),
    onShowHand: jest.fn(),
    onShowCreatures: jest.fn(),
    handCount: 5,
    creatureCount: 2,
    foodPool: 10,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('渲染', () => {
    it('should render mobile controls container', () => {
      render(<MobileGameControls {...defaultProps} />);

      expect(screen.getByTestId('mobile-controls')).toBeInTheDocument();
    });

    it('should display current phase', () => {
      render(<MobileGameControls {...defaultProps} currentPhase="evolution" />);

      expect(screen.getByText('演化階段')).toBeInTheDocument();
    });

    it('should display feeding phase', () => {
      render(<MobileGameControls {...defaultProps} currentPhase="feeding" />);

      expect(screen.getByText('進食階段')).toBeInTheDocument();
    });

    it('should display feeding setup phase', () => {
      render(<MobileGameControls {...defaultProps} currentPhase="feeding_setup" />);

      expect(screen.getByText('食物供給')).toBeInTheDocument();
    });

    it('should display extinction phase', () => {
      render(<MobileGameControls {...defaultProps} currentPhase="extinction" />);

      expect(screen.getByText('滅絕階段')).toBeInTheDocument();
    });

    it('should display unknown phase as-is', () => {
      render(<MobileGameControls {...defaultProps} currentPhase="unknown" />);

      expect(screen.getByText('unknown')).toBeInTheDocument();
    });

    it('should display turn indicator when my turn', () => {
      render(<MobileGameControls {...defaultProps} isMyTurn={true} />);

      expect(screen.getByText('你的回合')).toBeInTheDocument();
    });

    it('should not display turn indicator when not my turn', () => {
      render(<MobileGameControls {...defaultProps} isMyTurn={false} />);

      expect(screen.queryByText('你的回合')).not.toBeInTheDocument();
    });

    it('should display food pool count', () => {
      render(<MobileGameControls {...defaultProps} foodPool={15} />);

      expect(screen.getByText('15')).toBeInTheDocument();
    });
  });

  describe('手牌按鈕', () => {
    it('should render hand button', () => {
      render(<MobileGameControls {...defaultProps} />);

      expect(screen.getByTestId('btn-show-hand')).toBeInTheDocument();
    });

    it('should display hand count badge', () => {
      render(<MobileGameControls {...defaultProps} handCount={7} />);

      const badge = screen.getByTestId('btn-show-hand').querySelector('.mobile-controls__badge');
      expect(badge).toHaveTextContent('7');
    });

    it('should not display badge when hand count is 0', () => {
      render(<MobileGameControls {...defaultProps} handCount={0} />);

      const badge = screen.getByTestId('btn-show-hand').querySelector('.mobile-controls__badge');
      expect(badge).not.toBeInTheDocument();
    });

    it('should call onShowHand when clicked', () => {
      const onShowHand = jest.fn();
      render(<MobileGameControls {...defaultProps} onShowHand={onShowHand} />);

      fireEvent.click(screen.getByTestId('btn-show-hand'));

      expect(onShowHand).toHaveBeenCalledTimes(1);
    });
  });

  describe('生物按鈕', () => {
    it('should render creatures button', () => {
      render(<MobileGameControls {...defaultProps} />);

      expect(screen.getByTestId('btn-show-creatures')).toBeInTheDocument();
    });

    it('should display creature count badge', () => {
      render(<MobileGameControls {...defaultProps} creatureCount={3} />);

      const badge = screen.getByTestId('btn-show-creatures').querySelector('.mobile-controls__badge');
      expect(badge).toHaveTextContent('3');
    });

    it('should not display badge when creature count is 0', () => {
      render(<MobileGameControls {...defaultProps} creatureCount={0} />);

      const badge = screen.getByTestId('btn-show-creatures').querySelector('.mobile-controls__badge');
      expect(badge).not.toBeInTheDocument();
    });

    it('should call onShowCreatures when clicked', () => {
      const onShowCreatures = jest.fn();
      render(<MobileGameControls {...defaultProps} onShowCreatures={onShowCreatures} />);

      fireEvent.click(screen.getByTestId('btn-show-creatures'));

      expect(onShowCreatures).toHaveBeenCalledTimes(1);
    });
  });

  describe('進食按鈕', () => {
    it('should not render feed button when canFeed is false', () => {
      render(<MobileGameControls {...defaultProps} canFeed={false} />);

      expect(screen.queryByTestId('btn-feed')).not.toBeInTheDocument();
    });

    it('should render feed button when canFeed is true', () => {
      render(<MobileGameControls {...defaultProps} canFeed={true} />);

      expect(screen.getByTestId('btn-feed')).toBeInTheDocument();
    });

    it('should display feed label', () => {
      render(<MobileGameControls {...defaultProps} canFeed={true} />);

      expect(screen.getByText('進食')).toBeInTheDocument();
    });

    it('should be disabled when not my turn', () => {
      render(<MobileGameControls {...defaultProps} canFeed={true} isMyTurn={false} />);

      expect(screen.getByTestId('btn-feed')).toBeDisabled();
    });

    it('should be enabled when my turn', () => {
      render(<MobileGameControls {...defaultProps} canFeed={true} isMyTurn={true} />);

      expect(screen.getByTestId('btn-feed')).not.toBeDisabled();
    });

    it('should call onFeed when clicked', () => {
      const onFeed = jest.fn();
      render(<MobileGameControls {...defaultProps} canFeed={true} isMyTurn={true} onFeed={onFeed} />);

      fireEvent.click(screen.getByTestId('btn-feed'));

      expect(onFeed).toHaveBeenCalledTimes(1);
    });
  });

  describe('攻擊按鈕', () => {
    it('should not render attack button when canAttack is false', () => {
      render(<MobileGameControls {...defaultProps} canAttack={false} />);

      expect(screen.queryByTestId('btn-attack')).not.toBeInTheDocument();
    });

    it('should render attack button when canAttack is true', () => {
      render(<MobileGameControls {...defaultProps} canAttack={true} />);

      expect(screen.getByTestId('btn-attack')).toBeInTheDocument();
    });

    it('should display attack label', () => {
      render(<MobileGameControls {...defaultProps} canAttack={true} />);

      expect(screen.getByText('攻擊')).toBeInTheDocument();
    });

    it('should be disabled when not my turn', () => {
      render(<MobileGameControls {...defaultProps} canAttack={true} isMyTurn={false} />);

      expect(screen.getByTestId('btn-attack')).toBeDisabled();
    });

    it('should call onAttack when clicked', () => {
      const onAttack = jest.fn();
      render(<MobileGameControls {...defaultProps} canAttack={true} isMyTurn={true} onAttack={onAttack} />);

      fireEvent.click(screen.getByTestId('btn-attack'));

      expect(onAttack).toHaveBeenCalledTimes(1);
    });
  });

  describe('跳過按鈕', () => {
    it('should not render pass button when canPass is false', () => {
      render(<MobileGameControls {...defaultProps} canPass={false} />);

      expect(screen.queryByTestId('btn-pass')).not.toBeInTheDocument();
    });

    it('should render pass button when canPass is true', () => {
      render(<MobileGameControls {...defaultProps} canPass={true} />);

      expect(screen.getByTestId('btn-pass')).toBeInTheDocument();
    });

    it('should display pass label', () => {
      render(<MobileGameControls {...defaultProps} canPass={true} />);

      expect(screen.getByText('跳過')).toBeInTheDocument();
    });

    it('should be disabled when not my turn', () => {
      render(<MobileGameControls {...defaultProps} canPass={true} isMyTurn={false} />);

      expect(screen.getByTestId('btn-pass')).toBeDisabled();
    });

    it('should be enabled when my turn', () => {
      render(<MobileGameControls {...defaultProps} canPass={true} isMyTurn={true} />);

      expect(screen.getByTestId('btn-pass')).not.toBeDisabled();
    });

    it('should call onPass when clicked', () => {
      const onPass = jest.fn();
      render(<MobileGameControls {...defaultProps} canPass={true} isMyTurn={true} onPass={onPass} />);

      fireEvent.click(screen.getByTestId('btn-pass'));

      expect(onPass).toHaveBeenCalledTimes(1);
    });
  });

  describe('多按鈕狀態', () => {
    it('should render all action buttons when all enabled', () => {
      render(
        <MobileGameControls
          {...defaultProps}
          canFeed={true}
          canPass={true}
          canAttack={true}
          isMyTurn={true}
        />
      );

      expect(screen.getByTestId('btn-feed')).toBeInTheDocument();
      expect(screen.getByTestId('btn-pass')).toBeInTheDocument();
      expect(screen.getByTestId('btn-attack')).toBeInTheDocument();
    });

    it('should only render feed and pass during feeding phase', () => {
      render(
        <MobileGameControls
          {...defaultProps}
          currentPhase="feeding"
          canFeed={true}
          canPass={true}
          canAttack={false}
          isMyTurn={true}
        />
      );

      expect(screen.getByTestId('btn-feed')).toBeInTheDocument();
      expect(screen.getByTestId('btn-pass')).toBeInTheDocument();
      expect(screen.queryByTestId('btn-attack')).not.toBeInTheDocument();
    });
  });

  describe('預設值', () => {
    it('should have default values for all props', () => {
      // 只傳入必要的回調
      render(
        <MobileGameControls
          onShowHand={jest.fn()}
          onShowCreatures={jest.fn()}
        />
      );

      // 應該渲染而不報錯
      expect(screen.getByTestId('mobile-controls')).toBeInTheDocument();
    });

    it('should handle undefined callbacks gracefully', () => {
      render(<MobileGameControls />);

      // 應該渲染基本結構
      expect(screen.getByTestId('mobile-controls')).toBeInTheDocument();
    });
  });
});
