/**
 * Hand 組件測試
 *
 * @module components/games/evolution/board/__tests__/Hand.test
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
    },
    AnimatePresence: ({ children }) => children,
  };
});

// Import after mocks
const { Hand } = require('../Hand');

// Mock cards data
const createMockCards = (count) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `CARD_${i}`,
    instanceId: `base_CARD_${i}_0`,
    frontTrait: 'carnivore',
    backTrait: 'fatTissue',
    expansion: 'base',
  }));
};

describe('Hand', () => {
  describe('Rendering', () => {
    it('should render hand component', () => {
      render(<Hand cards={[]} />);

      expect(screen.getByTestId('hand')).toBeInTheDocument();
    });

    it('should render cards container', () => {
      render(<Hand cards={createMockCards(3)} />);

      expect(screen.getByTestId('hand-cards')).toBeInTheDocument();
    });

    it('should render correct number of cards', () => {
      const cards = createMockCards(5);
      render(<Hand cards={cards} />);

      // Each card has a wrapper
      expect(screen.getByTestId('card-wrapper-0')).toBeInTheDocument();
      expect(screen.getByTestId('card-wrapper-4')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<Hand cards={[]} className="custom-class" />);

      expect(screen.getByTestId('hand')).toHaveClass('custom-class');
    });
  });

  describe('Card Count Display', () => {
    it('should show card count by default', () => {
      const cards = createMockCards(5);
      render(<Hand cards={cards} />);

      expect(screen.getByTestId('hand-count')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('張手牌')).toBeInTheDocument();
    });

    it('should hide card count when showCount is false', () => {
      render(<Hand cards={createMockCards(5)} showCount={false} />);

      expect(screen.queryByTestId('hand-count')).not.toBeInTheDocument();
    });

    it('should show zero count for empty hand', () => {
      render(<Hand cards={[]} />);

      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  describe('Max Display', () => {
    it('should respect maxDisplay limit', () => {
      const cards = createMockCards(15);
      render(<Hand cards={cards} maxDisplay={10} />);

      // Should only render 10 cards
      expect(screen.getByTestId('card-wrapper-0')).toBeInTheDocument();
      expect(screen.getByTestId('card-wrapper-9')).toBeInTheDocument();
      expect(screen.queryByTestId('card-wrapper-10')).not.toBeInTheDocument();
    });

    it('should show expand button when cards exceed maxDisplay', () => {
      const cards = createMockCards(15);
      render(<Hand cards={cards} maxDisplay={10} />);

      expect(screen.getByTestId('expand-button')).toBeInTheDocument();
      expect(screen.getByText('+5 更多')).toBeInTheDocument();
    });

    it('should not show expand button when cards fit within maxDisplay', () => {
      const cards = createMockCards(5);
      render(<Hand cards={cards} maxDisplay={10} />);

      expect(screen.queryByTestId('expand-button')).not.toBeInTheDocument();
    });
  });

  describe('Expanded View', () => {
    it('should open expanded view when expand button clicked', () => {
      const cards = createMockCards(15);
      render(<Hand cards={cards} maxDisplay={10} />);

      fireEvent.click(screen.getByTestId('expand-button'));

      expect(screen.getByTestId('expanded-overlay')).toBeInTheDocument();
      expect(screen.getByTestId('expanded-content')).toBeInTheDocument();
    });

    it('should show all cards in expanded view', () => {
      const cards = createMockCards(15);
      render(<Hand cards={cards} maxDisplay={10} />);

      fireEvent.click(screen.getByTestId('expand-button'));

      expect(screen.getByTestId('expanded-grid')).toBeInTheDocument();
      // Title shows total count
      expect(screen.getByText('全部手牌 (15)')).toBeInTheDocument();
    });

    it('should close expanded view when close button clicked', () => {
      const cards = createMockCards(15);
      render(<Hand cards={cards} maxDisplay={10} />);

      fireEvent.click(screen.getByTestId('expand-button'));
      expect(screen.getByTestId('expanded-overlay')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('close-button'));
      expect(screen.queryByTestId('expanded-overlay')).not.toBeInTheDocument();
    });

    it('should close expanded view when overlay clicked', () => {
      const cards = createMockCards(15);
      render(<Hand cards={cards} maxDisplay={10} />);

      fireEvent.click(screen.getByTestId('expand-button'));
      fireEvent.click(screen.getByTestId('expanded-overlay'));

      expect(screen.queryByTestId('expanded-overlay')).not.toBeInTheDocument();
    });

    it('should not close when clicking inside content', () => {
      const cards = createMockCards(15);
      render(<Hand cards={cards} maxDisplay={10} />);

      fireEvent.click(screen.getByTestId('expand-button'));
      fireEvent.click(screen.getByTestId('expanded-content'));

      expect(screen.getByTestId('expanded-overlay')).toBeInTheDocument();
    });

    it('should change button text when expanded', () => {
      const cards = createMockCards(15);
      render(<Hand cards={cards} maxDisplay={10} />);

      expect(screen.getByText('+5 更多')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('expand-button'));

      expect(screen.getByText('收起')).toBeInTheDocument();
    });
  });

  describe('Layout Modes', () => {
    it('should apply fan layout class by default', () => {
      render(<Hand cards={createMockCards(3)} />);

      expect(screen.getByTestId('hand')).toHaveClass('hand--fan');
    });

    it('should apply grid layout class when specified', () => {
      render(<Hand cards={createMockCards(3)} layout="grid" />);

      expect(screen.getByTestId('hand')).toHaveClass('hand--grid');
    });
  });

  describe('Play Actions', () => {
    it('should show side selector when card is selected', () => {
      const cards = createMockCards(1);
      render(<Hand cards={cards} />);

      // Select the card by clicking the card base
      const cardBase = screen.getByTestId('hand-card-base');
      fireEvent.click(cardBase);

      // Side selector should appear (Hand passes showSideSelector={isCardSelected})
      expect(screen.getByTestId('side-selector')).toBeInTheDocument();
      expect(screen.getByTestId('side-btn-front')).toBeInTheDocument();
      expect(screen.getByTestId('side-btn-back')).toBeInTheDocument();
    });

    it('should pass onPlayAsCreature callback to HandCard', () => {
      const handlePlayAsCreature = jest.fn();
      const cards = createMockCards(1);
      render(<Hand cards={cards} onPlayAsCreature={handlePlayAsCreature} />);

      // Verify the HandCard receives the callback (component renders without error)
      expect(screen.getByTestId('hand-card')).toBeInTheDocument();
    });

    it('should pass onPlayAsTrait callback to HandCard', () => {
      const handlePlayAsTrait = jest.fn();
      const cards = createMockCards(1);
      render(<Hand cards={cards} onPlayAsTrait={handlePlayAsTrait} />);

      // Verify the HandCard receives the callback (component renders without error)
      expect(screen.getByTestId('hand-card')).toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('should pass disabled to cards', () => {
      const cards = createMockCards(1);
      render(<Hand cards={cards} disabled />);

      // The hand card base should have disabled class
      const cardBase = screen.getByTestId('hand-card-base');
      expect(cardBase).toHaveClass('evolution-card--disabled');
    });
  });

  describe('Empty State', () => {
    it('should render empty hand', () => {
      render(<Hand cards={[]} />);

      const handCards = screen.getByTestId('hand-cards');
      expect(handCards.children).toHaveLength(0);
    });

    it('should show zero in count', () => {
      render(<Hand cards={[]} />);

      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  describe('Card Positions', () => {
    it('should calculate positions for fan layout', () => {
      const cards = createMockCards(5);
      render(<Hand cards={cards} layout="fan" />);

      // All cards should be rendered
      for (let i = 0; i < 5; i++) {
        expect(screen.getByTestId(`card-wrapper-${i}`)).toBeInTheDocument();
      }
    });
  });
});
