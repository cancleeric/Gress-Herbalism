/**
 * TraitBadge 組件測試
 *
 * @module components/games/evolution/cards/__tests__/TraitBadge.test
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TraitBadge } from '../TraitBadge';

describe('TraitBadge', () => {
  describe('Rendering', () => {
    it('should render trait badge', () => {
      render(<TraitBadge traitType="carnivore" />);

      expect(screen.getByTestId('trait-badge')).toBeInTheDocument();
    });

    it('should show correct icon for known trait', () => {
      render(<TraitBadge traitType="carnivore" />);

      expect(screen.getByText('🦷')).toBeInTheDocument();
    });

    it('should show question mark for unknown trait', () => {
      render(<TraitBadge traitType="unknown-trait" />);

      expect(screen.getByText('❓')).toBeInTheDocument();
    });

    it('should have correct data-trait attribute', () => {
      render(<TraitBadge traitType="camouflage" />);

      expect(screen.getByTestId('trait-badge')).toHaveAttribute(
        'data-trait',
        'camouflage'
      );
    });
  });

  describe('Size Variants', () => {
    it('should apply small size class', () => {
      render(<TraitBadge traitType="carnivore" size="small" />);

      expect(screen.getByTestId('trait-badge')).toHaveClass(
        'trait-badge--small'
      );
    });

    it('should apply medium size class by default', () => {
      render(<TraitBadge traitType="carnivore" />);

      expect(screen.getByTestId('trait-badge')).toHaveClass(
        'trait-badge--medium'
      );
    });

    it('should apply large size class', () => {
      render(<TraitBadge traitType="carnivore" size="large" />);

      expect(screen.getByTestId('trait-badge')).toHaveClass(
        'trait-badge--large'
      );
    });
  });

  describe('Linked State', () => {
    it('should apply linked class when linked', () => {
      render(<TraitBadge traitType="cooperation" linked />);

      expect(screen.getByTestId('trait-badge')).toHaveClass(
        'trait-badge--linked'
      );
    });

    it('should show link indicator when linked', () => {
      render(<TraitBadge traitType="cooperation" linked />);

      expect(screen.getByText('🔗')).toBeInTheDocument();
    });

    it('should not show link indicator when not linked', () => {
      render(<TraitBadge traitType="cooperation" linked={false} />);

      expect(screen.queryByText('🔗')).not.toBeInTheDocument();
    });
  });

  describe('Tooltip', () => {
    it('should show tooltip with trait name by default', () => {
      render(<TraitBadge traitType="carnivore" />);

      expect(screen.getByTestId('trait-badge')).toHaveAttribute(
        'title',
        '肉食'
      );
    });

    it('should not show tooltip when showTooltip is false', () => {
      render(<TraitBadge traitType="carnivore" showTooltip={false} />);

      expect(screen.getByTestId('trait-badge')).not.toHaveAttribute('title');
    });
  });

  describe('Click Handler', () => {
    it('should call onClick when clicked', () => {
      const handleClick = jest.fn();
      render(<TraitBadge traitType="carnivore" onClick={handleClick} />);

      fireEvent.click(screen.getByTestId('trait-badge'));

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not throw when onClick is not provided', () => {
      render(<TraitBadge traitType="carnivore" />);

      expect(() => {
        fireEvent.click(screen.getByTestId('trait-badge'));
      }).not.toThrow();
    });
  });

  describe('Different Traits', () => {
    const traitTests = [
      { type: 'camouflage', icon: '🍃' },
      { type: 'burrowing', icon: '🕳️' },
      { type: 'aquatic', icon: '🌊' },
      { type: 'fatTissue', icon: '🍖' },
      { type: 'cooperation', icon: '🤝' },
    ];

    traitTests.forEach(({ type, icon }) => {
      it(`should show correct icon for ${type}`, () => {
        render(<TraitBadge traitType={type} />);

        expect(screen.getByText(icon)).toBeInTheDocument();
      });
    });
  });
});
