/**
 * CreatureCard 組件測試
 *
 * @module components/games/evolution/cards/__tests__/CreatureCard.test
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
const { CreatureCard } = require('../CreatureCard');

const mockCreature = {
  id: 'c1',
  ownerId: 'p1',
  traits: [],
  food: 0,
  maxFood: 1,
  fat: 0,
};

describe('CreatureCard', () => {
  describe('Rendering', () => {
    it('should render creature card', () => {
      render(<CreatureCard creature={mockCreature} />);

      expect(screen.getByTestId('creature-card')).toBeInTheDocument();
    });

    it('should display creature icon', () => {
      render(<CreatureCard creature={mockCreature} />);

      expect(screen.getByTestId('creature-icon')).toBeInTheDocument();
      // 預設是蜥蜴圖示
      expect(screen.getByText('🦎')).toBeInTheDocument();
    });

    it('should display food indicator', () => {
      render(<CreatureCard creature={mockCreature} />);

      expect(screen.getByTestId('food-indicator')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<CreatureCard creature={mockCreature} className="custom" />);

      expect(screen.getByTestId('creature-card')).toHaveClass('custom');
    });
  });

  describe('Creature Icons', () => {
    it('should show fish icon for aquatic creature', () => {
      const aquaticCreature = {
        ...mockCreature,
        traits: [{ type: 'aquatic' }],
      };

      render(<CreatureCard creature={aquaticCreature} />);

      expect(screen.getByText('🐟')).toBeInTheDocument();
    });

    it('should show dinosaur icon for carnivore creature', () => {
      const carnivoreCreature = {
        ...mockCreature,
        traits: [{ type: 'carnivore' }],
      };

      render(<CreatureCard creature={carnivoreCreature} />);

      expect(screen.getByText('🦖')).toBeInTheDocument();
    });

    it('should show sauropod icon for massive creature', () => {
      const massiveCreature = {
        ...mockCreature,
        traits: [{ type: 'massive' }],
      };

      render(<CreatureCard creature={massiveCreature} />);

      expect(screen.getByText('🦕')).toBeInTheDocument();
    });
  });

  describe('Status Display', () => {
    it('should show hungry status when not fed', () => {
      const hungryCreature = {
        ...mockCreature,
        food: 0,
        maxFood: 2,
      };

      render(<CreatureCard creature={hungryCreature} />);

      expect(screen.getByTestId('status-hungry')).toBeInTheDocument();
      expect(screen.getByText('餓')).toBeInTheDocument();
    });

    it('should show fed status when satisfied', () => {
      const fedCreature = {
        ...mockCreature,
        food: 1,
        maxFood: 1,
      };

      render(<CreatureCard creature={fedCreature} />);

      expect(screen.getByTestId('status-fed')).toBeInTheDocument();
      expect(screen.getByText('飽')).toBeInTheDocument();
    });

    it('should show fat status when has fat', () => {
      const fatCreature = {
        ...mockCreature,
        food: 1,
        maxFood: 1,
        fat: 2,
        traits: [{ type: 'fatTissue' }, { type: 'fatTissue' }],
      };

      render(<CreatureCard creature={fatCreature} />);

      expect(screen.getByTestId('status-fat')).toBeInTheDocument();
      expect(screen.getByText('脂肪 2')).toBeInTheDocument();
    });

    it('should not show hungry status when isFed prop is true', () => {
      const hungryCreature = {
        ...mockCreature,
        food: 0,
        maxFood: 2,
      };

      render(<CreatureCard creature={hungryCreature} isFed />);

      expect(screen.queryByTestId('status-hungry')).not.toBeInTheDocument();
    });
  });

  describe('Trait Badges', () => {
    it('should display trait badges', () => {
      const creatureWithTraits = {
        ...mockCreature,
        traits: [{ type: 'carnivore' }, { type: 'camouflage' }],
      };

      render(<CreatureCard creature={creatureWithTraits} />);

      expect(screen.getByTestId('creature-traits')).toBeInTheDocument();
      const badges = screen.getAllByTestId('trait-badge');
      expect(badges).toHaveLength(2);
    });

    it('should not display traits section when no traits', () => {
      render(<CreatureCard creature={mockCreature} />);

      expect(screen.queryByTestId('creature-traits')).not.toBeInTheDocument();
    });
  });

  describe('Selection and Click', () => {
    it('should call onSelect when clicked', () => {
      const handleSelect = jest.fn();
      render(<CreatureCard creature={mockCreature} onSelect={handleSelect} />);

      fireEvent.click(screen.getByTestId('creature-card-base'));

      expect(handleSelect).toHaveBeenCalledWith(mockCreature.id);
    });

    it('should call onAttack when clicked and canBeAttacked', () => {
      const handleAttack = jest.fn();
      const handleSelect = jest.fn();

      render(
        <CreatureCard
          creature={mockCreature}
          canBeAttacked
          onAttack={handleAttack}
          onSelect={handleSelect}
        />
      );

      fireEvent.click(screen.getByTestId('creature-card-base'));

      expect(handleAttack).toHaveBeenCalledWith(mockCreature.id);
      expect(handleSelect).not.toHaveBeenCalled();
    });
  });

  describe('Attackable State', () => {
    it('should show attack overlay when canBeAttacked', () => {
      render(<CreatureCard creature={mockCreature} canBeAttacked />);

      expect(screen.getByTestId('attack-overlay')).toBeInTheDocument();
      expect(screen.getByText('⚔️ 可攻擊')).toBeInTheDocument();
    });

    it('should apply attackable class', () => {
      render(<CreatureCard creature={mockCreature} canBeAttacked />);

      expect(screen.getByTestId('creature-card')).toHaveClass(
        'creature-card--attackable'
      );
    });
  });

  describe('Feed Button', () => {
    it('should show feed button during feeding phase for own hungry creature', () => {
      const hungryCreature = {
        ...mockCreature,
        food: 0,
        maxFood: 2,
      };

      render(
        <CreatureCard
          creature={hungryCreature}
          isOwn
          currentPhase="feeding"
        />
      );

      expect(screen.getByTestId('feed-button')).toBeInTheDocument();
    });

    it('should not show feed button for satisfied creature', () => {
      const fedCreature = {
        ...mockCreature,
        food: 1,
        maxFood: 1,
      };

      render(
        <CreatureCard creature={fedCreature} isOwn currentPhase="feeding" />
      );

      expect(screen.queryByTestId('feed-button')).not.toBeInTheDocument();
    });

    it('should not show feed button during evolution phase', () => {
      const hungryCreature = {
        ...mockCreature,
        food: 0,
        maxFood: 2,
      };

      render(
        <CreatureCard
          creature={hungryCreature}
          isOwn
          currentPhase="evolution"
        />
      );

      expect(screen.queryByTestId('feed-button')).not.toBeInTheDocument();
    });

    it('should not show feed button for opponent creature', () => {
      const hungryCreature = {
        ...mockCreature,
        food: 0,
        maxFood: 2,
      };

      render(
        <CreatureCard
          creature={hungryCreature}
          isOwn={false}
          currentPhase="feeding"
        />
      );

      expect(screen.queryByTestId('feed-button')).not.toBeInTheDocument();
    });

    it('should call onFeed when feed button clicked', () => {
      const handleFeed = jest.fn();
      const hungryCreature = {
        ...mockCreature,
        food: 0,
        maxFood: 2,
      };

      render(
        <CreatureCard
          creature={hungryCreature}
          isOwn
          currentPhase="feeding"
          onFeed={handleFeed}
        />
      );

      fireEvent.click(screen.getByTestId('feed-button'));

      expect(handleFeed).toHaveBeenCalledWith(mockCreature.id);
    });
  });

  describe('State Classes', () => {
    it('should apply own class for own creature', () => {
      render(<CreatureCard creature={mockCreature} isOwn />);

      expect(screen.getByTestId('creature-card')).toHaveClass(
        'creature-card--own'
      );
    });

    it('should apply hungry class for hungry creature', () => {
      const hungryCreature = {
        ...mockCreature,
        food: 0,
        maxFood: 2,
      };

      render(<CreatureCard creature={hungryCreature} />);

      expect(screen.getByTestId('creature-card')).toHaveClass(
        'creature-card--hungry'
      );
    });

    it('should apply satisfied class for satisfied creature', () => {
      const fedCreature = {
        ...mockCreature,
        food: 1,
        maxFood: 1,
      };

      render(<CreatureCard creature={fedCreature} />);

      expect(screen.getByTestId('creature-card')).toHaveClass(
        'creature-card--satisfied'
      );
    });
  });
});
