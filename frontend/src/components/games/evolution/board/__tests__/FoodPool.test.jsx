/**
 * FoodPool 組件測試
 *
 * @module components/games/evolution/board/__tests__/FoodPool.test
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock react-dnd
jest.mock('react-dnd', () => ({
  useDrag: () => [{ isDragging: false }, jest.fn()],
  useDrop: () => [{ isOver: false, canDrop: false }, jest.fn()],
  DndProvider: ({ children }) => children,
}));

jest.mock('react-dnd-html5-backend', () => ({
  HTML5Backend: {},
}));

// Mock framer-motion
jest.mock('framer-motion', () => {
  const React = require('react');
  return {
    motion: {
      div: React.forwardRef(({ children, ...props }, ref) => (
        <div ref={ref} {...props}>
          {children}
        </div>
      )),
      button: React.forwardRef(({ children, ...props }, ref) => (
        <button ref={ref} {...props}>
          {children}
        </button>
      )),
    },
    AnimatePresence: ({ children }) => children,
  };
});

// Import after mocks
const { FoodPool } = require('../FoodPool');

describe('FoodPool', () => {
  describe('Rendering', () => {
    it('should render food pool', () => {
      render(<FoodPool />);

      expect(screen.getByTestId('food-pool')).toBeInTheDocument();
    });

    it('should render header with title', () => {
      render(<FoodPool />);

      expect(screen.getByTestId('food-pool-header')).toBeInTheDocument();
      expect(screen.getByText('食物池')).toBeInTheDocument();
    });

    it('should render food amount', () => {
      render(<FoodPool amount={10} />);

      expect(screen.getByTestId('food-amount')).toHaveTextContent('10');
    });

    it('should render food container', () => {
      render(<FoodPool />);

      expect(screen.getByTestId('food-container')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<FoodPool className="custom-class" />);

      expect(screen.getByTestId('food-pool')).toHaveClass('custom-class');
    });
  });

  describe('Food Tokens', () => {
    it('should render food tokens for amount', () => {
      render(<FoodPool amount={5} />);

      expect(screen.getByTestId('food-token-0')).toBeInTheDocument();
      expect(screen.getByTestId('food-token-4')).toBeInTheDocument();
    });

    it('should limit tokens to 30 maximum', () => {
      render(<FoodPool amount={35} />);

      expect(screen.getByTestId('food-token-29')).toBeInTheDocument();
      expect(screen.queryByTestId('food-token-30')).not.toBeInTheDocument();
    });

    it('should show overflow indicator when amount exceeds 30', () => {
      render(<FoodPool amount={35} />);

      expect(screen.getByTestId('food-overflow')).toBeInTheDocument();
      expect(screen.getByTestId('food-overflow')).toHaveTextContent('+5');
    });

    it('should not show overflow for 30 or less', () => {
      render(<FoodPool amount={30} />);

      expect(screen.queryByTestId('food-overflow')).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show empty state when amount is 0', () => {
      render(<FoodPool amount={0} />);

      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByText('食物已耗盡')).toBeInTheDocument();
    });

    it('should apply empty class when amount is 0', () => {
      render(<FoodPool amount={0} />);

      expect(screen.getByTestId('food-pool')).toHaveClass('food-pool--empty');
    });

    it('should not show empty state when amount > 0', () => {
      render(<FoodPool amount={5} />);

      expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
    });
  });

  describe('Low Food Warning', () => {
    it('should apply low class when amount is 1-3', () => {
      render(<FoodPool amount={2} />);

      expect(screen.getByTestId('food-pool')).toHaveClass('food-pool--low');
    });

    it('should not apply low class when amount > 3', () => {
      render(<FoodPool amount={5} />);

      expect(screen.getByTestId('food-pool')).not.toHaveClass('food-pool--low');
    });

    it('should not apply low class when amount is 0', () => {
      render(<FoodPool amount={0} />);

      // When 0, it should have empty class, not low
      expect(screen.getByTestId('food-pool')).toHaveClass('food-pool--empty');
      expect(screen.getByTestId('food-pool')).not.toHaveClass('food-pool--low');
    });
  });

  describe('Roll Result', () => {
    it('should show roll result when provided', () => {
      render(<FoodPool amount={8} lastRoll={{ dice: 5, players: 3 }} />);

      expect(screen.getByTestId('roll-result')).toBeInTheDocument();
      expect(screen.getByTestId('roll-result')).toHaveTextContent(
        '(骰 5 + 3 人)'
      );
    });

    it('should not show roll result when not provided', () => {
      render(<FoodPool amount={8} />);

      expect(screen.queryByTestId('roll-result')).not.toBeInTheDocument();
    });
  });

  describe('Rolling State', () => {
    it('should show dice animation when rolling', () => {
      render(<FoodPool isRolling />);

      expect(screen.getByTestId('dice-animation')).toBeInTheDocument();
    });

    it('should apply rolling class when rolling', () => {
      render(<FoodPool isRolling />);

      expect(screen.getByTestId('food-pool')).toHaveClass('food-pool--rolling');
    });

    it('should not show dice when not rolling', () => {
      render(<FoodPool isRolling={false} />);

      expect(screen.queryByTestId('dice-animation')).not.toBeInTheDocument();
    });
  });

  describe('Roll Button', () => {
    it('should show roll button when showRollButton is true', () => {
      render(<FoodPool showRollButton />);

      expect(screen.getByTestId('roll-button')).toBeInTheDocument();
      expect(screen.getByTestId('roll-button')).toHaveTextContent('決定食物');
    });

    it('should not show roll button when showRollButton is false', () => {
      render(<FoodPool showRollButton={false} />);

      expect(screen.queryByTestId('roll-button')).not.toBeInTheDocument();
    });

    it('should show rolling text when isRolling', () => {
      render(<FoodPool showRollButton isRolling />);

      expect(screen.getByTestId('roll-button')).toHaveTextContent('擲骰中...');
    });

    it('should disable button when rolling', () => {
      render(<FoodPool showRollButton isRolling />);

      expect(screen.getByTestId('roll-button')).toBeDisabled();
    });

    it('should call onRoll when clicked', () => {
      const handleRoll = jest.fn();
      render(<FoodPool showRollButton onRoll={handleRoll} />);

      fireEvent.click(screen.getByTestId('roll-button'));

      expect(handleRoll).toHaveBeenCalledTimes(1);
    });
  });

  describe('Taking Food', () => {
    it('should show hint when canTakeFood and amount > 0', () => {
      render(<FoodPool amount={5} canTakeFood />);

      expect(screen.getByTestId('food-hint')).toBeInTheDocument();
      expect(screen.getByText('點擊或拖動食物來餵食生物')).toBeInTheDocument();
    });

    it('should not show hint when canTakeFood is false', () => {
      render(<FoodPool amount={5} canTakeFood={false} />);

      expect(screen.queryByTestId('food-hint')).not.toBeInTheDocument();
    });

    it('should not show hint when amount is 0', () => {
      render(<FoodPool amount={0} canTakeFood />);

      expect(screen.queryByTestId('food-hint')).not.toBeInTheDocument();
    });

    it('should call onTakeFood when token clicked and canTakeFood', () => {
      const handleTakeFood = jest.fn();
      render(<FoodPool amount={5} canTakeFood onTakeFood={handleTakeFood} />);

      fireEvent.click(screen.getByTestId('food-token-0'));

      expect(handleTakeFood).toHaveBeenCalledTimes(1);
    });

    it('should not call onTakeFood when canTakeFood is false', () => {
      const handleTakeFood = jest.fn();
      render(
        <FoodPool amount={5} canTakeFood={false} onTakeFood={handleTakeFood} />
      );

      fireEvent.click(screen.getByTestId('food-token-0'));

      expect(handleTakeFood).not.toHaveBeenCalled();
    });
  });

  describe('Fill Percentage', () => {
    it('should calculate fill percentage correctly', () => {
      render(<FoodPool amount={10} maxAmount={20} />);

      const fill = screen.getByTestId('food-fill');
      expect(fill).toHaveStyle({ height: '50%' });
    });

    it('should cap fill at 100%', () => {
      render(<FoodPool amount={30} maxAmount={20} />);

      const fill = screen.getByTestId('food-fill');
      expect(fill).toHaveStyle({ height: '100%' });
    });

    it('should show 0% fill when empty', () => {
      render(<FoodPool amount={0} maxAmount={20} />);

      const fill = screen.getByTestId('food-fill');
      expect(fill).toHaveStyle({ height: '0%' });
    });
  });
});
