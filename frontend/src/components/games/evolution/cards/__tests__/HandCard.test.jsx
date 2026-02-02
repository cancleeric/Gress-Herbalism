/**
 * HandCard 組件測試
 *
 * @module components/games/evolution/cards/__tests__/HandCard.test
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock react-dnd to avoid ES modules issues
jest.mock('react-dnd', () => ({
  useDrag: () => [{ isDragging: false }, jest.fn()],
  useDrop: () => [{ isOver: false }, jest.fn()],
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
      div: React.forwardRef(
        ({ children, whileHover, whileTap, animate, variants, ...props }, ref) => (
          <div ref={ref} {...props}>
            {children}
          </div>
        )
      ),
    },
  };
});

// Import after mocks
const { HandCard } = require('../HandCard');

const mockCard = {
  id: 'CARD_001',
  instanceId: 'base_CARD_001_1',
  frontTrait: 'carnivore',
  backTrait: 'fatTissue',
  expansion: 'base',
};

const renderWithDnd = (component) => {
  return render(component);
};

describe('HandCard', () => {
  describe('Rendering', () => {
    it('should render card with front trait info', () => {
      renderWithDnd(<HandCard card={mockCard} />);

      // 應顯示正面性狀名稱
      expect(screen.getByText('肉食')).toBeInTheDocument();
    });

    it('should render card with trait icon', () => {
      renderWithDnd(<HandCard card={mockCard} />);

      // 應顯示性狀圖示
      expect(screen.getByText('🦷')).toBeInTheDocument();
    });

    it('should render food bonus for carnivore', () => {
      renderWithDnd(<HandCard card={mockCard} />);

      // 肉食有 +1 食量
      expect(screen.getByText('+1')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      renderWithDnd(<HandCard card={mockCard} className="custom-class" />);

      const handCard = screen.getByTestId('hand-card');
      expect(handCard).toHaveClass('custom-class');
    });
  });

  describe('Selection', () => {
    it('should call onSelect when clicked', () => {
      const handleSelect = jest.fn();
      renderWithDnd(<HandCard card={mockCard} onSelect={handleSelect} />);

      fireEvent.click(screen.getByTestId('hand-card-base'));

      expect(handleSelect).toHaveBeenCalledWith(mockCard.instanceId);
    });

    it('should not call onSelect when disabled', () => {
      const handleSelect = jest.fn();
      renderWithDnd(
        <HandCard card={mockCard} onSelect={handleSelect} disabled />
      );

      fireEvent.click(screen.getByTestId('hand-card-base'));

      expect(handleSelect).not.toHaveBeenCalled();
    });
  });

  describe('Actions', () => {
    it('should show action buttons when selected', () => {
      renderWithDnd(<HandCard card={mockCard} selected />);

      expect(screen.getByTestId('card-actions')).toBeInTheDocument();
      expect(screen.getByTitle('作為生物打出')).toBeInTheDocument();
      expect(screen.getByTitle('作為性狀打出')).toBeInTheDocument();
    });

    it('should not show action buttons when not selected', () => {
      renderWithDnd(<HandCard card={mockCard} selected={false} />);

      expect(screen.queryByTestId('card-actions')).not.toBeInTheDocument();
    });

    it('should call onPlayAsCreature when creature button clicked', () => {
      const handlePlayAsCreature = jest.fn();
      renderWithDnd(
        <HandCard
          card={mockCard}
          selected
          onPlayAsCreature={handlePlayAsCreature}
        />
      );

      fireEvent.click(screen.getByTestId('action-creature'));

      expect(handlePlayAsCreature).toHaveBeenCalledWith(mockCard.instanceId);
    });

    it('should call onPlayAsTrait when trait button clicked', () => {
      const handlePlayAsTrait = jest.fn();
      renderWithDnd(
        <HandCard card={mockCard} selected onPlayAsTrait={handlePlayAsTrait} />
      );

      fireEvent.click(screen.getByTestId('action-trait'));

      expect(handlePlayAsTrait).toHaveBeenCalledWith(mockCard.instanceId);
    });

    it('should show hint when selected without side selector', () => {
      renderWithDnd(<HandCard card={mockCard} selected />);

      expect(screen.getByText('雙擊翻轉查看')).toBeInTheDocument();
    });
  });

  describe('Side Selector', () => {
    it('should show side selector when selected and showSideSelector is true', () => {
      renderWithDnd(<HandCard card={mockCard} selected showSideSelector />);

      expect(screen.getByTestId('side-selector')).toBeInTheDocument();
    });

    it('should not show side selector when showSideSelector is false', () => {
      renderWithDnd(
        <HandCard card={mockCard} selected showSideSelector={false} />
      );

      expect(screen.queryByTestId('side-selector')).not.toBeInTheDocument();
    });

    it('should show both trait names in side selector', () => {
      renderWithDnd(<HandCard card={mockCard} selected showSideSelector />);

      // 應顯示正面和背面性狀名稱
      expect(screen.getByTestId('side-btn-front')).toHaveTextContent('肉食');
      expect(screen.getByTestId('side-btn-back')).toHaveTextContent('脂肪組織');
    });

    it('should call onSideSelect when side button clicked', () => {
      const handleSideSelect = jest.fn();
      renderWithDnd(
        <HandCard
          card={mockCard}
          selected
          showSideSelector
          onSideSelect={handleSideSelect}
        />
      );

      fireEvent.click(screen.getByTestId('side-btn-front'));

      expect(handleSideSelect).toHaveBeenCalledWith(
        mockCard.instanceId,
        'front'
      );
    });

    it('should highlight selected side', () => {
      renderWithDnd(
        <HandCard
          card={mockCard}
          selected
          showSideSelector
          selectedSide="front"
        />
      );

      expect(screen.getByTestId('side-btn-front')).toHaveClass(
        'hand-card__side-btn--active'
      );
      expect(screen.getByTestId('side-btn-back')).not.toHaveClass(
        'hand-card__side-btn--active'
      );
    });

    it('should not show actions when side selector is shown', () => {
      renderWithDnd(<HandCard card={mockCard} selected showSideSelector />);

      expect(screen.queryByTestId('card-actions')).not.toBeInTheDocument();
    });

    it('should not show hint when side selector is shown', () => {
      renderWithDnd(<HandCard card={mockCard} selected showSideSelector />);

      expect(screen.queryByText('雙擊翻轉查看')).not.toBeInTheDocument();
    });
  });

  describe('Flip Functionality', () => {
    it('should flip card on double click', () => {
      renderWithDnd(<HandCard card={mockCard} />);

      const cardBase = screen.getByTestId('hand-card-base');

      // 初始顯示正面
      expect(cardBase).not.toHaveClass('evolution-card--flipped');

      // 雙擊翻轉
      fireEvent.doubleClick(cardBase);

      expect(cardBase).toHaveClass('evolution-card--flipped');
    });

    it('should toggle flip state on multiple double clicks', () => {
      renderWithDnd(<HandCard card={mockCard} />);

      const cardBase = screen.getByTestId('hand-card-base');

      // 第一次雙擊 - 翻轉
      fireEvent.doubleClick(cardBase);
      expect(cardBase).toHaveClass('evolution-card--flipped');

      // 第二次雙擊 - 翻回
      fireEvent.doubleClick(cardBase);
      expect(cardBase).not.toHaveClass('evolution-card--flipped');
    });
  });

  describe('Different Trait Cards', () => {
    it('should render defensive trait correctly', () => {
      const defensiveCard = {
        ...mockCard,
        frontTrait: 'camouflage',
        backTrait: 'burrowing',
      };

      renderWithDnd(<HandCard card={defensiveCard} />);

      expect(screen.getByText('偽裝')).toBeInTheDocument();
      expect(screen.getByText('🍃')).toBeInTheDocument();
    });

    it('should render interactive trait correctly', () => {
      const interactiveCard = {
        ...mockCard,
        frontTrait: 'cooperation',
        backTrait: 'symbiosis',
      };

      renderWithDnd(<HandCard card={interactiveCard} />);

      expect(screen.getByText('合作')).toBeInTheDocument();
      expect(screen.getByText('🤝')).toBeInTheDocument();
    });

    it('should not show food bonus for traits without bonus', () => {
      const noFoodBonusCard = {
        ...mockCard,
        frontTrait: 'camouflage',
        backTrait: 'agile',
      };

      renderWithDnd(<HandCard card={noFoodBonusCard} />);

      // 偽裝和敏捷都沒有食量加成
      expect(screen.queryByText(/\+\d/)).not.toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('should not trigger any handlers when disabled', () => {
      const handleSelect = jest.fn();
      const handlePlayAsCreature = jest.fn();
      const handlePlayAsTrait = jest.fn();

      renderWithDnd(
        <HandCard
          card={mockCard}
          disabled
          selected
          onSelect={handleSelect}
          onPlayAsCreature={handlePlayAsCreature}
          onPlayAsTrait={handlePlayAsTrait}
        />
      );

      fireEvent.click(screen.getByTestId('hand-card-base'));

      expect(handleSelect).not.toHaveBeenCalled();
    });
  });
});
