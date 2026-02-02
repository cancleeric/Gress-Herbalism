/**
 * FoodIndicator 組件測試
 *
 * @module components/games/evolution/cards/__tests__/FoodIndicator.test
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FoodIndicator } from '../FoodIndicator';

describe('FoodIndicator', () => {
  describe('Food Slots', () => {
    it('should render correct number of food slots', () => {
      render(<FoodIndicator current={0} max={3} />);

      const foodSlots = screen.getByTestId('food-slots');
      expect(foodSlots.children).toHaveLength(3);
    });

    it('should show filled slots based on current food', () => {
      render(<FoodIndicator current={2} max={3} />);

      expect(screen.getByTestId('food-slot-0')).toHaveClass(
        'food-indicator__slot--filled'
      );
      expect(screen.getByTestId('food-slot-1')).toHaveClass(
        'food-indicator__slot--filled'
      );
      expect(screen.getByTestId('food-slot-2')).not.toHaveClass(
        'food-indicator__slot--filled'
      );
    });

    it('should show meat emoji for filled slots', () => {
      render(<FoodIndicator current={1} max={2} />);

      expect(screen.getByTestId('food-slot-0')).toHaveTextContent('🍖');
      expect(screen.getByTestId('food-slot-1')).toHaveTextContent('○');
    });

    it('should show all slots filled when full', () => {
      render(<FoodIndicator current={2} max={2} />);

      expect(screen.getByTestId('food-slot-0')).toHaveClass(
        'food-indicator__slot--filled'
      );
      expect(screen.getByTestId('food-slot-1')).toHaveClass(
        'food-indicator__slot--filled'
      );
    });
  });

  describe('Fat Slots', () => {
    it('should not render fat slots when fatCapacity is 0', () => {
      render(<FoodIndicator current={1} max={1} fatCapacity={0} />);

      expect(screen.queryByTestId('fat-slots')).not.toBeInTheDocument();
    });

    it('should render fat slots when fatCapacity > 0', () => {
      render(<FoodIndicator current={1} max={1} fatCapacity={2} />);

      expect(screen.getByTestId('fat-slots')).toBeInTheDocument();
      expect(screen.getByTestId('fat-slots').children).toHaveLength(2);
    });

    it('should show filled fat slots based on fat value', () => {
      render(<FoodIndicator current={1} max={1} fat={1} fatCapacity={2} />);

      expect(screen.getByTestId('fat-slot-0')).toHaveClass(
        'food-indicator__slot--filled'
      );
      expect(screen.getByTestId('fat-slot-1')).not.toHaveClass(
        'food-indicator__slot--filled'
      );
    });

    it('should show bacon emoji for filled fat slots', () => {
      render(<FoodIndicator current={1} max={1} fat={1} fatCapacity={2} />);

      expect(screen.getByTestId('fat-slot-0')).toHaveTextContent('🥓');
      expect(screen.getByTestId('fat-slot-1')).toHaveTextContent('◇');
    });
  });

  describe('Tooltips', () => {
    it('should have correct title for empty food slot', () => {
      render(<FoodIndicator current={0} max={1} />);

      expect(screen.getByTestId('food-slot-0')).toHaveAttribute('title', '空');
    });

    it('should have correct title for filled food slot', () => {
      render(<FoodIndicator current={1} max={1} />);

      expect(screen.getByTestId('food-slot-0')).toHaveAttribute(
        'title',
        '已進食'
      );
    });

    it('should have correct title for empty fat slot', () => {
      render(<FoodIndicator current={1} max={1} fat={0} fatCapacity={1} />);

      expect(screen.getByTestId('fat-slot-0')).toHaveAttribute(
        'title',
        '空脂肪槽'
      );
    });

    it('should have correct title for filled fat slot', () => {
      render(<FoodIndicator current={1} max={1} fat={1} fatCapacity={1} />);

      expect(screen.getByTestId('fat-slot-0')).toHaveAttribute(
        'title',
        '已儲存脂肪'
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero max food', () => {
      render(<FoodIndicator current={0} max={0} />);

      const foodSlots = screen.getByTestId('food-slots');
      expect(foodSlots.children).toHaveLength(0);
    });

    it('should handle current > max gracefully', () => {
      render(<FoodIndicator current={5} max={3} />);

      // All slots should be filled
      expect(screen.getByTestId('food-slot-0')).toHaveClass(
        'food-indicator__slot--filled'
      );
      expect(screen.getByTestId('food-slot-1')).toHaveClass(
        'food-indicator__slot--filled'
      );
      expect(screen.getByTestId('food-slot-2')).toHaveClass(
        'food-indicator__slot--filled'
      );
    });
  });
});
