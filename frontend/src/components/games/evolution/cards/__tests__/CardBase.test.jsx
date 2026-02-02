/**
 * CardBase 組件測試
 *
 * @module components/games/evolution/cards/__tests__/CardBase.test
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CardBase } from '../CardBase';

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => {
  const React = require('react');
  return {
    motion: {
      div: React.forwardRef(({ children, whileHover, whileTap, animate, variants, ...props }, ref) => (
        <div ref={ref} {...props}>
          {children}
        </div>
      )),
    },
  };
});

describe('CardBase', () => {
  describe('Rendering', () => {
    it('should render front content', () => {
      render(
        <CardBase
          frontContent={<div>Front Content</div>}
          backContent={<div>Back Content</div>}
          testId="card"
        />
      );

      expect(screen.getByText('Front Content')).toBeInTheDocument();
    });

    it('should render back content', () => {
      render(
        <CardBase
          frontContent={<div>Front Content</div>}
          backContent={<div>Back Content</div>}
          testId="card"
        />
      );

      expect(screen.getByText('Back Content')).toBeInTheDocument();
    });

    it('should render children', () => {
      render(
        <CardBase testId="card">
          <span>Child Content</span>
        </CardBase>
      );

      expect(screen.getByText('Child Content')).toBeInTheDocument();
    });

    it('should apply testId as data-testid', () => {
      render(<CardBase testId="my-card" />);

      expect(screen.getByTestId('my-card')).toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    it('should apply small size class', () => {
      render(<CardBase size="small" testId="card" />);

      const card = screen.getByTestId('card');
      expect(card).toHaveClass('evolution-card--small');
    });

    it('should apply medium size class by default', () => {
      render(<CardBase testId="card" />);

      const card = screen.getByTestId('card');
      expect(card).toHaveClass('evolution-card--medium');
    });

    it('should apply large size class', () => {
      render(<CardBase size="large" testId="card" />);

      const card = screen.getByTestId('card');
      expect(card).toHaveClass('evolution-card--large');
    });
  });

  describe('State Classes', () => {
    it('should apply selected class when selected', () => {
      render(<CardBase selected testId="card" />);

      const card = screen.getByTestId('card');
      expect(card).toHaveClass('evolution-card--selected');
    });

    it('should not apply selected class when not selected', () => {
      render(<CardBase selected={false} testId="card" />);

      const card = screen.getByTestId('card');
      expect(card).not.toHaveClass('evolution-card--selected');
    });

    it('should apply disabled class when disabled', () => {
      render(<CardBase disabled testId="card" />);

      const card = screen.getByTestId('card');
      expect(card).toHaveClass('evolution-card--disabled');
    });

    it('should apply highlighted class when highlighted', () => {
      render(<CardBase highlighted testId="card" />);

      const card = screen.getByTestId('card');
      expect(card).toHaveClass('evolution-card--highlighted');
    });

    it('should apply flipped class when flipped', () => {
      render(<CardBase flipped testId="card" />);

      const card = screen.getByTestId('card');
      expect(card).toHaveClass('evolution-card--flipped');
    });

    it('should apply draggable class when draggable', () => {
      render(<CardBase draggable testId="card" />);

      const card = screen.getByTestId('card');
      expect(card).toHaveClass('evolution-card--draggable');
    });

    it('should apply custom className', () => {
      render(<CardBase className="custom-class" testId="card" />);

      const card = screen.getByTestId('card');
      expect(card).toHaveClass('custom-class');
    });
  });

  describe('Click Events', () => {
    it('should call onClick when clicked', () => {
      const handleClick = jest.fn();
      render(<CardBase onClick={handleClick} testId="card" />);

      fireEvent.click(screen.getByTestId('card'));

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when disabled', () => {
      const handleClick = jest.fn();
      render(<CardBase onClick={handleClick} disabled testId="card" />);

      fireEvent.click(screen.getByTestId('card'));

      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should call onDoubleClick when double-clicked', () => {
      const handleDoubleClick = jest.fn();
      render(<CardBase onDoubleClick={handleDoubleClick} testId="card" />);

      fireEvent.doubleClick(screen.getByTestId('card'));

      expect(handleDoubleClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onDoubleClick when disabled', () => {
      const handleDoubleClick = jest.fn();
      render(<CardBase onDoubleClick={handleDoubleClick} disabled testId="card" />);

      fireEvent.doubleClick(screen.getByTestId('card'));

      expect(handleDoubleClick).not.toHaveBeenCalled();
    });
  });

  describe('Hover Events', () => {
    it('should call onHover with true on mouse enter', () => {
      const handleHover = jest.fn();
      render(<CardBase onHover={handleHover} testId="card" />);

      fireEvent.mouseEnter(screen.getByTestId('card'));

      expect(handleHover).toHaveBeenCalledWith(true);
    });

    it('should call onHover with false on mouse leave', () => {
      const handleHover = jest.fn();
      render(<CardBase onHover={handleHover} testId="card" />);

      fireEvent.mouseEnter(screen.getByTestId('card'));
      fireEvent.mouseLeave(screen.getByTestId('card'));

      expect(handleHover).toHaveBeenLastCalledWith(false);
    });

    it('should apply hovered class on mouse enter', () => {
      render(<CardBase testId="card" />);

      const card = screen.getByTestId('card');
      fireEvent.mouseEnter(card);

      expect(card).toHaveClass('evolution-card--hovered');
    });

    it('should remove hovered class on mouse leave', () => {
      render(<CardBase testId="card" />);

      const card = screen.getByTestId('card');
      fireEvent.mouseEnter(card);
      fireEvent.mouseLeave(card);

      expect(card).not.toHaveClass('evolution-card--hovered');
    });
  });

  describe('Accessibility', () => {
    it('should have role="button"', () => {
      render(<CardBase testId="card" />);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should have tabIndex 0 when not disabled', () => {
      render(<CardBase testId="card" />);

      const card = screen.getByTestId('card');
      expect(card).toHaveAttribute('tabIndex', '0');
    });

    it('should have tabIndex -1 when disabled', () => {
      render(<CardBase disabled testId="card" />);

      const card = screen.getByTestId('card');
      expect(card).toHaveAttribute('tabIndex', '-1');
    });

    it('should have aria-disabled when disabled', () => {
      render(<CardBase disabled testId="card" />);

      const card = screen.getByTestId('card');
      expect(card).toHaveAttribute('aria-disabled', 'true');
    });

    it('should have aria-selected when selected', () => {
      render(<CardBase selected testId="card" />);

      const card = screen.getByTestId('card');
      expect(card).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('Style Prop', () => {
    it('should apply custom style', () => {
      render(<CardBase style={{ backgroundColor: 'red' }} testId="card" />);

      const card = screen.getByTestId('card');
      expect(card).toHaveStyle({ backgroundColor: 'red' });
    });
  });

  describe('Multiple States', () => {
    it('should apply multiple state classes', () => {
      render(
        <CardBase
          selected
          highlighted
          size="large"
          testId="card"
        />
      );

      const card = screen.getByTestId('card');
      expect(card).toHaveClass('evolution-card--selected');
      expect(card).toHaveClass('evolution-card--highlighted');
      expect(card).toHaveClass('evolution-card--large');
    });
  });
});
